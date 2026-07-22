import logging
from typing import List, Dict, Any
from app.services.rag_service import rag_service
from app.rag.retriever import retriever

logger = logging.getLogger("RAGTool")

class RAGTool:
    """
    RAGTool wraps the Retriever service to search government resources, metadata documents,
    and manage user profile states semantically.
    """
    def __init__(self):
        self._retriever = retriever

    def search_government_resource(self, query: str, limit: int = 3) -> List[Dict[str, Any]]:
        """Search official government resources (PAN, Passport, DL, PM Kisan, Certificates, etc.) in Qdrant."""
        logger.info(f"[RAG_TOOL] Searching government resources for: '{query}'")
        return self._retriever.search_government_resource(query, limit)

    def retrieve_documents(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Retrieve metadata documents from vector store."""
        logger.info(f"[RAG_TOOL] Retrieving metadata documents for: '{query}'")
        return self._retriever.retrieve_documents(query, limit)

    def semantic_search(self, query: str, limit: int = 3, category: str = "schemes") -> List[Dict[str, Any]]:
        """Backwards compatible semantic search method."""
        logger.info(f"[RAG_TOOL] semantic_search fallback for category '{category}': '{query}'")
        return self.search_government_resource(query, limit)

    # Backwards compatibility methods
    def generate_answer(self, query: str) -> str:
        """Generates an answer based on retrieved context using Gemini model."""
        return rag_service.generate_answer(query)

    def search_schemes(self, query: str, limit: int = 3) -> List[Dict[str, Any]]:
        """Semantic search for government schemes."""
        return self.search_government_resource(query, limit)

    def search_care_community(self, query: str, limit: int = 3) -> List[Dict[str, Any]]:
        """Semantic search for care and community services."""
        return self.search_government_resource(query, limit)
