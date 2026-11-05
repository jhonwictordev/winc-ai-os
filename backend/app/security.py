"""Security and sandbox validation module for WINC AI OS."""

import os
from pathlib import Path
from typing import Tuple
from .config import STORAGE_DIR, PROJECTS_DIR, OUTPUTS_DIR, ALLOWED_EXTENSIONS

# Forbidden command prefixes to prevent arbitrary destructive commands
DANGEROUS_COMMANDS = [
    "format", "del /s", "rmdir /s", "rm -rf", "drop database", "mkfs", "dd ",
    "reg delete", "shutdown", "powershell -enc", "certutil -urlcache"
]

def is_safe_path(target_path: str) -> Tuple[bool, Path]:
    """Verify that a path is strictly inside the authorized storage folder."""
    try:
        resolved = Path(target_path).resolve()
        storage_resolved = STORAGE_DIR.resolve()
        
        # Check if resolved path starts with storage directory
        if str(resolved).startswith(str(storage_resolved)):
            return True, resolved
        return False, resolved
    except Exception:
        return False, Path(target_path)

def validate_command_safety(command: str) -> Tuple[bool, str]:
    """Check command against dangerous execution blacklist."""
    cmd_lower = command.lower().strip()
    for dangerous in DANGEROUS_COMMANDS:
        if dangerous in cmd_lower:
            return False, f"Comando bloqueado por segurança: contém termo sensível '{dangerous}'"
    return True, "Safe"
