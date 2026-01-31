"""
Storage Service - Handles S3 uploads and URL generation.
"""

from dataclasses import dataclass
from pathlib import Path
import boto3
from botocore.config import Config
import structlog

from src.config import get_settings

logger = structlog.get_logger()
settings = get_settings()


@dataclass
class UploadResult:
    """Result of upload operation."""
    video_url: str
    hls_url: str
    thumbnail_url: str


class StorageService:
    """Handles file storage operations with S3."""

    def __init__(self):
        self.s3 = boto3.client(
            "s3",
            endpoint_url=settings.s3_endpoint,
            aws_access_key_id=settings.s3_access_key,
            aws_secret_access_key=settings.s3_secret_key,
            region_name=settings.s3_region,
            config=Config(signature_version="s3v4"),
        )
        self.bucket = settings.s3_bucket_videos
        self.cdn_url = settings.cdn_url

    def upload_segment(
        self,
        segment_id: str,
        scene_id: str,
        video_path: Path,
        hls_path: Path,
        thumbnail_path: Path,
    ) -> UploadResult:
        """
        Upload all segment assets to S3.
        
        Args:
            segment_id: Segment ID
            scene_id: Scene ID for path organization
            video_path: Path to source video
            hls_path: Path to HLS directory
            thumbnail_path: Path to thumbnail
            
        Returns:
            UploadResult with CDN URLs
        """
        base_path = f"scenes/{scene_id}/segments/{segment_id}"

        # Upload source video
        video_key = f"{base_path}/source.mp4"
        self._upload_file(video_path, video_key, "video/mp4")

        # Upload HLS files
        hls_base = f"{base_path}/hls"
        self._upload_directory(hls_path, hls_base)

        # Upload thumbnail
        thumb_key = f"{base_path}/thumbnail.jpg"
        self._upload_file(thumbnail_path, thumb_key, "image/jpeg")

        return UploadResult(
            video_url=f"{self.cdn_url}/{video_key}",
            hls_url=f"{self.cdn_url}/{hls_base}/master.m3u8",
            thumbnail_url=f"{self.cdn_url}/{thumb_key}",
        )

    def _upload_file(
        self,
        local_path: Path,
        s3_key: str,
        content_type: str,
    ) -> None:
        """Upload a single file to S3."""
        logger.debug("Uploading file", path=str(local_path), key=s3_key)

        self.s3.upload_file(
            str(local_path),
            self.bucket,
            s3_key,
            ExtraArgs={
                "ContentType": content_type,
                "CacheControl": "max-age=31536000",  # 1 year for immutable content
            },
        )

    def _upload_directory(self, local_dir: Path, s3_prefix: str) -> None:
        """Upload all files in a directory to S3."""
        for file_path in local_dir.iterdir():
            if file_path.is_file():
                s3_key = f"{s3_prefix}/{file_path.name}"
                
                # Determine content type
                if file_path.suffix == ".m3u8":
                    content_type = "application/vnd.apple.mpegurl"
                elif file_path.suffix == ".ts":
                    content_type = "video/mp2t"
                else:
                    content_type = "application/octet-stream"

                self._upload_file(file_path, s3_key, content_type)

    def get_signed_url(self, key: str, expiration: int = 3600) -> str:
        """Generate a signed URL for private content."""
        return self.s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": key},
            ExpiresIn=expiration,
        )

    def delete_segment(self, segment_id: str, scene_id: str) -> None:
        """Delete all files for a segment."""
        prefix = f"scenes/{scene_id}/segments/{segment_id}/"
        
        # List and delete all objects with prefix
        paginator = self.s3.get_paginator("list_objects_v2")
        for page in paginator.paginate(Bucket=self.bucket, Prefix=prefix):
            if "Contents" in page:
                objects = [{"Key": obj["Key"]} for obj in page["Contents"]]
                self.s3.delete_objects(
                    Bucket=self.bucket,
                    Delete={"Objects": objects},
                )
