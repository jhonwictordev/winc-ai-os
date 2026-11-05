"""Hardware and system telemetry module for WINC AI OS."""

import os
import sys
import gc
import psutil
import httpx
from typing import Dict, Any
from .config import LOW_RAM_MODE, STORAGE_DIR

def get_system_telemetry() -> Dict[str, Any]:
    """Retrieve real-time hardware telemetry with emphasis on RAM safety."""
    mem = psutil.virtual_memory()
    swap = psutil.swap_memory()
    cpu_percent = psutil.cpu_percent(interval=None)
    cpu_cores = psutil.cpu_count(logical=False) or 2
    cpu_threads = psutil.cpu_count(logical=True) or 4

    # Disk usage on C:
    disk = psutil.disk_usage("C:\\")

    # Check Ollama status on default localhost:11434
    ollama_running = False
    ollama_models = []
    try:
        r = httpx.get("http://127.0.0.1:11434/api/tags", timeout=0.6)
        if r.status_code == 200:
            ollama_running = True
            ollama_models = [m.get("name", "") for m in r.json().get("models", [])]
    except Exception:
        ollama_running = False

    # Check OpenJarvis availability
    openjarvis_loaded = "openjarvis" in sys.modules

    # RAM Safety evaluation
    ram_critical = mem.percent > 92.0
    ram_warning = mem.percent > 85.0

    return {
        "cpu": {
            "percent": cpu_percent,
            "cores": cpu_cores,
            "threads": cpu_threads
        },
        "ram": {
            "total_gb": round(mem.total / (1024**3), 2),
            "available_gb": round(mem.available / (1024**3), 2),
            "used_gb": round((mem.total - mem.available) / (1024**3), 2),
            "percent": mem.percent,
            "warning": ram_warning,
            "critical": ram_critical
        },
        "swap": {
            "total_gb": round(swap.total / (1024**3), 2),
            "used_gb": round(swap.used / (1024**3), 2),
            "percent": swap.percent
        },
        "disk": {
            "total_gb": round(disk.total / (1024**3), 2),
            "free_gb": round(disk.free / (1024**3), 2),
            "percent": disk.percent
        },
        "services": {
            "ollama_running": ollama_running,
            "ollama_models": ollama_models,
            "openjarvis_loaded": openjarvis_loaded
        },
        "low_ram_mode": LOW_RAM_MODE
    }

def free_memory():
    """Trigger Python garbage collection to release unreferenced memory."""
    collected = gc.collect()
    return {"status": "ok", "garbage_collected_objects": collected}
