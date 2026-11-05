import { SystemTelemetry, Agent, Division, Project, Task, Workflow, Message, Memory, AuditLog } from './types';

const API_BASE = '/api';

export const api = {
  // System Telemetry
  getSystemInfo: async (): Promise<SystemTelemetry> => {
    const res = await fetch(`${API_BASE}/system/info`);
    return res.json();
  },
  purgeMemory: async () => {
    const res = await fetch(`${API_BASE}/system/purge-memory`, { method: 'POST' });
    return res.json();
  },

  // Agents
  getAgents: async (division?: string, search?: string): Promise<Agent[]> => {
    const params = new URLSearchParams();
    if (division) params.append('division', division);
    if (search) params.append('search', search);
    const res = await fetch(`${API_BASE}/agents?${params.toString()}`);
    return res.json();
  },
  getDivisions: async (): Promise<Division[]> => {
    const res = await fetch(`${API_BASE}/agents/divisions`);
    return res.json();
  },
  getAgent: async (id: string): Promise<Agent> => {
    const res = await fetch(`${API_BASE}/agents/${id}`);
    return res.json();
  },
  toggleAgent: async (id: string) => {
    const res = await fetch(`${API_BASE}/agents/${id}/toggle`, { method: 'POST' });
    return res.json();
  },
  saveAgent: async (agent: Partial<Agent>) => {
    const res = await fetch(`${API_BASE}/agents/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agent)
    });
    return res.json();
  },

  // WINC Master AI
  planMasterRequest: async (prompt: string, client?: string, category?: string) => {
    const res = await fetch(`${API_BASE}/master/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, client, category })
    });
    return res.json();
  },
  executeMasterPlan: async (plan: any) => {
    const res = await fetch(`${API_BASE}/master/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan })
    });
    return res.json();
  },
  interactMaster: async (message: string, conversationId?: string) => {
    const res = await fetch(`${API_BASE}/master/interact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, conversation_id: conversationId })
    });
    return res.json();
  },

  // Text-To-Speech (TTS)
  getTtsVoices: async () => {
    const res = await fetch(`${API_BASE}/tts/voices`);
    return res.json();
  },
  synthesizeSpeech: async (text: string, voice?: string, rate?: string) => {
    const res = await fetch(`${API_BASE}/tts/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice, rate })
    });
    return res.json();
  },
  getTtsSample: async () => {
    const res = await fetch(`${API_BASE}/tts/sample`);
    return res.json();
  },

  // Projects & Kanban
  getProjects: async (): Promise<Project[]> => {
    const res = await fetch(`${API_BASE}/projects`);
    return res.json();
  },
  createProject: async (data: { name: string; client?: string; category?: string; description?: string }) => {
    const res = await fetch(`${API_BASE}/projects/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  getProjectKanban: async (projectId: string) => {
    const res = await fetch(`${API_BASE}/projects/${projectId}/kanban`);
    return res.json();
  },

  // Tasks
  getTasks: async (projectId?: string): Promise<Task[]> => {
    const url = projectId ? `${API_BASE}/tasks?project_id=${projectId}` : `${API_BASE}/tasks`;
    const res = await fetch(url);
    return res.json();
  },
  createTask: async (data: { agent_id: string; title: string; description: string; project_id?: string }) => {
    const res = await fetch(`${API_BASE}/tasks/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Chat
  sendMessage: async (data: { conversation_id?: string; agent_id?: string; message: string; project_id?: string }) => {
    const res = await fetch(`${API_BASE}/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  getConversations: async (projectId?: string) => {
    const url = projectId ? `${API_BASE}/chat/conversations?project_id=${projectId}` : `${API_BASE}/chat/conversations`;
    const res = await fetch(url);
    return res.json();
  },
  getMessages: async (conversationId: string): Promise<Message[]> => {
    const res = await fetch(`${API_BASE}/chat/conversations/${conversationId}/messages`);
    return res.json();
  },

  // Workflows
  getWorkflows: async (): Promise<Workflow[]> => {
    const res = await fetch(`${API_BASE}/workflows`);
    return res.json();
  },
  saveWorkflow: async (wf: Partial<Workflow>) => {
    const res = await fetch(`${API_BASE}/workflows/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wf)
    });
    return res.json();
  },
  runWorkflow: async (wfId: string) => {
    const res = await fetch(`${API_BASE}/workflows/${wfId}/run`, { method: 'POST' });
    return res.json();
  },

  // Models
  getModelsStatus: async () => {
    const res = await fetch(`${API_BASE}/models/status`);
    return res.json();
  },
  configureModel: async (config: { provider: string; model: string; api_base_url?: string; api_key?: string }) => {
    const res = await fetch(`${API_BASE}/models/configure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return res.json();
  },
  testInference: async (prompt?: string) => {
    const res = await fetch(`${API_BASE}/models/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    return res.json();
  },
  unloadModel: async () => {
    const res = await fetch(`${API_BASE}/models/unload`, { method: 'POST' });
    return res.json();
  },

  // Memory
  getMemories: async (entityType?: string, entityId?: string): Promise<Memory[]> => {
    const params = new URLSearchParams();
    if (entityType) params.append('entity_type', entityType);
    if (entityId) params.append('entity_id', entityId);
    const res = await fetch(`${API_BASE}/memory?${params.toString()}`);
    return res.json();
  },
  addMemory: async (data: { content: string; entity_type?: string; entity_id?: string; category?: string }) => {
    const res = await fetch(`${API_BASE}/memory/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  clearMemory: async (entityType?: string, entityId?: string) => {
    const params = new URLSearchParams();
    if (entityType) params.append('entity_type', entityType);
    if (entityId) params.append('entity_id', entityId);
    const res = await fetch(`${API_BASE}/memory/clear?${params.toString()}`, { method: 'DELETE' });
    return res.json();
  },

  // Files & Workspace
  browseFiles: async (subpath = '') => {
    const res = await fetch(`${API_BASE}/files/browse?subpath=${encodeURIComponent(subpath)}`);
    return res.json();
  },
  readFile: async (path: string) => {
    const res = await fetch(`${API_BASE}/files/read?path=${encodeURIComponent(path)}`);
    return res.json();
  },
  writeFile: async (path: string, content: string) => {
    const res = await fetch(`${API_BASE}/files/write`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, content })
    });
    return res.json();
  },
  executeWorkspaceCmd: async (command: string, projectId?: string) => {
    const res = await fetch(`${API_BASE}/workspace/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, project_id: projectId })
    });
    return res.json();
  },

  // History & Settings
  getAuditLogs: async (): Promise<AuditLog[]> => {
    const res = await fetch(`${API_BASE}/history/audit`);
    return res.json();
  },
  getSettings: async () => {
    const res = await fetch(`${API_BASE}/settings`);
    return res.json();
  },
  getAiStatus: async () => {
    const res = await fetch(`${API_BASE}/settings/ai-status`);
    return res.json();
  },
  testAiConnection: async (data: { provider: string; model: string; api_key?: string; base_url?: string }) => {
    const res = await fetch(`${API_BASE}/settings/test-connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  updateSettings: async (settings: Record<string, string>) => {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return res.json();
  }
};
