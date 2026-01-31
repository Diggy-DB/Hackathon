"""
BullMQ Worker for processing video generation jobs from NestJS.

This worker connects to the same Redis queue that NestJS uses
and processes video generation jobs.
"""

import asyncio
import json
import os
import sys
from typing import Any
from bullmq import Worker, Job
import structlog

# Add src to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.config import get_settings
from src.services.database import DatabaseService
from src.services.storage import StorageService
from src.services.script_expander import ScriptExpander, PreviousSegment
from src.services.video_generator import VideoGenerator

logger = structlog.get_logger()
settings = get_settings()


def update_progress(db: DatabaseService, job_id: str, progress: int, stage: str):
    """Update job progress in database."""
    db.update_job(job_id, {
        "progress": progress,
        "stage": stage,
    })


async def process_generation_job(job: Job, token: str) -> dict:
    """
    Process a video generation job.
    
    Pipeline:
    1. Fetch segment and scene context
    2. Expand script via OpenAI ChatGPT
    3. Generate video via Google Veo 3
    4. Upload to S3
    5. Update database
    """
    data = job.data
    job_id = data.get("jobId")
    scene_id = data.get("sceneId")
    segment_id = data.get("segmentId")
    user_prompt = data.get("prompt", "")
    aspect_ratio = data.get("aspectRatio", "16:9")
    duration_seconds = data.get("durationSeconds", 10)

    log = logger.bind(job_id=job_id, scene_id=scene_id, segment_id=segment_id)
    log.info("Processing video generation job")

    db = DatabaseService()
    storage = StorageService()

    try:
        # Update job status to PROCESSING
        db.update_job(job_id, {"status": "PROCESSING"})
        db.update_segment(segment_id, {"status": "PROCESSING"})

        # Get segment and scene data
        segment = db.get_segment(segment_id)
        scene = db.get_scene(scene_id)

        if not segment or not scene:
            raise ValueError(f"Missing segment or scene data")

        user_prompt = segment.get("prompt", user_prompt)

        # Get scene bible for continuity
        scene_bible = db.get_scene_bible(scene_id)

        # Get previous segments for context
        previous_segments = db.get_segments_before(scene_id, segment.get("order_index", 0))
        prev_segment_objs = [
            PreviousSegment(
                order_index=s["order_index"],
                prompt=s.get("prompt", ""),
                expanded_script=s.get("expanded_script"),
                video_url=s.get("video_url"),
            )
            for s in previous_segments
        ]

        # Build scene context
        scene_context = {
            "title": scene.get("title", ""),
            "description": scene.get("description", ""),
            "topic": scene.get("topic", {}).get("title", "") if scene.get("topic") else "",
        }

        # Stage 1: Script Expansion via OpenAI ChatGPT
        log.info("Stage 1: Script expansion via OpenAI")
        update_progress(db, job_id, 10, "script_expanding")

        expander = ScriptExpander()
        expanded = expander.expand(
            user_prompt=user_prompt,
            scene_context=scene_context,
            scene_bible=scene_bible,
            previous_segments=prev_segment_objs,
        )

        # Save expanded script
        db.update_segment(segment_id, {
            "expanded_script": expanded.full_script,
        })
        update_progress(db, job_id, 25, "script_expanded")

        log.info(
            "Script expanded successfully",
            video_prompt_length=len(expanded.video_prompt) if expanded.video_prompt else 0,
        )

        # Stage 2: Video Generation via Google Veo 3
        log.info("Stage 2: Video generation via Google Veo 3")
        update_progress(db, job_id, 30, "video_generating")

        video_generator = VideoGenerator()
        video_result = video_generator.generate(
            video_prompt=expanded.video_prompt,
            scene_bible=scene_bible,
            aspect_ratio=aspect_ratio,
            duration_seconds=duration_seconds,
        )

        update_progress(db, job_id, 70, "video_generated")
        log.info("Video generated", video_path=video_result.video_path)

        # Stage 3: Upload to S3
        log.info("Stage 3: Uploading to S3")
        update_progress(db, job_id, 80, "uploading")

        video_key = f"segments/{segment_id}/video.mp4"
        thumbnail_key = f"segments/{segment_id}/thumbnail.jpg"

        video_url = storage.upload_file(video_result.video_path, video_key)
        thumbnail_url = None
        if video_result.thumbnail_path:
            thumbnail_url = storage.upload_file(video_result.thumbnail_path, thumbnail_key)

        update_progress(db, job_id, 90, "uploaded")

        # Stage 4: Finalize
        log.info("Stage 4: Finalizing")
        update_progress(db, job_id, 95, "finalizing")

        # Update segment with video URLs
        db.update_segment(segment_id, {
            "status": "COMPLETED",
            "video_url": video_url,
            "thumbnail_url": thumbnail_url,
            "duration": video_result.duration,
        })

        # Update job as completed
        db.update_job(job_id, {
            "status": "COMPLETED",
            "progress": 100,
            "stage": "completed",
            "result": json.dumps({
                "video_url": video_url,
                "thumbnail_url": thumbnail_url,
                "duration": video_result.duration,
            }),
        })

        log.info("Job completed successfully", video_url=video_url)

        return {
            "success": True,
            "video_url": video_url,
            "thumbnail_url": thumbnail_url,
            "duration": video_result.duration,
        }

    except Exception as e:
        log.error("Job failed", error=str(e))
        
        # Update job and segment as failed
        db.update_job(job_id, {
            "status": "FAILED",
            "error": str(e),
        })
        db.update_segment(segment_id, {
            "status": "FAILED",
        })
        
        raise


