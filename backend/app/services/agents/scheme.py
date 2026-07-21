from app.services.agents.base import BaseAgent
from app.core.ai.gemini import get_gemini_client
from app.services.vector_store import vector_store
from typing import AsyncGenerator

class SchemeAgent(BaseAgent):
    async def process(self, message: str, history: list) -> AsyncGenerator[str, None]:
        client = get_gemini_client()
        if not client:
            yield "I can help you with Government Schemes once my API key is configured."
            return
            
        results = vector_store.search(message, limit=3)
        context_str = ""
        if results:
            for i, res in enumerate(results):
                context_str += f"Scheme {i+1}: {res.get('name')}\n"
                context_str += f"Description: {res.get('description')}\n"
                context_str += f"Eligibility: {', '.join(res.get('eligibility_criteria', []))}\n"
                context_str += f"Benefits: {', '.join(res.get('benefits', []))}\n\n"
        
        prompt = f"""You are the Sahayak AI Scheme Expert. 
        Provide clear, accessible information about government schemes relevant to the user's query.
        Keep it simple.
        
        Use the following retrieved context to answer the user's query if relevant:
        {context_str}
        
        User: {message}"""
        
        try:
            response = await client.aio.models.generate_content_stream(
                model='gemini-3.5-flash',
                contents=prompt
            )
            async for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            yield f"Error fetching scheme details: {str(e)}"
