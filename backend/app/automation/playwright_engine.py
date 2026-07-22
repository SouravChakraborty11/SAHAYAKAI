from playwright.async_api import async_playwright, Browser, Page


class PlaywrightEngine:
    """
    Low-level wrapper around Playwright.
    Responsible only for browser operations.
    """

    def __init__(self):
        self.playwright = None
        self.browser: Browser | None = None
        self.page: Page | None = None

    async def launch(self, headless: bool = False):
        self.playwright = await async_playwright().start()

        self.browser = await self.playwright.chromium.launch(
            headless=headless
        )

        context = await self.browser.new_context()

        self.page = await context.new_page()

    async def shutdown(self):
        if self.browser:
            await self.browser.close()

        if self.playwright:
            await self.playwright.stop()

    async def goto(self, url: str):
        await self.page.goto(url)

    async def title(self):
        return await self.page.title()

    async def current_url(self):
        return self.page.url

    async def screenshot(self, path: str):
        await self.page.screenshot(path=path)

    async def click(self, selector: str):
        await self.page.click(selector)

    async def fill(self, selector: str, value: str):
        await self.page.fill(selector, value)

    async def select(self, selector: str, value: str):
        await self.page.select_option(selector, value)

    async def wait(self, milliseconds: int):
        await self.page.wait_for_timeout(milliseconds)