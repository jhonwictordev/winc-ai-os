"""System settings and configuration persistence with live AI provider testing."""

from fastapi import APIRouter
from typing import Dict, Any, Optional
from pydantic import BaseModel
from ..database import get_db_connection, log_audit
from ..engine_manager import engine_manager

router = APIRouter(prefix="/api/settings", tags=["Settings"])

class TestConnectionRequest(BaseModel):
    provider: str
    model: str
    api_key: Optional[str] = None
    base_url: Optional[str] = None

@router.get("")
def get_all_settings():
    """Retrieve saved system settings with sensitive keys safely masked."""
    with get_db_connection() as conn:
        rows = conn.execute("SELECT * FROM settings").fetchall()
        settings = {r["key"]: r["value"] for r in rows}

    # Mask API keys if present
    masked = dict(settings)
    for key_field in ["gemini_api_key", "openrouter_api_key", "openai_api_key"]:
        if key_field in masked and masked[key_field]:
            raw = masked[key_field]
            if len(raw) > 8:
                masked[f"{key_field}_masked"] = f"{raw[:4]}...{raw[-4:]}"
                masked[f"{key_field}_configured"] = True
            else:
                masked[f"{key_field}_masked"] = "********"
                masked[f"{key_field}_configured"] = True

    return masked

@router.get("/ai-status")
def get_ai_status():
    """Retrieve runtime status of active AI engine."""
    return engine_manager.get_status()

@router.post("/test-connection")
async def test_ai_connection(req: TestConnectionRequest):
    """Perform a live roundtrip latency test against chosen AI provider."""
    # If key wasn't passed, check if one is saved in SQLite
    api_key = req.api_key
    if not api_key:
        with get_db_connection() as conn:
            target_key = f"{req.provider}_api_key"
            row = conn.execute("SELECT value FROM settings WHERE key = ?", (target_key,)).fetchone()
            if row:
                api_key = row["value"]

    result = await engine_manager.test_connection(
        provider=req.provider,
        model=req.model,
        api_key=api_key,
        base_url=req.base_url
    )
    return result

@router.post("")
def update_settings(payload: Dict[str, Any]):
    """Update system settings and reconfigure engine manager in real time."""
    with get_db_connection() as conn:
        for k, v in payload.items():
            # Don't save empty dummy strings if already configured
            if k.endswith("_api_key") and (v == "********" or "..." in str(v)):
                continue
            conn.execute(
                "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                (str(k), str(v))
            )
        conn.commit()

        # Update in-memory engine configuration
        provider = payload.get("ai_provider") or engine_manager.active_provider
        model = payload.get("ai_model") or engine_manager.active_model
        gemini_key = payload.get("gemini_api_key")
        openrouter_key = payload.get("openrouter_api_key")
        openai_key = payload.get("openai_api_key")
        base_url = payload.get("openai_base_url")

        key_to_use = None
        if provider == "gemini":
            key_to_use = gemini_key or engine_manager.api_key
        elif provider == "openrouter":
            key_to_use = openrouter_key or engine_manager.api_key
        elif provider == "openai_compatible":
            key_to_use = openai_key or engine_manager.api_key

        engine_manager.configure(
            provider=provider,
            model=model,
            api_base_url=base_url,
            api_key=key_to_use
        )

    log_audit("UPDATE_SETTINGS", "user", f"Updated {len(payload)} setting keys. Configured AI provider: {provider}")
    return {"status": "ok", "provider": provider, "model": model}
