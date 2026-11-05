"""System and telemetry routes."""

from fastapi import APIRouter
from ..system_monitor import get_system_telemetry, free_memory
from ..engine_manager import engine_manager
from ..config import LOW_RAM_MODE

router = APIRouter(prefix="/api/system", tags=["System"])

@router.get("/info")
def system_info():
    """Retrieve full hardware and runtime telemetry."""
    return get_system_telemetry()

@router.post("/purge-memory")
def purge_memory():
    """Purge model weights from RAM and run garbage collection."""
    engine_manager.unload_model()
    return free_memory()
