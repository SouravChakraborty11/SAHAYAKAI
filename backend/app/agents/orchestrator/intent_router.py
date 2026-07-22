import json
import logging

from google.genai import types

from app.core.ai.gemini import get_gemini_client
from app.agents.orchestrator.models import IntentResult
from app.agents.orchestrator.prompts import INTENT_CLASSIFICATION_PROMPT

logger = logging.getLogger(__name__)


class IntentRouter:
    """
    AI-powered intent router using Gemini.
    """

    def __init__(self):
        self.client = get_gemini_client()

        if self.client:
            print("\n✅ Gemini client initialized successfully.\n")
        else:
            print("\n❌ Gemini client initialization failed.\n")

    async def analyze(self, query: str) -> IntentResult:

        if self.client is None:
            return IntentResult(
                intent="unknown",
                goal="general_assistance",
                confidence=0.0,
                entities=[],
            )

        prompt = f"""
{INTENT_CLASSIFICATION_PROMPT}

User Query:
{query}

Return ONLY valid JSON in this format:

{{
    "intent": "...",
    "goal": "...",
    "confidence": 0.95,
    "entities": ["..."]
}}
"""

        print("\n" + "=" * 80)
        print("Sending Prompt to Gemini")
        print("=" * 80)
        print(prompt)
        print("=" * 80)

        try:

            response = self.client.models.generate_content(
                model="gemini-flash-latest",
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0,
                    response_mime_type="application/json",
                ),
            )

            print("\n" + "=" * 80)
            print("RAW GEMINI RESPONSE")
            print("=" * 80)
            print(response.text)
            print("=" * 80)

            try:
                result = json.loads(response.text)

            except json.JSONDecodeError as e:

                print("\nJSON Parsing Error")
                print(e)

                return IntentResult(
                    intent="unknown",
                    goal="general_assistance",
                    confidence=0.0,
                    entities=[],
                )

            intent = IntentResult(
                intent=result.get("intent", "unknown"),
                goal=result.get("goal", "general_assistance"),
                confidence=float(result.get("confidence", 0.0)),
                entities=result.get("entities", []),
            )

            print("\nParsed IntentResult")
            print(intent)

            return intent

        except Exception as e:

            print("\n" + "=" * 80)
            print("GEMINI API ERROR")
            print("=" * 80)
            print(type(e).__name__)
            print(str(e))
            print("=" * 80)

            logger.exception(e)

            return IntentResult(
                intent="unknown",
                goal="general_assistance",
                confidence=0.0,
                entities=[],
            )