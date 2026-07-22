from typing import Optional

from app.automation.models import (
    BrowserAction,
    BrowserActionType,
)


class BrowserSafety:
    """
    Validates browser actions before execution.

    This layer prevents accidental execution of
    potentially dangerous browser operations.
    """

    DANGEROUS_KEYWORDS = {
        "delete",
        "remove",
        "payment",
        "pay",
        "purchase",
        "confirm",
        "submit",
        "logout",
        "deactivate",
        "terminate",
        "cancel application",
        "close account",
    }

    def validate(self, action: BrowserAction) -> tuple[bool, Optional[str]]:
        """
        Returns:
            (True, None) if action is safe.
            (False, reason) if blocked.
        """

        if action.action not in BrowserActionType:
            return False, "Unknown browser action."

        if action.action == BrowserActionType.CLICK:

            selector = (action.selector or "").lower()

            for keyword in self.DANGEROUS_KEYWORDS:
                if keyword in selector:
                    return (
                        False,
                        f"Blocked click on potentially dangerous element: '{keyword}'"
                    )

        return True, None