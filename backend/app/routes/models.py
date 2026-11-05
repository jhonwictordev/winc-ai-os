"""AI Model Manager and Local Inference routes for Low RAM host."""

import time
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from ..engine_manager import engine_manager
from ..system_monitor import get_system_telemetry
from ..config import FALLBACK_LOCAL_MODELS, LOW_RAM_MODE
from ..database import log_audit

router = APIRouter(prefix="/api/models", tags=["Models"])

@router.get("/status")
def get_models_status():
    """Return active model, available local models, and recommendations for 4GB hardware."""
    telemetry = get_system_telemetry()
    return {
        "active_provider": engine_manager.active_provider,
        "active_model": engine_manager.active_model,
        "api_base_url": engine_manager.api_base_url,
        "hardware_recommendation": {
            "ram_total_gb": telemetry["ram"]["total_gb"],
            "ram_available_gb": telemetry["ram"]["available_gb"],
            "max_model_param": "0.5B a 1.1B",
            "recommended_models": FALLBACK_LOCAL_MODELS,
            "warning": telemetry["ram"]["warning"],
            "critical": telemetry["ram"]["critical"],
            "advice": "Em computadores com 4 GB de RAM física, recomendamos estritamente modelos quantizados <= 1.1B ou o uso de APIs externas para tarefas complexas."
        },
        "ollama_models": telemetry["services"]["ollama_models"],
        "ollama_running": telemetry["services"]["ollama_running"]
    }

@router.post("/configure")
def configure_model(payload: Dict[str, Any]):
    """Update active model or switch between local Ollama and external OpenAI-compatible API."""
    provider = payload.get("provider", "auto")
    model = payload.get("model", "qwen2.5:0.5b")
    api_base_url = payload.get("api_base_url")
    api_key = payload.get("api_key")

    engine_manager.configure(
        provider=provider,
        model=model,
        api_base_url=api_base_url,
        api_key=api_key
    )
    log_audit("CONFIG_MODEL", "user", f"Switched model to {model} via provider {provider}")
    return {"status": "ok", "provider": provider, "model": model}

@router.post("/test")
async def test_inference(payload: Dict[str, Any]):
    """Run a fast diagnostic test to verify real inference and measure latency."""
    prompt = payload.get("prompt", "Explique o papel de um arquiteto de software em 2 frases.")
    start = time.time()
    try:
        response = await engine_manager.generate_response(
            system_prompt="Você é um assistente técnico conciso da Agência WINC.",
            user_prompt=prompt
        )
        latency_ms = round((time.time() - start) * 1000, 2)
        return {
            "status": "success",
            "response": response,
            "latency_ms": latency_ms,
            "model": engine_manager.active_model,
            "provider": engine_manager.active_provider
        }
    except Exception as ex:
        raise HTTPException(status_code=500, detail=f"Erro no teste de inferência: {str(ex)}")

@router.post("/unload")
def unload_model():
    """Purge active model weights from memory to reclaim RAM."""
    engine_manager.unload_model()
    return {"status": "unloaded", "message": "Memória liberada com sucesso."}
