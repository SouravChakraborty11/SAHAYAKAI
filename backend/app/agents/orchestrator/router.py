from typing import Dict

from app.agents.accessibility.agent import AccessibilityAgent
from app.agents.care_community.agent import CareCommunityAgent
from app.agents.digital_services.agent import DigitalServicesAgent
from app.agents.orchestrator.intent_router import IntentRouter
from app.agents.orchestrator.session import SessionManager


class OrchestratorRouter:
    """
    Central routing layer for Sahayak AI.

    Responsibilities:
    - Manage user sessions
    - Understand user intent
    - Route requests to the correct agent
    - Coordinate agent execution

    Google ADK orchestration will replace the routing logic
    in a future phase.
    """

    def __init__(self):

        self.session_manager = SessionManager()

        self.intent_router = IntentRouter()

        self.agents: Dict[str, object] = {
            "digital_services": DigitalServicesAgent(),
            "care_community": CareCommunityAgent(),
            "accessibility": AccessibilityAgent(),
        }

    def _select_agent(self, goal: str) -> str:
        """
        Map a goal to the appropriate agent.
        """

        mapping = {
            "government_services": "digital_services",
            "healthcare_support": "care_community",
            "accessibility": "accessibility",
            "general_assistance": "digital_services",
        }

        return mapping.get(goal.lower(), "digital_services")

    async def handle_request(
        self,
        query: str,
        session_id: str,
        user_id: str,
    ):
        """
        Main orchestration pipeline.
        """

        # ----------------------------
        # Retrieve or create session
        # ----------------------------

        context = await self.session_manager.get_session(user_id)

        if context is None:
            context = await self.session_manager.create_session(
                user_id=user_id,
                session_id=session_id,
            )

        context.query = query

        # ----------------------------
        # Store user message
        # ----------------------------

        await self.session_manager.add_message(
            context=context,
            role="user",
            content=query,
        )

        # ----------------------------
        # Intent Classification
        # ----------------------------

        intent = await self.intent_router.analyze(query)

        context.log(
            f"Intent={intent.intent}, "
            f"Goal={intent.goal}, "
            f"Confidence={intent.confidence}"
        )

        # ----------------------------
        # Select Agent
        # ----------------------------

        selected_agent = self._select_agent(intent.goal)

        context.active_agent = selected_agent

        agent = self.agents[selected_agent]

        # ----------------------------
        # Execute Agent
        # ----------------------------

        agent_response = await agent.process(
            query=query,
            context=context,
        )

        assistant_message = agent_response.get(
            "response",
            str(agent_response),
        )

        # ----------------------------
        # Store assistant response
        # ----------------------------

        await self.session_manager.add_message(
            context=context,
            role="assistant",
            content=assistant_message,
        )

        # ----------------------------
        # Development Response
        # ----------------------------

        return {
            "status": "success",
            "intent": intent.intent,
            "goal": intent.goal,
            "confidence": intent.confidence,
            "entities": intent.entities,
            "selected_agent": selected_agent,
            "conversation_length": len(context.conversation),
            "execution_log": context.execution_log,
            "agent_response": agent_response,
        }