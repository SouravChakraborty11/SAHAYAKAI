from typing import List

from app.automation.models import FormField
from app.automation.playwright_engine import PlaywrightEngine


class FormDetector:
    """
    Detects form fields from the current webpage.

    Attempts to identify:
    - visible label
    - placeholder
    - input type
    - selector
    - required status
    """

    def __init__(self, engine: PlaywrightEngine):
        self.engine = engine

    async def detect(self) -> List[FormField]:

        page = self.engine.page

        elements = await page.query_selector_all(
            "input, textarea, select"
        )

        fields: List[FormField] = []

        for element in elements:

            tag = await element.evaluate(
                "(el) => el.tagName.toLowerCase()"
            )

            input_type = (
                await element.get_attribute("type")
            ) or tag

            name = (
                await element.get_attribute("name")
            ) or ""

            placeholder = (
                await element.get_attribute("placeholder")
            ) or ""

            aria_label = (
                await element.get_attribute("aria-label")
            ) or ""

            element_id = (
                await element.get_attribute("id")
            ) or ""

            required = (
                await element.get_attribute("required")
            ) is not None

            selector = ""

            if name:
                selector = f'[name="{name}"]'

            elif element_id:
                selector = f"#{element_id}"

            else:
                continue

            label = ""

            if element_id:

                label_element = await page.query_selector(
                    f'label[for="{element_id}"]'
                )

                if label_element:
                    label = (
                        await label_element.inner_text()
                    ).strip()

            if not label:
                label = aria_label

            if not label:
                label = placeholder

            if not label:
                label = name

            if not label:
                label = element_id

            fields.append(
                FormField(
                    label=label,
                    selector=selector,
                    field_type=input_type,
                    required=required,
                    placeholder=placeholder,
                )
            )

        return fields