import os
import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.core.database import get_db
from app.repositories.document_repository import DocumentRepository
from app.repositories.receipt_repository import ReceiptRepository
from app.repositories.user_repository import UserRepository
from app.repositories.activity_repository import ActivityRepository
from app.services.gcs_service import gcs_service
from app.services.vector_store import vector_store

router = APIRouter()

class MetadataSearchRequest(BaseModel):
    query: str
    limit: Optional[int] = 5

@router.post("/upload-document")
async def upload_user_document(
    file: UploadFile = File(...),
    document_name: str = Form(...),
    file_type: str = Form("General Document"),
    user_id: Optional[int] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload user document via Google Cloud Storage (with local filesystem fallback),
    save metadata record using DocumentRepository, and index vector metadata into Qdrant.
    """
    file_bytes = await file.read()
    filename = f"{uuid.uuid4().hex[:8]}_{file.filename}"
    
    # 1. Upload to GCS / Local Storage
    storage_path, gcs_url = await gcs_service.upload_file(
        file_bytes=file_bytes,
        filename=filename,
        folder="documents",
        content_type=file.content_type or "application/pdf"
    )

    # 2. Save record via DocumentRepository
    doc_repo = DocumentRepository(db)
    doc_record = await doc_repo.create({
        "user_id": user_id,
        "document_name": document_name,
        "file_type": file_type,
        "storage_path": storage_path,
        "gcs_url": gcs_url,
        "file_size": len(file_bytes),
        "metadata_json": f'{{"original_filename": "{file.filename}", "content_type": "{file.content_type}"}}'
    })

    # 3. Index metadata vector in Qdrant
    searchable_text = f"Document: {document_name} Type: {file_type} UserID: {user_id} Storage: {storage_path}"
    vector_store.index_metadata(
        doc_id=str(doc_record.id),
        text=searchable_text,
        payload={
            "document_id": doc_record.id,
            "document_name": document_name,
            "file_type": file_type,
            "storage_path": storage_path,
            "gcs_url": gcs_url,
            "user_id": user_id
        }
    )

    # 4. Log Activity via ActivityRepository
    act_repo = ActivityRepository(db)
    await act_repo.create({
        "user_id": user_id,
        "action": "UPLOAD_DOCUMENT",
        "details": f"Uploaded {document_name} ({file_type})"
    })

    return {
        "success": True,
        "document_id": doc_record.id,
        "document_name": doc_record.document_name,
        "file_type": doc_record.file_type,
        "storage_path": doc_record.storage_path,
        "gcs_url": doc_record.gcs_url,
        "file_size": doc_record.file_size
    }

@router.get("/documents")
async def list_user_documents(
    user_id: Optional[int] = None, 
    db: AsyncSession = Depends(get_db)
):
    """Retrieve user documents via DocumentRepository."""
    doc_repo = DocumentRepository(db)
    if user_id:
        docs = await doc_repo.get_by_user_id(user_id)
    else:
        docs = await doc_repo.get_all()
    
    return [
        {
            "id": d.id,
            "document_name": d.document_name,
            "file_type": d.file_type,
            "storage_path": d.storage_path,
            "gcs_url": d.gcs_url,
            "file_size": d.file_size,
            "created_at": d.created_at.isoformat() if d.created_at else None
        }
        for d in docs
    ]

@router.get("/receipts")
async def list_receipts(db: AsyncSession = Depends(get_db)):
    """Retrieve automation receipts via ReceiptRepository."""
    rec_repo = ReceiptRepository(db)
    receipts = await rec_repo.get_all()
    return [
        {
            "id": r.id,
            "reference_number": r.reference_number,
            "scheme_name": r.scheme_name,
            "receipt_filename": r.receipt_filename,
            "storage_path": r.storage_path,
            "gcs_url": r.gcs_url,
            "file_size": r.file_size,
            "created_at": r.created_at.isoformat() if r.created_at else None
        }
        for r in receipts
    ]

@router.post("/search-metadata")
async def search_metadata_vectors(request: MetadataSearchRequest):
    """Perform Qdrant vector semantic search on documents & receipts metadata."""
    results = vector_store.search_metadata(request.query, limit=request.limit or 5)
    return {"query": request.query, "results_count": len(results), "metadata_matches": results}
