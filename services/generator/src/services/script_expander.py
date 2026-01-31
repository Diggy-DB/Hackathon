"""
Script Expander - Transforms user prompts into detailed scripts.
"""

from dataclasses import dataclass
import openai
from src.config import get_settings

settings = get_settings()


@dataclass
class ExpandedScript:
    """Result of script expansion."""
    full_script: str
    scene_description: str
    character_actions: list[dict]
    dialogue: list[dict]
    visual_notes: str
    duration_estimate: float


class ScriptExpander:
    """Expands user prompts into detailed scripts using LLM."""

    def __init__(self):
        self.client = openai.OpenAI(api_key=settings.openai_api_key)

    def expand(
        self,
        prompt: str,
        scene_context: str,
        scene_bible: dict | None = None,
    ) -> str:
        """
        Expand a user prompt into a detailed script.
        
        Args:
            prompt: User's input prompt
            scene_context: Context from the scene description
            scene_bible: Existing Scene Bible for continuity
            
        Returns:
            Expanded script as string
        """
        system_prompt = self._build_system_prompt(scene_bible)
        user_prompt = self._build_user_prompt(prompt, scene_context, scene_bible)

        response = self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.7,
            max_tokens=2000,
        )

        return response.choices[0].message.content or ""

    def _build_system_prompt(self, scene_bible: dict | None) -> str:
        """Build system prompt for script expansion."""
        base_prompt = """You are a professional screenwriter and scene director. 
Your task is to expand brief story prompts into detailed, vivid scene descriptions 
that can be used to generate video content.

Guidelines:
- Write in present tense, active voice
- Include specific visual details (lighting, colors, camera angles)
- Describe character actions precisely
- Keep dialogue natural and concise
- Aim for 15-30 seconds of video content
- Use cinematic language

Format your response as:
[SCENE DESCRIPTION]
Detailed description of the setting and atmosphere.

[ACTION]
What happens in the scene, step by step.

[DIALOGUE] (if any)
CHARACTER_NAME: "Dialogue"

[VISUAL NOTES]
Camera angles, transitions, special effects.
"""

        if scene_bible:
            base_prompt += "\n\nMAINTAIN CONTINUITY WITH EXISTING CHARACTERS:\n"
            for char_id, char in scene_bible.get("characters", {}).items():
                base_prompt += f"- {char.get('name')}: {char.get('physicalDescription', {}).get('build', 'no description')}\n"

        return base_prompt

    def _build_user_prompt(
        self,
        prompt: str,
        scene_context: str,
        scene_bible: dict | None,
    ) -> str:
        """Build user prompt with context."""
        user_prompt = f"Scene Context: {scene_context}\n\n"
        user_prompt += f"Expand this prompt into a detailed scene:\n{prompt}"

        if scene_bible and scene_bible.get("timeline"):
            last_event = scene_bible["timeline"][-1] if scene_bible["timeline"] else None
            if last_event:
                user_prompt += f"\n\nPrevious scene ended with: {last_event.get('description', '')}"

        return user_prompt
