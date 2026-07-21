import json
import os
import uuid
from typing import List, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct
from app.core.ai.gemini import get_gemini_client

COLLECTION_NAME = "government_schemes"

class VectorStoreService:
    def __init__(self, data_path: str = "data/schemes.json", qdrant_path: str = "qdrant_data"):
        self.data_path = data_path
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
        if any(c.name == COLLECTION_NAME for c in collections):
            print(f"Collection {COLLECTION_NAME} already exists.")
            return

        print(f"Creating collection {COLLECTION_NAME}...")
        self._client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=768, distance=Distance.COSINE),
        )
        self._populate_data()

    def _get_embedding(self, text: str) -> List[float]:
        if not self.gemini_client:
            # Return dummy vector if no API key is provided
            return [0.0] * 768
            
        try:
            response = self.gemini_client.models.embed_content(
                model='text-embedding-004',
                contents=text
            )
            return response.embeddings[0].values
        except Exception as e:
            print(f"Embedding error: {e}")
            return [0.0] * 768

    def _populate_data(self):
        if not os.path.exists(self.data_path):
            print(f"Dataset {self.data_path} not found.")
            return

        with open(self.data_path, "r", encoding="utf-8") as f:
            schemes = json.load(f)

        points = []
        for scheme in schemes:
            # Create a rich text representation for embedding
            text_to_embed = f"Scheme: {scheme['name']}\\nDescription: {scheme['description']}\\nEligibility: {', '.join(scheme['eligibility_criteria'])}\\nBenefits: {', '.join(scheme['benefits'])}"
            vector = self._get_embedding(text_to_embed)
            
            # Using uuid5 or simple string hash for UUID would be better, but Qdrant also accepts integer IDs. 
            # We'll generate a random UUID for simplicity, or just use string id if supported (Qdrant supports UUIDs)
            point_id = str(uuid.uuid4())
            
            points.append(
                PointStruct(
                    id=point_id,
                    vector=vector,
                    payload=scheme
                )
            )

        self.client.upsert(
            collection_name=COLLECTION_NAME,
            points=points
        )
        print(f"Inserted {len(points)} schemes into Qdrant.")

    def search(self, query: str, limit: int = 3) -> List[Dict[str, Any]]:
        if not self.gemini_client:
            return []
            
        query_vector = self._get_embedding(query)
        search_result = self.client.search(
            collection_name=COLLECTION_NAME,
            query_vector=query_vector,
            limit=limit
        )
        
        return [hit.payload for hit in search_result]

vector_store = VectorStoreService()
