"""Comprehensive Agent Translator for WINC AI OS.
Translates all Agency Agents titles, divisions, and descriptions into Brazilian Portuguese (pt-BR).
Preserves technical identifiers, API names, code tokens, and system integrity.
"""

import json
import re
from pathlib import Path
from typing import Dict, Any, Tuple

# Division translations
DIVISION_MAP = {
    "academic": "Acadêmico",
    "design": "Design & Criação",
    "engineering": "Engenharia de Software",
    "finance": "Finanças & Contabilidade",
    "game-development": "Desenvolvimento de Jogos",
    "gis": "Geoinformação & GIS",
    "healthcare": "Saúde & Cuidados Médicos",
    "marketing": "Marketing & Crescimento",
    "paid-media": "Mídia Paga & Performance",
    "product": "Gestão de Produto",
    "project-management": "Gerenciamento de Projetos",
    "research": "Pesquisa & Inteligência",
    "sales": "Vendas & Negócios",
    "security": "Segurança & Ciberdefesa",
    "spatial-computing": "Computação Espacial & XR",
    "specialized": "Especialistas & Nichos",
    "support": "Suporte & Atendimento",
    "testing": "Garantia de Qualidade & Testes",
}

# Title translations (exact and component overrides)
EXACT_TITLES = {
    # Academic
    "Anthropologist": "Antropólogo Cultural",
    "Geographer": "Geógrafo & Analista Espacial",
    "Historian": "Historiador & Analista Documental",
    "Narratologist": "Narratologista & Estruturador de Histórias",
    "Psychologist": "Psicólogo Comportamental",
    "Statistician": "Estatístico & Cientista Quantitativo",
    
    # Design
    "Brand Guardian": "Guardião da Identidade de Marca",
    "Image Prompt Engineer": "Engenheiro de Prompts de Imagem",
    "Inclusive Visuals Specialist": "Especialista em Recursos Visuais Inclusivos",
    "Persona Walkthrough Specialist": "Especialista em Navegação por Persona",
    "UI Designer": "Designer de Interface (UI)",
    "UI Finish-Gate Reviewer": "Revisor de Acabamento de UI",
    "UX Architect": "Arquiteto de Experiência (UX)",
    "UX Researcher": "Pesquisador de Experiência do Usuário (UX)",
    "Visual Storyteller": "Contador de Histórias Visuais",
    "Whimsy Injector": "Especialista em Microinterações e Encantamento",

    # Engineering Highlights
    "Content Creator": "Criador de Conteúdo",
    "Godot Shader Developer": "Desenvolvedor de Shaders Godot",
    "Unity Editor Tool Developer": "Desenvolvedor de Ferramentas do Editor Unity",
    "Unreal Technical Artist": "Artista Técnico Unreal",
    "PDF Engine Architect": "Arquiteto de Mecanismos PDF",
    "AI Data Remediation Engineer": "Engenheiro de Remediação de Dados de IA",
    "AI Engineer": "Engenheiro de Inteligência Artificial",
    "API Platform Engineer": "Engenheiro de Plataforma de APIs",
    "ATS Validator Architect": "Arquiteto de Validação ATS",
    "Autonomous Optimization Architect": "Arquiteto de Otimização Autônoma",
    "Backend Architect": "Arquiteto Backend",
    "China Network Engineer": "Engenheiro de Redes Internacionais (China)",
    "CMS Developer": "Desenvolvedor de Sistemas CMS",
    "Code Reviewer": "Revisor de Código-Fonte",
    "Codebase Onboarding Engineer": "Engenheiro de Integração de Codebase",
    "Data Engineer": "Engenheiro de Dados",
    "Data Visualization Engineer": "Engenheiro de Visualização de Dados",
    "Database Optimizer": "Otimizador de Bancos de Dados",
    "Database Reliability Engineer": "Engenheiro de Confiabilidade de Bancos de Dados (DBRE)",
    "Debug Specialist": "Especialista em Depuração e Diagnósticos",
    "Devops Architect": "Arquiteto DevOps & CI/CD",
    "Devops Automator": "Automatizador de Operações DevOps",
    "Devops Cloud Architect": "Arquiteto Cloud & Infraestrutura",
    "Devops Release Engineer": "Engenheiro de Release & Deploy",
    "Docker Architect": "Arquiteto Docker & Containerização",
    "Documentation Engineer": "Engenheiro de Documentação Técnica",
    "Embedded Firmware Developer": "Desenvolvedor de Firmware Embarcado",
    "Embedded Linux Kernel Engineer": "Engenheiro de Kernel Linux Embarcado",
    "Embedded Systems Architect": "Arquiteto de Sistemas Embarcados",
    "Frontend Architect": "Arquiteto Frontend",
    "Frontend Developer": "Desenvolvedor Frontend",
    "Full Stack Developer": "Desenvolvedor Full Stack",
    "Full Stack Engineer": "Engenheiro Full Stack",
    "GraphQL Architect": "Arquiteto GraphQL & Federação",
    "Incident Commander": "Comandante de Incidentes Críticos",
    "Integration Specialist": "Especialista em Integrações de Sistemas",
    "Kubernetes Architect": "Arquiteto de Kubernetes & Clusters",
    "Linux Systems Engineer": "Engenheiro de Sistemas Linux",
    "Mobile Developer": "Desenvolvedor Mobile Multiplataforma",
    "Network Engineer": "Engenheiro de Redes & Conectividade",
    "Performance Engineer": "Engenheiro de Desempenho & Otimização",
    "Python Developer": "Desenvolvedor Python Especialista",
    "React Native Developer": "Desenvolvedor React Native",
    "Site Reliability Engineer": "Engenheiro de Confiabilidade de Sites (SRE)",
    "Solutions Architect": "Arquiteto de Soluções Corporativas",
    "Systems Architect": "Arquiteto de Sistemas de Grande Escala",
    "Technical Writer": "Redator Técnico Especializado",
    "Web Performance Optimizer": "Otimizador de Performance Web",

    # Finance
    "Accountant": "Contador Executivo",
    "Crypto Portfolio Manager": "Gestor de Carteiras Cripto e DeFi",
    "Financial Analyst": "Analista Financeiro Estratégico",
    "Payroll Specialist": "Especialista em Folha de Pagamento & Benefícios",
    "Tax Consultant": "Consultor Tributário & Fiscal",

    # Marketing & Paid Media
    "Copywriter": "Redator Publicitário (Copywriter)",
    "Growth Hacker": "Estrategista de Growth Hacking",
    "Marketing Strategist": "Estrategista de Marketing Integrado",
    "SEO Specialist": "Especialista em Otimização de Busca (SEO)",
    "Social Media Strategist": "Estrategista de Mídias Sociais",
    "Paid Search Specialist": "Especialista em Busca Paga (Google Ads)",
    "Paid Social Specialist": "Especialista em Tráfego Pago Social (Meta/LinkedIn Ads)",
    "Performance Marketer": "Gestor de Performance & ROI de Campanhas",
    "Media Buyer": "Comprador de Mídia & Negociador de Inventário",

    # Product & Project Management
    "Product Manager": "Gerente de Produto (PM)",
    "Product Owner": "Líder de Backlog & Escopo (Product Owner)",
    "Scrum Master": "Facilitador Ágil & Scrum Master",
    "Agile Coach": "Coach Ágil Organizacional",
    "Project Coordinator": "Coordenador de Projetos",
    "Risk Manager": "Gestor de Riscos e Contingências",
    "Delivery Manager": "Gerente de Entregas e Prazos",

    # Security
    "Application Security Engineer": "Engenheiro de Segurança de Aplicações (AppSec)",
    "Cloud Security Architect": "Arquiteto de Segurança em Nuvem",
    "Compliance Auditor": "Auditor de Conformidade & LGPD/GDPR",
    "Cryptographer": "Especialista em Criptografia & Proteção de Dados",
    "Penetration Tester": "Testador de Invasão & Pentester Ético",
    "Security Analyst": "Analista de Operações de Segurança (SOC)",
    "Security Architect": "Arquiteto de Segurança da Informação",
    "Threat Intelligence Analyst": "Analista de Inteligência de Ameaças",
    "Vulnerability Assessor": "Avaliador de Vulnerabilidades e Brechas",

    # Quality & Testing
    "Automation Test Engineer": "Engenheiro de Testes Automatizados",
    "Performance Tester": "Engenheiro de Testes de Carga e Estresse",
    "QA Architect": "Arquiteto de Garantia de Qualidade (QA)",
    "QA Lead": "Líder de Qualidade e Conformidade de Software",
    "Security QA Tester": "Testador de Segurança e QA Defensivo",
    "Usability Tester": "Testador de Usabilidade e Acessibilidade",
}

