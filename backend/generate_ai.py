import os

files = {
    "app/core/ai/gemini.py": """from google import genai
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

def get_gemini_client():
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "YOUR_GEMINI_API_KEY":
        logger.warning("Gemini API key is not configured.")
        return None
        
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return client
""",
    
    "app/core/ai/intent.py": """from app.core.ai.gemini import get_gemini_client

async def detect_intent(message: str) -> str:
    client = get_gemini_client()
    if not client:
        return "GENERAL"
        
    prompt = f\"\"\"Classify the following user message into one of these intents: 
    - SCHEME_INQUIRY (asking about government schemes, pensions, etc.)
    - NGO_CONNECT (looking for NGOs, caregivers, or help)
    - GENERAL (anything else, greetings, general chat)
    
    Message: {message}
    
    Return ONLY the exact intent name.\"\"\"
    
    try:
        response = await client.aio.models.generate_content(
            model='gemini-3.5-flash',
            contents=prompt
        )
        intent = response.text.strip().upper()
        if intent in ["SCHEME_INQUIRY", "NGO_CONNECT"]:
            return intent
        return "GENERAL"
    except Exception:
        return "GENERAL"
""",
    
    "app/services/agents/general.py": """from app.services.agents.base import BaseAgent
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
                model='gemini-3.5-flash',
                contents=formatted_history,
                config=config
            )
            
            async for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            yield f"I'm sorry, I encountered an error connecting to the AI: {str(e)}"
""",

    "app/services/agents/scheme.py": """from app.services.agents.base import BaseAgent
from app.core.ai.gemini import get_gemini_client
from typing import AsyncGenerator

class SchemeAgent(BaseAgent):
    async def process(self, message: str, history: list) -> AsyncGenerator[str, None]:
        client = get_gemini_client()
        if not client:
            yield "I can help you with Government Schemes once my API key is configured."
            return
            
        prompt = f\"\"\"You are the Sahayak AI Scheme Expert. 
        Provide clear, accessible information about government schemes relevant to the user's query.
        Keep it simple.
        
        User: {message}\"\"\"
        
        try:
            response = await client.aio.models.generate_content_stream(
                model='gemini-3.5-flash',
                contents=prompt
            )
            async for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            yield f"Error fetching scheme details: {str(e)}"
""",

    "app/services/agents/ngo.py": """from app.services.agents.base import BaseAgent
from app.core.ai.gemini import get_gemini_client
from typing import AsyncGenerator

class NGOAgent(BaseAgent):
    async def process(self, message: str, history: list) -> AsyncGenerator[str, None]:
        client = get_gemini_client()
        if not client:
            yield "I can connect you with NGOs once my API key is configured."
            return
            
        prompt = f\"\"\"You are the Sahayak AI Community Expert. 
        Help the user find NGOs or caregivers based on their query. Provide practical, compassionate advice.
        
        User: {message}\"\"\"
        
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
"""
}

def create_files():
    for path, content in files.items():
        full_path = f"d:/SAHAYAK_AI/SAHAYAKAI/backend/{path}"
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)

if __name__ == "__main__":
    create_files()
    print("Files created successfully.")
