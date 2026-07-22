from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import auth, users, chat, tools, activity, schemes, appointments, automation, intervention, storage, notifications, applications

from contextlib import asynccontextmanager
from app.core.database import engine, Base
import app.models.user
import app.models.chat
import app.models.activity
import app.models.appointment
import app.models.application
import app.models.intervention
import app.models.document
import app.models.receipt
import app.models.notification
import os
from fastapi.staticfiles import StaticFiles

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Initialize Vector Store on startup to trigger dataset ingestion
    from app.services.vector_store import vector_store
    _ = vector_store.client
    
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development. Configure this properly in production.
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
app.include_router(chat.router, prefix=f"{settings.API_V1_STR}/chat", tags=["chat"])
app.include_router(tools.router, prefix=f"{settings.API_V1_STR}/tools", tags=["tools"])
app.include_router(activity.router, prefix=f"{settings.API_V1_STR}/activity", tags=["activity"])
app.include_router(schemes.router, prefix=f"{settings.API_V1_STR}/schemes", tags=["schemes"])
app.include_router(appointments.router, prefix=f"{settings.API_V1_STR}/appointments", tags=["appointments"])
app.include_router(automation.router, prefix=f"{settings.API_V1_STR}/automation", tags=["automation"])
app.include_router(intervention.router, prefix=f"{settings.API_V1_STR}/intervention", tags=["intervention"])
app.include_router(storage.router, prefix=f"{settings.API_V1_STR}/storage", tags=["storage"])
app.include_router(notifications.router, prefix=f"{settings.API_V1_STR}/notifications", tags=["notifications"])
app.include_router(applications.router, prefix=f"{settings.API_V1_STR}/applications", tags=["applications"])

@app.get("/")
async def root():
    return {"message": "Welcome to SAHAYAK AI API"}

# Create uploads directory if it doesn't exist
os.makedirs("uploads/profiles", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

