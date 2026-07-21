from app.services.agents.base import BaseAgent
from app.core.ai.gemini import get_gemini_client
from typing import AsyncGenerator

class SchemeAgent(BaseAgent):
    async def process(self, message: str, history: list) -> AsyncGenerator[str, None]:
        client = get_gemini_client()
        if not client:
            yield "I can help you with Government Schemes once my API key is configured."
            return
            
        prompt = f"""You are the Sahayak AI Scheme Expert. 
        Provide clear, accessible information about government schemes relevant to the user's query.
        Keep it simple.
        
        User: {message}"""
        
        try:
            response = await client.aio.models.generate_content_stream(
                model='gemini-2.5-flash',
                contents=prompt
            )
            async for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            yield f"Error fetching scheme details: {str(e)}"