async def main():
    """Start the BullMQ worker."""
    logger.info("Starting BullMQ worker for video generation", redis_url=settings.redis_url)

    # Parse Redis URL for connection
    # Format: redis://localhost:6379
    redis_host = "localhost"
    redis_port = 6379
    
    if settings.redis_url:
        parts = settings.redis_url.replace("redis://", "").split(":")
        redis_host = parts[0] if parts else "localhost"
        redis_port = int(parts[1].split("/")[0]) if len(parts) > 1 else 6379

    # Track processed job IDs to prevent reprocessing
    processed_jobs = set()

    async def process_job_wrapper(job: Job, token: str) -> dict:
        """Wrapper to track processed jobs and prevent duplicates."""
        job_id = job.data.get("jobId")
        
        # Skip if already processed
        if job_id in processed_jobs:
            logger.info(f"Skipping already processed job", job_id=job_id)
            return {"status": "skipped", "reason": "already_processed"}
        
        # Also check database status
        db = DatabaseService()
        existing_job = db.get_job(job_id)
        if existing_job and existing_job.get("status") == "COMPLETED":
            logger.info(f"Skipping completed job from database", job_id=job_id)
            processed_jobs.add(job_id)
            return {"status": "skipped", "reason": "already_completed"}
        
        try:
            result = await process_generation_job(job, token)
            processed_jobs.add(job_id)
            return result
        except Exception as e:
            processed_jobs.add(job_id)  # Don't retry failed jobs either
            raise

    worker = Worker(
        "generation",  # Queue name - matches NestJS BullMQ queue
        process_job_wrapper,
        {
            "connection": {
                "host": redis_host,
                "port": redis_port,
            },
            "concurrency": 1,  # Process one at a time to avoid rate limits
            "autorun": True,
            "removeOnComplete": {"count": 0},  # Remove completed jobs
            "removeOnFail": {"count": 10},  # Keep last 10 failed for debugging
        },
    )

    logger.info(f"Worker started, listening on queue 'generation' at {redis_host}:{redis_port}")

    # Keep worker running
    try:
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        logger.info("Shutting down worker...")
        await worker.close()


if __name__ == "__main__":
    asyncio.run(main())
