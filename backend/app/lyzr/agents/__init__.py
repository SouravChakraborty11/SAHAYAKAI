from app.lyzr.registry import registry
from app.lyzr.agents.citizen_companion_agent import CitizenCompanionAgent
from app.lyzr.agents.digital_services_agent import DigitalServicesAgent
from app.lyzr.agents.care_community_agent import CareCommunityAgent

# Register agent singletons mapped to intents
registry.register_agent("GENERAL", CitizenCompanionAgent())
registry.register_agent("SCHEME_INQUIRY", DigitalServicesAgent())
registry.register_agent("NGO_CONNECT", CareCommunityAgent())

__all__ = [
    "CitizenCompanionAgent",
    "DigitalServicesAgent",
    "CareCommunityAgent",
]
