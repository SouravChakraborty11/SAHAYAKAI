from app.core.ai.gemini import get_gemini_client

async def detect_intent(message: str) -> str:
    client = get_gemini_client()
    if not client:
        return "GENERAL"
        
    prompt = f"""Classify the following user message into one of these intents: 
    - SCHEME_INQUIRY (asking about government schemes, pensions, eligibility, etc.)
    - NGO_CONNECT (looking for NGOs, caregivers, rehabilitation centers, therapy, appointments, or community assistance)
    - GENERAL (anything else, greetings, general chat)
    
    Message: {message}
    
    Return ONLY the exact intent name."""
    
    msg_lower = message.lower()
    ngo_keywords = ["ngo", "caregiver", "nurse", "rehab", "rehabilitation", "appointment", "therapy", "elderly", "disability", "disabled", "support", "physio", "doctor", "hospital"]
    scheme_keywords = ["scheme", "pension", "yojana", "pmay", "pm-kisan", "eligibility", "government", "subsidy", "benefit"]

    try:
        response = await client.aio.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        intent = response.text.strip().upper()
        if intent in ["SCHEME_INQUIRY", "NGO_CONNECT"]:
            return intent
    except Exception:
        pass

    if any(k in msg_lower for k in ngo_keywords):
        return "NGO_CONNECT"
    if any(k in msg_lower for k in scheme_keywords):
        return "SCHEME_INQUIRY"
    return "GENERAL"
