from typing import AsyncGenerator
from app.lyzr.agents.base import BaseLyzrAgent
from app.core.ai.gemini import get_gemini_client
from google.genai import types

class CitizenCompanionAgent(BaseLyzrAgent):
    """
    CitizenCompanionAgent handles conversational queries, general inquiries, and citizen companion tasks.
    It relies entirely on Gemini LLM without external tools.
    """
    def __init__(self):
        self.active_tool = "None"
        self.tool_output = "None"

    async def process(self, message: str, history: list) -> AsyncGenerator[str, None]:
        client = get_gemini_client()
        if not client:
            yield "I am Sahayak AI. (Gemini API key is missing from the environment)."
            return

        system_instruction = "You are Sahayak AI, a helpful and polite digital companion for citizens. Keep responses short and simple."

        # Format history for google-genai safely
        formatted_history = []
        for msg in history:
            sender = getattr(msg, "sender", None) or (msg.get("sender") if isinstance(msg, dict) else "user")
            content = getattr(msg, "content", None) or getattr(msg, "message", None) or (msg.get("content") or msg.get("message") if isinstance(msg, dict) else "")
            role = "user" if sender == "user" else "model"
            formatted_history.append(types.Content(role=role, parts=[types.Part.from_text(text=content)]))

        formatted_history.append(types.Content(role="user", parts=[types.Part.from_text(text=message)]))

        config = types.GenerateContentConfig(
            system_instruction=system_instruction
        )

        try:
            response = await client.aio.models.generate_content_stream(
                model='gemini-3.5-flash',
                contents=formatted_history,
                config=config
            )

            async for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            yield f"I'm sorry, I encountered an error connecting to the AI: {str(e)}"
