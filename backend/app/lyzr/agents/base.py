from abc import ABC, abstractmethod
from typing import AsyncGenerator

class BaseLyzrAgent(ABC):
    """
    Base abstraction for Phase 11 modular Lyzr Agents.
    """
    @abstractmethod
    async def process(self, message: str, history: list) -> AsyncGenerator[str, None]:
        pass
