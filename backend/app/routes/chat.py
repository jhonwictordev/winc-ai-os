"""Interactive Chat and conversation history routes."""

import time
import uuid
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List, Optional
from ..database import get_db_connection, log_audit
from ..agent_adapter import get_agent_by_id
from ..engine_manager import engine_manager

router = APIRouter(prefix="/api/chat", tags=["Chat"])

@router.get("/conversations")
def list_conversations(project_id: Optional[str] = None):
    """Retrieve chat conversations."""
    with get_db_connection() as conn:
        if project_id:
            rows = conn.execute("SELECT * FROM conversations WHERE project_id = ? ORDER BY updated_at DESC", (project_id,)).fetchall()
        else:
            rows = conn.execute("SELECT * FROM conversations ORDER BY updated_at DESC").fetchall()
        return [dict(r) for r in rows]

@router.get("/conversations/{conversation_id}/messages")
def get_conversation_messages(conversation_id: str):
    """Get all messages for a specific conversation."""
    with get_db_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
            (conversation_id,)
        ).fetchall()
        return [dict(r) for r in rows]

@router.post("/send")
async def send_chat_message(payload: Dict[str, Any]):
    """Send user message, execute single-agent inference with OpenJarvis / Low RAM manager, and record response."""
    conversation_id = payload.get("conversation_id")
    agent_id = payload.get("agent_id") or "master-ai"
    user_prompt = payload.get("message", "").strip()

    if not user_prompt:
        raise HTTPException(status_code=400, detail="Mensagem vazia")

    now = time.time()
    with get_db_connection() as conn:
        # Create conversation if new
        if not conversation_id:
            conversation_id = f"conv-{uuid.uuid4().hex[:8]}"
            title = user_prompt[:35] + "..." if len(user_prompt) > 35 else user_prompt
            conn.execute(
                "INSERT INTO conversations (id, title, agent_id, project_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
                (conversation_id, title, agent_id, payload.get("project_id"), now, now)
            )

        # Record user message
        user_msg_id = f"msg-{uuid.uuid4().hex[:8]}"
        conn.execute(
            "INSERT INTO messages (id, conversation_id, agent_id, role, content, created_at) VALUES (?, ?, ?, 'user', ?, ?)",
            (user_msg_id, conversation_id, agent_id, user_prompt, now)
        )
        conn.commit()

        # Load history
        history_rows = conn.execute(
            "SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
            (conversation_id,)
        ).fetchall()
        history = [{"role": r["role"], "content": r["content"]} for r in history_rows]

    # Resolve system prompt
    if agent_id == "master-ai":
        system_prompt = (
            "Você é o WINC MASTER AI, o coordenador geral de inteligência artificial da Agência WINC. "
            "Sua missão é coordenar projetos, gerenciar a equipe de especialistas do Agency Agents e "
            "garantir entregas de alto padrão para nossos clientes."
        )
    else:
        agent = get_agent_by_id(agent_id)
        system_prompt = agent["system_prompt"] if agent else "Você é um agente da Agência WINC."

    # Inference (protected by single-agent lock)
    response_content = await engine_manager.generate_response(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        history=history[:-1]  # exclude the newly added user message as it is passed in user_prompt
    )

    # Record assistant message
    asst_now = time.time()
    asst_msg_id = f"msg-{uuid.uuid4().hex[:8]}"
    with get_db_connection() as conn:
        conn.execute(
            "INSERT INTO messages (id, conversation_id, agent_id, role, content, created_at) VALUES (?, ?, ?, 'assistant', ?, ?)",
            (asst_msg_id, conversation_id, agent_id, response_content, asst_now)
        )
        conn.execute("UPDATE conversations SET updated_at = ? WHERE id = ?", (asst_now, conversation_id))
        conn.commit()

    return {
        "conversation_id": conversation_id,
        "message_id": asst_msg_id,
        "role": "assistant",
        "agent_id": agent_id,
        "content": response_content
    }
