import os
import json
import logging
import contextvars
from typing import AsyncGenerator, Dict, Any, List

from google.adk.agents.llm_agent import Agent as AdkAgent
from google.adk.runners import InMemoryRunner
from google.genai import types

from app.lyzr.agents.base import BaseLyzrAgent
from app.lyzr.tools.rag_tool import RAGTool
from app.lyzr.tools.eligibility_tool import EligibilityTool
from app.rag.retriever import retriever

logger = logging.getLogger(__name__)

# ContextVars to async-safely propagate session details to tools
current_user_id = contextvars.ContextVar("current_user_id", default="guest")
current_session_id = contextvars.ContextVar("current_session_id", default="default_session")

# Instantiate Lyzr tools
rag_tool = RAGTool()
eligibility_tool = EligibilityTool()

def search_government_resource(query: str) -> str:
    """
    Search official government resources (PAN, Passport, DL, PM Kisan, Certificates, Scholarships, etc.) in Qdrant.
    Use this to identify official URLs, required documents, and form inputs.
    """
    logger.info(f"[ADK_TOOL] search_government_resource query: {query}")
    results = rag_tool.search_government_resource(query, limit=3)
    if not results:
        return f"No official records found for: {query}"
    
    formatted = []
    for i, res in enumerate(results):
        formatted.append(
            f"Result {i+1}: {res.get('name')}\n"
            f"Description: {res.get('description')}\n"
            f"Portal URL: {res.get('official_url', res.get('url', 'N/A'))}\n"
            f"Required Documents: {res.get('required_documents', 'N/A')}\n"
            f"Required Inputs: {res.get('required_inputs', 'N/A')}"
        )
    return "\n\n".join(formatted)

def save_profile_info(key: str, value: str) -> str:
    """
    Save or update a single key-value attribute in the user's profile memory (e.g. name, email, phone, DOB, address).
    Use this to persist user information when provided.
    """
    user_id = current_user_id.get()
    logger.info(f"[ADK_TOOL] save_profile_info for {user_id}: {key}={value}")
    retriever.save_user_profile_attribute(user_id, key, value)
    return f"Successfully saved {key} = {value} in user profile memory."

def get_profile_info() -> str:
    """
    Retrieve all stored user profile details (like name, email, phone, DOB, address, preferred language) from Qdrant.
    Use this at the start of a workflow to reuse existing information.
    """
    user_id = current_user_id.get()
    logger.info(f"[ADK_TOOL] get_profile_info for {user_id}")
    profile = retriever.get_user_profile(user_id)
    if not profile:
        return "User profile is currently empty."
    return json.dumps(profile, indent=2)

def check_scheme_eligibility(profile_json: str) -> str:
    """
    Evaluate user eligibility against retrieved schemes using the Eligibility Tool.
    Input should be a JSON string representing the user profile attributes.
    """
    logger.info(f"[ADK_TOOL] check_scheme_eligibility: {profile_json}")
    try:
        profile_dict = json.loads(profile_json)
        return eligibility_tool.check_eligibility(profile_dict)
    except Exception as e:
        return f"Failed to check eligibility due to parsing error: {e}"

# System instruction prompt for Google ADK Agent
SYSTEM_INSTRUCTION = """You are the Sahayak AI Digital Services Agent.
You assist citizens with digital and government services such as PAN Card, Passport, Driving Licence, PM Kisan scheme, and Certificates.

Your goal is to decide WHAT browser actions should be performed next, but you must NEVER execute them yourself. Instead, generate them in your output.

You must interact with the user and return responses formatted STRICTLY as a single JSON object. Do not include markdown code block formatting (like ```json) in your final output, just output the raw JSON string matching the following schema:
{
  "response": "Your conversational message to the user.",
  "tool_calls": [
    // A list of generated browser actions to navigate, fill, click, or wait on the official portals.
    // Examples:
    // {"tool": "browser", "action": "goto", "url": "https://www.onlineservices.nsdl.com/paam/endUserRegisterContact.html", "reason": "Navigate to the official PAN application portal."}
    // {"tool": "browser", "action": "fill", "selector": "#name", "value": "John Doe", "reason": "Fill applicant name"}
    // {"tool": "browser", "action": "click", "selector": "#submit", "reason": "Click submit button"}
  ],
  "missing_information": [
    // List of attributes or documents that are required for the application but are not yet known.
  ],
  "memory_updates": [
    // List of key-value pairs to store in Qdrant memory for this user.
    // Example: [{"key": "name", "value": "John Doe"}]
  ]
}

RULES:
1. Search official government information using the `search_government_resource` tool. Never use unofficial sites.
2. Retrieve the existing user profile using the `get_profile_info` tool at the start to reuse stored information.
3. If information is missing, ask for it in your `response` and add the field names to `missing_information`. Do not generate actions that need missing details.
4. Auto-save any user profile details they provide by calling the `save_profile_info` tool and listing them in `memory_updates`.
5. SAFETY: Never submit forms, pay fees, or click final submits. When the application is ready for final submission, output "Ready for user confirmation." in your `response` and do not generate final click submits.
"""

