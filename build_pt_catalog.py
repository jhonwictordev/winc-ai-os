"""Catalog Generator for Portuguese (pt-BR) localization of all 283 Agency Agents.
Generates natural, high-level technical Brazilian Portuguese translations.
"""

import json
import sqlite3
import re
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "storage" / "winc_ai_os.db"

DIVISION_NAMES = {
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

# Common word and term dictionary for accurate title translations
TITLE_PATTERNS = [
    ("Godot Shader Developer", "Desenvolvedor de Shaders Godot"),
    ("Godot Gameplay Scripter", "Desenvolvedor de Scripts de Gameplay Godot"),
    ("Godot Multiplayer Engineer", "Engenheiro de Multiplayer Godot"),
    ("Unity Editor Tool Developer", "Desenvolvedor de Ferramentas do Editor Unity"),
    ("Unity Shader Graph Artist", "Artista Técnico de Shader Graph Unity"),
    ("Unity Multiplayer Engineer", "Engenheiro de Multiplayer Unity"),
    ("Unity Architect", "Arquiteto de Sistemas Unity"),
    ("Unreal Technical Artist", "Artista Técnico Unreal"),
    ("Unreal Systems Engineer", "Engenheiro de Sistemas Unreal"),
    ("Unreal Multiplayer Architect", "Arquiteto de Multiplayer Unreal"),
    ("Unreal World Builder", "Construtor de Mundos e Cenários Unreal"),
    ("PDF Engine Architect", "Arquiteto de Mecanismos PDF"),
    ("Content Creator", "Criador de Conteúdo"),
    ("Developer Community Builder", "Construtor de Comunidades de Desenvolvedores"),
    ("LinkedIn Content Creator", "Criador de Conteúdo para LinkedIn"),
    ("Reddit Community Builder", "Construtor de Comunidades Reddit"),
    ("TikTok Content Creator", "Criador de Conteúdo TikTok"),
    ("YouTube Strategist", "Estrategista de Canais YouTube"),
    ("Podcast Producer", "Produtor de Podcasts Técnicos"),
    ("Persona Walkthrough Specialist", "Especialista em Navegação por Persona"),
    ("UI Finish-Gate Reviewer", "Revisor de Acabamento de UI"),
    ("Inclusive Visuals Specialist", "Especialista em Recursos Visuais Inclusivos"),
    ("Image Prompt Engineer", "Engenheiro de Prompts de Imagem"),
    ("Visual Storyteller", "Contador de Histórias Visuais"),
    ("Whimsy Injector", "Especialista em Encantamento e Microinterações"),
    ("Brand Guardian", "Guardião da Identidade de Marca"),
    ("UI Designer", "Designer de Interfaces (UI)"),
    ("UX Architect", "Arquiteto de Experiência (UX)"),
    ("UX Researcher", "Pesquisador de Experiência (UX)"),
    ("AI Data Remediation Engineer", "Engenheiro de Remediação de Dados de IA"),
    ("ATS Validator Architect", "Arquiteto de Validação ATS"),
    ("Autonomous Optimization Architect", "Arquiteto de Otimização Autônoma"),
    ("China Network Engineer", "Engenheiro de Redes Internacionais (China)"),
    ("Codebase Onboarding Engineer", "Engenheiro de Integração de Codebase"),
    ("Database Reliability Engineer", "Engenheiro de Confiabilidade de Bancos de Dados (DBRE)"),
    ("Embedded Firmware Developer", "Desenvolvedor de Firmware Embarcado"),
    ("Embedded Linux Kernel Engineer", "Engenheiro de Kernel Linux Embarcado"),
    ("Embedded Systems Architect", "Arquiteto de Sistemas Embarcados"),
    ("Incident Commander", "Comandante de Incidentes Críticos"),
    ("Site Reliability Engineer", "Engenheiro de Confiabilidade de Sites (SRE)"),
    ("Web Performance Optimizer", "Otimizador de Performance Web"),
    ("Crypto Portfolio Manager", "Gestor de Carteiras Cripto e Ativos Digitais"),
    ("Payroll Specialist", "Especialista em Folha de Pagamento & Benefícios"),
    ("Tax Consultant", "Consultor Tributário & Fiscal"),
    ("Financial Analyst", "Analista Financeiro Estratégico"),
    ("Accountant", "Contador Executivo"),
    ("Anthropologist", "Antropólogo Cultural"),
    ("Geographer", "Geógrafo & Analista Espacial"),
    ("Historian", "Historiador & Analista Histórico"),
    ("Narratologist", "Narratologista & Estruturador de Histórias"),
    ("Psychologist", "Psicólogo Comportamental"),
    ("Statistician", "Estatístico & Cientista de Dados Quantitativos"),
]

def pt_title(en_name: str) -> str:
    for pattern, pt in TITLE_PATTERNS:
        if en_name.strip().lower() == pattern.lower():
            return pt
    
    # Automatic semantic mapping
    t = en_name
    rules = [
        ("Full Stack Developer", "Desenvolvedor Full Stack"),
        ("Full Stack Engineer", "Engenheiro Full Stack"),
        ("Frontend Developer", "Desenvolvedor Frontend"),
        ("Frontend Architect", "Arquiteto Frontend"),
        ("Backend Architect", "Arquiteto Backend"),
        ("Backend Developer", "Desenvolvedor Backend"),
        ("AI Engineer", "Engenheiro de Inteligência Artificial"),
        ("Data Engineer", "Engenheiro de Dados"),
        ("Data Visualization Engineer", "Engenheiro de Visualização de Dados"),
        ("Database Optimizer", "Otimizador de Bancos de Dados"),
        ("Debug Specialist", "Especialista em Depuração"),
        ("Devops Architect", "Arquiteto DevOps"),
        ("Devops Automator", "Automatizador de Operações DevOps"),
        ("Devops Cloud Architect", "Arquiteto de Nuvem & Cloud"),
        ("Devops Release Engineer", "Engenheiro de Release & Deploy"),
        ("Docker Architect", "Arquiteto de Containers Docker"),
        ("Documentation Engineer", "Engenheiro de Documentação Técnica"),
        ("GraphQL Architect", "Arquiteto GraphQL"),
        ("Integration Specialist", "Especialista em Integrações"),
        ("Kubernetes Architect", "Arquiteto Kubernetes"),
        ("Linux Systems Engineer", "Engenheiro de Sistemas Linux"),
        ("Mobile Developer", "Desenvolvedor Mobile"),
        ("Network Engineer", "Engenheiro de Redes"),
        ("Performance Engineer", "Engenheiro de Performance"),
        ("Python Developer", "Desenvolvedor Python"),
        ("React Native Developer", "Desenvolvedor React Native"),
        ("Security Architect", "Arquiteto de Segurança"),
        ("Solutions Architect", "Arquiteto de Soluções"),
        ("Systems Architect", "Arquiteto de Sistemas"),
        ("Technical Writer", "Redator Técnico"),
        ("Product Manager", "Gerente de Produto (PM)"),
        ("Product Owner", "Líder de Produto (PO)"),
        ("Project Coordinator", "Coordenador de Projetos"),
        ("Risk Manager", "Gestor de Riscos"),
        ("Delivery Manager", "Gerente de Entregas"),
        ("Scrum Master", "Facilitador Ágil & Scrum Master"),
        ("Agile Coach", "Coach Ágil Organizacional"),
        ("SEO Specialist", "Especialista em SEO"),
        ("Copywriter", "Redator Publicitário & Copywriter"),
        ("Marketing Strategist", "Estrategista de Marketing"),
        ("Growth Hacker", "Estrategista de Growth"),
        ("Social Media Strategist", "Estrategista de Mídias Sociais"),
        ("Paid Search Specialist", "Especialista em Busca Paga"),
        ("Paid Social Specialist", "Especialista em Mídia Social Paga"),
        ("Performance Marketer", "Especialista em Performance de Campanhas"),
        ("Media Buyer", "Comprador de Mídia"),
        ("Application Security Engineer", "Engenheiro de Segurança de Aplicações"),
        ("Cloud Security Architect", "Arquiteto de Segurança Cloud"),
        ("Compliance Auditor", "Auditor de Conformidade & Governança"),
        ("Cryptographer", "Especialista em Criptografia"),
        ("Penetration Tester", "Testador de Invasão & Pentester"),
        ("Security Analyst", "Analista de Segurança"),
        ("Threat Intelligence Analyst", "Analista de Inteligência de Ameaças"),
        ("Vulnerability Assessor", "Avaliador de Vulnerabilidades"),
        ("Automation Test Engineer", "Engenheiro de Automação de Testes"),
        ("QA Architect", "Arquiteto de Qualidade (QA)"),
        ("QA Lead", "Líder de Garantia de Qualidade"),
        ("Performance Tester", "Testador de Desempenho e Carga"),
        ("Security QA Tester", "Testador de Segurança de Software"),
        ("Usability Tester", "Testador de Usabilidade"),
    ]
    for en, pt_val in rules:
        if t.strip().lower() == en.lower():
            return pt_val
            
    # Generic word replacement
    t = re.sub(r"\bArchitect\b", "Arquiteto", t)
    t = re.sub(r"\bDeveloper\b", "Desenvolvedor", t)
    t = re.sub(r"\bEngineer\b", "Engenheiro", t)
    t = re.sub(r"\bSpecialist\b", "Especialista", t)
    t = re.sub(r"\bManager\b", "Gerente", t)
    t = re.sub(r"\bAnalyst\b", "Analista", t)
    t = re.sub(r"\bStrategist\b", "Estrategista", t)
    t = re.sub(r"\bConsultant\b", "Consultor", t)
    t = re.sub(r"\bLead\b", "Líder", t)
    t = re.sub(r"\bReviewer\b", "Revisor", t)
    t = re.sub(r"\bAuditor\b", "Auditor", t)
    t = re.sub(r"\bOptimizer\b", "Otimizador", t)
    t = re.sub(r"\bResearcher\b", "Pesquisador", t)
    t = re.sub(r"\bTester\b", "Testador", t)
    t = re.sub(r"\bCreator\b", "Criador", t)
    t = re.sub(r"\bBuilder\b", "Construtor", t)
    return t.strip()

def pt_desc(en_desc: str, title: str, div: str) -> str:
    div_name = DIVISION_NAMES.get(div, div.title())
    if not en_desc or len(en_desc.strip()) < 5:
        return f"Especialista sênior em fluxos avançados de {div_name.lower()} para a Agência WINC."

    text = en_desc.strip()
    
    # Common English phrasing translation to fluent Brazilian Portuguese
    phrase_maps = [
        ("Expert in cultural systems, rituals, kinship, belief systems, and ethnographic method", "Especialista em sistemas culturais, rituais, parentesco, cosmologias e método etnográfico"),
        ("Expert in physical and human geography, climate systems, cartography, and spatial analysis", "Especialista em geografia física e humana, sistemas climáticos, cartografia e análise espacial"),
        ("Expert in historical analysis, periodization, material culture, and historiography", "Especialista em análise histórica, periodização, cultura material e historiografia"),
        ("Expert in narrative theory, story structure, character arcs, and literary analysis", "Especialista em teoria narrativa, estruturação de arcos de personagens e análise de histórias"),
        ("Expert in human behavior, personality theory, motivation, and cognitive patterns", "Especialista em comportamento humano, teorias de personalidade, motivação e padrões cognitivos"),
        ("Expert in quantitative research methodology, experimental design, and statistical inference", "Especialista em metodologia quantitativa, delineamento experimental e inferência estatística"),
        ("Architect and specialist in deterministic HTML-to-PDF document compilation", "Arquiteto especialista em compilação determinística de documentos HTML para PDF"),
        ("Specializes in", "Especializado em"),
        ("Specializing in", "com foco especialista em"),
        ("Focuses on", "Concentra-se em"),
        ("Focused on", "Focado em"),
        ("Responsible for", "Responsável por"),
        ("Expert in", "Especialista em"),
        ("Expert", "Especialista"),
        ("Specialist in", "Especialista em"),
        ("Master of", "Mestre em"),
        ("Masters the art of", "Domina com maestria"),
        ("Designs and implements", "Projeta e implementa"),
        ("Provides", "Oferece"),
        ("Delivers", "Entrega soluções de"),
        ("Ensures", "Garante a"),
        ("Builds", "Constrói e desenvolve"),
        ("Analyzes", "Analisa criticamente"),
        ("Creates", "Desenvolve"),
        ("Optimizes", "Otimiza a"),
        ("Validates", "Valida rigorosamente"),
        ("Monitors", "Monitora"),
        ("Helps", "Auxilia no suporte e"),
        ("user experience", "experiência do usuário (UX)"),
        ("user interface", "interface de usuário (UI)"),
        ("best practices", "melhores práticas"),
        ("high performance", "alta performance"),
        ("scalable architecture", "arquitetura escalável"),
    ]
    
    for en, pt in phrase_maps:
        text = re.sub(re.escape(en), pt, text, flags=re.IGNORECASE)
        
    if not text.startswith("Especialista") and not text.startswith("Arquiteto") and not text.startswith("Desenvolvedor") and not text.startswith("Engenheiro") and not text.startswith("Responsável"):
        text = f"Especialista em {title}: {text}"
        
    return text.strip()

def run_migration():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    
    cur.execute("SELECT id, name, division, description FROM agents")
    rows = cur.fetchall()
    
    catalog = {}
    
    for r in rows:
        agent_id = r["id"]
        title_pt = pt_title(r["name"])
        div_pt = DIVISION_NAMES.get(r["division"], r["division"].title())
        desc_pt = pt_desc(r["description"] or "", title_pt, r["division"])
        
        cur.execute("""
            UPDATE agents 
            SET name_pt = ?, description_pt = ?, division_label_pt = ? 
            WHERE id = ?
        """, (title_pt, desc_pt, div_pt, agent_id))
        
        catalog[agent_id] = {
            "name_pt": title_pt,
            "division_label_pt": div_pt,
            "description_pt": desc_pt
        }
        
    conn.commit()
    
    # Save JSON catalog to backend/app/i18n/pt_br_catalog.json
    out_json = BASE_DIR / "backend" / "app" / "i18n" / "pt_br_catalog.json"
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
        
    print(f"Updated {len(catalog)} agents with pt-BR translations and generated pt_br_catalog.json.")

if __name__ == "__main__":
    run_migration()
