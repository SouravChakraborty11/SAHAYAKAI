from typing import Dict, List

from app.automation.playwright_engine import PlaywrightEngine


class PageAnalyzer:
    """
    Extracts structured information from the current webpage.

    This allows AI agents to understand page contents without
    manually inspecting the DOM.
    """

    def __init__(self, engine: PlaywrightEngine):
        self.engine = engine

    async def analyze(self) -> Dict:

        page = self.engine.page

        if page is None:
            return {
                "success": False,
                "message": "Browser page is not initialized."
            }

        title = await page.title()
        url = page.url

        headings = await page.eval_on_selector_all(
            "h1,h2,h3,h4,h5,h6",
            """
            elements => elements.map(e => e.innerText.trim())
            """
        )

        buttons = await page.eval_on_selector_all(
            "button,input[type='submit'],input[type='button']",
            """
            elements => elements.map(e => ({
                text: e.innerText || e.value || "",
                id: e.id,
                name: e.name
            }))
            """
        )

        links = await page.eval_on_selector_all(
            "a[href]",
            """
            elements => elements.map(e => ({
                text: e.innerText.trim(),
                href: e.href
            }))
            """
        )

        inputs = await page.eval_on_selector_all(
            "input,textarea,select",
            """
            elements => elements.map(e => ({
                tag: e.tagName.toLowerCase(),
                type: e.type || "",
                name: e.name || "",
                id: e.id || "",
                placeholder: e.placeholder || ""
            }))
            """
        )

        paragraphs = await page.eval_on_selector_all(
            "p",
            """
            elements => elements
                .map(e => e.innerText.trim())
                .filter(text => text.length > 0)
            """
        )

        return {
            "success": True,
            "title": title,
            "url": url,
            "headings": headings,
            "buttons": buttons,
            "links": links,
            "inputs": inputs,
            "paragraphs": paragraphs
        }
    