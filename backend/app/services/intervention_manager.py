import os
import asyncio
import logging
from typing import Dict, Optional, Any, Tuple
from datetime import datetime
from playwright.async_api import Page

logger = logging.getLogger("HumanInterventionManager")

class HumanInterventionManager:
    """
    Human Intervention Manager:
    Detects OTP / CAPTCHA on target Playwright pages, pauses execution via asyncio.Event,
    notifies listeners/DB, and unblocks automation when human input is received.
    """
    def __init__(self):
        # In-memory session tracking: session_id -> { "event": asyncio.Event, "user_input": str, "trigger_type": str }
        self._active_events: Dict[str, Dict[str, Any]] = {}

    async def detect_challenge(self, page: Page) -> Tuple[bool, str]:
        """
        Inspect Playwright page for OTP or CAPTCHA elements.
        Returns (has_challenge, trigger_type).
        """
        try:
            # Detect CAPTCHA elements
            captcha_selectors = [
                "#txtcaptcha", "input[name*='captcha']", "input[placeholder*='Captcha']",
                "img[id*='captcha']", "img[src*='captcha']", "#ContentPlaceHolder1_txtcaptcha"
            ]
            for sel in captcha_selectors:
                if await page.locator(sel).count() > 0:
                    logger.info(f"[INTERVENTION_DETECT] CAPTCHA element detected via selector: {sel}")
                    return True, "CAPTCHA"

            # Detect OTP elements
            otp_selectors = [
                "#txtotp", "input[name*='otp']", "input[placeholder*='OTP']",
                "input[id*='otp']", "#ContentPlaceHolder1_txtOTP"
            ]
            for sel in otp_selectors:
                if await page.locator(sel).count() > 0:
                    logger.info(f"[INTERVENTION_DETECT] OTP element detected via selector: {sel}")
                    return True, "OTP"

        except Exception as e:
            logger.error(f"[INTERVENTION_DETECT] Error detecting challenges: {e}")

        # Default fallback detection for Government portal forms with security barriers
        return True, "CAPTCHA"

    async def pause_and_wait(
        self,
        session_id: str,
        trigger_type: str,
        page: Page,
        screenshot_dir: str,
        timeout_seconds: int = 120
    ) -> Tuple[bool, Optional[str]]:
        """
        Pause the Playwright workflow thread using an asyncio.Event.
        Captures CAPTCHA image element if available.
        Waits for human input via resume() or timeout.
        Returns (success, user_input).
        """
        logger.info(f"[INTERVENTION_PAUSE] Pausing session {session_id} for {trigger_type} (Timeout: {timeout_seconds}s)")
        
        event = asyncio.Event()
        captcha_filename = ""

        # Capture element screenshot if CAPTCHA img is present
        try:
            captcha_img = page.locator("img[id*='captcha'], img[src*='captcha'], #ContentPlaceHolder1_imgCaptcha").first
            if await captcha_img.count() > 0:
                captcha_filename = f"captcha_{session_id}.png"
                captcha_path = os.path.join(screenshot_dir, captcha_filename)
                await captcha_img.screenshot(path=captcha_path)
                logger.info(f"[INTERVENTION_PAUSE] Captured CAPTCHA element screenshot: {captcha_filename}")
        except Exception as e:
            logger.warning(f"[INTERVENTION_PAUSE] Could not screenshot captcha element: {e}")

        self._active_events[session_id] = {
            "event": event,
            "user_input": None,
            "trigger_type": trigger_type,
            "captcha_image": captcha_filename,
            "created_at": datetime.now()
        }

        try:
            # Wait for event trigger or timeout
            await asyncio.wait_for(event.wait(), timeout=timeout_seconds)
            user_input = self._active_events[session_id].get("user_input")
            logger.info(f"[INTERVENTION_RESUME] Received user input for session {session_id}: '{user_input}'")
            return True, user_input
        except asyncio.TimeoutError:
            logger.warning(f"[INTERVENTION_TIMEOUT] Session {session_id} timed out waiting for human input.")
            return False, None
        finally:
            self._active_events.pop(session_id, None)

    def resume_session(self, session_id: str, user_input: str) -> bool:
        """
        Resume a paused workflow by setting user_input and triggering the asyncio.Event.
        """
        if session_id in self._active_events:
            self._active_events[session_id]["user_input"] = user_input
            event: asyncio.Event = self._active_events[session_id]["event"]
            event.set()
            logger.info(f"[INTERVENTION_SIGNAL] Signaled event for session {session_id}")
            return True
        logger.warning(f"[INTERVENTION_SIGNAL] Session ID {session_id} not found in active events")
        return False

    def get_active_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        return self._active_events.get(session_id)

    def list_active_sessions(self) -> Dict[str, Dict[str, Any]]:
        return {
            sid: {
                "trigger_type": data["trigger_type"],
                "captcha_image": data["captcha_image"],
                "created_at": data["created_at"].isoformat()
            }
            for sid, data in self._active_events.items()
        }

intervention_manager = HumanInterventionManager()
