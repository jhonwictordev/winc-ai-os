"""WINC MASTER AI routes."""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from ..orchestrator import master_ai

router = APIRouter(prefix="/api/master", tags=["Master AI"])

@router.post("/plan")
def plan_master_request(payload: Dict[str, Any]):
    """Analyze goal and formulate multi-agent execution plan."""
    prompt = payload.get("prompt", "").strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt obrigatório")
    if len(prompt) > 4000:
        raise HTTPException(status_code=400, detail="Prompt excede o limite máximo permitido de 4.000 caracteres")
    client = payload.get("client", "Cliente WINC")
    category = payload.get("category", "Desenvolvimento")

    plan = master_ai.plan_project(prompt, client_name=client, category=category)
    return plan

@router.post("/execute")
async def execute_master_plan(payload: Dict[str, Any]):
    """Enqueue multi-agent subtasks sequentially for single-agent execution."""
    plan = payload.get("plan")
    if not plan or "subtasks" not in plan:
        raise HTTPException(status_code=400, detail="Plano inválido")

    task_ids = await master_ai.execute_plan(plan)
    return {
        "status": "queued",
        "project_id": plan["project_id"],
        "queued_tasks": task_ids
    }

@router.post("/interact")
async def interact_master(payload: Dict[str, Any]):
    """Bidirectional voice/text interaction with WINC Master AI character."""
    message = payload.get("message", "").strip()
    if not message:
        raise HTTPException(status_code=400, detail="Mensagem obrigatória")
    if len(message) > 4000:
        raise HTTPException(status_code=400, detail="Mensagem excede o limite máximo permitido de 4.000 caracteres")
    conversation_id = payload.get("conversation_id")
    result = await master_ai.interact(user_prompt=message, conversation_id=conversation_id)
    return result
