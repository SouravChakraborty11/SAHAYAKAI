from app.core.ai.gemini import get_gemini_client

async def detect_intent(message: str) -> str:
    client = get_gemini_client()
    if not client:
        return "GENERAL"
        
    prompt = f"""Classify the following user message into one of these intents: 
    - SCHEME_INQUIRY (asking about government schemes, pensions, etc.)
    - NGO_CONNECT (looking for NGOs, caregivers, or help)
    - GENERAL (anything else, greetings, general chat)
    
    Message: {message}
    
    Return ONLY the exact intent name."""
    
    try:
        response = await client.aio.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        intent = response.text.strip().upper()
        if intent in ["SCHEME_INQUIRY", "NGO_CONNECT"]:
            return intent
        return "GENERAL"
    except Exception:
        return "GENERAL"
