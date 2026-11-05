"""Tasks queue and execution tracking routes."""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional
from ..database import get_db_connection, log_audit
from ..task_queue import task_queue

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])

@router.get("")
def list_tasks(project_id: Optional[str] = None):
    """List tasks in the queue with real-time status."""
    with get_db_connection() as conn:
        if project_id:
            rows = conn.execute("SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC", (project_id,)).fetchall()
        else:
            rows = conn.execute("SELECT * FROM tasks ORDER BY created_at DESC LIMIT 50").fetchall()
        return [dict(r) for r in rows]

@router.get("/{task_id}")
def get_task(task_id: str):
    """Retrieve detailed logs and output of a specific task."""
    with get_db_connection() as conn:
        row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Tarefa não encontrada")
        return dict(row)

@router.post("/create")
async def create_task(payload: Dict[str, Any]):
    """Enqueue a new task into the single-agent queue."""
    agent_id = payload.get("agent_id")
    title = payload.get("title", "").strip()
    description = payload.get("description", "").strip()
    project_id = payload.get("project_id")

    if not agent_id or not title:
        raise HTTPException(status_code=400, detail="agent_id e title são obrigatórios")

    task_id = await task_queue.enqueue_task(
        project_id=project_id,
        agent_id=agent_id,
        title=title,
        description=description
    )
    task_queue.start_worker()
    return {"status": "enqueued", "task_id": task_id}