class DigitalServicesAgent(BaseLyzrAgent):
    """
    DigitalServicesAgent handles government services, citizen services, and document assistance.
    It integrates Google ADK as its reasoning engine, powered by Gemini-3.5-flash-lite.
    """
    def __init__(self):
        # Set standard Google API key if not set
        if "GOOGLE_API_KEY" not in os.environ and "GEMINI_API_KEY" in os.environ:
            os.environ["GOOGLE_API_KEY"] = os.environ["GEMINI_API_KEY"]

        self.active_tool = "None"
        self.tool_output = "None"
        
        # Initialize Google ADK Agent
        self._adk_agent = AdkAgent(
            model="gemini-3.5-flash-lite",
            name="DigitalServicesAgent",
            description="Agent for digital and government services.",
            instruction=SYSTEM_INSTRUCTION,
            tools=[
                search_government_resource,
                save_profile_info,
                get_profile_info,
                check_scheme_eligibility
            ]
        )
        self._runner = InMemoryRunner(self._adk_agent)

    async def process(self, message: str, history: list) -> AsyncGenerator[str, None]:
        user_id = current_user_id.get()
        session_id = current_session_id.get()

        logger.info(f"[DIGITAL_SERVICES_AGENT] Processing message for user={user_id}, session={session_id}")

        # Ensure session exists in runner's session_service
        try:
            await self._runner.session_service.create_session(
                app_name=self._runner.app_name,
                user_id=user_id,
                session_id=session_id
            )
        except Exception:
            # Session might already exist
            pass

        new_message = types.Content(
            role="user",
            parts=[types.Part.from_text(text=message)]
        )

        full_text = ""
        try:
            async for event in self._runner.run_async(
                user_id=user_id,
                session_id=session_id,
                new_message=new_message
            ):
                if hasattr(event, "content") and event.content:
                    for part in event.content.parts:
                        if hasattr(part, "text") and part.text:
                            full_text += part.text
        except Exception as e:
            logger.error(f"[DIGITAL_SERVICES_AGENT] Google ADK runtime error: {e}")
            full_text = json.dumps({
                "response": f"I'm sorry, I encountered an error: {e}",
                "tool_calls": [],
                "missing_information": [],
                "memory_updates": []
            })

        # Process and validate response matches the consistent JSON schema
        cleaned_text = full_text.strip()
        # Remove markdown JSON wrappers if present
        if cleaned_text.startswith("```json"):
            cleaned_text = cleaned_text[7:]
        if cleaned_text.endswith("```"):
            cleaned_text = cleaned_text[:-3]
        cleaned_text = cleaned_text.strip()

        # Validate JSON format
        try:
            parsed = json.loads(cleaned_text)
            # Ensure all required keys are present
            required_keys = ["response", "tool_calls", "missing_information", "memory_updates"]
            for key in required_keys:
                if key not in parsed:
                    parsed[key] = [] if key != "response" else ""
            cleaned_text = json.dumps(parsed, indent=2)
        except Exception:
            # Fallback wrapper if model output wasn't valid JSON
            cleaned_text = json.dumps({
                "response": full_text,
                "tool_calls": [],
                "missing_information": [],
                "memory_updates": []
            }, indent=2)

        # Yield response in chunks to maintain streaming compatibilities
        chunk_size = 64
        for i in range(0, len(cleaned_text), chunk_size):
            yield cleaned_text[i:i+chunk_size]
