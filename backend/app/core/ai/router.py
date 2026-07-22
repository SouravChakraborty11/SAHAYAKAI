from app.core.ai.intent import detect_intent
from app.lyzr.registry import registry

async def route_message(message: str):
    intent = await detect_intent(message)
    agent = registry.get_agent(intent)
    if not agent:
        agent = registry.get_agent("GENERAL")
    return agent, intent
