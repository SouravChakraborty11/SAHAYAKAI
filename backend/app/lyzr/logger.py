import json
import logging
from datetime import datetime, timezone
import uuid

# Configure standard logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("lyzr_integration")

class StructuredLogger:
    @staticmethod
    def log_execution(user_id: str, session_id: str, agent_name: str, tool_name: str, execution_time_ms: float, tool_output: str, error_trace: str = None, final_response: str = None):
        log_entry = {
            "request_id": str(uuid.uuid4()),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "user_id": user_id,
            "session_id": session_id,
            "selected_agent": agent_name,
            "selected_tool": tool_name,
            "execution_time_ms": execution_time_ms,
            "tool_output": tool_output,
            "error_trace": error_trace,
            "final_response": final_response
        }
        # Dump to JSON for structured logging systems
        logger.info(json.dumps(log_entry))
