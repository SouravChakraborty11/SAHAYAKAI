from app.automation.browser_manager import BrowserManager
from app.automation.models import (
    BrowserAction,
    BrowserActionType,
    BrowserResult,
)
from app.automation.safety import BrowserSafety


class BrowserExecutor:
    """
    Executes BrowserAction objects using the BrowserManager.

    This provides a single entry point for AI agents (Google ADK,
    Gemini, etc.) to control the browser without interacting
    directly with Playwright.
    """

    def __init__(self, browser: BrowserManager):
        self.browser = browser
        self.safety = BrowserSafety()

    async def execute(self, action: BrowserAction) -> BrowserResult:
        """
        Execute a single browser action.
        """

        # Validate the action before executing it
        allowed, reason = self.safety.validate(action)

        if not allowed:
            return BrowserResult(
                success=False,
                message=reason
            )

        if action.action == BrowserActionType.GOTO:
            return await self.browser.goto(action.value)

        elif action.action == BrowserActionType.CLICK:
            return await self.browser.click(action.selector)

        elif action.action == BrowserActionType.FILL:
            return await self.browser.fill(
                action.selector,
                action.value,
            )

        elif action.action == BrowserActionType.SELECT:
            return await self.browser.select(
                action.selector,
                action.value,
            )

        elif action.action == BrowserActionType.SCREENSHOT:
            return await self.browser.screenshot(action.value)

        elif action.action == BrowserActionType.WAIT:
            await self.browser.engine.wait(int(action.value))

            return BrowserResult(
                success=True,
                message=f"Waited {action.value} ms."
            )

        else:
            return BrowserResult(
                success=False,
                message=f"Unsupported action: {action.action}"
            )

    async def execute_many(
        self,
        actions: list[BrowserAction],
    ) -> list[BrowserResult]:
        """
        Execute multiple browser actions sequentially.
        """

        results = []

        for action in actions:
            result = await self.execute(action)
            results.append(result)

        return results