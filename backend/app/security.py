"""Security and sandbox validation module for WINC AI OS.
Provides strict path traversal protection, command execution sandboxing,
SSRF prevention, and sensitive file isolation.
"""

import os
import re
import shlex
import ipaddress
from urllib.parse import urlparse
from pathlib import Path
from typing import Tuple, List, Optional
from .config import STORAGE_DIR, PROJECTS_DIR, OUTPUTS_DIR, WORKSPACE_DIR

# Forbidden file extensions that could lead to binary code execution
DISALLOWED_WRITE_EXTENSIONS = {
    ".exe", ".dll", ".bat", ".cmd", ".vbs", ".vbe", ".js", ".jse",
    ".wsf", ".wsh", ".msc", ".scr", ".pif", ".com", ".ps1", ".ps1xml",
    ".ps2", ".psc1", ".psc2", ".reg"
}

# Protected database files inside storage that must NEVER be overwritten via file APIs
PROTECTED_FILENAMES = {
    "winc_ai_os.db",
    "winc_ai_os.db-wal",
    "winc_ai_os.db-shm",
    "winc_ai_os.db-journal"
}

# Approved developer tools for sandboxed workspace execution
ALLOWED_WORKSPACE_COMMANDS = {
    "python", "node", "npm", "git", "dir", "ls", "type", "cat",
    "echo", "pytest", "uv", "pip"
}

# Disallowed shell metacharacters that allow command chaining, redirection or injection
SHELL_INJECTION_CHARS = set("&|;><`$\n\r")

# Cloud metadata addresses to prevent SSRF attacks
BLOCKED_IP_NETWORKS = [
    ipaddress.ip_network("169.254.0.0/16"),     # Link-local / Cloud metadata (AWS, GCP, Azure)
    ipaddress.ip_network("100.100.0.0/16"),     # Alibaba Cloud metadata
    ipaddress.ip_network("0.0.0.0/8"),          # Current network
]

BLOCKED_HOSTNAMES = {
    "metadata.google.internal",
    "metadata",
    "instance-data"
}

MAX_FILE_WRITE_BYTES = 5 * 1024 * 1024  # 5 MB max per file write to prevent disk-filling DoS


def is_safe_path(target_path: str, for_write: bool = False) -> Tuple[bool, Path]:
    """Verify that a path is strictly inside the authorized storage folder using resolved paths.
    
    Protects against:
    - Path traversal (../)
    - Prefix confusion attacks (storage_malicious vs storage)
    - Windows Alternate Data Streams (::$DATA)
    - Overwriting active SQLite database files
    - Writing executable binaries
    """
    try:
        raw_str = str(target_path).strip()
        # Disallow Windows Alternate Data Streams
        if "::" in raw_str:
            return False, Path(raw_str)

        resolved = Path(raw_str).resolve()
        storage_resolved = STORAGE_DIR.resolve()

        # Check strict containment inside STORAGE_DIR using is_relative_to
        try:
            resolved.relative_to(storage_resolved)
        except ValueError:
            return False, resolved

        # Check for protected database files
        if resolved.name.lower() in PROTECTED_FILENAMES:
            return False, resolved

        # If writing, enforce extension safety
        if for_write:
            suffix = resolved.suffix.lower()
            if suffix in DISALLOWED_WRITE_EXTENSIONS:
                return False, resolved

        return True, resolved
    except Exception:
        return False, Path(target_path)


def validate_command_safety(command: str) -> Tuple[bool, str, List[str]]:
    """Strictly validate that a command is non-destructive and doesn't chain processes.
    
    Returns:
        (is_safe, reason, argv_list)
    """
    raw_cmd = command.strip()
    if not raw_cmd:
        return False, "Comando vazio", []

    # 1. Disallow shell chaining and redirection characters
    for ch in SHELL_INJECTION_CHARS:
        if ch in raw_cmd:
            return False, f"Comando bloqueado: caractere de encadeamento não permitido '{ch}'", []

    # 2. Parse into arguments
    try:
        argv = shlex.split(raw_cmd, posix=False)
    except Exception as ex:
        return False, f"Falha na sintaxe do comando: {ex}", []

    if not argv:
        return False, "Comando inválido", []

    # 3. Base command must be in the approved whitelist
    base_cmd = Path(argv[0]).stem.lower()
    if base_cmd not in ALLOWED_WORKSPACE_COMMANDS:
        return False, f"Executável '{base_cmd}' não autorizado. Ferramentas permitidas: {', '.join(sorted(ALLOWED_WORKSPACE_COMMANDS))}", []

    # 4. Filter suspicious flags on python/node that execute inline strings
    cmd_lower = raw_cmd.lower()
    if base_cmd == "python" and any(flag in argv for flag in ["-c", "-m"]):
        # Disallow inline python execution of dangerous os/subprocess imports
        if any(bad in cmd_lower for bad in ["import os", "import sys", "import subprocess", "system(", "popen(", "exec(", "eval("]):
            return False, "Execução inline de código com privilégios de sistema bloqueada", []

    return True, "Safe", argv


def validate_remote_url(url: str) -> Tuple[bool, str]:
    """Validate remote AI endpoint URL to prevent Server-Side Request Forgery (SSRF)."""
    try:
        parsed = urlparse(url.strip())
        if parsed.scheme not in ("http", "https"):
            return False, "Apenas os protocolos http:// e https:// são permitidos"

        hostname = (parsed.hostname or "").lower()
        if not hostname:
            return False, "Hostname ausente na URL"

        if hostname in BLOCKED_HOSTNAMES:
            return False, f"Acesso ao host '{hostname}' bloqueado por segurança"

        # Check IP addresses
        try:
            ip_obj = ipaddress.ip_address(hostname)
            for net in BLOCKED_IP_NETWORKS:
                if ip_obj in net:
                    return False, f"Acesso ao IP restrito '{hostname}' bloqueado por segurança"
        except ValueError:
            # Not an IP literal, it's a domain name (safe to proceed)
            pass

        return True, "Safe"
    except Exception as e:
        return False, f"URL inválida: {e}"
