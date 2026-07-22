from fastapi import APIRouter
from pydantic import BaseModel

from app.agents.orchestrator.router import OrchestratorRouter

router = APIRouter()

orchestrator = OrchestratorRouter()


class OrchestratorRequest(BaseModel):
    query: str
    session_id: str
    user_id: str


@router.post("/test")
async def test_orchestrator(request: OrchestratorRequest):
    """
    Temporary endpoint for testing the orchestrator.
    """

    response = await orchestrator.handle_request(
        query=request.query,
        session_id=request.session_id,
        user_id=request.user_id,
    )

    return response