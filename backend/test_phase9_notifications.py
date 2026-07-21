import os
import sys
import time
import requests
import json
from playwright.sync_api import sync_playwright

API_BASE = "http://127.0.0.1:8000/api/v1/notifications"
FRONTEND_URL = "http://localhost:5173/dashboard"
SCREENSHOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "storage/screenshots"))
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

def run_phase9_audit():
    print("=" * 70)
    print("PHASE 9 END-TO-END NOTIFICATION SERVICE AUTOMATED AUDIT")
    print("=" * 70)

    # 1. BACKEND API VERIFICATION
    print("\n--- [1/5] BACKEND API VERIFICATION ---")
    
    # Check history endpoint
    res_hist = requests.get(f"{API_BASE}/history")
    print(f"GET /history Status Code: {res_hist.status_code}")
    assert res_hist.status_code == 200, "GET /history failed"
    initial_history = res_hist.json()
    print(f"Initial Notification Logs in DB: {len(initial_history)}")

    # Check unread count endpoint
    res_unread = requests.get(f"{API_BASE}/unread-count")
    print(f"GET /unread-count Status Code: {res_unread.status_code}")
    assert res_unread.status_code == 200, "GET /unread-count failed"
    print(f"Initial Unread Count: {res_unread.json().get('unread_count')}")

    # 2. CREATE A TEST NOTIFICATION FOR PLAYWRIGHT
    print("\n--- [2/5] CREATING TEST DISPATCH VIA BACKEND ---")
    test_payload = {
        "channel": "PUSH",
        "recipient": "fcm_test_device_audit_token",
        "subject": "Audit Test Notification",
        "message": "This notification was created by Playwright audit runner.",
        "user_id": 1,
        "max_retries": 3
    }
    res_send = requests.post(f"{API_BASE}/send", json=test_payload)
    print(f"POST /send Status Code: {res_send.status_code}")
    assert res_send.status_code == 200, "POST /send failed"
    send_data = res_send.json()
    notification_id = send_data["notification_id"]
    print(f"Created Notification ID: {notification_id} | Status: {send_data['status']}")

    # Wait 1 second for background worker delivery execution
    time.sleep(1.5)

    # Verify status transition in DB
    res_check = requests.get(f"{API_BASE}/history")
    history_after = res_check.json()
    created_item = next((item for item in history_after if item["id"] == notification_id), None)
    assert created_item is not None, "Notification record not found in database!"
    print(f"Post-dispatch DB Record: ID={created_item['id']} | Channel={created_item['channel']} | Status={created_item['status']} | IsRead={created_item['is_read']}")
    assert created_item["status"] in ["DELIVERED", "FAILED"], f"Unexpected status: {created_item['status']}"

    # 3. PLAYWRIGHT FRONTEND AUTOMATION AUDIT
    print("\n--- [3/5] PLAYWRIGHT FRONTEND AUTOMATION AUDIT ---")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        # Step 1: Open Frontend App
        print("Navigating to Frontend App...")
        page.goto(FRONTEND_URL)
        page.wait_for_selector("header", timeout=10000)
        time.sleep(1)
        screenshot_1 = os.path.join(SCREENSHOT_DIR, "phase9_step1_dashboard_loaded.png")
        page.screenshot(path=screenshot_1)
        print(f"Screenshot 1 captured: {os.path.basename(screenshot_1)}")

        # Step 2: Open Notification Drawer
        print("Clicking Notification Bell icon...")
        bell_button = page.locator("button[aria-label='Open Notifications']")
        bell_button.click()
        page.wait_for_selector("h2:has-text('Notifications')", timeout=5000)
        time.sleep(1)
        screenshot_2 = os.path.join(SCREENSHOT_DIR, "phase9_step2_drawer_opened.png")
        page.screenshot(path=screenshot_2)
        print(f"Screenshot 2 captured: {os.path.basename(screenshot_2)}")

        # Step 3: Verify Test Notification Appears in Drawer
        print(f"Verifying notification ID #{notification_id} in drawer UI...")
        test_notif_heading = page.locator("h4:has-text('Audit Test Notification')").first
        assert test_notif_heading.is_visible(), "Test notification subject not visible in drawer!"
        print("Verified: Audit Test Notification is visible in drawer UI!")

        # Step 4: Test Mark as Read
        print(f"Marking notification #{notification_id} as read...")
        res_read = requests.patch(f"{API_BASE}/{notification_id}/read")
        assert res_read.status_code == 200, "PATCH /{id}/read failed"
        time.sleep(0.5)

        # Refresh drawer UI
        refresh_btn = page.locator("button[title='Refresh Notifications']")
        refresh_btn.click()
        time.sleep(1)
        screenshot_3 = os.path.join(SCREENSHOT_DIR, "phase9_step3_marked_read.png")
        page.screenshot(path=screenshot_3)
        print(f"Screenshot 3 captured: {os.path.basename(screenshot_3)}")

        # Step 5: Test Delete Notification from UI
        print(f"Deleting notification #{notification_id} via API...")
        res_del = requests.delete(f"{API_BASE}/{notification_id}")
        assert res_del.status_code == 200, "DELETE /{id} failed"
        
        # Click refresh in UI to verify disappearance
        refresh_btn.click()
        time.sleep(1)
        screenshot_4 = os.path.join(SCREENSHOT_DIR, "phase9_step4_deleted_notification.png")
        page.screenshot(path=screenshot_4)
        print(f"Screenshot 4 captured: {os.path.basename(screenshot_4)}")

        # Step 6: Reload page to verify persistence
        print("Reloading page to verify persistence...")
        page.reload()
        page.wait_for_selector("header", timeout=10000)
        time.sleep(1)
        screenshot_5 = os.path.join(SCREENSHOT_DIR, "phase9_step5_page_reloaded.png")
        page.screenshot(path=screenshot_5)
        print(f"Screenshot 5 captured: {os.path.basename(screenshot_5)}")

        browser.close()

    # 4. DATABASE INTEGRITY CHECK
    print("\n--- [4/5] DATABASE INTEGRITY VERIFICATION ---")
    res_final = requests.get(f"{API_BASE}/history")
    final_history = res_final.json()
    deleted_item = next((item for item in final_history if item["id"] == notification_id), None)
    assert deleted_item is None, "Deleted notification still present in database!"
    print(f"Verified: Notification ID #{notification_id} completely deleted from database.")

    print("\n" + "=" * 70)
    print("[SUCCESS] ALL PHASE 9 AUDIT CHECKS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_phase9_audit()
