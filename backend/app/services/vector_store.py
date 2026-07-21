import json
import os
import uuid
from typing import List, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct
from app.core.ai.gemini import get_gemini_client

SCHEMES_COLLECTION_NAME = "government_schemes"
CARE_COLLECTION_NAME = "care_community"

class VectorStoreService:
    def __init__(self, data_path: str = "data/schemes.json", care_data_path: str = "data/care_community.json", qdrant_path: str = "qdrant_data"):
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
        if not self.gemini_client:
            print("Warning: Gemini client not initialized. Using dummy vectors for Qdrant initialization.")

        collections = self._client.get_collections().collections
        
        # Initialize Schemes Collection
        if not any(c.name == SCHEMES_COLLECTION_NAME for c in collections):
            print(f"Creating collection {SCHEMES_COLLECTION_NAME}...")
            self._client.create_collection(
                collection_name=SCHEMES_COLLECTION_NAME,
                vectors_config=VectorParams(size=768, distance=Distance.COSINE),
            )
            self._populate_data()

        # Initialize Care & Community Collection
        if not any(c.name == CARE_COLLECTION_NAME for c in collections):
            print(f"Creating collection {CARE_COLLECTION_NAME}...")
            self._client.create_collection(
                collection_name=CARE_COLLECTION_NAME,
                vectors_config=VectorParams(size=768, distance=Distance.COSINE),
            )
            self._populate_care_data()

    def _get_embedding(self, text: str) -> List[float]:
        if self.gemini_client:
            try:
                response = self.gemini_client.models.embed_content(
                    model='embedding-001',
                    contents=text
                )
                if hasattr(response, 'embeddings') and response.embeddings:
                    return response.embeddings[0].values
            except Exception:
                pass
                
        # Deterministic lightweight 768-dim hash vector fallback for offline / rate-limited search
        import hashlib
        vector = [0.0] * 768
        words = text.lower().split()
        for word in words:
            h = int(hashlib.md5(word.encode()).hexdigest(), 16)
            idx = h % 768
            vector[idx] += 1.0
        # Normalize
        norm = sum(v*v for v in vector) ** 0.5
        if norm > 0:
            vector = [v / norm for v in vector]
        return vector

    def _populate_data(self):
        if not os.path.exists(self.data_path):
            print(f"Dataset {self.data_path} not found.")
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
        print(f"Inserted {len(points)} schemes into Qdrant.")

    def _populate_care_data(self):
        if not os.path.exists(self.care_data_path):
            print(f"Dataset {self.care_data_path} not found.")
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
        print(f"Inserted {len(points)} care & community providers into Qdrant.")

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
            print(f"Qdrant scheme search exception: {e}")
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
            print(f"Qdrant care search exception: {e}")
            
        # Offline JSON search fallback if Qdrant client query format differs
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

vector_store = VectorStoreService()
