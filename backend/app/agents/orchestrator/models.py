from dataclasses import dataclass, field
from typing import List


@dataclass
class IntentResult:
    """
    Represents the result of understanding a user's query.
    """

    intent: str
    goal: str
    confidence: float
    entities: List[str] = field(default_factory=list)