"""Audit history and configuration settings routes."""

from fastapi import APIRouter
from typing import Dict, Any
from ..database import get_db_connection, log_audit

router = APIRouter(prefix="/api/history", tags=["History"])

@router.get("/audit")
def get_audit_trail():
    """Retrieve system operations and audit history."""
    with get_db_connection() as conn:
        rows = conn.execute("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100").fetchall()
        return [dict(r) for r in rows]
