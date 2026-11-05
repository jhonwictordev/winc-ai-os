"""Visual Workflows execution and persistence routes."""

import time
import uuid
import json
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from ..database import get_db_connection, log_audit
from ..task_queue import task_queue

router = APIRouter(prefix="/api/workflows", tags=["Workflows"])

@router.get("")
def list_workflows():
    """Retrieve saved workflows."""
    with get_db_connection() as conn:
        rows = conn.execute("SELECT * FROM workflows ORDER BY created_at DESC").fetchall()
        result = []
        for r in rows:
            d = dict(r)
            try:
                d["nodes"] = json.loads(d["nodes_json"])
                d["edges"] = json.loads(d["edges_json"])
            except Exception:
                d["nodes"] = []
                d["edges"] = []
            result.append(d)
        return result

@router.post("/save")
def save_workflow(payload: Dict[str, Any]):
    """Create or update a visual DAG workflow."""
    wf_id = payload.get("id") or f"wf-{uuid.uuid4().hex[:8]}"
    title = payload.get("title", "Novo Workflow")
    desc = payload.get("description", "")
    nodes_json = json.dumps(payload.get("nodes", []))
    edges_json = json.dumps(payload.get("edges", []))
    now = time.time()

    with get_db_connection() as conn:
        conn.execute("""
            INSERT INTO workflows (id, title, description, nodes_json, edges_json, status, created_at)
            VALUES (?, ?, ?, ?, ?, 'idle', ?)
            ON CONFLICT(id) DO UPDATE SET
                title=excluded.title,
                description=excluded.description,
                nodes_json=excluded.nodes_json,
                edges_json=excluded.edges_json
        """, (wf_id, title, desc, nodes_json, edges_json, now))
        conn.commit()

    log_audit("SAVE_WORKFLOW", "user", f"Saved workflow {title} ({wf_id})")
    return {"status": "ok", "workflow_id": wf_id}

@router.post("/{wf_id}/run")
async def run_workflow(wf_id: str):
    """Trigger sequential execution of workflow nodes."""
    with get_db_connection() as conn:
        row = conn.execute("SELECT * FROM workflows WHERE id = ?", (wf_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Workflow não encontrado")
        
        nodes = json.loads(row["nodes_json"])
        conn.execute("UPDATE workflows SET status = 'running', last_run_at = ? WHERE id = ?", (time.time(), wf_id))
        conn.commit()

    # Enqueue tasks for each agent node sequentially
    enqueued = []
    for node in nodes:
        if node.get("type") == "agent" or "agent_id" in node:
            t_id = await task_queue.enqueue_task(
                project_id=None,
                agent_id=node.get("agent_id", "engineering-engineering-backend-architect"),
                title=f"Workflow Step: {node.get('label', 'Node')}",
                description=node.get("description", "Execute workflow node task.")
            )
            enqueued.append(t_id)

    task_queue.start_worker()
    return {"status": "started", "workflow_id": wf_id, "tasks": enqueued}
