"""Agency Agents Adapter: Imports and manages all agency agents in OpenJarvis database."""

import os
import json
import re
import time
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional
from .config import AGENCY_AGENTS_DIR, BASE_DIR
from .database import get_db_connection, log_audit

PT_BR_DIRECTIVE = """
[DIRETIVA DE LINGUAGEM WINC AI OS - AGÊNCIA WINC]
Você é um agente especialista de alto padrão integrado ao ecossistema WINC AI OS.
Você deve formular todas as suas análises, relatórios, códigos comentados e respostas rigorosamente em Português Brasileiro (pt-BR).
Preserve intactos comandos de terminal, nomes de bibliotecas/APIs, snippets de código-fonte, identificadores técnicos e diretivas de sistema quando aplicável.
Mantenha postura profissional, executiva, técnica e orientada à excelência da Agência WINC.
"""

DIVISION_PT_MAP = {
    "academic": "Acadêmico",
    "design": "Design & Criação",
    "engineering": "Engenharia de Software",
    "finance": "Finanças & Contabilidade",
    "game-development": "Desenvolvimento de Jogos",
    "gis": "Geoinformação & GIS",
    "healthcare": "Saúde & Medicina",
    "marketing": "Marketing & Crescimento",
    "paid-media": "Mídia Paga & Performance",
    "product": "Gestão de Produto",
    "project-management": "Gerenciamento de Projetos",
    "research": "Pesquisa & Inteligência",
    "sales": "Vendas & Negócios",
    "security": "Segurança & Ciberdefesa",
    "spatial-computing": "Computação Espacial & XR",
    "specialized": "Especialistas Diversos",
    "support": "Suporte & Atendimento",
    "testing": "Garantia de Qualidade & Testes",
}

def load_agency_agents_into_db():
    """Scans agency-agents repository, parses YAML frontmatter and populates SQLite database with pt-BR localization."""
    if not AGENCY_AGENTS_DIR.exists():
        print(f"[WARN] Agency Agents directory not found at {AGENCY_AGENTS_DIR}")
        return 0

    divisions_file = AGENCY_AGENTS_DIR / "divisions.json"
    divisions = {}
    if divisions_file.exists():
        try:
            with open(divisions_file, "r", encoding="utf-8") as f:
                divisions = json.load(f).get("divisions", {})
        except Exception as e:
            print(f"[ERROR] Could not parse divisions.json: {e}")

    # Load pt-BR catalog if available
    pt_catalog = {}
    catalog_path = Path(__file__).resolve().parent / "i18n" / "pt_br_catalog.json"
    if catalog_path.exists():
        try:
            with open(catalog_path, "r", encoding="utf-8") as f:
                pt_catalog = json.load(f)
        except Exception as e:
            print(f"[WARN] Could not load pt_br_catalog.json: {e}")

    imported_count = 0
    now = time.time()

    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Iterate over all divisions
        for div_key, div_info in divisions.items():
            div_dir = AGENCY_AGENTS_DIR / div_key
            if not div_dir.is_dir():
                continue

            for md_file in div_dir.rglob("*.md"):
                try:
                    text = md_file.read_text(encoding="utf-8", errors="ignore")
                    
                    # Parse YAML frontmatter
                    fm_match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", text, re.DOTALL)
                    
                    name = md_file.stem.replace(f"{div_key}-", "").replace("-", " ").title()
                    desc = ""
                    color = div_info.get("color", "#3B82F6")
                    emoji = "🤖"
                    vibe = ""
                    system_prompt = text

                    if fm_match:
                        fm_text, body = fm_match.group(1), fm_match.group(2)
                        system_prompt = body.strip()
                        for line in fm_text.splitlines():
                            line_s = line.strip()
                            if line_s.startswith("name:"):
                                name = line_s.split(":", 1)[1].strip().strip('"').strip("'")
                            elif line_s.startswith("description:"):
                                desc = line_s.split(":", 1)[1].strip().strip('"').strip("'")
                            elif line_s.startswith("color:"):
                                color = line_s.split(":", 1)[1].strip().strip('"').strip("'")
                            elif line_s.startswith("emoji:"):
                                emoji = line_s.split(":", 1)[1].strip().strip('"').strip("'")
                            elif line_s.startswith("vibe:"):
                                vibe = line_s.split(":", 1)[1].strip().strip('"').strip("'")

                    agent_id = f"{div_key}-{md_file.stem}"

                    # Localized fields
                    pt_meta = pt_catalog.get(agent_id, {})
                    name_pt = pt_meta.get("name_pt") or name
                    desc_pt = pt_meta.get("description_pt") or desc
                    div_label_pt = pt_meta.get("division_label_pt") or DIVISION_PT_MAP.get(div_key, div_key.title())

                    # Enforce PT-BR System Directive
                    if PT_BR_DIRECTIVE.strip() not in system_prompt:
                        system_prompt = f"{PT_BR_DIRECTIVE.strip()}\n\n{system_prompt}"

                    # Insert or update
                    cursor.execute("""
                        INSERT INTO agents (
                            id, name, name_pt, division, division_label, division_label_pt,
                            description, description_pt, color, emoji,
                            vibe, system_prompt, model_assigned, is_active, is_custom, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'default', 1, 0, ?, ?)
                        ON CONFLICT(id) DO UPDATE SET
                            name=excluded.name,
                            name_pt=excluded.name_pt,
                            division_label_pt=excluded.division_label_pt,
                            description=excluded.description,
                            description_pt=excluded.description_pt,
                            color=excluded.color,
                            emoji=excluded.emoji,
                            vibe=excluded.vibe,
                            system_prompt=excluded.system_prompt,
                            updated_at=excluded.updated_at
                    """, (
                        agent_id, name, name_pt, div_key, div_info.get("label", div_key.title()), div_label_pt,
                        desc, desc_pt, color, emoji, vibe, system_prompt, now, now
                    ))
                    imported_count += 1
                except Exception as ex:
                    print(f"[WARN] Error reading agent file {md_file}: {ex}")

        conn.commit()

    log_audit("CATALOG_AGENTS", "system", f"Cataloged {imported_count} Agency Agents successfully with pt-BR localization.")
    return imported_count

