from abc import ABC, abstractmethod
from typing import Any, Dict


class BaseAgent(ABC):
    """
    Abstract base class for all AI agents in Sahayak AI.

    Every specialized agent (Digital Services, Care & Community,
    Accessibility, etc.) must inherit from this class.
    """

    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    async def process(
        self,
        query: str,
        context: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Process a user request.

        Parameters
        ----------
        query : str
            User input.

        context : dict
            Shared execution context.

        Returns
        -------
        dict
            Structured response.
        """
        pass