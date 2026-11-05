"""SQLite database initialization and connection pool with low memory footprint."""

import sqlite3
import json
import time
from typing import List, Dict, Any, Optional
from .config import DATABASE_PATH

def get_db_connection() -> sqlite3.Connection:
    """Create a lightweight SQLite connection with optimized PRAGMAs for 4GB RAM."""
    conn = sqlite3.connect(DATABASE_PATH, timeout=10.0)
    conn.row_factory = sqlite3.Row
    # Low RAM SQLite configuration
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    conn.execute("PRAGMA cache_size = -2000;")  # Limit page cache to ~2MB RAM
    conn.execute("PRAGMA temp_store = MEMORY;")
    return conn

def init_db():
    """Create tables if they do not exist."""
    with get_db_connection() as conn:
        cursor = conn.cursor()

        # 1. Agents table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS agents (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            name_pt TEXT,
            division TEXT NOT NULL,
            division_label TEXT NOT NULL,
            division_label_pt TEXT,
            description TEXT,
            description_pt TEXT,
            color TEXT,
            emoji TEXT,
            vibe TEXT,
            system_prompt TEXT NOT NULL,
            model_assigned TEXT DEFAULT 'default',
            is_active INTEGER DEFAULT 1,
            is_custom INTEGER DEFAULT 0,
            tools_json TEXT DEFAULT '[]',
            created_at REAL NOT NULL,
            updated_at REAL NOT NULL
        );
        """)
        # Ensure migration columns exist for existing databases
        for col in ["name_pt", "description_pt", "division_label_pt"]:
            try:
                cursor.execute(f"ALTER TABLE agents ADD COLUMN {col} TEXT")
            except Exception:
                pass

        # 2. Projects table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            client TEXT DEFAULT 'Agência WINC',
            category TEXT DEFAULT 'Desenvolvimento',
            description TEXT,
            status TEXT DEFAULT 'planning', -- planning, pending, in_progress, in_review, completed, error
            directory_path TEXT NOT NULL,
            created_at REAL NOT NULL,
            updated_at REAL NOT NULL
        );
        """)

        # 3. Tasks table (Sequential Queue)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            project_id TEXT,
            agent_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'pending', -- pending, running, completed, error, cancelled
            priority INTEGER DEFAULT 1,
            stage TEXT DEFAULT 'planning', -- planning, pending, execution, review, done
            logs TEXT DEFAULT '',
            result TEXT DEFAULT '',
            created_at REAL NOT NULL,
            started_at REAL,
            completed_at REAL,
            FOREIGN KEY (agent_id) REFERENCES agents (id),
            FOREIGN KEY (project_id) REFERENCES projects (id)
        );
        """)

        # 4. Workflows table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS workflows (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            nodes_json TEXT NOT NULL DEFAULT '[]',
            edges_json TEXT NOT NULL DEFAULT '[]',
            status TEXT DEFAULT 'idle', -- idle, running, completed, failed
            last_run_at REAL,
            created_at REAL NOT NULL
        );
        """)

        # 5. Conversations & Messages
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            agent_id TEXT,
            project_id TEXT,
            created_at REAL NOT NULL,
            updated_at REAL NOT NULL
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL,
            agent_id TEXT,
            role TEXT NOT NULL, -- user, assistant, system
            content TEXT NOT NULL,
            created_at REAL NOT NULL,
            FOREIGN KEY (conversation_id) REFERENCES conversations (id)
        );
        """)

        # 6. Persistent Memory
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS memories (
            id TEXT PRIMARY KEY,
            entity_type TEXT NOT NULL, -- agent, project, global, client
            entity_id TEXT NOT NULL,
            content TEXT NOT NULL,
            category TEXT DEFAULT 'general',
            created_at REAL NOT NULL
        );
        """)

        # 7. Audit Log
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT NOT NULL,
            actor TEXT NOT NULL,
            details TEXT,
            created_at REAL NOT NULL
        );
        """)

        # 8. Settings
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        """)

        conn.commit()

def log_audit(action: str, actor: str = "system", details: str = ""):
    """Record an audit trail entry."""
    with get_db_connection() as conn:
        conn.execute(
            "INSERT INTO audit_logs (action, actor, details, created_at) VALUES (?, ?, ?, ?)",
            (action, actor, details, time.time())
        )
        conn.commit()
