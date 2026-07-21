import os
import random
import string
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Dict, Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.application import SchemeApplication
from app.services.browser_service import browser_service, SCREENSHOTS_DIR, RECEIPTS_DIR

router = APIRouter()

class AutomationRequest(BaseModel):
    target_url: str = "https://example.com"
    applicant_name: str
    aadhaar_number: str
    phone_number: str
    scheme_name: str
    address: Optional[str] = None

class StatusTrackRequest(BaseModel):
    reference_number: str
    tracking_url: Optional[str] = "https://example.com"

class ScreenshotRequest(BaseModel):
    target_url: str

def generate_reference_number(scheme_name: str) -> str:
    prefix = "".join([w[0] for w in scheme_name.split() if w]).upper()[:3]
    if len(prefix) < 3:
        prefix = "SAH"
    date_str = datetime.now().strftime("%Y%m%d")
    random_str = "".join(random.choices(string.ascii_uppercase + string.digits, k=5))
    return f"{prefix}-{date_str}-{random_str}"

@router.post("/apply")
async def execute_application_automation(
    request: AutomationRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Automate scheme application submission using Playwright.
    Auto-fills forms, captures screenshots, downloads receipt, stores application in DB, and returns reference number.
    """
    form_data = {
        "applicant_name": request.applicant_name,
        "name": request.applicant_name,
        "aadhaar": request.aadhaar_number,
        "phone": request.phone_number,
        "scheme": request.scheme_name,
        "address": request.address or "Bengaluru, Karnataka"
    }

    result = await browser_service.execute_full_workflow(
        url=request.target_url,
        form_data=form_data,
        applicant_name=request.applicant_name,
        aadhaar_number=request.aadhaar_number,
        phone_number=request.phone_number,
        scheme_name=request.scheme_name
    )

    ref_number = generate_reference_number(request.scheme_name)
    initial_status = "Under Verification"

    # Save application to Database
    app_record = SchemeApplication(
        reference_number=ref_number,
        scheme_name=request.scheme_name,
        applicant_name=request.applicant_name,
        aadhaar_number=request.aadhaar_number,
        phone_number=request.phone_number,
        status=initial_status,
        receipt_file=result.get("receipt"),
        screenshot_file=result.get("screenshot")
    )
    db.add(app_record)
    await db.commit()
    await db.refresh(app_record)

    result["reference_number"] = ref_number
    result["submission_date"] = app_record.created_at.strftime("%Y-%m-%d %H:%M:%S")
    result["scheme_name"] = request.scheme_name
    result["applicant_name"] = request.applicant_name
    result["status"] = initial_status

    return result

@router.post("/screenshot")
async def capture_url_screenshot(request: ScreenshotRequest):
    """Capture a live screenshot of a target URL."""
    browser, context, page = await browser_service.open_page(request.target_url)
    try:
        filename = await browser_service.capture_screenshot(page, name_prefix="preview")
        return {"screenshot": filename, "url": request.target_url}
    finally:
        await browser.close()

@router.post("/track")
async def track_application_status(
    request: StatusTrackRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Track scheme application status by reference number from DB.
    Returns HTTP 404 with clean error if reference number is invalid.
    """
    stmt = select(SchemeApplication).where(SchemeApplication.reference_number == request.reference_number.strip())
    res = await db.execute(stmt)
    app_record = res.scalar_one_or_none()

    if not app_record:
        raise HTTPException(
            status_code=404, 
            detail="Invalid Reference Number. Please check your reference code and try again."
        )

    return {
        "reference_number": app_record.reference_number,
        "scheme_name": app_record.scheme_name,
        "applicant_name": app_record.applicant_name,
        "status": app_record.status,
        "submission_date": app_record.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        "last_updated": app_record.updated_at.strftime("%Y-%m-%d %H:%M:%S") if app_record.updated_at else app_record.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        "screenshot": app_record.screenshot_file,
        "receipt": app_record.receipt_file
    }

@router.get("/files/{file_type}/{filename}")
async def get_automation_file(file_type: str, filename: str):
    """Serve screenshots and receipts."""
    if file_type == "screenshots":
        target_dir = SCREENSHOTS_DIR
    elif file_type == "receipts":
        target_dir = RECEIPTS_DIR
    else:
        raise HTTPException(status_code=400, detail="Invalid file type")

    file_path = os.path.join(target_dir, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(file_path)
