import os
import logging
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams

logger = logging.getLogger(__name__)

USER_PROFILE_COLLECTION = "user_profile"
GOVERNMENT_RESOURCES_COLLECTION = "government_resources"
DOCUMENT_METADATA_COLLECTION = "document_metadata"

class QdrantService:
    def __init__(self, qdrant_path: str = "qdrant_data"):
        self.qdrant_path = qdrant_path
        self._client = None

    @property
    def client(self) -> QdrantClient:
        if self._client is None:
            os.makedirs(self.qdrant_path, exist_ok=True)
            self._client = QdrantClient(path=self.qdrant_path)
            self._initialize_collections()
        return self._client

    def _initialize_collections(self):
        try:
            collections = [c.name for c in self.client.get_collections().collections]
            
            # 1. Initialize user_profile
            if USER_PROFILE_COLLECTION not in collections:
                logger.info(f"Creating Qdrant collection {USER_PROFILE_COLLECTION}...")
                self.client.create_collection(
                    collection_name=USER_PROFILE_COLLECTION,
                    vectors_config=VectorParams(size=768, distance=Distance.COSINE),
                )

            # 2. Initialize government_resources
            if GOVERNMENT_RESOURCES_COLLECTION not in collections:
                logger.info(f"Creating Qdrant collection {GOVERNMENT_RESOURCES_COLLECTION}...")
                self.client.create_collection(
                    collection_name=GOVERNMENT_RESOURCES_COLLECTION,
                    vectors_config=VectorParams(size=768, distance=Distance.COSINE),
                )

            # 3. Initialize document_metadata
            if DOCUMENT_METADATA_COLLECTION not in collections:
                logger.info(f"Creating Qdrant collection {DOCUMENT_METADATA_COLLECTION}...")
                self.client.create_collection(
                    collection_name=DOCUMENT_METADATA_COLLECTION,
                    vectors_config=VectorParams(size=768, distance=Distance.COSINE),
                )
        except Exception as e:
            logger.error(f"Failed to initialize collections in Qdrant: {e}")

qdrant_service = QdrantService()