from abc import ABC, abstractmethod
from typing import AsyncGenerator

class BaseAgent(ABC):
    @abstractmethod
    async def process(self, message: str, history: list) -> AsyncGenerator[str, None]:
        pass
