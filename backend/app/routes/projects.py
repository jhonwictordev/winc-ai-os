"""Projects and Kanban board management routes."""

import time
import uuid
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional
from pathlib import Path
from ..database import get_db_connection, log_audit
from ..config import PROJECTS_DIR

router = APIRouter(prefix="/api/projects", tags=["Projects"])

@router.get("")
def list_projects():
    """Retrieve all projects with task counts."""
    with get_db_connection() as conn:
        projects = [dict(r) for r in conn.execute("SELECT * FROM projects ORDER BY updated_at DESC").fetchall()]
        for p in projects:
            task_stats = conn.execute("""
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as running
                FROM tasks WHERE project_id = ?
            """, (p["id"],)).fetchone()
            p["total_tasks"] = task_stats["total"] or 0
            p["completed_tasks"] = task_stats["completed"] or 0
            p["running_tasks"] = task_stats["running"] or 0
        return projects

@router.post("/create")
def create_project(payload: Dict[str, Any]):
    """Create a new project directory and database record."""
    name = payload.get("name", "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Nome do projeto obrigatório")

    project_id = f"proj-{uuid.uuid4().hex[:8]}"
    project_dir = PROJECTS_DIR / project_id
    project_dir.mkdir(parents=True, exist_ok=True)
    now = time.time()

    with get_db_connection() as conn:
        conn.execute("""
            INSERT INTO projects (id, name, client, category, description, status, directory_path, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 'planning', ?, ?, ?)
        """, (
            project_id,
            name,
            payload.get("client", "Agência WINC"),
            payload.get("category", "Geral"),
            payload.get("description", ""),
            str(project_dir),
            now, now
        ))
        conn.commit()

    log_audit("CREATE_PROJECT", "user", f"Created project {name} ({project_id})")
    return {"status": "ok", "project_id": project_id, "directory": str(project_dir)}

@router.get("/{project_id}/kanban")
def get_project_kanban(project_id: str):
    """Retrieve tasks organized by Kanban columns."""
    with get_db_connection() as conn:
        project = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
        if not project:
            raise HTTPException(status_code=404, detail="Projeto não encontrado")

        tasks = [dict(r) for r in conn.execute("SELECT * FROM tasks WHERE project_id = ? ORDER BY priority ASC, created_at ASC", (project_id,)).fetchall()]

        columns = {
            "planning": [],
            "pending": [],
            "execution": [],
            "review": [],
            "done": []
        }

        for t in tasks:
            stage = t.get("stage") or "pending"
            if stage in columns:
                columns[stage].append(t)
            else:
                columns["pending"].append(t)

        return {
            "project": dict(project),
            "columns": columns
        }
