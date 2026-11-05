"""Files and Deliverables management routes with sandboxed security."""

import os
from pathlib import Path
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from ..config import STORAGE_DIR, PROJECTS_DIR, OUTPUTS_DIR
from ..security import is_safe_path, MAX_FILE_WRITE_BYTES
from ..database import log_audit

router = APIRouter(prefix="/api/files", tags=["Files"])

@router.get("/browse")
def browse_files(subpath: str = ""):
    """Browse directories and files inside authorized storage."""
    target_dir = STORAGE_DIR / subpath.lstrip("/\\")
    safe, resolved = is_safe_path(str(target_dir))
    if not safe or not resolved.exists():
        raise HTTPException(status_code=400, detail="Diretório inválido ou fora da sandbox")

    items = []
    try:
        for entry in os.scandir(resolved):
            items.append({
                "name": entry.name,
                "is_dir": entry.is_dir(),
                "size_bytes": entry.stat().st_size if entry.is_file() else 0,
                "relative_path": str(Path(entry.path).relative_to(STORAGE_DIR)).replace("\\", "/")
            })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "current_path": subpath,
        "items": sorted(items, key=lambda x: (not x["is_dir"], x["name"].lower()))
    }

@router.get("/read")
def read_file_content(path: str):
    """Read file content with strict path traversal check."""
    target_file = STORAGE_DIR / path.lstrip("/\\")
    safe, resolved = is_safe_path(str(target_file))
    if not safe or not resolved.is_file():
        raise HTTPException(status_code=400, detail="Arquivo inválido ou acesso não autorizado")

    try:
        content = resolved.read_text(encoding="utf-8", errors="replace")
        return {
            "path": path,
            "size": resolved.stat().st_size,
            "content": content
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/write")
def write_file_content(payload: Dict[str, Any]):
    """Safely create or edit a file inside the storage sandbox."""
    rel_path = payload.get("path", "").strip().lstrip("/\\")
    content = payload.get("content", "")
    if not rel_path:
        raise HTTPException(status_code=400, detail="Caminho do arquivo obrigatório")

    encoded_bytes = content.encode("utf-8")
    if len(encoded_bytes) > MAX_FILE_WRITE_BYTES:
        raise HTTPException(status_code=413, detail=f"Arquivo excede o limite máximo permitido de {MAX_FILE_WRITE_BYTES // (1024*1024)} MB")

    target_file = STORAGE_DIR / rel_path
    safe, resolved = is_safe_path(str(target_file), for_write=True)
    if not safe:
        raise HTTPException(status_code=403, detail="Tentativa de gravação bloqueada por segurança (arquivo protegido, extensão não autorizada ou fora da sandbox)")

    try:
        resolved.parent.mkdir(parents=True, exist_ok=True)
        resolved.write_text(content, encoding="utf-8")
        log_audit("WRITE_FILE", "user", f"Saved file {rel_path}")
        return {"status": "ok", "path": rel_path, "bytes": len(encoded_bytes)}
    except Exception as ex:
        raise HTTPException(status_code=500, detail="Erro interno ao gravar arquivo")
