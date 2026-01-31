"""
Video generation task - main entry point for segment generation.
"""

from celery import shared_task
from celery.exceptions import MaxRetriesExceededError
import structlog

from src.config import get_settings
from src.services.database import DatabaseService
from src.services.storage import StorageService
from src.services.script_expander import ScriptExpander
from src.services.continuity import ContinuityValidator
from src.services.video_generator import VideoGenerator
from src.services.hls_builder import HLSBuilder

logger = structlog.get_logger()
settings = get_settings()


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_jitter=True,
)
def generate_segment(
    self,
    job_id: str,
    scene_id: str,
    segment_id: str,
) -> dict:
    """
    Main task for generating a video segment.
    
    Pipeline stages:
    1. Script Expansion - Expand user prompt into detailed script
    2. Continuity Validation - Check against Scene Bible
    3. Video Generation - Generate video using AI provider
    4. HLS Processing - Transcode to HLS format
    5. Upload - Upload to S3
    6. Finalization - Update database, notify client
    """
    log = logger.bind(job_id=job_id, scene_id=scene_id, segment_id=segment_id)
    log.info("Starting segment generation")

    db = DatabaseService()
    storage = StorageService()

    try:
        # Get job and segment data
        job = db.get_job(job_id)
        segment = db.get_segment(segment_id)
        scene = db.get_scene(scene_id)

        if not all([job, segment, scene]):
            raise ValueError("Missing job, segment, or scene data")

        # Stage 1: Script Expansion
        log.info("Stage 1: Script expansion")
        update_progress(db, job_id, 10, "script_expanding")

        expander = ScriptExpander()
        expanded_script = expander.expand(
            prompt=segment["prompt"],
            scene_context=scene.get("description", ""),
            scene_bible=db.get_scene_bible(scene_id),
        )

        db.update_segment(segment_id, {"expanded_script": expanded_script})
        update_progress(db, job_id, 25, "script_expanded")

        # Stage 2: Continuity Validation
        log.info("Stage 2: Continuity validation")
        update_progress(db, job_id, 30, "continuity_checking")

        validator = ContinuityValidator()
        bible = db.get_scene_bible(scene_id)
        validation_result = validator.validate(expanded_script, bible)

        if not validation_result.is_valid:
            log.warning("Continuity violations found", violations=validation_result.violations)
            
            # Apply auto-corrections if possible
            if validation_result.auto_corrections:
                expanded_script = validator.apply_corrections(
                    expanded_script,
                    validation_result.auto_corrections,
                )
                db.update_segment(segment_id, {"expanded_script": expanded_script})

        update_progress(db, job_id, 40, "continuity_checked")

        # Stage 3: Video Generation
        log.info("Stage 3: Video generation")
        update_progress(db, job_id, 45, "generating_video")

        generator = VideoGenerator()
        video_result = generator.generate(
            script=expanded_script,
            scene_bible=bible,
            reference_frames=get_reference_frames(db, scene_id),
        )

        update_progress(db, job_id, 70, "video_generated")

        # Stage 4: HLS Processing
        log.info("Stage 4: HLS processing")
        update_progress(db, job_id, 75, "processing_hls")

        hls_builder = HLSBuilder()
        hls_result = hls_builder.process(
            video_path=video_result.local_path,
            segment_id=segment_id,
        )

        update_progress(db, job_id, 85, "hls_processed")

        # Stage 5: Upload to S3
        log.info("Stage 5: Uploading to S3")
        update_progress(db, job_id, 90, "uploading")

        upload_result = storage.upload_segment(
            segment_id=segment_id,
            scene_id=scene_id,
            video_path=video_result.local_path,
            hls_path=hls_result.output_dir,
            thumbnail_path=video_result.thumbnail_path,
        )

        # Stage 6: Finalization
        log.info("Stage 6: Finalizing")
        update_progress(db, job_id, 95, "finalizing")

        # Update segment with URLs
        db.update_segment(segment_id, {
            "status": "completed",
            "video_url": upload_result.video_url,
            "hls_url": upload_result.hls_url,
            "thumbnail_url": upload_result.thumbnail_url,
            "duration": video_result.duration,
        })

        # Update scene
        db.update_scene_stats(scene_id)

        # Update Scene Bible with new content
        bible_updates = validator.extract_bible_updates(expanded_script)
        if bible_updates:
            db.update_scene_bible(scene_id, bible_updates)

        # Mark job complete
        db.complete_job(job_id, {
            "segment_id": segment_id,
            "video_url": upload_result.video_url,
            "hls_url": upload_result.hls_url,
            "duration": video_result.duration,
        })

        log.info("Segment generation completed successfully")

        return {
            "success": True,
            "segment_id": segment_id,
            "video_url": upload_result.video_url,
        }

    except MaxRetriesExceededError:
        log.error("Max retries exceeded")
        db.fail_job(job_id, "Max retries exceeded")
        db.update_segment(segment_id, {"status": "failed"})
        raise

    except Exception as e:
        log.error("Segment generation failed", error=str(e))
        
        # Check if we should retry
        if self.request.retries < self.max_retries:
            raise self.retry(exc=e)
        
        db.fail_job(job_id, str(e))
        db.update_segment(segment_id, {"status": "failed"})
        raise


def update_progress(db: DatabaseService, job_id: str, progress: int, stage: str) -> None:
    """Update job progress and publish to Redis for real-time updates."""
    db.update_job_progress(job_id, progress, stage)


def get_reference_frames(db: DatabaseService, scene_id: str) -> list[str]:
    """Get reference frames for character consistency."""
    bible = db.get_scene_bible(scene_id)
    if not bible:
        return []

    frames = []
    for character in bible.get("characters", {}).values():
        frames.extend(character.get("reference_frames", []))

    return frames[:10]  # Limit to 10 reference frames
