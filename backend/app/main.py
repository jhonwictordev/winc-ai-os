"""Main FastAPI application for WINC AI OS - Executive Multi-Agent Operating System."""

import logging
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .config import BRAND_DIR, STORAGE_DIR, LOW_RAM_MODE, BASE_DIR
from .database import init_db
from .agent_adapter import load_agency_agents_into_db
from .task_queue import task_queue

# Import route modules
from .routes.system import router as system_router
from .routes.agents import router as agents_router
from .routes.chat import router as chat_router
from .routes.master import router as master_router
from .routes.projects import router as projects_router
from .routes.tasks import router as tasks_router
from .routes.workflows import router as workflows_router
from .routes.models import router as models_router
from .routes.memory import router as memory_router
from .routes.files import router as files_router
from .routes.workspace import router as workspace_router
from .routes.history import router as history_router
from .routes.settings import router as settings_router
from .routes.tts import router as tts_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("winc-ai-os")

DIST_DIR = BASE_DIR / "frontend" / "dist"

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle: Initialize DB, Catalog Agency Agents, and start sequential worker."""
    logger.info("Initializing WINC AI OS Database...")
    init_db()
    
    logger.info("Cataloging Agency Agents...")
    agent_count = load_agency_agents_into_db()
    logger.info(f"Loaded {agent_count} Agency Agents into active catalog.")

    logger.info("Starting Sequential Task Queue Worker (Single-Agent Lock)...")
    task_queue.start_worker()

    logger.info(f"WINC AI OS Backend Online [LOW RAM MODE: {LOW_RAM_MODE}]")
    yield
    logger.info("Shutting down WINC AI OS...")

app = FastAPI(
    title="WINC AI OS API",
    description="Sistema Operacional de Agentes Inteligentes — Agência WINC",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration for desktop and web frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount brand assets and storage for direct browser rendering
if BRAND_DIR.exists():
    app.mount("/brand", StaticFiles(directory=str(BRAND_DIR)), name="brand")
if STORAGE_DIR.exists():
    app.mount("/storage", StaticFiles(directory=str(STORAGE_DIR)), name="storage")

# Register all API routes
app.include_router(system_router)
app.include_router(agents_router)
app.include_router(chat_router)
app.include_router(master_router)
app.include_router(projects_router)
app.include_router(tasks_router)
app.include_router(workflows_router)
app.include_router(models_router)
app.include_router(memory_router)
app.include_router(files_router)
app.include_router(workspace_router)
app.include_router(history_router)
app.include_router(settings_router)
app.include_router(tts_router)

# Mount Frontend static distribution if built
if DIST_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(DIST_DIR / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = DIST_DIR / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(DIST_DIR / "index.html")
else:
    @app.get("/")
    def health_check():
        return {
            "status": "online",
            "system": "WINC AI OS",
            "agency": "Agência WINC",
            "version": "1.0.0",
            "low_ram_mode": LOW_RAM_MODE
        }
