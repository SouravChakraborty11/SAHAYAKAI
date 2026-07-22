from app.services.vector_store import vector_store
from app.core.ai.gemini import get_gemini_client

class RAGService:
    def __init__(self):
        self.gemini_client = get_gemini_client()

    def generate_answer(self, query: str) -> str:
        if not self.gemini_client:
            return "Gemini API key is not configured. Cannot perform RAG."

        # 1. Retrieve context from Qdrant
        results = vector_store.search(query, limit=3)
        
        if not results:
            return "I couldn't find any relevant schemes for your query."
            
        context_str = ""
        for i, res in enumerate(results):
            context_str += f"Scheme {i+1}: {res.get('name')}\\n"
            context_str += f"Description: {res.get('description')}\\n"
            context_str += f"Eligibility: {', '.join(res.get('eligibility_criteria', []))}\\n"
            context_str += f"Benefits: {', '.join(res.get('benefits', []))}\\n"
            context_str += f"Application: {res.get('application_process')}\\n\\n"
            
        # 2. Construct Prompt
        prompt = f"""You are Sahayak AI, a helpful assistant for Indian Government Schemes.
Use the following retrieved context to answer the user's query. If the context doesn't contain the answer, say you don't know based on the provided information, but try to be helpful.

Context:
{context_str}

User Query:
{query}

Answer:"""

        # 3. Call Gemini
        try:
            response = self.gemini_client.models.generate_content(
                model='gemini-3.5-flash',
                contents=prompt
            )
            return response.text.strip()
        except Exception as e:
            return f"An error occurred during generation: {str(e)}"

rag_service = RAGService()
