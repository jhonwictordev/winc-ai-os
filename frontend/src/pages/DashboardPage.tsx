import React, { useState } from 'react';
import { SystemTelemetry, Project, Task, AuditLog } from '../types';
import { 
  Users, 
  FolderKanban, 
  CheckSquare, 
  Activity, 
  Sparkles, 
  ShieldCheck, 
  Plus, 
  ArrowRight, 
  Clock, 
  Cpu, 
  HardDrive, 
  CheckCircle2, 
  Play
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

interface DashboardPageProps {
  telemetry: SystemTelemetry | null;
  projects: Project[];
  tasks: Task[];
  auditLogs: AuditLog[];
  onNavigate: (tab: string) => void;
  onOpenCreateProject?: () => void;
  onLaunchMaster: (prompt: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  telemetry,
  projects,
  tasks,
  auditLogs,
  onNavigate,
  onOpenCreateProject,
  onLaunchMaster
}) => {
  const [quickPrompt, setQuickPrompt] = useState('');

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const runningTask = tasks.find(t => t.status === 'running');
  const runningCount = runningTask ? 1 : 0;
  const availableAgentsCount = 283;

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickPrompt.trim()) {
      onLaunchMaster(quickPrompt);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* Executive Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-white/8">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">Visão geral</h1>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            Gerencie seus agentes, projetos e operações em um só lugar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            icon={<Sparkles className="w-4 h-4 text-[#d9ff2f]" />}
            onClick={() => onNavigate('master')}
          >
            WINC Master AI
          </Button>

          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              if (onOpenCreateProject) onOpenCreateProject();
              else onNavigate('projects');
            }}
          >
            Novo projeto
          </Button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Agentes disponíveis */}
        <Card hoverable onClick={() => onNavigate('agents')} className="cursor-pointer">
          <div className="flex items-center justify-between text-[#94a3b8] mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Agentes disponíveis</span>
            <div className="w-8 h-8 rounded-lg bg-[#d9ff2f]/10 text-[#d9ff2f] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{availableAgentsCount}</div>
          <p className="text-[11px] text-[#64748b] mt-1">18 departamentos especializados</p>
        </Card>

        {/* Card 2: Agentes em execução */}
        <Card hoverable onClick={() => onNavigate('tasks')} className="cursor-pointer">
          <div className="flex items-center justify-between text-[#94a3b8] mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Agentes em execução</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              runningCount > 0 ? 'bg-[#3b82f6]/10 text-[#60a5fa] animate-pulse' : 'bg-white/5 text-[#94a3b8]'
            }`}>
              <Play className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {runningCount > 0 ? '1 ativo' : '0 em espera'}
          </div>
          <p className="text-[11px] text-[#64748b] mt-1">Trava sequencial de baixo consumo</p>
        </Card>

        {/* Card 3: Projetos ativos */}
        <Card hoverable onClick={() => onNavigate('projects')} className="cursor-pointer">
          <div className="flex items-center justify-between text-[#94a3b8] mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Projetos ativos</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{projects.length}</div>
          <p className="text-[11px] text-[#64748b] mt-1">Gerenciados em Kanban local</p>
        </Card>

        {/* Card 4: Tarefas concluídas */}
        <Card hoverable onClick={() => onNavigate('tasks')} className="cursor-pointer">
          <div className="flex items-center justify-between text-[#94a3b8] mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Tarefas concluídas</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{completedTasks}</div>
          <p className="text-[11px] text-[#64748b] mt-1">Entregáveis salvos em disco</p>
        </Card>
      </div>

      {/* Central Command Input for Master AI */}
      <Card className="bg-gradient-to-r from-[#0c121d] via-[#0f1726] to-[#0c121d] border border-white/10">
        <form onSubmit={handleQuickSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Sparkles className="w-4 h-4 text-[#d9ff2f] absolute left-3.5 top-3" />
            <input
              type="text"
              value={quickPrompt}
              onChange={(e) => setQuickPrompt(e.target.value)}
              placeholder="Instrua o WINC MASTER AI (ex: 'Crie uma estratégia de marketing e SEO para clínica médica')..."
              className="w-full bg-[#06090e] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#64748b] focus:border-[#d9ff2f]/50 transition-colors"
            />
          </div>
          <Button type="submit" variant="primary" size="md" icon={<ArrowRight className="w-4 h-4" />}>
            Orquestrar
          </Button>
        </form>
      </Card>

      {/* Central Area: Two Columns (Atividade dos agentes & Projetos recentes) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Atividade dos agentes */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/8">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#d9ff2f]" />
              <h3 className="text-sm font-bold text-white">Atividade dos agentes</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('tasks')}>
              Ver fila completa
            </Button>
          </div>

          <div className="space-y-3">
            {tasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                onClick={() => onNavigate('tasks')}
                className="p-3 rounded-lg bg-[#080c14] border border-white/6 hover:border-white/15 transition-all cursor-pointer flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[11px] font-bold text-[#d9ff2f] truncate">
                      {task.agent_id.split('-').pop()?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-[#94a3b8] font-medium truncate max-w-[200px]">
                      {task.title}
                    </span>
                  </div>

                  <Badge
                    variant={
                      task.status === 'completed'
                        ? 'lime'
                        : task.status === 'running'
                        ? 'blue'
                        : task.status === 'error'
                        ? 'danger'
                        : 'warning'
                    }
                    size="sm"
                    dot={task.status === 'running'}
                  >
                    {task.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#64748b] font-mono">
                  <span className="truncate max-w-[260px]">{task.result ? task.result.slice(0, 70) + '...' : task.description}</span>
                  <span>{task.completed_at ? new Date(task.completed_at * 1000).toLocaleTimeString() : 'Na fila'}</span>
                </div>
              </div>
            ))}

            {tasks.length === 0 && (
              <div className="py-8 text-center text-xs text-[#64748b]">Nenhuma tarefa em execução ou concluída.</div>
            )}
          </div>
        </Card>

        {/* Right Column: Projetos recentes */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/8">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-[#3b82f6]" />
              <h3 className="text-sm font-bold text-white">Projetos recentes</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('projects')}>
              Ver Kanban
            </Button>
          </div>

          <div className="space-y-3">
            {projects.slice(0, 5).map((project) => (
              <div
                key={project.id}
                onClick={() => onNavigate('projects')}
                className="p-3 rounded-lg bg-[#080c14] border border-white/6 hover:border-white/15 transition-all cursor-pointer flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white truncate max-w-[260px]">{project.name}</h4>
                  <Badge variant="blue" size="sm">{project.status}</Badge>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#64748b]">
                  <span>Cliente: <strong className="text-[#94a3b8]">{project.client}</strong></span>
                  <span className="font-mono text-[10px]">
                    {project.completed_tasks || 0}/{project.total_tasks || 0} tarefas
                  </span>
                </div>
              </div>
            ))}

            {projects.length === 0 && (
              <div className="py-8 text-center text-xs text-[#64748b]">Nenhum projeto cadastrado ainda.</div>
            )}
          </div>
        </Card>
      </div>

      {/* Bottom Area: Hardware Telemetry & Services Status */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/8">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#d9ff2f]" />
            <h3 className="text-sm font-bold text-white">Telemetria de recursos & Status operacional</h3>
          </div>
          <span className="text-[11px] font-mono text-[#64748b]">Ambiente 4 GB RAM Host</span>
        </div>

        {telemetry && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CPU Metric */}
            <div className="p-3.5 rounded-lg bg-[#080c14] border border-white/6 space-y-2">
              <div className="flex justify-between items-center text-[11px] text-[#94a3b8]">
                <span>CPU Host:</span>
                <span className="font-mono font-bold text-white">{telemetry.cpu.percent}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#3b82f6]" style={{ width: `${Math.min(telemetry.cpu.percent, 100)}%` }} />
              </div>
              <span className="text-[10px] text-[#64748b] font-mono">{telemetry.cpu.cores} núcleos / {telemetry.cpu.threads} threads</span>
            </div>

            {/* RAM Metric */}
            <div className="p-3.5 rounded-lg bg-[#080c14] border border-white/6 space-y-2">
              <div className="flex justify-between items-center text-[11px] text-[#94a3b8]">
                <span>RAM Física:</span>
                <span className={`font-mono font-bold ${telemetry.ram.warning ? 'text-red-400' : 'text-white'}`}>
                  {telemetry.ram.percent}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full ${telemetry.ram.warning ? 'bg-red-500' : 'bg-[#d9ff2f]'}`}
                  style={{ width: `${Math.min(telemetry.ram.percent, 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-[#64748b] font-mono">{telemetry.ram.used_gb} / {telemetry.ram.total_gb} GB usados</span>
            </div>

            {/* Virtual Memory / Swap Metric */}
            <div className="p-3.5 rounded-lg bg-[#080c14] border border-white/6 space-y-2">
              <div className="flex justify-between items-center text-[11px] text-[#94a3b8]">
                <span>Memória Virtual:</span>
                <span className="font-mono font-bold text-white">{telemetry.swap.percent}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500" style={{ width: `${Math.min(telemetry.swap.percent, 100)}%` }} />
              </div>
              <span className="text-[10px] text-[#64748b] font-mono">{telemetry.swap.used_gb} / {telemetry.swap.total_gb} GB</span>
            </div>

            {/* Storage C: Metric */}
            <div className="p-3.5 rounded-lg bg-[#080c14] border border-white/6 space-y-2">
              <div className="flex justify-between items-center text-[11px] text-[#94a3b8]">
                <span>Disco C:</span>
                <span className="font-mono font-bold text-white">{telemetry.disk.free_gb} GB livres</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400" style={{ width: `${100 - telemetry.disk.percent}%` }} />
              </div>
              <span className="text-[10px] text-[#64748b] font-mono">{telemetry.disk.total_gb} GB total</span>
            </div>
          </div>
        )}

        {/* Protection Safeguards Banner */}
        <div className="p-3.5 rounded-lg bg-[#d9ff2f]/5 border border-[#d9ff2f]/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 text-[#94a3b8]">
            <ShieldCheck className="w-4 h-4 text-[#d9ff2f] shrink-0" />
            <span>
              <strong>Proteção Low RAM Ativa:</strong> Trava de 1 agente por vez, descarregamento imediato de pesos e limite de 1.536 tokens.
            </span>
          </div>
          <Badge variant="lime" size="sm">Seguro</Badge>
        </div>
      </Card>
    </div>
  );
};
