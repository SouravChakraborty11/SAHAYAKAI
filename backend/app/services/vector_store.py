import json
import os
import uuid
import logging
import hashlib
from typing import List, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct
from app.core.ai.gemini import get_gemini_client

logger = logging.getLogger("VectorStoreService")

SCHEMES_COLLECTION_NAME = "government_schemes"
CARE_COLLECTION_NAME = "care_community"
METADATA_COLLECTION_NAME = "document_metadata"

class VectorStoreService:
    def __init__(
        self, 
        data_path: str = "data/schemes.json", 
        care_data_path: str = "data/care_community.json", 
        qdrant_path: str = "qdrant_data"
    ):
        self.data_path = data_path
        self.care_data_path = care_data_path
        self.qdrant_path = qdrant_path
        self._client = None
        self.gemini_client = get_gemini_client()
        
    @property
    def client(self) -> QdrantClient:
        if self._client is None:
            self._client = QdrantClient(path=self.qdrant_path)
            self._initialize_collection()
        return self._client

    def _initialize_collection(self):
        collections = self.client.get_collections().collections
        
        # 1. Initialize Schemes Collection
        if not any(c.name == SCHEMES_COLLECTION_NAME for c in collections):
            logger.info(f"Creating Qdrant collection {SCHEMES_COLLECTION_NAME}...")
            self.client.create_collection(
                collection_name=SCHEMES_COLLECTION_NAME,
                vectors_config=VectorParams(size=768, distance=Distance.COSINE),
            )
            self._populate_data()

        # 2. Initialize Care & Community Collection
        if not any(c.name == CARE_COLLECTION_NAME for c in collections):
            logger.info(f"Creating Qdrant collection {CARE_COLLECTION_NAME}...")
            self.client.create_collection(
                collection_name=CARE_COLLECTION_NAME,
                vectors_config=VectorParams(size=768, distance=Distance.COSINE),
            )
            self._populate_care_data()

        # 3. Initialize Metadata Collection
        if not any(c.name == METADATA_COLLECTION_NAME for c in collections):
            logger.info(f"Creating Qdrant collection {METADATA_COLLECTION_NAME}...")
            self.client.create_collection(
                collection_name=METADATA_COLLECTION_NAME,
                vectors_config=VectorParams(size=768, distance=Distance.COSINE),
            )

    def _get_embedding(self, text: str) -> List[float]:
        """Generate 768-dim vector embedding using Gemini API or deterministic n-gram hash vector."""
        if self.gemini_client:
            for model_name in ['text-embedding-004', 'models/text-embedding-004']:
                try:
                    response = self.gemini_client.models.embed_content(
                        model=model_name,
                        contents=text
                    )
                    if hasattr(response, 'embeddings') and response.embeddings:
                        return response.embeddings[0].values
                except Exception:
                    pass
                
        # Deterministic 768-dim word & char n-gram hash embedding vector
        vector = [0.0] * 768
        text_clean = text.lower().strip()
        
        # Word hashing
        words = text_clean.split()
        for word in words:
            h = int(hashlib.sha256(word.encode('utf-8')).hexdigest(), 16)
            idx = h % 768
            vector[idx] += 2.0
            
        # Character 3-gram hashing
        for i in range(len(text_clean) - 2):
            ngram = text_clean[i:i+3]
            h = int(hashlib.md5(ngram.encode('utf-8')).hexdigest(), 16)
            idx = h % 768
            vector[idx] += 1.0

        # L2 Normalize
        norm = sum(v * v for v in vector) ** 0.5
        if norm > 0:
            vector = [v / norm for v in vector]
        return vector

    def _populate_data(self):
        if not os.path.exists(self.data_path):
            return

        with open(self.data_path, "r", encoding="utf-8") as f:
            schemes = json.load(f)

        points = []
        for scheme in schemes:
            text_to_embed = f"Scheme: {scheme['name']}\nDescription: {scheme['description']}\nEligibility: {', '.join(scheme['eligibility_criteria'])}\nBenefits: {', '.join(scheme['benefits'])}"
            vector = self._get_embedding(text_to_embed)
            point_id = str(uuid.uuid4())
            
            points.append(
                PointStruct(
                    id=point_id,
                    vector=vector,
                    payload=scheme
                )
            )

        self.client.upsert(
            collection_name=SCHEMES_COLLECTION_NAME,
            points=points
        )
        logger.info(f"Inserted {len(points)} schemes into Qdrant.")

    def _populate_care_data(self):
        if not os.path.exists(self.care_data_path):
            return

        with open(self.care_data_path, "r", encoding="utf-8") as f:
            items = json.load(f)

        points = []
        for item in items:
            text_to_embed = f"Name: {item['name']}\nType: {item['type']}\nCategory: {item['category']}\nLocation: {item['location']}\nDescription: {item['description']}\nServices: {', '.join(item.get('services', []))}"
            vector = self._get_embedding(text_to_embed)
            point_id = str(uuid.uuid4())
            
            points.append(
                PointStruct(
                    id=point_id,
                    vector=vector,
                    payload=item
                )
            )

        self.client.upsert(
            collection_name=CARE_COLLECTION_NAME,
            points=points
        )
        logger.info(f"Inserted {len(points)} care providers into Qdrant.")

    def search(self, query: str, limit: int = 3) -> List[Dict[str, Any]]:
        try:
            query_vector = self._get_embedding(query)
            if hasattr(self.client, 'query_points'):
                res = self.client.query_points(collection_name=SCHEMES_COLLECTION_NAME, query=query_vector, limit=limit)
                return [hit.payload for hit in res.points]
            elif hasattr(self.client, 'search'):
                res = self.client.search(collection_name=SCHEMES_COLLECTION_NAME, query_vector=query_vector, limit=limit)
                return [hit.payload for hit in res]
        except Exception as e:
            logger.error(f"Qdrant scheme search exception: {e}")
        return []

    def search_care_community(self, query: str, limit: int = 3) -> List[Dict[str, Any]]:
        try:
            query_vector = self._get_embedding(query)
            if hasattr(self.client, 'query_points'):
                res = self.client.query_points(collection_name=CARE_COLLECTION_NAME, query=query_vector, limit=limit)
                return [hit.payload for hit in res.points]
            elif hasattr(self.client, 'search'):
                res = self.client.search(collection_name=CARE_COLLECTION_NAME, query_vector=query_vector, limit=limit)
                return [hit.payload for hit in res]
        except Exception as e:
            logger.error(f"Qdrant care search exception: {e}")
            
        try:
            if os.path.exists(self.care_data_path):
                with open(self.care_data_path, "r", encoding="utf-8") as f:
                    items = json.load(f)
                words = [w.lower() for w in query.split() if len(w) > 2]
                scored = []
                for item in items:
                    blob = f"{item['name']} {item['category']} {item['location']} {item['description']} {' '.join(item.get('services', []))}".lower()
                    score = sum(1 for w in words if w in blob)
                    scored.append((score, item))
                scored.sort(key=lambda x: x[0], reverse=True)
                return [item for score, item in scored[:limit]]
        except Exception:
            pass
        return []

    def index_metadata(self, doc_id: str, text: str, payload: Dict[str, Any]) -> str:
        """
        Generate 768-dim embedding vector and insert document metadata into Qdrant 'document_metadata' collection.
        Returns the generated Point ID.
        """
        # Ensure collection exists before indexing
        collections = [c.name for c in self.client.get_collections().collections]
        if METADATA_COLLECTION_NAME not in collections:
            logger.info(f"Creating Qdrant collection {METADATA_COLLECTION_NAME}...")
            self.client.create_collection(
                collection_name=METADATA_COLLECTION_NAME,
                vectors_config=VectorParams(size=768, distance=Distance.COSINE),
            )

        vector = self._get_embedding(text)
        point_id = str(uuid.uuid4())
        
        point = PointStruct(
            id=point_id,
            vector=vector,
            payload=payload
        )
        self.client.upsert(collection_name=METADATA_COLLECTION_NAME, points=[point])
        logger.info(f"[QDRANT_INDEX] Metadata indexed successfully | Collection: {METADATA_COLLECTION_NAME} | Point ID: {point_id} | Doc ID: {doc_id}")
        print(f"[QDRANT_INDEX] Metadata indexed successfully | Collection: {METADATA_COLLECTION_NAME} | Point ID: {point_id} | Doc ID: {doc_id}")
        return point_id

    def search_metadata(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Search document metadata semantically using Qdrant vector store.
        Returns matching metadata payloads.
        """
        try:
            # Ensure collection exists before querying
            collections = [c.name for c in self.client.get_collections().collections]
            if METADATA_COLLECTION_NAME not in collections:
                logger.warning(f"Qdrant collection {METADATA_COLLECTION_NAME} does not exist yet.")
                return []

            query_vector = self._get_embedding(query)
            payloads = []
            
            if hasattr(self.client, 'query_points'):
                res = self.client.query_points(collection_name=METADATA_COLLECTION_NAME, query=query_vector, limit=limit)
                payloads = [hit.payload for hit in res.points]
            elif hasattr(self.client, 'search'):
                res = self.client.search(collection_name=METADATA_COLLECTION_NAME, query_vector=query_vector, limit=limit)
                payloads = [hit.payload for hit in res]
                
            logger.info(f"[QDRANT_SEARCH] Query: '{query}' | Collection: {METADATA_COLLECTION_NAME} | Search results count: {len(payloads)}")
            print(f"[QDRANT_SEARCH] Query: '{query}' | Collection: {METADATA_COLLECTION_NAME} | Search results count: {len(payloads)}")
            return payloads
        except Exception as e:
            logger.error(f"[QDRANT_SEARCH_ERROR] Qdrant metadata search exception: {e}")
            print(f"[QDRANT_SEARCH_ERROR] Exception: {e}")
            return []

vector_store = VectorStoreService()
