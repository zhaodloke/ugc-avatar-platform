from pathlib import Path
import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from .api import videos
from .core.config import settings
from .db.database import engine, Base

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG
)

# Serve local storage and demo assets
local_storage_dir = Path(os.path.dirname(os.path.dirname(__file__))) / "local_storage"
local_storage_dir.mkdir(parents=True, exist_ok=True)
app.mount("/local_storage", StaticFiles(directory=str(local_storage_dir), html=False), name="local_storage")

frontend_demo = Path(__file__).resolve().parents[2] / "frontend" / "public" / "demo"
if frontend_demo.exists():
    app.mount("/demo", StaticFiles(directory=str(frontend_demo), html=False), name="demo")
# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(videos.router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {"message": "UGC Avatar Platform API", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
