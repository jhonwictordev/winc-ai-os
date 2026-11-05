"""Development Workspace routes."""

import subprocess
import os
from pathlib import Path
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from ..config import PROJECTS_DIR, STORAGE_DIR
from ..security import is_safe_path, validate_command_safety
from ..database import log_audit

router = APIRouter(prefix="/api/workspace", tags=["Workspace"])

@router.get("/tree")
def get_project_tree(project_id: str):
    """Retrieve file structure of an active development project."""
    proj_dir = PROJECTS_DIR / project_id
    safe, resolved = is_safe_path(str(proj_dir))
    if not safe or not resolved.exists():
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    tree = []
    for root, dirs, files in os.walk(resolved):
        rel_root = str(Path(root).relative_to(resolved)).replace("\\", "/")
        for f in files:
            tree.append({
                "path": f"{rel_root}/{f}".lstrip("./"),
                "name": f,
                "size": (Path(root) / f).stat().st_size
            })
    return {"project_id": project_id, "files": tree}

@router.post("/execute")
def execute_workspace_command(payload: Dict[str, Any]):
    """Execute a controlled test or diagnostic command inside project directory."""
    project_id = payload.get("project_id")
    command = payload.get("command", "").strip()

    if not command:
        raise HTTPException(status_code=400, detail="Comando obrigatório")

    safe_cmd, reason = validate_command_safety(command)
    if not safe_cmd:
        raise HTTPException(status_code=403, detail=reason)

    proj_dir = PROJECTS_DIR / project_id if project_id else STORAGE_DIR
    safe, cwd = is_safe_path(str(proj_dir))
    if not safe:
        cwd = STORAGE_DIR

    try:
        proc = subprocess.run(
            command,
            shell=True,
            cwd=str(cwd),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=15.0
        )
        log_audit("WORKSPACE_EXEC", "user", f"Executed: {command[:50]}")
        return {
            "exit_code": proc.returncode,
            "stdout": proc.stdout,
            "stderr": proc.stderr
        }
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Comando excedeu o tempo limite de segurança (15s)")
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))
