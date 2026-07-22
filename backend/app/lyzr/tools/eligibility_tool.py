import logging
from typing import Dict, Any
from app.services.eligibility_service import eligibility_service

logger = logging.getLogger("EligibilityTool")

class EligibilityTool:
    """
    EligibilityTool wraps the EligibilityService to evaluate user eligibility for various schemes.
    """
    def __init__(self):
        self._service = eligibility_service

    def check_eligibility(self, user_profile: Dict[str, Any]) -> str:
        """Evaluates which schemes a user is eligible for, ineligible for, or needs more information for."""
        logger.info("[ELIGIBILITY_TOOL] Checking scheme eligibility against user profile.")
        return self._service.check_eligibility(user_profile)
