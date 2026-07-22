from typing import List

from app.automation.browser_tool import BrowserTool
from app.automation.models import (
    BrowserAction,
    BrowserResult,
)


class BrowserAgent:
    """
    AI-facing browser agent.

    This class is responsible for exposing browser automation
    functionality to higher-level agents such as the
    DigitalServicesAgent or Google ADK.

    It does not perform browser automation itself.
    Instead, it delegates execution to BrowserTool.
    """

    def __init__(self):
        self.browser_tool = BrowserTool()

    async def start(self) -> BrowserResult:
        """
        Launch browser.
        """
        return await self.browser_tool.start()

    async def stop(self) -> BrowserResult:
        """
        Close browser.
        """
        return await self.browser_tool.stop()

    async def execute(
        self,
        actions: List[BrowserAction],
    ) -> List[BrowserResult]:
        """
        Execute a list of browser actions.
        """
        return await self.browser_tool.run(actions)

    async def detect_form(self) -> BrowserResult:
        """
        Detect form fields on the current page.
        """
        return await self.browser_tool.detect_form()

    async def analyze_page(self):
        """
        Analyze the current webpage.
        """
        return await self.browser_tool.browser.analyze_page()

    async def browser_state(self):
        """
        Return current browser state.
        """
        return await self.browser_tool.state()