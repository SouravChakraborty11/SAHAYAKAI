from typing import AsyncGenerator
from app.lyzr.agents.base import BaseLyzrAgent
from app.lyzr.tools.rag_tool import RAGTool
from app.core.ai.gemini import get_gemini_client

class CareCommunityAgent(BaseLyzrAgent):
    """
    CareCommunityAgent connects users to NGOs, caregivers, nurses, and care community hubs.
    It uses RAGTool to semantically fetch care provider matches.
    """
    def __init__(self):
        self.rag_tool = RAGTool()
        self.active_tool = "None"
        self.tool_output = "None"

    async def process(self, message: str, history: list) -> AsyncGenerator[str, None]:
        client = get_gemini_client()
        
        self.active_tool = "RAGTool"
        # 1. Retrieve matching care providers from vector store using RAGTool
        try:
            results = self.rag_tool.semantic_search(message, limit=3, category="care_community")
            self.tool_output = f"Retrieved {len(results)} care providers."
        except Exception as e:
            results = []
            self.tool_output = f"RAGTool Error: {str(e)}"

        context_str = ""
        fallback_response = "Here are the top matches from our Care & Community directory for your query:\n\n"
        
        if results:
            for i, res in enumerate(results):
                context_str += f"Provider {i+1}: {res.get('name')} ({res.get('category')})\n"
                context_str += f"Type: {res.get('type')}\n"
                context_str += f"Location: {res.get('location')}\n"
                context_str += f"Contact: {res.get('contact')}\n"
                context_str += f"Description: {res.get('description')}\n"
                context_str += f"Services: {', '.join(res.get('services', []))}\n\n"

                fallback_response += f"📍 **{res.get('name')}** ({res.get('category')})\n"
                fallback_response += f"- **Location**: {res.get('location')}\n"
                fallback_response += f"- **Contact**: {res.get('contact')}\n"
                fallback_response += f"- **Services**: {', '.join(res.get('services', []))}\n"
                fallback_response += f"- **About**: {res.get('description')}\n\n"
        else:
            fallback_response = "I am your Care & Community assistant. You can search for NGOs, home nurses, caregivers, or rehabilitation centers, or schedule an appointment using the Care & Community Hub on your dashboard."

        if not client:
            yield fallback_response
            return

        prompt = f"""You are Sahayak AI's Care & Community Expert. 
        Help the user find NGOs, Caregivers, or Rehabilitation Centres based on their query.
        Provide clear, practical, and compassionate assistance. 
        If the user wants to book an appointment, let them know they can easily do so through the Care & Community Hub.
        
        Retrieved Care & Community Directory Data:
        {context_str}
        
        User: {message}"""

        try:
            response = await client.aio.models.generate_content_stream(
                model='gemini-2.5-flash',
                contents=prompt
            )
            async for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            yield fallback_response
