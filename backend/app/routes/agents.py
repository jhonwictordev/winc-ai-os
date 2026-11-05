"""Agents catalog and management routes."""

from fastapi import APIRouter, HTTPException
from typing import Optional, Dict, Any
from ..agent_adapter import get_agents, get_agent_by_id, list_divisions, save_custom_agent
from ..database import get_db_connection, log_audit

router = APIRouter(prefix="/api/agents", tags=["Agents"])

@router.get("")
def list_all_agents(division: Optional[str] = None, search: Optional[str] = None, active_only: bool = False):
    """Retrieve cataloged agents with optional division and text filtering."""
    return get_agents(division=division, search=search, active_only=active_only)

@router.get("/divisions")
def get_divisions():
    """Retrieve the 18 agency divisions metadata."""
    return list_divisions()

@router.get("/{agent_id}")
def get_agent(agent_id: str):
    """Fetch details for a specific agent."""
    agent = get_agent_by_id(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agente não encontrado")
    return agent

@router.post("/save")
def create_or_update_agent(payload: Dict[str, Any]):
    """Create or update a custom agent."""
    agent_id = save_custom_agent(payload)
    return {"status": "ok", "agent_id": agent_id}

@router.post("/{agent_id}/toggle")
def toggle_agent_active(agent_id: str):
    """Activate or deactivate an agent."""
    with get_db_connection() as conn:
        row = conn.execute("SELECT is_active FROM agents WHERE id = ?", (agent_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Agente não encontrado")
        new_state = 0 if row["is_active"] == 1 else 1
        conn.execute("UPDATE agents SET is_active = ? WHERE id = ?", (new_state, agent_id))
        conn.commit()
    log_audit("TOGGLE_AGENT", "user", f"Toggled agent {agent_id} active status to {new_state}")
    return {"status": "ok", "agent_id": agent_id, "is_active": new_state}
