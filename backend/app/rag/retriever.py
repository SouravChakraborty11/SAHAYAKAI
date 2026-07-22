import uuid
import logging
from typing import List, Dict, Any, Optional
from qdrant_client.http import models as qmodels
from qdrant_client.http.models import PointStruct

from app.rag.qdrant_service import qdrant_service, USER_PROFILE_COLLECTION, GOVERNMENT_RESOURCES_COLLECTION, DOCUMENT_METADATA_COLLECTION
from app.rag.embedder import embedder

logger = logging.getLogger(__name__)

class Retriever:
    def __init__(self):
        self.qdrant = qdrant_service

    def search_government_resource(self, query: str, limit: int = 3) -> List[Dict[str, Any]]:
        """Semantic search for government schemes and resources."""
        try:
            vector = embedder.get_embedding(query)
            res = self.qdrant.client.search(
                collection_name=GOVERNMENT_RESOURCES_COLLECTION,
                query_vector=vector,
                limit=limit
            )
            return [hit.payload for hit in res]
        except Exception as e:
            logger.error(f"search_government_resource failed: {e}")
            return []

    def retrieve_documents(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Semantic search across metadata documents."""
        try:
            vector = embedder.get_embedding(query)
            res = self.qdrant.client.search(
                collection_name=DOCUMENT_METADATA_COLLECTION,
                query_vector=vector,
                limit=limit
            )
            return [hit.payload for hit in res]
        except Exception as e:
            logger.error(f"retrieve_documents failed: {e}")
            return []

    def get_user_profile(self, user_id: str) -> Dict[str, str]:
        """Retrieve all stored user profile attributes from Qdrant using payload filtering."""
        try:
            filter_condition = qmodels.Filter(
                must=[
                    qmodels.FieldCondition(
                        key="user_id",
                        match=qmodels.MatchValue(value=user_id)
                    )
                ]
            )
            res = self.qdrant.client.scroll(
                collection_name=USER_PROFILE_COLLECTION,
                scroll_filter=filter_condition,
                limit=100
            )
            points = res[0]
            profile = {}
            for point in points:
                payload = point.payload
                if payload and "key" in payload and "value" in payload:
                    profile[payload["key"]] = payload["value"]
            return profile
        except Exception as e:
            logger.error(f"Error fetching user profile from Qdrant: {e}")
            return {}

    def save_user_profile_attribute(self, user_id: str, key: str, value: str):
        """Save or update a single user profile attribute in Qdrant."""
        try:
            # Check if this attribute already exists to avoid duplication
            filter_condition = qmodels.Filter(
                must=[
                    qmodels.FieldCondition(
                        key="user_id",
                        match=qmodels.MatchValue(value=user_id)
                    ),
                    qmodels.FieldCondition(
                        key="key",
                        match=qmodels.MatchValue(value=key)
                    )
                ]
            )
            res = self.qdrant.client.scroll(
                collection_name=USER_PROFILE_COLLECTION,
                scroll_filter=filter_condition,
                limit=10
            )
            points = res[0]
            
            if points:
                point_ids = [point.id for point in points]
                self.qdrant.client.delete(
                    collection_name=USER_PROFILE_COLLECTION,
                    points_selector=qmodels.PointIdsList(points=point_ids)
                )

            point_id = str(uuid.uuid4())
            text_to_embed = f"{key}: {value}"
            vector = embedder.get_embedding(text_to_embed)
            
            point = PointStruct(
                id=point_id,
                vector=vector,
                payload={
                    "user_id": user_id,
                    "key": key,
                    "value": value
                }
            )
            self.qdrant.client.upsert(
                collection_name=USER_PROFILE_COLLECTION,
                points=[point]
            )
            logger.info(f"Saved profile info in Qdrant: {key}={value} for user={user_id}")
        except Exception as e:
            logger.error(f"Error saving user profile to Qdrant: {e}")

retriever = Retriever()