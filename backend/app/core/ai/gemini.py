from google import genai
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


def get_gemini_client():

    if (
        not settings.GEMINI_API_KEY
        or settings.GEMINI_API_KEY
        in ["YOUR_GEMINI_API_KEY", "your_gemini_api_key_here"]
    ):
        logger.warning("Gemini API key is not configured.")
        return None

    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    print("\n========== AVAILABLE GEMINI MODELS ==========\n")

    try:

        for model in client.models.list():

            print(model.name)

    except Exception as e:

        print("Unable to list models:")
        print(e)

    print("\n=============================================\n")

    return client