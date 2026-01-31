"""
Database Service - Handles database operations for the worker.
"""

import json
from datetime import datetime
import redis
import structlog

from src.config import get_settings

logger = structlog.get_logger()
settings = get_settings()


class DatabaseService:
    """Database operations using Redis pub/sub for real-time updates."""

    def __init__(self):
        self.redis = redis.from_url(settings.redis_url)
        # In production, would also have PostgreSQL connection
        # self.pg = create_engine(settings.database_url)

    def get_job(self, job_id: str) -> dict | None:
        """Get job data."""
        # In production, query PostgreSQL
        # For now, use Redis as cache
        data = self.redis.get(f"job:{job_id}")
        return json.loads(data) if data else None

    def get_segment(self, segment_id: str) -> dict | None:
        """Get segment data."""
        data = self.redis.get(f"segment:{segment_id}")
        return json.loads(data) if data else None

    def get_scene(self, scene_id: str) -> dict | None:
        """Get scene data."""
        data = self.redis.get(f"scene:{scene_id}")
        return json.loads(data) if data else None

    def get_scene_bible(self, scene_id: str) -> dict | None:
        """Get Scene Bible for a scene."""
        data = self.redis.get(f"bible:{scene_id}")
        return json.loads(data) if data else None

    def update_segment(self, segment_id: str, updates: dict) -> None:
        """Update segment data."""
        # In production, update PostgreSQL
        # Publish update event
        self.redis.publish("segment:update", json.dumps({
            "segment_id": segment_id,
            "updates": updates,
            "timestamp": datetime.utcnow().isoformat(),
        }))

    def update_job_progress(
        self,
        job_id: str,
        progress: int,
        stage: str,
    ) -> None:
        """Update job progress and publish event."""
        update = {
            "job_id": job_id,
            "progress": progress,
            "stage": stage,
            "status": "processing",
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        # Cache current status
        self.redis.setex(f"job:{job_id}:progress", 300, json.dumps(update))
        
        # Publish for WebSocket updates
        self.redis.publish("job:progress", json.dumps(update))

    def complete_job(self, job_id: str, result: dict) -> None:
        """Mark job as completed."""
        update = {
            "job_id": job_id,
            "status": "completed",
            "progress": 100,
            "result": result,
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        # Publish completion event
        self.redis.publish("job:complete", json.dumps(update))
        
        # Clear progress cache
        self.redis.delete(f"job:{job_id}:progress")

    def fail_job(self, job_id: str, error: str) -> None:
        """Mark job as failed."""
        update = {
            "job_id": job_id,
            "status": "failed",
            "error": error,
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        # Publish failure event
        self.redis.publish("job:complete", json.dumps(update))
        
        # Clear progress cache
        self.redis.delete(f"job:{job_id}:progress")

    def update_scene_stats(self, scene_id: str) -> None:
        """Update scene statistics after segment added."""
        # In production, update PostgreSQL
        # - Increment segment_count
        # - Recalculate total_duration
        pass

    def update_scene_bible(self, scene_id: str, updates: dict) -> None:
        """Update Scene Bible with new entities."""
        current = self.get_scene_bible(scene_id) or {}
        
        # Merge updates
        for key, value in updates.items():
            if key in current and isinstance(current[key], dict):
                current[key].update(value)
            else:
                current[key] = value
        
        # Update metadata
        if "metadata" not in current:
            current["metadata"] = {}
        current["metadata"]["updated_at"] = datetime.utcnow().isoformat()
        
        # In production, update PostgreSQL
        # For now, cache in Redis
        self.redis.setex(f"bible:{scene_id}", 3600, json.dumps(current))
