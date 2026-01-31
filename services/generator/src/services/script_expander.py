"""
Script Expander - Transforms user prompts into detailed video scripts using OpenAI.

This service takes user-submitted prompts and expands them into detailed
video scripts that include scene descriptions, character details, camera
directions, and visual notes suitable for video generation.
"""

from dataclasses import dataclass
from typing import Any
import json
import openai
import structlog

from src.config import get_settings

logger = structlog.get_logger()
settings = get_settings()


@dataclass
class ExpandedScript:
    """Result of script expansion."""
    full_script: str
    scene_description: str
    character_descriptions: dict[str, str]
    actions: list[str]
    dialogue: list[dict[str, str]]
    visual_notes: str
    camera_directions: list[str]
    mood_and_atmosphere: str
    duration_estimate: float  # in seconds
    video_prompt: str  # optimized prompt for video generation
    raw_response: str = ""


@dataclass
class PreviousSegment:
    """Context from a previous segment in the scene."""
    order_index: int
    prompt: str
    expanded_script: str | None
    video_url: str | None


class ScriptExpander:
    """
    Expands user prompts into detailed video scripts using OpenAI ChatGPT.
    
    The expander takes into account:
    - The user's submitted prompt/script
    - Previous segments in the scene for continuity
    - The scene bible (characters, locations, style guide)
    - The overall scene context
    """

    def __init__(self):
        self.client = openai.OpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_model

    def expand(
        self,
        user_prompt: str,
        scene_context: dict[str, Any],
        scene_bible: dict[str, Any] | None = None,
        previous_segments: list[PreviousSegment] | None = None,
    ) -> ExpandedScript:
        """
        Expand a user prompt into a detailed video script.
        
        Args:
            user_prompt: The user's submitted story prompt
            scene_context: Context about the scene (title, description, topic)
            scene_bible: Existing Scene Bible with characters, locations, timeline
            previous_segments: List of previous segments for continuity
            
        Returns:
            ExpandedScript with all details needed for video generation
        """
        logger.info(
            "Expanding script",
            prompt_length=len(user_prompt),
            has_bible=scene_bible is not None,
            num_previous=len(previous_segments) if previous_segments else 0,
        )

        system_prompt = self._build_system_prompt(scene_bible)
        user_message = self._build_user_message(
            user_prompt, scene_context, scene_bible, previous_segments
        )

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
                temperature=0.7,
                max_tokens=3000,
                response_format={"type": "json_object"},
            )

            raw_response = response.choices[0].message.content or "{}"
            result = json.loads(raw_response)
            
            logger.info("Script expansion complete", result_keys=list(result.keys()))

            return ExpandedScript(
                full_script=result.get("full_script", ""),
                scene_description=result.get("scene_description", ""),
                character_descriptions=result.get("character_descriptions", {}),
                actions=result.get("actions", []),
                dialogue=result.get("dialogue", []),
                visual_notes=result.get("visual_notes", ""),
                camera_directions=result.get("camera_directions", []),
                mood_and_atmosphere=result.get("mood_and_atmosphere", ""),
                duration_estimate=float(result.get("duration_estimate", 15.0)),
                video_prompt=result.get("video_prompt", ""),
                raw_response=raw_response,
            )

        except json.JSONDecodeError as e:
            logger.error("Failed to parse script expansion response", error=str(e))
            # Fallback to simple expansion
            return self._fallback_expand(user_prompt, scene_context)
        except Exception as e:
            logger.error("Script expansion failed", error=str(e))
            raise

    def _build_system_prompt(self, scene_bible: dict[str, Any] | None) -> str:
        """Build the system prompt for ChatGPT."""
        
        prompt = """You are an expert screenwriter and video director specializing in AI-generated video content.

Your task is to transform brief story prompts into detailed, vivid scene descriptions optimized for AI video generation (Google Veo 3).

## Guidelines

1. **Visual Clarity**: Write descriptions that are visually specific and unambiguous
2. **Continuity**: Maintain character appearances and settings consistent with the scene bible
3. **Cinematic Language**: Use professional film terminology for camera directions
4. **Duration**: Aim for 15-30 second video segments
5. **Action Focus**: Prioritize visual action over internal thoughts
6. **Present Tense**: Always write in present tense, active voice

## Output Format

You MUST respond with a valid JSON object containing these fields:

{
    "full_script": "Complete narrative script with all details",
    "scene_description": "Detailed description of the setting, lighting, atmosphere",
    "character_descriptions": {
        "character_name": "Visual description for this scene"
    },
    "actions": ["Action 1", "Action 2", "Action 3"],
    "dialogue": [
        {"character": "Name", "line": "What they say"}
    ],
    "visual_notes": "Special effects, transitions, visual style notes",
    "camera_directions": ["Opening shot type", "Mid-scene camera movement", "Closing shot"],
    "mood_and_atmosphere": "Overall emotional tone and visual atmosphere",
    "duration_estimate": 20,
    "video_prompt": "Optimized 200-word prompt for video generation API"
}

## Video Prompt Optimization

The "video_prompt" field should be a condensed, highly visual prompt optimized for AI video generation:
- Lead with the most important visual elements
- Include character appearances in the prompt
- Specify lighting, color palette, and atmosphere
- Describe motion and action clearly
- Keep under 200 words for best results
"""

        if scene_bible:
            prompt += "\n\n## Scene Bible (Maintain Continuity)\n\n"
            
            # Add characters
            characters = scene_bible.get("characters", {})
            if characters:
                prompt += "### Characters\n"
                for char_id, char in characters.items():
                    name = char.get("name", char_id)
                    visual = char.get("visualPrompt", char.get("description", ""))
                    traits = char.get("traits", [])
                    prompt += f"- **{name}**: {visual}"
                    if traits:
                        prompt += f" (Traits: {', '.join(traits)})"
                    prompt += "\n"
            
            # Add locations
            locations = scene_bible.get("locations", {})
            if locations:
                prompt += "\n### Locations\n"
                for loc_id, loc in locations.items():
                    name = loc.get("name", loc_id)
                    visual = loc.get("visualPrompt", loc.get("description", ""))
                    prompt += f"- **{name}**: {visual}\n"
            
            # Add style guide
            rules = scene_bible.get("rules", {})
            if rules:
                prompt += "\n### Style Guide\n"
                if "visualStyle" in rules:
                    prompt += f"- Visual Style: {rules['visualStyle']}\n"
                if "colorPalette" in rules:
                    prompt += f"- Color Palette: {', '.join(rules['colorPalette'])}\n"
                if "mood" in rules:
                    prompt += f"- Mood: {rules['mood']}\n"

        return prompt

    def _build_user_message(
        self,
        user_prompt: str,
        scene_context: dict[str, Any],
        scene_bible: dict[str, Any] | None,
        previous_segments: list[PreviousSegment] | None,
    ) -> str:
        """Build the user message with all context."""
        
        message_parts = []
        
        # Scene context
        message_parts.append("## Scene Context")
        message_parts.append(f"**Title**: {scene_context.get('title', 'Untitled')}")
        if scene_context.get("description"):
            message_parts.append(f"**Description**: {scene_context['description']}")
        if scene_context.get("topic"):
            message_parts.append(f"**Topic/Genre**: {scene_context['topic']}")
        
        # Previous segments for continuity
        if previous_segments:
            message_parts.append("\n## Previous Segments (for continuity)")
            for seg in previous_segments[-3:]:  # Last 3 segments max
                message_parts.append(f"\n### Segment {seg.order_index}")
                message_parts.append(f"**Prompt**: {seg.prompt}")
                if seg.expanded_script:
                    # Truncate long scripts
                    script_preview = seg.expanded_script[:500]
                    if len(seg.expanded_script) > 500:
                        script_preview += "..."
                    message_parts.append(f"**Script**: {script_preview}")
        
        # Current user prompt
        message_parts.append("\n## User's New Prompt (expand this)")
        message_parts.append(user_prompt)
        
        # Instructions
        message_parts.append("\n## Instructions")
        message_parts.append("1. Expand the user's prompt into a detailed video script")
        message_parts.append("2. Maintain visual continuity with previous segments")
        message_parts.append("3. Use character descriptions from the scene bible exactly")
        message_parts.append("4. Generate an optimized video_prompt for AI video generation")
        message_parts.append("5. Respond with ONLY the JSON object, no markdown formatting")
        
        return "\n".join(message_parts)

    def _fallback_expand(
        self,
        user_prompt: str,
        scene_context: dict[str, Any],
    ) -> ExpandedScript:
        """Fallback expansion when JSON parsing fails."""
        
        return ExpandedScript(
            full_script=user_prompt,
            scene_description=scene_context.get("description", ""),
            character_descriptions={},
            actions=[user_prompt],
            dialogue=[],
            visual_notes="",
            camera_directions=["Wide establishing shot", "Medium shot", "Close-up"],
            mood_and_atmosphere="",
            duration_estimate=15.0,
            video_prompt=user_prompt[:200],
            raw_response="",
        )


# Convenience function for one-off expansions
def expand_script(
    user_prompt: str,
    scene_context: dict[str, Any],
    scene_bible: dict[str, Any] | None = None,
    previous_segments: list[dict] | None = None,
) -> ExpandedScript:
    """
    Convenience function to expand a script.
    
    Args:
        user_prompt: The user's story prompt
        scene_context: Scene title, description, topic
        scene_bible: Character/location data
        previous_segments: Previous segment data as dicts
        
    Returns:
        ExpandedScript with all details
    """
    expander = ScriptExpander()
    
    # Convert dict segments to PreviousSegment objects
    prev_segs = None
    if previous_segments:
        prev_segs = [
            PreviousSegment(
                order_index=s.get("orderIndex", s.get("order_index", 0)),
                prompt=s.get("prompt", ""),
                expanded_script=s.get("expandedScript", s.get("expanded_script")),
                video_url=s.get("videoUrl", s.get("video_url")),
            )
            for s in previous_segments
        ]
    
    return expander.expand(user_prompt, scene_context, scene_bible, prev_segs)
