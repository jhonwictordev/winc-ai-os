export interface SystemTelemetry {
  cpu: {
    percent: number;
    cores: number;
    threads: number;
  };
  ram: {
    total_gb: number;
    available_gb: number;
    used_gb: number;
    percent: number;
    warning: boolean;
    critical: boolean;
  };
  swap: {
    total_gb: number;
    used_gb: number;
    percent: number;
  };
  disk: {
    total_gb: number;
    free_gb: number;
    percent: number;
  };
  services: {
    ollama_running: boolean;
    ollama_models: string[];
    openjarvis_loaded: boolean;
  };
  low_ram_mode: boolean;
}

export interface Agent {
  id: string;
  name: string;
  name_pt?: string;
  division: string;
  division_label: string;
  division_label_pt?: string;
  description: string;
  description_pt?: string;
  color: string;
  emoji: string;
  vibe: string;
  system_prompt: string;
  model_assigned: string;
  is_active: number;
  is_custom: number;
}

export interface Division {
  id: string;
  label: string;
  label_pt?: string;
  description?: string;
  agent_count?: number;
  icon?: string;
  color: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  category: string;
  description: string;
  status: string;
  directory_path: string;
  created_at: number;
  updated_at: number;
  total_tasks?: number;
  completed_tasks?: number;
  running_tasks?: number;
}

export interface Task {
  id: string;
  project_id?: string;
  agent_id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  priority: number;
  stage: string;
  logs: string;
  result: string;
  created_at: number;
  started_at?: number;
  completed_at?: number;
}

export interface Workflow {
  id: string;
  title: string;
  description: string;
  nodes: any[];
  edges: any[];
  status: string;
  last_run_at?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  agent_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: number;
}

export interface Memory {
  id: string;
  entity_type: string;
  entity_id: string;
  content: string;
  category: string;
  created_at: number;
}

export interface AuditLog {
  id: number;
  action: string;
  actor: string;
  details: string;
  created_at: number;
}
