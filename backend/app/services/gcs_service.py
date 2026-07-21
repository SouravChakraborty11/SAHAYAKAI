import os
import logging
from typing import Optional, Tuple
from app.core.config import settings

logger = logging.getLogger("GoogleCloudStorageService")

STORAGE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../storage"))
DOCUMENTS_DIR = os.path.join(STORAGE_DIR, "documents")
RECEIPTS_DIR = os.path.join(STORAGE_DIR, "receipts")

os.makedirs(DOCUMENTS_DIR, exist_ok=True)
os.makedirs(RECEIPTS_DIR, exist_ok=True)

class GoogleCloudStorageService:
    """
    Google Cloud Storage Service with Local Filesystem Fallback.
    Uploads documents & receipts to GCS bucket or local storage when credentials are omitted.
    """
    def __init__(self):
        self.bucket_name = settings.GCS_BUCKET_NAME
        self.client = None
        
        # Try initializing google-cloud-storage if credentials provided
        if settings.GCS_CREDENTIALS_FILE and os.path.exists(settings.GCS_CREDENTIALS_FILE):
            try:
                from google.cloud import storage
                self.client = storage.Client.from_service_account_json(settings.GCS_CREDENTIALS_FILE)
                logger.info(f"[GCS_SERVICE] Initialized GCS client for bucket: {self.bucket_name}")
            except Exception as e:
                logger.warning(f"[GCS_SERVICE] Failed to initialize GCS client: {e}. Falling back to local storage.")
        else:
            logger.info("[GCS_SERVICE] No GCS credentials found. Operating in local storage fallback mode.")

    async def upload_file(
        self,
        file_bytes: bytes,
        filename: str,
        folder: str = "documents",
        content_type: str = "application/pdf"
    ) -> Tuple[str, Optional[str]]:
        """
        Upload file to GCS bucket (or local storage fallback).
        Returns Tuple[storage_path, gcs_public_url].
        """
        gcs_url = None
        blob_path = f"{folder}/{filename}"

        if self.client:
            try:
                bucket = self.client.bucket(self.bucket_name)
                blob = bucket.blob(blob_path)
                blob.upload_from_string(file_bytes, content_type=content_type)
                gcs_url = f"https://storage.googleapis.com/{self.bucket_name}/{blob_path}"
                logger.info(f"[GCS_SERVICE] Uploaded {filename} to GCS: {gcs_url}")
                return blob_path, gcs_url
            except Exception as e:
                logger.error(f"[GCS_SERVICE] GCS upload failed: {e}. Using local storage.")

        # Local Storage Fallback
        target_dir = RECEIPTS_DIR if folder == "receipts" else DOCUMENTS_DIR
        local_path = os.path.join(target_dir, filename)
        with open(local_path, "wb") as f:
            f.write(file_bytes)
        
        logger.info(f"[GCS_SERVICE] Saved file to local storage: {local_path}")
        return local_path, None

    async def get_file_bytes(self, storage_path: str) -> Optional[bytes]:
        """Download file bytes from GCS or local storage."""
        if self.client and not os.path.exists(storage_path):
            try:
                bucket = self.client.bucket(self.bucket_name)
                blob = bucket.blob(storage_path)
                return blob.download_as_bytes()
            except Exception as e:
                logger.error(f"[GCS_SERVICE] Error fetching from GCS: {e}")

        if os.path.exists(storage_path):
            with open(storage_path, "rb") as f:
                return f.read()

        return None

gcs_service = GoogleCloudStorageService()
