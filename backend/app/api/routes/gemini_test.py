from fastapi import APIRouter
from google.genai import types

from app.core.ai.gemini import get_gemini_client

router = APIRouter(prefix="/gemini", tags=["Gemini Test"])


@router.get("/health")
async def gemini_health():

    client = get_gemini_client()

    if client is None:
        return {
            "status": "error",
            "message": "Gemini client could not be initialized."
        }

    try:

        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents="Reply with only the word OK.",
            config=types.GenerateContentConfig(
                temperature=0,
            ),
        )

        return {
            "status": "success",
            "model": "gemini-flash-latest",
            "response": response.text,
        }

    except Exception as e:

        return {
            "status": "error",
            "type": type(e).__name__,
            "message": str(e),
        }