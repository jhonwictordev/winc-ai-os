"""Persistent Memory management routes."""

import time
import uuid
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional
from ..database import get_db_connection, log_audit

router = APIRouter(prefix="/api/memory", tags=["Memory"])

@router.get("")
def list_memories(entity_type: Optional[str] = None, entity_id: Optional[str] = None):
    """Retrieve stored memory records."""
    with get_db_connection() as conn:
        query = "SELECT * FROM memories WHERE 1=1"
        params = []
        if entity_type:
            query += " AND entity_type = ?"
            params.append(entity_type)
        if entity_id:
            query += " AND entity_id = ?"
            params.append(entity_id)
        query += " ORDER BY created_at DESC LIMIT 100"
        rows = conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]

@router.post("/add")
def add_memory(payload: Dict[str, Any]):
    """Store contextual memory item."""
    content = payload.get("content", "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="Conteúdo obrigatório")
    
    mem_id = f"mem-{uuid.uuid4().hex[:8]}"
    entity_type = payload.get("entity_type", "global")
    entity_id = payload.get("entity_id", "default")
    category = payload.get("category", "general")
    now = time.time()

    with get_db_connection() as conn:
        conn.execute("""
            INSERT INTO memories (id, entity_type, entity_id, content, category, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (mem_id, entity_type, entity_id, content, category, now))
        conn.commit()

    return {"status": "ok", "memory_id": mem_id}

@router.get("/search")
def search_memory(query: str):
    """Perform keyword search in persistent memory store."""
    with get_db_connection() as conn:
        s = f"%{query}%"
        rows = conn.execute("""
            SELECT * FROM memories 
            WHERE content LIKE ? OR category LIKE ?
            ORDER BY created_at DESC LIMIT 20
        """, (s, s)).fetchall()
        return [dict(r) for r in rows]

@router.delete("/clear")
def clear_memory(entity_type: Optional[str] = None, entity_id: Optional[str] = None):
    """Clear memory entries by entity."""
    with get_db_connection() as conn:
        if entity_type and entity_id:
            conn.execute("DELETE FROM memories WHERE entity_type = ? AND entity_id = ?", (entity_type, entity_id))
        elif entity_type:
            conn.execute("DELETE FROM memories WHERE entity_type = ?", (entity_type,))
        else:
            conn.execute("DELETE FROM memories")
        conn.commit()
    log_audit("CLEAR_MEMORY", "user", f"Cleared memories for entity_type={entity_type}")
    return {"status": "ok", "message": "Memórias limpas."}
