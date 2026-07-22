import time
import traceback
from typing import AsyncGenerator
from app.lyzr.registry import registry
import app.lyzr.agents  # Trigger agent registrations
from app.lyzr.memory import memory
from app.lyzr.logger import StructuredLogger

class AgentManager:
    """
    Manager coordinates the retrieval of agents from the registry,
    manages short-term conversation context using memory,
    delegates processing to agents, and logs structured metrics.
    """
    def __init__(self):
        # Initializes Lyzr configuration.
        pass

    async def process_message(
        self,
        session_id: str,
        user_id: str,
        message: str,
        intent: str
    ) -> AsyncGenerator[str, None]:
        from app.lyzr.agents.digital_services_agent import current_user_id, current_session_id
        current_user_id.set(user_id)
        current_session_id.set(session_id)
        # 1. Retrieve agent from registry
        agent = registry.get_agent(intent)
        if not agent:
            agent = registry.get_agent("GENERAL")

        # 2. Retrieve context history from MemoryStore
        history = memory.get_context(session_id).get("history", [])

        # 3. Update MemoryStore with user message
        memory.add_message(session_id, "user", message)

        # 4. Process message using the selected agent and measure execution time
        start_time = time.perf_counter()
        agent_name = agent.__class__.__name__ if agent else "UnknownAgent"
        full_response = ""
        error_trace = None

        try:
            async for chunk in agent.process(message, history):
                full_response += chunk
                yield chunk
        except Exception as e:
            error_trace = traceback.format_exc()
            yield f"Error processing message: {str(e)}"
        finally:
            execution_time_ms = (time.perf_counter() - start_time) * 1000

            # 5. Update MemoryStore with assistant response
            if full_response:
                memory.add_message(session_id, "assistant", full_response)

            # 6. Log execution metrics using StructuredLogger
            tool_name = getattr(agent, "active_tool", "None")
            tool_output = getattr(agent, "tool_output", "None")

            StructuredLogger.log_execution(
                user_id=user_id,
                session_id=session_id,
                agent_name=agent_name,
                tool_name=tool_name,
                execution_time_ms=execution_time_ms,
                tool_output=tool_output,
                error_trace=error_trace,
                final_response=full_response
            )

agent_manager = AgentManager()
