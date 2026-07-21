from app.services.agents.base import BaseAgent
from app.core.ai.gemini import get_gemini_client
from typing import AsyncGenerator
from google.genai import types

class GeneralAgent(BaseAgent):
    async def process(self, message: str, history: list) -> AsyncGenerator[str, None]:
        client = get_gemini_client()
        if not client:
            yield "I am Sahayak AI. (Gemini API key is missing from the environment)."
            return
            
        system_instruction = "You are Sahayak AI, a helpful and polite digital companion for citizens. Keep responses short and simple."
        
        # Format history for google-genai
        formatted_history = []
        for msg in history:
            role = "user" if msg.sender == "user" else "model"
            formatted_history.append(types.Content(role=role, parts=[types.Part.from_text(text=msg.content)]))
            
        formatted_history.append(types.Content(role="user", parts=[types.Part.from_text(text=message)]))
        
        config = types.GenerateContentConfig(
            system_instruction=system_instruction
        )
            
        try:
            response = await client.aio.models.generate_content_stream(
                model='gemini-2.5-flash',
                contents=formatted_history,
                config=config
            )
            
            async for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            yield f"I'm sorry, I encountered an error connecting to the AI: {str(e)}"
