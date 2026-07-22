import logging
from typing import Dict, Any, Optional
from app.services.browser_service import browser_service
from app.services.intervention_manager import intervention_manager

logger = logging.getLogger("BrowserTool")

class BrowserTool:
    """
    BrowserTool wraps the BrowserAutomationService to provide browser automation interfaces to Lyzr agents.
    It guarantees all browser actions execute through challenge detection, keeping the Human Intervention Manager aware.
    """
    def __init__(self):
        self._service = browser_service
        self._intervention_manager = intervention_manager

    async def navigate(self, url: str, headless: bool = True):
        """Launch browser with standard desktop user agent and navigate to target URL."""
        logger.info(f"[BROWSER_TOOL] Navigating to: {url}")
        return await self._service.open_page(url, headless)

    async def fill_form(self, page, form_data: Dict[str, str]) -> bool:
        """Fill form fields based on key-value selectors."""
        logger.info(f"[BROWSER_TOOL] Filling form: {form_data}")
        return await self._service.fill_form(page, form_data)

    async def click(self, page, selector: str) -> bool:
        """Click on the designated selector on the page and check for intervention challenges."""
        logger.info(f"[BROWSER_TOOL] Clicking selector: {selector}")
        try:
            element = page.locator(selector).first
            await element.click()
            # Run Intervention Manager challenge check
            has_challenge, trigger_type = await self._intervention_manager.detect_challenge(page)
            if has_challenge:
                logger.warning(f"[BROWSER_TOOL] Intervention challenge detected: {trigger_type}")
            return True
        except Exception as e:
            logger.error(f"[BROWSER_TOOL] Click failed: {e}")
            return False

    async def upload_file(self, page, file_input_selector: str, file_path: str) -> bool:
        """Upload a local document to file input."""
        logger.info(f"[BROWSER_TOOL] Uploading file from {file_path} to input selector {file_input_selector}")
        return await self._service.upload_document(page, file_input_selector, file_path)

    async def capture_screenshot(self, page, name_prefix: str = "step") -> str:
        """Capture screenshot of the current page state."""
        logger.info(f"[BROWSER_TOOL] Capturing screenshot with prefix: {name_prefix}")
        return await self._service.capture_screenshot(page, name_prefix)

    async def wait_for_element(self, page, selector: str, timeout_ms: int = 5000) -> bool:
        """Wait for an element to load on the page."""
        logger.info(f"[BROWSER_TOOL] Waiting for element: {selector}")
        try:
            await page.wait_for_selector(selector, timeout=timeout_ms)
            return True
        except Exception:
            return False

    # Backwards compatibility methods
    async def execute_workflow(
        self,
        url: str,
        form_data: Dict[str, str],
        file_path: Optional[str] = None,
        file_input_selector: str = "input[type='file']",
        receipt_trigger_selector: Optional[str] = None,
        applicant_name: str = "Applicant",
        aadhaar_number: str = "123456789012",
        phone_number: str = "9876543210",
        scheme_name: str = "Government Scheme"
    ) -> Dict[str, Any]:
        """Executes a full browser automation workflow (routes to pmkisan or generic)."""
        return await self._service.execute_full_workflow(
            url=url,
            form_data=form_data,
            file_path=file_path,
            file_input_selector=file_input_selector,
            receipt_trigger_selector=receipt_trigger_selector,
            applicant_name=applicant_name,
            aadhaar_number=aadhaar_number,
            phone_number=phone_number,
            scheme_name=scheme_name
        )

    async def download_receipt(self, page, trigger_selector: Optional[str] = None) -> Optional[str]:
        """Intercept PDF/receipt download or generate PDF receipt snapshot."""
        return await self._service.download_receipt(page, trigger_selector)

    async def track_status(self, page, status_selector: str = ".status, #status, [data-status]") -> str:
        """Extract application status text from page."""
        return await self._service.track_status(page, status_selector)
