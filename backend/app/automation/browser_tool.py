from typing import List

from app.automation.browser_manager import BrowserManager
from app.automation.executor import BrowserExecutor
from app.automation.models import BrowserAction, BrowserResult


class BrowserTool:
    """
    High-level browser tool for AI agents.

    This class exposes browser functionality through a clean interface
    that can later be wrapped as a Google ADK Tool.
    """

    def __init__(self):
        self.browser = BrowserManager()
        self.executor = BrowserExecutor(self.browser)

    async def start(self) -> BrowserResult:
        """
        Launch the browser.
        """
        return await self.browser.start()

    async def stop(self) -> BrowserResult:
        """
        Close the browser.
        """
        return await self.browser.stop()

    async def run(
        self,
        actions: List[BrowserAction]
    ) -> List[BrowserResult]:
        """
        Execute a sequence of browser actions.
        """
        return await self.executor.execute_many(actions)

    async def detect_form(self) -> BrowserResult:
        """
        Detect all form fields on the current page.
        """
        return await self.browser.detect_form()

    async def state(self):
        """
        Return the current browser state.
        """
        return await self.browser.get_state()