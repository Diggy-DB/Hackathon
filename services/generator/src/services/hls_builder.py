"""
HLS Builder - Transcodes video to HLS format for streaming.
"""

from dataclasses import dataclass
from pathlib import Path
import subprocess
import structlog

logger = structlog.get_logger()


@dataclass
class HLSResult:
    """Result of HLS processing."""
    output_dir: Path
    master_playlist: Path
    variants: list[dict]
    segment_count: int


class HLSBuilder:
    """Builds HLS playlists from video files."""

    def __init__(self):
        self.segment_duration = 4  # seconds
        self.variants = [
            {"name": "720p", "width": 1280, "height": 720, "bitrate": "2500k"},
            {"name": "1080p", "width": 1920, "height": 1080, "bitrate": "5000k"},
        ]

    def process(self, video_path: Path, segment_id: str) -> HLSResult:
        """
        Process video into HLS format.
        
        Args:
            video_path: Path to source video
            segment_id: Segment ID for output naming
            
        Returns:
            HLSResult with output paths
        """
        logger.info("Processing video to HLS", video_path=str(video_path))

        output_dir = video_path.parent / "hls"
        output_dir.mkdir(exist_ok=True)

        # Generate each variant
        variant_playlists = []
        for variant in self.variants:
            playlist = self._generate_variant(video_path, output_dir, variant)
            variant_playlists.append({
                "name": variant["name"],
                "playlist": playlist,
                "bandwidth": int(variant["bitrate"].replace("k", "000")),
                "resolution": f"{variant['width']}x{variant['height']}",
            })

        # Generate master playlist
        master_playlist = self._generate_master_playlist(output_dir, variant_playlists)

        # Count segments
        segment_count = len(list(output_dir.glob("*.ts")))

        return HLSResult(
            output_dir=output_dir,
            master_playlist=master_playlist,
            variants=variant_playlists,
            segment_count=segment_count,
        )

    def _generate_variant(
        self,
        video_path: Path,
        output_dir: Path,
        variant: dict,
    ) -> Path:
        """Generate a single variant playlist."""
        variant_name = variant["name"]
        playlist_path = output_dir / f"{variant_name}.m3u8"

        # FFmpeg command for HLS transcoding
        cmd = [
            "ffmpeg",
            "-i", str(video_path),
            "-c:v", "libx264",
            "-preset", "fast",
            "-b:v", variant["bitrate"],
            "-maxrate", variant["bitrate"],
            "-bufsize", f"{int(variant['bitrate'].replace('k', '')) * 2}k",
            "-vf", f"scale={variant['width']}:{variant['height']}",
            "-c:a", "aac",
            "-b:a", "128k",
            "-hls_time", str(self.segment_duration),
            "-hls_list_size", "0",
            "-hls_segment_filename", str(output_dir / f"{variant_name}_%03d.ts"),
            "-f", "hls",
            str(playlist_path),
        ]

        try:
            subprocess.run(cmd, check=True, capture_output=True)
        except subprocess.CalledProcessError as e:
            logger.error("FFmpeg failed", error=e.stderr.decode())
            # Create placeholder for development
            self._create_placeholder_playlist(playlist_path, variant_name)

        return playlist_path

    def _generate_master_playlist(
        self,
        output_dir: Path,
        variants: list[dict],
    ) -> Path:
        """Generate master playlist referencing all variants."""
        master_path = output_dir / "master.m3u8"

        lines = ["#EXTM3U", "#EXT-X-VERSION:3", ""]

        for variant in variants:
            lines.append(
                f"#EXT-X-STREAM-INF:BANDWIDTH={variant['bandwidth']},"
                f"RESOLUTION={variant['resolution']}"
            )
            lines.append(f"{variant['name']}.m3u8")
            lines.append("")

        master_path.write_text("\n".join(lines))

        return master_path

    def _create_placeholder_playlist(self, path: Path, variant_name: str) -> None:
        """Create a placeholder playlist for development."""
        content = f"""#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:{self.segment_duration}
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:{self.segment_duration}.000,
{variant_name}_000.ts
#EXT-X-ENDLIST
"""
        path.write_text(content)
