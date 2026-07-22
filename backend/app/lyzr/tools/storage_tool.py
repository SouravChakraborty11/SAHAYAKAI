import logging
from typing import Optional, Tuple
from app.services.gcs_service import gcs_service

logger = logging.getLogger("StorageTool")

class StorageTool:
    """
    StorageTool wraps the GoogleCloudStorageService to manage GCS operations
    and local fallback storage.
    """
    def __init__(self):
        self._service = gcs_service

    async def upload_file(
        self,
        file_bytes: bytes,
        filename: str,
        folder: str = "documents",
        content_type: str = "application/pdf"
    ) -> Tuple[str, Optional[str]]:
        """Uploads a file to GCS or falls back to local storage."""
        logger.info(f"[STORAGE_TOOL] Uploading file '{filename}' into folder '{folder}'")
        return await self._service.upload_file(
            file_bytes=file_bytes,
            filename=filename,
            folder=folder,
            content_type=content_type
        )

    async def download_file(self, storage_path: str) -> Optional[bytes]:
        """Download file bytes from Google Cloud Storage or local fallback storage."""
        logger.info(f"[STORAGE_TOOL] Downloading file: {storage_path}")
        return await self._service.get_file_bytes(storage_path)

    # Backwards compatibility methods
    async def get_file_bytes(self, storage_path: str) -> Optional[bytes]:
        """Retrieves file bytes from GCS or local storage."""
        return await self._service.get_file_bytes(storage_path)
