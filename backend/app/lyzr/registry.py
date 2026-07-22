from typing import Dict, Any, Callable

class AgentRegistry:
    def __init__(self):
        self._agents = {}

    def register_agent(self, intent: str, agent_instance: Any):
        self._agents[intent] = agent_instance

    def unregister_agent(self, intent: str):
        if intent in self._agents:
            del self._agents[intent]

    def get_agent(self, intent: str) -> Any:
        return self._agents.get(intent)

    def list_agents(self) -> list:
        return list(self._agents.keys())

# Singleton registry
registry = AgentRegistry()
