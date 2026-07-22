from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine

from app.api.routes import auth, users, chat
from app.api.routes import orchestrator

import app.models.user
import app.models.chat
from app.api.routes import gemini_test

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    auth.router,
    prefix=f"{settings.API_V1_STR}/auth",
    tags=["Authentication"],
)

app.include_router(
    users.router,
    prefix=f"{settings.API_V1_STR}/users",
    tags=["Users"],
)

app.include_router(
    chat.router,
    prefix=f"{settings.API_V1_STR}/chat",
    tags=["Chat"],
)

app.include_router(
    orchestrator.router,
    prefix=f"{settings.API_V1_STR}/orchestrator",
    tags=["Orchestrator"],
)

app.include_router(
    gemini_test.router,
    prefix="/api/v1",
)

@app.get("/")
async def root():
    return {
        "message": "Welcome to SAHAYAK AI API",
        "version": settings.VERSION,
    }