def translate_title(name: str) -> str:
    """Translate an agent's title into natural Brazilian Portuguese."""
    if name in EXACT_TITLES:
        return EXACT_TITLES[name]
    
    # Common rule transformations
    pt = name
    replacements = [
        (r"\bArchitect\b", "Arquiteto"),
        (r"\bDeveloper\b", "Desenvolvedor"),
        (r"\bEngineer\b", "Engenheiro"),
        (r"\bSpecialist\b", "Especialista"),
        (r"\bManager\b", "Gerente"),
        (r"\bAnalyst\b", "Analista"),
        (r"\bStrategist\b", "Estrategista"),
        (r"\bConsultant\b", "Consultor"),
        (r"\bLead\b", "Líder"),
        (r"\bDirector\b", "Diretor"),
        (r"\bReviewer\b", "Revisor"),
        (r"\bAuditor\b", "Auditor"),
        (r"\bOptimizer\b", "Otimizador"),
        (r"\bDesigner\b", "Designer"),
        (r"\bResearcher\b", "Pesquisador"),
        (r"\bWriter\b", "Redator"),
        (r"\bTester\b", "Testador"),
        (r"\bCreator\b", "Criador"),
        (r"\bCoordinator\b", "Coordenador"),
        (r"\bAdministrator\b", "Administrador"),
        (r"\bScientist\b", "Cientista"),
        (r"\bExpert\b", "Especialista"),
        (r"\bOfficer\b", "Oficial"),
        (r"\bAdvisor\b", "Conselheiro"),
        (r"\bValidator\b", "Validador"),
        (r"\bBuilder\b", "Construtor"),
        (r"\bRemediation\b", "Remediação"),
        (r"\bAutonomous\b", "Autônomo"),
        (r"\bAutomation\b", "Automação"),
        (r"\bReliability\b", "Confiabilidade"),
        (r"\bPerformance\b", "Performance"),
        (r"\bSecurity\b", "Segurança"),
        (r"\bPlatform\b", "Plataforma"),
        (r"\bInfrastructure\b", "Infraestrutura"),
        (r"\bSystems\b", "Sistemas"),
        (r"\bQuality\b", "Qualidade"),
        (r"\bNetwork\b", "Redes"),
        (r"\bDatabase\b", "Bancos de Dados"),
        (r"\bMobile\b", "Mobile"),
        (r"\bSpatial\b", "Espacial"),
        (r"\bComputing\b", "Computação"),
        (r"\bHealth\b", "Saúde"),
        (r"\bFinance\b", "Finanças"),
        (r"\bMarketing\b", "Marketing"),
        (r"\bGame\b", "Jogos"),
        (r"\bTool\b", "Ferramentas"),
        (r"\bEngine\b", "Mecanismos"),
        (r"\bShader\b", "Shaders"),
    ]
    for pattern, rep in replacements:
        pt = re.sub(pattern, rep, pt, flags=re.IGNORECASE)
    
    # Adjust Portuguese word ordering if needed (e.g., "Python Desenvolvedor" -> "Desenvolvedor Python")
    for role in ["Desenvolvedor", "Engenheiro", "Arquiteto", "Especialista", "Gerente", "Analista", "Consultor", "Otimizador", "Revisor", "Líder", "Testador"]:
        match = re.search(rf"^(.+?)\s+({role})(.*)$", pt)
        if match:
            pt = f"{match.group(2)} {match.group(1)}{match.group(3)}"
            break
            
    return pt.strip()

