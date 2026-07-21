import json
from typing import Dict, Any, List
from app.services.vector_store import vector_store
from app.core.ai.gemini import get_gemini_client

class EligibilityService:
    def __init__(self):
        self.gemini_client = get_gemini_client()

    def check_eligibility(self, user_profile: Dict[str, Any]) -> str:
        if not self.gemini_client:
            return "Gemini API key is not configured. Cannot check eligibility."

        # Convert profile to string for semantic search
        profile_str = ", ".join([f"{k}: {v}" for k, v in user_profile.items()])
        
        # 1. Retrieve potentially relevant schemes based on the profile
        # We fetch more schemes here since we want to check multiple
        results = vector_store.search(profile_str, limit=5)
        
        if not results:
            return "No schemes found to evaluate."
            
        context_str = ""
        for i, res in enumerate(results):
            context_str += f"Scheme {i+1}: {res.get('name')}\\n"
            context_str += f"Eligibility Criteria: {json.dumps(res.get('eligibility_criteria', []))}\\n\\n"
            
        # 2. Construct Prompt to evaluate eligibility
        prompt = f"""You are Sahayak AI, an eligibility checker.
Given the following User Profile and a list of Government Schemes with their eligibility criteria, determine which schemes the user is eligible for, which they are NOT eligible for, and which require more information.

User Profile:
{json.dumps(user_profile, indent=2)}

Schemes to evaluate:
{context_str}

Please respond with a clear breakdown:
1. Eligible Schemes (with reason)
2. Ineligible Schemes (with reason)
3. Need More Information (what is missing)"""

        # 3. Call Gemini
        try:
            response = self.gemini_client.models.generate_content(
                model='gemini-3.5-flash',
                contents=prompt
            )
            return response.text.strip()
        except Exception as e:
            return f"An error occurred during eligibility check: {str(e)}"

eligibility_service = EligibilityService()
