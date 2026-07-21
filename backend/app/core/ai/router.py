from app.core.ai.intent import detect_intent
from app.services.agents.general import GeneralAgent
from app.services.agents.scheme import SchemeAgent
from app.services.agents.ngo import NGOAgent

async def route_message(message: str):
    intent = await detect_intent(message)
    
    if intent == "SCHEME_INQUIRY":
        return SchemeAgent(), intent
    elif intent == "NGO_CONNECT":
        return NGOAgent(), intent
    else:
        return GeneralAgent(), intent