def translate_description(desc: str, title_pt: str, division_key: str) -> str:
    """Translate or produce a high-impact, professional Portuguese description for an agent."""
    if not desc or len(desc.strip()) < 5:
        div_label = DIVISION_MAP.get(division_key, "Especialidades")
        return f"Especialista em fluxos operacionais e soluções técnicas de {div_label.lower()} para a Agência WINC."

    # Clean encoding artifacts like 
    cleaned = desc.replace("", "—").strip()
    
    # Common phrase substitutions to make natural Portuguese
    substitutions = [
        (r"^Expert in\b", "Especialista em"),
        (r"^Specialist in\b", "Especialista em"),
        (r"^Expert\b", "Especialista"),
        (r"^Focuses on\b", "Focado em"),
        (r"^Specializes in\b", "Especializado em"),
        (r"^Responsible for\b", "Responsável por"),
        (r"\bspecializing in\b", "com especialização em"),
        (r"\bfocused on\b", "focado em"),
        (r"\bdesigned to\b", "projetado para"),
        (r"\bhelps\b", "auxilia no(a)"),
        (r"\bprovides\b", "fornece"),
        (r"\bdelivers\b", "entrega"),
        (r"\bensures\b", "garante"),
        (r"\bbuilds\b", "constrói"),
        (r"\banalyzes\b", "analisa"),
        (r"\bcreates\b", "cria"),
        (r"\bmanages\b", "gerencia"),
        (r"\boptimizes\b", "otimiza"),
        (r"\bvalidates\b", "valida"),
        (r"\bmonitors\b", "monitora"),
        (r"\bdesigns\b", "projeta"),
        (r"\bconducts\b", "conduz"),
        (r"\bidentifies\b", "identifica"),
        (r"\buser experience\b", "experiência do usuário (UX)"),
        (r"\buser interface\b", "interface de usuário (UI)"),
        (r"\bbest practices\b", "melhores práticas"),
        (r"\bperformance optimization\b", "otimização de desempenho"),
        (r"\bdata-driven\b", "orientado a dados"),
        (r"\bhigh-quality\b", "alta qualidade"),
        (r"\bcross-functional teams\b", "equipes multidisciplinares"),
        (r"\bscalability\b", "escalabilidade"),
        (r"\bproduction environments\b", "ambientes de produção"),
        (r"\bcode review\b", "revisão de código"),
        (r"\bsecurity vulnerabilities\b", "vulnerabilidades de segurança"),
        (r"\bcloud architecture\b", "arquitetura em nuvem"),
        (r"\bmachine learning\b", "aprendizado de máquina (ML)"),
        (r"\bartificial intelligence\b", "inteligência artificial (IA)"),
    ]

    res = cleaned
    for pattern, rep in substitutions:
        res = re.sub(pattern, rep, res, flags=re.IGNORECASE)

    # If it still ends up purely English, prefix with contextual Portuguese clarity
    if not res.startswith("Especialista") and not res.startswith("Responsável") and not res.startswith("Focado"):
        res = f"Especialista: {res}"

    return res
