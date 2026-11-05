import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Users,
  Layers,
  FolderKanban,
  CheckSquare,
  GitMerge,
  Code2,
  Cpu,
  Brain,
  Files,
  Activity,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { Badge } from './ui/Badge';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  ramUsagePercent: number;
  lowRamMode: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  collapsed,
  setCollapsed,
  ramUsagePercent,
  lowRamMode
}) => {
  const groups = [
    {
      title: 'PRINCIPAL',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'master', label: 'WINC Master AI', icon: Sparkles, badge: 'CORE', badgeVariant: 'lime' as const },
        { id: 'agents', label: 'Agentes', icon: Users, badge: '283', badgeVariant: 'neutral' as const },
        { id: 'departments', label: 'Departamentos', icon: Layers },
      ]
    },
    {
      title: 'WORKSPACE',
      items: [
        { id: 'projects', label: 'Projetos', icon: FolderKanban },
        { id: 'tasks', label: 'Tarefas', icon: CheckSquare },
        { id: 'workflows', label: 'Workflows', icon: GitMerge },
        { id: 'workspace', label: 'Workspace', icon: Code2 },
      ]
    },
    {
      title: 'INTELIGÊNCIA',
      items: [
        { id: 'models', label: 'Modelos de IA', icon: Cpu },
        { id: 'memory', label: 'Memória', icon: Brain },
        { id: 'files', label: 'Arquivos', icon: Files },
      ]
    },
    {
      title: 'SISTEMA',
      items: [
        { id: 'monitoring', label: 'Monitoramento', icon: Activity },
        { id: 'history', label: 'Histórico', icon: History },
        { id: 'settings', label: 'Configurações', icon: Settings },
      ]
    }
  ];

  return (
    <aside
      className={`bg-[#080c14] border-r border-white/8 flex flex-col h-screen select-none z-30 transition-all duration-200 shrink-0 ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 border-b border-white/8 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Logo container */}
          <div className="w-8 h-8 rounded-lg bg-[#0e1624] border border-[#d9ff2f]/30 flex items-center justify-center p-1 shrink-0 shadow-[0_0_10px_rgba(217,255,47,0.12)]">
            <img
              src="/brand/winc_favicon.png"
              alt="WINC"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-wide text-white font-mono">WINC OS</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#d9ff2f] shadow-[0_0_6px_#d9ff2f]" />
              </div>
              <span className="text-[10px] text-[#64748b] tracking-wider uppercase font-semibold truncate">
                Agência WINC AI
              </span>
            </div>
          )}
        </div>

        {/* Toggle Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-white/5 text-[#94a3b8] hover:text-white transition-colors"
          title={collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-6">
        {groups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!collapsed && (
              <div className="px-3 pb-1 text-[10px] font-mono font-bold tracking-wider text-[#64748b] uppercase">
                {group.title}
              </div>
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-[#121c2c] text-[#f8fafc] font-semibold border-l-2 border-[#d9ff2f] shadow-sm'
                      : 'text-[#94a3b8] hover:text-[#f8fafc] hover:bg-white/4'
                  } ${collapsed ? 'justify-center px-0' : ''}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-[#d9ff2f]' : 'text-[#64748b] group-hover:text-[#94a3b8]'
                      }`}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!collapsed && item.badge && (
                    <Badge variant={item.badgeVariant || 'neutral'} size="sm">
                      {item.badge}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Info Box */}
      <div className="p-3 border-t border-white/8 bg-[#06090e]">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-[#94a3b8]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#d9ff2f]" />
                <span className="font-semibold text-white">Low RAM:</span>
              </div>
              <span className="text-[10px] font-mono text-[#d9ff2f] font-bold">1 AGENTE / VEZ</span>
            </div>

            {/* RAM Meter */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-[#64748b] font-mono">
                <span>RAM HOST</span>
                <span className={ramUsagePercent > 88 ? 'text-red-400 font-bold' : 'text-[#94a3b8]'}>
                  {ramUsagePercent}%
                </span>
              </div>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    ramUsagePercent > 88 ? 'bg-red-500' : 'bg-[#d9ff2f]'
                  }`}
                  style={{ width: `${Math.min(ramUsagePercent, 100)}%` }}
                />
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[10px] text-[#64748b] font-mono">
              <span>OpenJarvis Core</span>
              <span>v1.0.0</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1" title={`RAM Host: ${ramUsagePercent}%`}>
            <span className={`w-2 h-2 rounded-full ${ramUsagePercent > 88 ? 'bg-red-400' : 'bg-[#d9ff2f]'}`} />
            <span className="text-[9px] font-mono text-[#64748b]">{ramUsagePercent}%</span>
          </div>
        )}
      </div>
    </aside>
  );
};
