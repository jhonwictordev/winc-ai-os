import React, { useState, useEffect } from 'react';
import { api } from './api';
import { SystemTelemetry, Project, Task, AuditLog } from './types';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';

// 14 Redesigned Pages
import { DashboardPage } from './pages/DashboardPage';
import { MasterAIPage } from './pages/MasterAIPage';
import { AgentsPage } from './pages/AgentsPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { TasksPage } from './pages/TasksPage';
import { WorkflowsPage } from './pages/WorkflowsPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { ModelsPage } from './pages/ModelsPage';
import { MemoryPage } from './pages/MemoryPage';
import { FilesPage } from './pages/FilesPage';
import { MonitoringPage } from './pages/MonitoringPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { FloatingWincAssistant } from './components/character/FloatingWincAssistant';
import { VoiceRecordingOverlay } from './components/character/VoiceRecordingOverlay';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [telemetry, setTelemetry] = useState<SystemTelemetry | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [aiStatus, setAiStatus] = useState<any>({ active_model: 'gemini-2.0-flash', is_remote: true });

  // Filtering helper for departments -> agents navigation
  const [activeDivisionFilter, setActiveDivisionFilter] = useState<string | undefined>(undefined);

  const fetchGlobalData = async () => {
    try {
      const [tel, projList, taskList, logs, aiStat] = await Promise.all([
        api.getSystemInfo().catch(() => null),
        api.getProjects().catch(() => []),
        api.getTasks().catch(() => []),
        api.getAuditLogs().catch(() => []),
        api.getAiStatus().catch(() => null)
      ]);
      if (tel) setTelemetry(tel);
      setProjects(projList);
      setTasks(taskList);
      setAuditLogs(logs);
      if (aiStat) setAiStatus(aiStat);
    } catch (e) {
      console.error('Error fetching telemetry:', e);
    }
  };

  useEffect(() => {
    fetchGlobalData();
    const interval = setInterval(fetchGlobalData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectDepartment = (divId: string) => {
    setActiveDivisionFilter(divId);
    setCurrentTab('agents');
  };

  const handleLaunchMasterFromPrompt = (prompt: string) => {
    setCurrentTab('master');
  };

  const tabMeta: Record<string, { category: string; title: string }> = {
    dashboard: { category: 'Principal', title: 'Dashboard Executivo' },
    master: { category: 'Principal', title: 'WINC Master AI' },
    agents: { category: 'Principal', title: 'Catálogo de Especialistas' },
    departments: { category: 'Principal', title: 'Departamentos' },
    projects: { category: 'Workspace', title: 'Gerenciamento de Projetos' },
    tasks: { category: 'Workspace', title: 'Fila de Tarefas Sequencial' },
    workflows: { category: 'Workspace', title: 'Automações & Pipelines' },
    workspace: { category: 'Workspace', title: 'Ambiente de Desenvolvimento' },
    models: { category: 'Inteligência', title: 'Modelos de IA & Inferência' },
    memory: { category: 'Inteligência', title: 'Memória Persistente' },
    files: { category: 'Inteligência', title: 'Central de Arquivos' },
    monitoring: { category: 'Sistema', title: 'Monitoramento & Telemetria' },
    history: { category: 'Sistema', title: 'Histórico & Auditoria' },
    settings: { category: 'Sistema', title: 'Configurações do Sistema' }
  };

  const currentMeta = tabMeta[currentTab] || { category: 'Geral', title: 'WINC OS' };
  const hasRunningTask = tasks.some(t => t.status === 'running');

  return (
    <div className="flex h-screen bg-[#06090e] text-[#f8fafc] overflow-hidden select-none font-sans">
      {/* Redesigned Collapsible Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          if (tab !== 'agents') setActiveDivisionFilter(undefined);
          setCurrentTab(tab);
        }}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        ramUsagePercent={telemetry ? telemetry.ram.percent : 0}
        lowRamMode={telemetry ? telemetry.low_ram_mode : true}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Redesigned Topbar */}
        <Topbar
          currentTab={currentTab}
          category={currentMeta.category}
          title={currentMeta.title}
          telemetry={telemetry}
          onRefreshTelemetry={fetchGlobalData}
          onNavigate={(tab) => setCurrentTab(tab)}
          activeModelName={aiStatus?.active_model || 'gemini-2.0-flash'}
          isRunningTask={hasRunningTask}
        />

        {/* Dynamic Pages */}
        <main className="flex-1 overflow-y-auto bg-[#06090e]">
          {currentTab === 'dashboard' && (
            <DashboardPage
              telemetry={telemetry}
              projects={projects}
              tasks={tasks}
              auditLogs={auditLogs}
              onNavigate={(tab) => setCurrentTab(tab)}
              onOpenCreateProject={() => setCurrentTab('projects')}
              onLaunchMaster={handleLaunchMasterFromPrompt}
            />
          )}

          {currentTab === 'master' && (
            <MasterAIPage onPlanExecuted={() => setCurrentTab('tasks')} />
          )}

          {currentTab === 'agents' && (
            <AgentsPage
              initialDivision={activeDivisionFilter}
              onStartChatWithAgent={() => setCurrentTab('master')}
            />
          )}

          {currentTab === 'departments' && (
            <DepartmentsPage onSelectDepartment={handleSelectDepartment} />
          )}

          {currentTab === 'projects' && <ProjectsPage />}

          {currentTab === 'tasks' && <TasksPage />}

          {currentTab === 'workflows' && <WorkflowsPage />}

          {currentTab === 'workspace' && <WorkspacePage />}

          {currentTab === 'models' && <ModelsPage />}

          {currentTab === 'memory' && <MemoryPage />}

          {currentTab === 'files' && <FilesPage />}

          {currentTab === 'monitoring' && <MonitoringPage telemetry={telemetry} />}

          {currentTab === 'history' && <HistoryPage />}

          {currentTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Persistent Floating WINC Master AI Assistant across all dashboard tabs */}
      {currentTab !== 'master' && (
        <FloatingWincAssistant
          currentTab={currentTab}
          onNavigateToMaster={() => setCurrentTab('master')}
          onRefreshTelemetry={fetchGlobalData}
        />
      )}

      {/* Global Voice Command Overlay & Key F Controller */}
      <VoiceRecordingOverlay onRefreshData={fetchGlobalData} />
    </div>
  );
};
