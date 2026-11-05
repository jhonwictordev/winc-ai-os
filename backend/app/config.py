"""Configuration module for WINC AI OS - Low RAM Architecture."""

from pathlib import Path
import os

# Root directory of winc-ai-os
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Repositories and brand directories
AGENCY_AGENTS_DIR = BASE_DIR / "agency-agents"
OPENJARVIS_DIR = BASE_DIR / "openjarvis"
BRAND_DIR = BASE_DIR / "brand"
STORAGE_DIR = BASE_DIR / "storage"

# Subdirectories for data persistence
PROJECTS_DIR = STORAGE_DIR / "projects"
OUTPUTS_DIR = STORAGE_DIR / "outputs"
MEMORY_DIR = STORAGE_DIR / "memory"
BACKUPS_DIR = STORAGE_DIR / "backups"
WORKSPACE_DIR = STORAGE_DIR / "workspace"
DATABASE_PATH = STORAGE_DIR / "winc_ai_os.db"

# Ensure essential directories exist
for folder in [STORAGE_DIR, PROJECTS_DIR, OUTPUTS_DIR, MEMORY_DIR, BACKUPS_DIR, WORKSPACE_DIR]:
    folder.mkdir(parents=True, exist_ok=True)

# Hardware & Low RAM Mode Settings
LOW_RAM_MODE = True  # Enforced for 4GB RAM host
MAX_CONCURRENT_AGENTS = 1  # Strictly 1 agent executing at any time
MAX_CONTEXT_TURNS = 6  # Limit dialogue history turns to avoid context memory explosion
MAX_CONTEXT_TOKENS = 1536  # Safe token cap for prompt construction
MODEL_UNLOAD_IDLE_SECONDS = 15  # Unload model from RAM after 15s idle
OLLAMA_KEEP_ALIVE = "0s"  # Request Ollama to unload model immediately after response

# Default Inference Provider
DEFAULT_INFERENCE_PROVIDER = "auto"  # "auto", "ollama", "openai_compatible", "rule_engine"
DEFAULT_LOCAL_MODEL = "qwen2.5:0.5b"  # Recommended ultra-light model (0.5B)
FALLBACK_LOCAL_MODELS = [
    {"name": "qwen2.5:0.5b", "params": "0.5B", "ram_req": "~600MB", "recommended": True},
    {"name": "smollm2:360m", "params": "360M", "ram_req": "~450MB", "recommended": True},
    {"name": "tinyllama:1.1b", "params": "1.1B", "ram_req": "~900MB", "recommended": False},
]

# API Server Host and Port
BACKEND_HOST = "127.0.0.1"
BACKEND_PORT = 8000
FRONTEND_PORT = 5173

# Security Settings
RESTRICT_TO_STORAGE = True
ALLOWED_EXTENSIONS = {
    ".py", ".js", ".ts", ".tsx", ".html", ".css", ".json", ".md", ".txt",
    ".csv", ".sql", ".yaml", ".yml", ".png", ".jpg", ".jpeg", ".svg"
}
