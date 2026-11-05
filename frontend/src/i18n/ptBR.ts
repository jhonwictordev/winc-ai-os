/**
 * Centralized Brazilian Portuguese (pt-BR) Localization Dictionary
 * WINC AI OS - Agência WINC
 */

export const ptBR = {
  common: {
    appName: 'WINC AI OS',
    appSubtitle: 'Sistema Operacional de Agentes Inteligentes',
    agency: 'Agência WINC',
    loading: 'Carregando...',
    saving: 'Salvando alterações...',
    saved: 'Salvo com sucesso!',
    search: 'Buscar...',
    filter: 'Filtrar',
    all: 'Todos',
    actions: 'Ações',
    details: 'Detalhes',
    status: 'Status',
    date: 'Data',
    close: 'Fechar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    create: 'Criar',
    save: 'Salvar Configurações',
    edit: 'Editar',
    delete: 'Excluir',
    execute: 'Executar',
    refresh: 'Atualizar',
    purgeRam: 'Liberar RAM',
    active: 'Ativo',
    inactive: 'Inativo',
    online: 'Online',
    offline: 'Offline',
    running: 'Em Execução',
    pending: 'Na Fila',
    completed: 'Concluído',
    error: 'Erro',
    unknown: 'Desconhecido',
  },

  navigation: {
    dashboard: 'Dashboard',
    masterAI: 'WINC Master AI',
    agents: 'Especialistas',
    departments: 'Departamentos',
    projects: 'Projetos',
    tasks: 'Fila de Tarefas',
    workflows: 'Automações',
    workspace: 'Workspace',
    models: 'Modelos de IA',
    memory: 'Memória Persistente',
    files: 'Central de Arquivos',
    monitoring: 'Monitoramento',
    history: 'Histórico & Auditoria',
    settings: 'Configurações',
    categories: {
      main: 'PRINCIPAL',
      workspace: 'ESPAÇO DE TRABALHO',
      intelligence: 'INTELIGÊNCIA & IA',
      system: 'SISTEMA & INFRA',
    }
  },

  departments: {
    academic: 'Acadêmico & Pesquisa Teórica',
    design: 'Design & Direção de Arte',
    engineering: 'Engenharia de Software & DevOps',
    finance: 'Finanças & Contabilidade',
    'game-development': 'Desenvolvimento de Jogos',
    gis: 'Geoinformação & Cartografia Digital',
    healthcare: 'Saúde & Medicina',
    marketing: 'Marketing Estratégico & Conteúdo',
    'paid-media': 'Mídia Paga & Performance',
    product: 'Gestão de Produto (PM / PO)',
    'project-management': 'Gerenciamento de Projetos',
    research: 'Pesquisa & Inteligência de Mercado',
    sales: 'Vendas & Negócios B2B',
    security: 'Segurança da Informação & Ciberdefesa',
    'spatial-computing': 'Computação Espacial & XR',
    specialized: 'Especialistas & Nichos Técnicos',
    support: 'Suporte & Atendimento ao Cliente',
    testing: 'Qualidade & Automação de Testes (QA)',
  },

  stages: {
    planning: 'Planejamento',
    pending: 'Aguardando Início',
    execution: 'Em Execução',
    review: 'Em Revisão',
    done: 'Concluído',
    failed: 'Falha Técnica',
  },

  telemetry: {
    cpu: 'Processador (CPU)',
    ram: 'Memória RAM Física',
    ramAvailable: 'RAM Disponível',
    swap: 'Memória Virtual (Swap)',
    disk: 'Armazenamento em Disco',
    activeAgent: 'Agente Ativo',
    noActiveAgent: 'Nenhum agente em execução (Ocioso)',
    singleLockActive: 'Trava Sequencial Ativa (1 Agente / Vez)',
    lowRamActive: 'Modo Low RAM Ativo (Otimizado para 4 GB)',
    remoteAiActive: 'Inferência Remota Ativa (Zero RAM Local)',
  },

  aiProviders: {
    gemini: {
      name: 'Google Gemini API (Antigravity AI)',
      badge: 'Recomendado — Zero RAM Local',
      description: 'Executa a inferência nos servidores oficiais do Google com alta precisão e sem ocupar a memória RAM do computador.',
      models: [
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Padrão ultrarrápido)' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Leve e estável)' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Raciocínio complexo)' }
      ]
    },
    openrouter: {
      name: 'OpenRouter API',
      badge: 'Remoto — Zero RAM Local',
      description: 'Roteador unificado para modelos de nuvem como Claude, Llama 3 e GPT.',
      models: [
        { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash (via OpenRouter)' },
        { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B Instruct' },
        { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' }
      ]
    },
    ollama: {
      name: 'Ollama Local (0.5B a 1.1B)',
      badge: 'Execução Offline no Host',
      description: 'Modelos quantizados ultraleves rodando diretamente no Windows.',
      models: [
        { id: 'qwen2.5:0.5b', name: 'Qwen 2.5 0.5B (~600 MB RAM)' },
        { id: 'smollm2:360m', name: 'SmolLM2 360M (~450 MB RAM)' },
        { id: 'tinyllama:1.1b', name: 'TinyLlama 1.1B (~900 MB RAM)' }
      ]
    },
    openai_compatible: {
      name: 'Endpoint OpenAI Compatível',
      badge: 'Personalizado',
      description: 'Conecte qualquer API compatível com a especificação OpenAI.',
      models: [
        { id: 'default', name: 'Modelo Padrão do Endpoint' }
      ]
    }
  }
};
