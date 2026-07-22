from datetime import datetime
from typing import Optional

from app.agents.orchestrator.context import AgentContext


class SessionManager:
    """
    Manages conversational sessions for the orchestrator.

    This class is responsible for:
    - Initializing new sessions.
    - Restoring existing sessions.
    - Updating conversation history.
    - Preparing context for downstream agents.

    Database persistence will be integrated in a later phase.
    """

    def __init__(self):
        self.active_sessions = {}

    async def create_session(
        self,
        user_id: int,
        session_id: Optional[int] = None,
    ) -> AgentContext:
        """
        Create a new execution context for a user.
        """

        context = AgentContext(
            user_id=user_id,
            session_id=session_id,
            timestamp=datetime.utcnow(),
        )

        self.active_sessions[user_id] = context

        return context

    async def get_session(
        self,
        user_id: int,
    ) -> Optional[AgentContext]:
        """
        Retrieve an existing session.
        """

        return self.active_sessions.get(user_id)

    async def add_message(
        self,
        context: AgentContext,
        role: str,
        content: str,
    ) -> None:
        """
        Append a message to the conversation history.
        """

        context.conversation.append(
            {
                "role": role,
                "content": content,
            }
        )

    async def clear_session(
        self,
        user_id: int,
    ) -> None:
        """
        Remove an active session.
        """

        self.active_sessions.pop(user_id, None)