def list_divisions() -> List[Dict[str, Any]]:
    """Return divisions metadata with Portuguese localization and exact agent count from SQLite."""
    divisions_file = AGENCY_AGENTS_DIR / "divisions.json"
    base_divs = {}
    if divisions_file.exists():
        with open(divisions_file, "r", encoding="utf-8") as f:
            base_divs = json.load(f).get("divisions", {})

    with get_db_connection() as conn:
        cursor = conn.cursor()
        counts_res = cursor.execute("SELECT division, count(*) as count FROM agents GROUP BY division").fetchall()
        counts_map = {r["division"]: r["count"] for r in counts_res}

    result = []
    for k, v in base_divs.items():
        result.append({
            "id": k,
            "label": v.get("label", k.title()),
            "label_pt": DIVISION_PT_MAP.get(k, v.get("label", k.title())),
            "description": v.get("description", ""),
            "color": v.get("color", "#3B82F6"),
            "agent_count": counts_map.get(k, 0)
        })
    return result

def get_agents(division: Optional[str] = None, search: Optional[str] = None, active_only: bool = False) -> List[Dict[str, Any]]:
    """Retrieve filtered list of agents from SQLite with dual PT-BR and English search support."""
    with get_db_connection() as conn:
        query = "SELECT * FROM agents WHERE 1=1"
        params = []
        if division and division != "all":
            query += " AND division = ?"
            params.append(division)
        if search:
            query += " AND (name LIKE ? OR name_pt LIKE ? OR description LIKE ? OR description_pt LIKE ? OR vibe LIKE ? OR id LIKE ?)"
            s = f"%{search}%"
            params.extend([s, s, s, s, s, s])
        if active_only:
            query += " AND is_active = 1"
        query += " ORDER BY COALESCE(division_label_pt, division_label), COALESCE(name_pt, name) ASC"
        cursor = conn.execute(query, params)
        return [dict(row) for row in cursor.fetchall()]

def get_agent_by_id(agent_id: str) -> Optional[Dict[str, Any]]:
    """Fetch single agent by ID."""
    with get_db_connection() as conn:
        row = conn.execute("SELECT * FROM agents WHERE id = ?", (agent_id,)).fetchone()
        return dict(row) if row else None

def save_custom_agent(agent_data: Dict[str, Any]) -> str:
    """Create or update a custom agent."""
    agent_id = agent_data.get("id") or f"custom-{uuid.uuid4().hex[:8]}"
    now = time.time()
    name = agent_data.get("name", "Custom Agent")
    name_pt = agent_data.get("name_pt") or name
    div_key = agent_data.get("division", "specialized")
    div_label = agent_data.get("division_label", "Specialized")
    div_label_pt = agent_data.get("division_label_pt") or DIVISION_PT_MAP.get(div_key, div_label)
    desc = agent_data.get("description", "")
    desc_pt = agent_data.get("description_pt") or desc

    sys_prompt = agent_data.get("system_prompt", "You are a specialized WINC AI OS agent.")
    if PT_BR_DIRECTIVE.strip() not in sys_prompt:
        sys_prompt = f"{PT_BR_DIRECTIVE.strip()}\n\n{sys_prompt}"

    with get_db_connection() as conn:
        conn.execute("""
            INSERT INTO agents (
                id, name, name_pt, division, division_label, division_label_pt,
                description, description_pt, color, emoji,
                vibe, system_prompt, model_assigned, is_active, is_custom, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                name=excluded.name,
                name_pt=excluded.name_pt,
                division=excluded.division,
                division_label=excluded.division_label,
                division_label_pt=excluded.division_label_pt,
                description=excluded.description,
                description_pt=excluded.description_pt,
                color=excluded.color,
                emoji=excluded.emoji,
                vibe=excluded.vibe,
                system_prompt=excluded.system_prompt,
                model_assigned=excluded.model_assigned,
                is_active=excluded.is_active,
                updated_at=excluded.updated_at
        """, (
            agent_id,
            name,
            name_pt,
            div_key,
            div_label,
            div_label_pt,
            desc,
            desc_pt,
            agent_data.get("color", "#d9ff2f"),
            agent_data.get("emoji", "⚡"),
            agent_data.get("vibe", ""),
            sys_prompt,
            agent_data.get("model_assigned", "default"),
            now, now
        ))
        conn.commit()
    log_audit("SAVE_AGENT", "user", f"Saved agent {agent_id}")
    return agent_id
