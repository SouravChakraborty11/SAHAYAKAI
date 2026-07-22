from app.automation.playwright_engine import PlaywrightEngine
from app.automation.models import (
    BrowserResult,
    BrowserState,
)
from app.automation.form_detector import FormDetector
from app.automation.page_analyzer import PageAnalyzer

class BrowserManager:
    """
    High-level browser manager used by the application.

    Wraps PlaywrightEngine and exposes a clean interface for
    browser operations.
    """

    def __init__(self):
        self.engine = PlaywrightEngine()
        self.state = BrowserState()
        self.detector = FormDetector(self.engine)
        self.analyzer = PageAnalyzer(self.engine)

    async def start(self):
        """
        Launch the browser.
        """
        await self.engine.launch()

        self.state.page_loaded = True

        return BrowserResult(
            success=True,
            message="Browser started."
        )

    async def stop(self):
        """
        Close the browser.
        """
        await self.engine.shutdown()

        self.state.page_loaded = False

        return BrowserResult(
            success=True,
            message="Browser stopped."
        )

    async def goto(self, url: str):
        """
        Navigate to a URL.
        """
        await self.engine.goto(url)

        self.state.current_url = await self.engine.current_url()
        self.state.page_title = await self.engine.title()

        return BrowserResult(
            success=True,
            message=f"Opened {url}",
            data=self.state
        )

    async def click(self, selector: str):
        """
        Click an element.
        """
        await self.engine.click(selector)

        return BrowserResult(
            success=True,
            message=f"Clicked {selector}"
        )

    async def fill(self, selector: str, value: str):
        """
        Fill an input field.
        """
        await self.engine.fill(selector, value)

        return BrowserResult(
            success=True,
            message=f"Filled {selector}"
        )

    async def select(self, selector: str, value: str):
        """
        Select an option from a dropdown.
        """
        await self.engine.select(selector, value)

        return BrowserResult(
            success=True,
            message=f"Selected '{value}'"
        )

    async def screenshot(self, path: str):
        """
        Capture a screenshot.
        """
        await self.engine.screenshot(path)

        self.state.screenshot_path = path

        return BrowserResult(
            success=True,
            message="Screenshot captured.",
            data=path
        )

    async def detect_form(self):
        """
        Detect all form fields on the current page.
        """
        fields = await self.detector.detect()

        return BrowserResult(
            success=True,
            message=f"Detected {len(fields)} form fields.",
            data=fields
        )

    async def get_state(self):
        """
        Return the current browser state.
        """
        self.state.current_url = await self.engine.current_url()
        self.state.page_title = await self.engine.title()

        return self.state

    async def analyze_page(self):
        """
        Analyze the current webpage.
        """
        return await self.analyzer.analyze()