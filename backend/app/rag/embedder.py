import hashlib
import logging
from typing import List
from app.core.ai.gemini import get_gemini_client

logger = logging.getLogger(__name__)

class Embedder:
    def __init__(self):
        self._client = None

    @property
    def client(self):
        if self._client is None:
            self._client = get_gemini_client()
        return self._client

    def get_embedding(self, text: str) -> List[float]:
        """Generate 768-dim vector embedding using Gemini API or deterministic n-gram hash vector fallback."""
        if self.client:
            for model_name in ['text-embedding-004', 'models/text-embedding-004']:
                try:
                    response = self.client.models.embed_content(
                        model=model_name,
                        contents=text
                    )
                    if hasattr(response, 'embeddings') and response.embeddings:
                        return response.embeddings[0].values
                except Exception:
                    pass

        logger.warning("Gemini embedding client failed or unconfigured. Falling back to deterministic n-gram hash vector.")
        
        # Fallback deterministic 768-dim word & char n-gram hash embedding vector
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

embedder = Embedder()