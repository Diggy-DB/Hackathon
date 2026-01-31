"""
Video Generator - Generates video using Google AI Studio Veo 3 API.

This service takes expanded scripts and generates video content
using Google's Veo 3 video generation model via the GenAI SDK.
"""

from dataclasses import dataclass
from pathlib import Path
from typing import Any
import tempfile
import time
import subprocess
import structlog

from google import genai
from google.genai import types

from src.config import get_settings

logger = structlog.get_logger()
settings = get_settings()


@dataclass
class VideoResult:
    """Result of video generation."""
    video_path: Path  # Path to downloaded video file
    thumbnail_path: Path | None
    duration: float
    width: int
    height: int
    generation_id: str
    model_used: str


class VideoGenerationError(Exception):
    """Error during video generation."""
    pass


class VideoGenerator:
    """
    Generates video using Google AI Studio Veo 3 API.
    
    Uses the official google-genai SDK for video generation.
    """

    def __init__(self):
        self.client = genai.Client(api_key=settings.google_ai_api_key)
        self.model = "veo-3.1-generate-preview"  # Use Veo 3.1 model

    def generate(
        self,
        video_prompt: str,
        scene_bible: dict[str, Any] | None = None,
        aspect_ratio: str = "16:9",
        duration_seconds: int = 8,
        style_preset: str | None = None,
    ) -> VideoResult:
        """
        Generate video from a prompt using Veo 3.
        
        Args:
            video_prompt: The optimized prompt for video generation
            scene_bible: Scene Bible for style consistency
            aspect_ratio: Video aspect ratio ("16:9" or "9:16")
            duration_seconds: Target video duration (4, 6, or 8 seconds)
            style_preset: Optional style preset
            
        Returns:
            VideoResult with local file paths and metadata
        """
        logger.info(
            "Starting video generation",
            prompt_length=len(video_prompt),
            aspect_ratio=aspect_ratio,
            duration=duration_seconds,
        )

        # Enhance prompt with style
        enhanced_prompt = self._enhance_prompt(video_prompt, scene_bible, style_preset)
        
        # Validate duration (Veo supports 4, 6, or 8 seconds)
        if duration_seconds not in [4, 6, 8]:
            duration_seconds = 8
        
        try:
            # Start video generation
            logger.info("Calling Veo 3.1 API", model=self.model)
            
            operation = self.client.models.generate_videos(
                model=self.model,
                prompt=enhanced_prompt,
                config=types.GenerateVideosConfig(
                    aspect_ratio=aspect_ratio,
                ),
            )
            
            # Poll for completion
            logger.info("Waiting for video generation", operation_name=operation.name)
            while not operation.done:
                time.sleep(10)
                operation = self.client.operations.get(operation)
                logger.info("Still generating...", done=operation.done)
            
            # Get the generated video
            generated_video = operation.response.generated_videos[0]
            
            # Download the video
            self.client.files.download(file=generated_video.video)
            
            # Save to temp file
            temp_dir = Path(tempfile.mkdtemp())
            video_path = temp_dir / f"video_{int(time.time() * 1000)}.mp4"
            generated_video.video.save(str(video_path))
            
            logger.info("Video downloaded", path=str(video_path))
            
            # Generate thumbnail
            thumbnail_path = self._generate_thumbnail(video_path)
            
            # Get duration
            duration = self._get_video_duration(video_path)
            
            return VideoResult(
                video_path=video_path,
                thumbnail_path=thumbnail_path,
                duration=duration,
                width=1920 if aspect_ratio == "16:9" else 1080,
                height=1080 if aspect_ratio == "16:9" else 1920,
                generation_id=operation.name,
                model_used=self.model,
            )
            
        except Exception as e:
            logger.error("Video generation failed", error=str(e))
            raise VideoGenerationError(f"Veo 3 API error: {str(e)}")

    def _enhance_prompt(
        self,
        prompt: str,
        scene_bible: dict[str, Any] | None,
        style_preset: str | None,
    ) -> str:
        """Enhance the prompt with style and quality modifiers."""
        enhancements = []
        
        # Add style from scene bible
        if scene_bible:
            rules = scene_bible.get("rules", {})
            if isinstance(rules, dict):
                if rules.get("visualStyle"):
                    enhancements.append(rules["visualStyle"])
                if rules.get("mood"):
                    enhancements.append(f"Mood: {rules['mood']}")
        
        # Add style preset
        if style_preset:
            enhancements.append(style_preset)
        
        # Add quality modifiers
        quality_modifiers = [
            "cinematic quality",
            "professional lighting",
            "smooth camera movement",
        ]
        enhancements.extend(quality_modifiers)
        
        # Combine
        enhanced = prompt
        if enhancements:
            enhanced = f"{prompt}\n\nStyle: {', '.join(enhancements)}"
        
        # Truncate if too long
        if len(enhanced) > 1500:
            enhanced = enhanced[:1497] + "..."
        
        return enhanced

    def _generate_thumbnail(self, video_path: Path) -> Path | None:
        """Generate thumbnail from first frame using ffmpeg."""
        try:
            thumbnail_path = video_path.with_suffix(".jpg")
            
            result = subprocess.run(
                [
                    "ffmpeg", "-y",
                    "-i", str(video_path),
                    "-vframes", "1",
                    "-q:v", "2",
                    str(thumbnail_path),
                ],
                capture_output=True,
                text=True,
            )
            
            if result.returncode == 0 and thumbnail_path.exists():
                return thumbnail_path
            
            logger.warning("Failed to generate thumbnail", error=result.stderr)
            return None
        except Exception as e:
            logger.warning("Thumbnail generation failed", error=str(e))
            return None

    def _get_video_duration(self, video_path: Path) -> float:
        """Get video duration using ffprobe."""
        try:
            result = subprocess.run(
                [
                    "ffprobe",
                    "-v", "error",
                    "-show_entries", "format=duration",
                    "-of", "default=noprint_wrappers=1:nokey=1",
                    str(video_path),
                ],
                capture_output=True,
                text=True,
            )
            
            if result.returncode == 0:
                return float(result.stdout.strip())
            
            return 8.0  # Default duration
        except Exception:
            return 8.0


def generate_video(
    prompt: str,
    scene_bible: dict[str, Any] | None = None,
    aspect_ratio: str = "16:9",
    duration_seconds: int = 8,
) -> VideoResult:
    """Convenience function to generate video."""
    generator = VideoGenerator()
    return generator.generate(
        video_prompt=prompt,
        scene_bible=scene_bible,
        aspect_ratio=aspect_ratio,
        duration_seconds=duration_seconds,
    )
