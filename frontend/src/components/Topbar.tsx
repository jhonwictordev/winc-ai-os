import React, { useState } from 'react';
import { SystemTelemetry } from '../types';
import { api } from '../api';
import {
  Search,
  Cpu,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Bell,
  Settings,
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

interface TopbarProps {
  currentTab: string;
  category: string;
  title: string;
  telemetry: SystemTelemetry | null;
  onRefreshTelemetry: () => void;
  onNavigate: (tab: string) => void;
  activeModelName?: string;
  isRunningTask?: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentTab,
  category,
  title,
  telemetry,
  onRefreshTelemetry,
  onNavigate,
  activeModelName = 'qwen2.5:0.5b',
  isRunningTask = false
}) => {
  const [purging, setPurging] = useState(false);
  const [purgedMessage, setPurgedMessage] = useState<string | null>(null);

  const handlePurge = async () => {
    try {
      setPurging(true);
      await api.purgeMemory();
      setPurgedMessage('RAM Liberada');
      setTimeout(() => setPurgedMessage(null), 2500);
      onRefreshTelemetry();
    } finally {
      setPurging(false);
    }
  };

  return (
    <header className="h-16 px-6 border-b border-white/8 bg-[#080c14]/90 backdrop-blur-md flex items-center justify-between shrink-0 z-20">
      {/* Breadcrumb & Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-[#64748b]">
          <span>WINC OS</span>
          <ChevronRight className="w-3.5 h-3.5 text-white/20" />
          <span className="uppercase text-[10px] font-mono tracking-wider">{category}</span>
          <ChevronRight className="w-3.5 h-3.5 text-white/20" />
        </div>
        <h2 className="text-sm font-bold text-white tracking-wide">{title}</h2>
      </div>

      {/* Middle: Global Search Pill */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0e1420] border border-white/8 text-xs text-[#64748b] w-72 focus-within:border-[#d9ff2f]/40 transition-colors">
        <Search className="w-3.5 h-3.5 text-[#64748b]" />
        <input
          type="text"
          placeholder="Buscar agentes, projetos, tarefas..."
          className="bg-transparent text-xs text-white placeholder-[#64748b] w-full focus:outline-none"
        />
        <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[#94a3b8]">
          ⌘K
        </kbd>
      </div>

      {/* Right Actions & Status Badges */}
      <div className="flex items-center gap-3">
        {/* Execution Status Badge */}
        {isRunningTask ? (
          <Badge variant="blue" dot className="animate-pulse">
            Executando Agente
          </Badge>
        ) : (
          <Badge variant="lime" dot>
            Fila Pronta
          </Badge>
        )}

        {/* Model Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0e1420] border border-white/8 text-[11px] font-mono text-[#94a3b8]">
          <Zap className="w-3.5 h-3.5 text-[#d9ff2f]" />
          <span>{activeModelName}</span>
        </div>

        {/* Telemetry Quick Meters */}
        {telemetry && (
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0e1420] border border-white/8 text-[11px] font-mono text-[#94a3b8]">
              <Cpu className="w-3.5 h-3.5 text-[#3b82f6]" />
              <span>{telemetry.cpu.percent}%</span>
            </div>

            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-mono ${
                telemetry.ram.warning
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : 'bg-[#0e1420] border-white/8 text-[#94a3b8]'
              }`}
            >
              <span>RAM:</span>
              <span className="font-bold text-white">{telemetry.ram.percent}%</span>
            </div>
          </div>
        )}

        {/* Purge RAM Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handlePurge}
          loading={purging}
          icon={purgedMessage ? <CheckCircle2 className="w-3.5 h-3.5 text-[#d9ff2f]" /> : <Trash2 className="w-3.5 h-3.5 text-[#d9ff2f]" />}
          title="Descarrega pesos do modelo da memória física e roda garbage collection"
        >
          {purgedMessage || 'Liberar RAM'}
        </Button>

        {/* Settings button */}
        <button
          onClick={() => onNavigate('settings')}
          className="p-2 rounded-lg hover:bg-white/5 text-[#94a3b8] hover:text-white transition-colors"
          title="Configurações do sistema"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
