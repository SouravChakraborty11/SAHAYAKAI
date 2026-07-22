from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.models.application import SchemeApplication

router = APIRouter()

class ApplicationResponse(BaseModel):
    id: int
    reference_number: str
    scheme_name: str
    applicant_name: str
    phone_number: str
    status: str
    receipt_file: Optional[str] = None
    screenshot_file: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class ApplicationsListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    results: List[ApplicationResponse]

@router.get("/", response_model=ApplicationsListResponse)
async def list_applications(
    search: Optional[str] = Query(None, description="Search by reference number, scheme, or applicant name"),
    status: Optional[str] = Query(None, description="Filter by status"),
    sort_by: Optional[str] = Query("created_at", description="Sort field: created_at, scheme_name, status, applicant_name"),
    sort_order: Optional[str] = Query("desc", description="asc or desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(SchemeApplication)

    # Search filter
    if search:
        pattern = f"%{search}%"
        stmt = stmt.where(
            or_(
                SchemeApplication.reference_number.ilike(pattern),
                SchemeApplication.scheme_name.ilike(pattern),
                SchemeApplication.applicant_name.ilike(pattern),
            )
        )

    # Status filter
    if status:
        stmt = stmt.where(SchemeApplication.status == status)

    # Count total
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_result = await db.execute(count_stmt)
    total = total_result.scalar_one()

    # Sorting
    sort_col = getattr(SchemeApplication, sort_by, SchemeApplication.created_at)
    if sort_order == "asc":
        stmt = stmt.order_by(sort_col.asc())
    else:
        stmt = stmt.order_by(sort_col.desc())

    # Pagination
    offset = (page - 1) * page_size
    stmt = stmt.offset(offset).limit(page_size)

    result = await db.execute(stmt)
    records = result.scalars().all()

    total_pages = max(1, (total + page_size - 1) // page_size)

    return ApplicationsListResponse(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        results=records,
    )

@router.get("/{application_id}", response_model=ApplicationResponse)
async def get_application(
    application_id: int,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(SchemeApplication).where(SchemeApplication.id == application_id)
    result = await db.execute(stmt)
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Application not found")
    return record

@router.get("/ref/{reference_number}", response_model=ApplicationResponse)
async def get_application_by_ref(
    reference_number: str,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(SchemeApplication).where(
        SchemeApplication.reference_number == reference_number.strip()
    )
    result = await db.execute(stmt)
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Application not found")
    return record
