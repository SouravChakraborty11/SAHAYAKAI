from app.services.agents.base import BaseAgent
from app.core.ai.gemini import get_gemini_client
from typing import AsyncGenerator

class NGOAgent(BaseAgent):
    async def process(self, message: str, history: list) -> AsyncGenerator[str, None]:
        client = get_gemini_client()
        if not client:
            yield "I can connect you with NGOs once my API key is configured."
            return
            
        prompt = f"""You are the Sahayak AI Community Expert. 
        Help the user find NGOs or caregivers based on their query. Provide practical, compassionate advice.
        
        User: {message}"""
        
        try:
            response = await client.aio.models.generate_content_stream(
                model='gemini-3.5-flash',
                contents=prompt
            )
            async for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            yield f"Error connecting to NGO database: {str(e)}"
