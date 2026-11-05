import React, { useState, useEffect, useMemo } from 'react';
import { Agent, Division } from '../types';
import { api } from '../api';
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  Eye,
  X,
  Power,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  FilterX
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

interface AgentsPageProps {
  initialDivision?: string;
  onStartChatWithAgent?: (agentId: string) => void;
}

export const AgentsPage: React.FC<AgentsPageProps> = ({
  initialDivision,
  onStartChatWithAgent
}) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<string>(initialDivision || 'all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(18);
  const [loading, setLoading] = useState(false);

  // Modals
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentDiv, setNewAgentDiv] = useState('specialized');
  const [newAgentDesc, setNewAgentDesc] = useState('');
  const [newAgentPrompt, setNewAgentPrompt] = useState('');

  // Sync initialDivision changes from parent navigation
  useEffect(() => {
    if (initialDivision) {
      setSelectedDivision(initialDivision);
    } else {
      setSelectedDivision('all');
    }
  }, [initialDivision]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [agentsData, divsData] = await Promise.all([
        api.getAgents(selectedDivision === 'all' ? undefined : selectedDivision, search.trim() || undefined),
        api.getDivisions()
      ]);
      setAgents(agentsData);
      setDivisions(divsData);
      setPage(1);
    } catch (e) {
      console.error('Error loading agents:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDivision]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleClearSearch = () => {
    setSearch('');
    // Trigger immediate reload without search term
    api.getAgents(selectedDivision === 'all' ? undefined : selectedDivision).then(data => {
      setAgents(data);
      setPage(1);
    });
  };

  const handleToggle = async (e: React.MouseEvent, agentId: string) => {
    e.stopPropagation();
    await api.toggleAgent(agentId);
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, is_active: a.is_active ? 0 : 1 } : a));
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim() || !newAgentPrompt.trim()) return;

    await api.saveAgent({
      name: newAgentName,
      division: newAgentDiv,
      division_label: newAgentDiv.toUpperCase(),
      description: newAgentDesc,
      system_prompt: newAgentPrompt,
      color: '#d9ff2f',
      emoji: '⚡'
    });

    setShowCreateModal(false);
    setNewAgentName('');
    setNewAgentDesc('');
    setNewAgentPrompt('');
    loadData();
  };

  // Calculate real total agents in the entire catalog
  const totalCatalogAgents = useMemo(() => {
    if (divisions.length > 0) {
      return divisions.reduce((sum, d) => sum + (d.agent_count || 0), 0) || 283;
    }
    return 283;
  }, [divisions]);

  // Pagination slice
  const effectivePageSize = pageSize === 0 ? (agents.length || 1) : pageSize;
  const totalPages = Math.ceil(agents.length / effectivePageSize) || 1;
  const paginatedAgents = useMemo(() => {
    if (pageSize === 0) return agents;
    const start = (page - 1) * effectivePageSize;
    return agents.slice(start, start + effectivePageSize);
  }, [agents, page, effectivePageSize, pageSize]);

  const activeDivisionObj = divisions.find(d => d.id === selectedDivision);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-white/8">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Catálogo de Especialistas WINC
            <Badge variant="lime" size="sm">283 Agentes Ativos</Badge>
          </h1>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            Todos os 283 agentes inteligentes integrados do Agency Agents e OpenJarvis em Português Brasileiro (pt-BR).
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setShowCreateModal(true)}
        >
          Criar Agente Personalizado
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#64748b] absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome em português (ex: Criador de Conteúdo) ou inglês (ex: PDF Engine Architect)..."
                className="w-full bg-[#06090e] border border-white/10 rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder-[#64748b] focus:border-[#d9ff2f]/50"
              />
              {search && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-2.5 text-[#64748b] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button type="submit" variant="secondary" size="md">
              Buscar
            </Button>
          </form>

          {/* View Mode & Page Size Selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#06090e] border border-white/10 rounded-lg p-1 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-[#101826] text-[#d9ff2f]' : 'text-[#64748b] hover:text-white'}`}
                title="Grade"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-[#101826] text-[#d9ff2f]' : 'text-[#64748b] hover:text-white'}`}
                title="Lista"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-[#06090e] border border-white/10 rounded-lg px-2 py-2 text-[11px] text-[#94a3b8] focus:border-[#d9ff2f]/50"
            >
              <option value={18}>18 por página</option>
              <option value={36}>36 por página</option>
              <option value={72}>72 por página</option>
              <option value={0}>Todos ({agents.length})</option>
            </select>
          </div>
        </div>

        {/* Division Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedDivision('all')}
            className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
              selectedDivision === 'all'
                ? 'bg-[#d9ff2f] text-black font-extrabold shadow-sm shadow-[#d9ff2f]/30'
                : 'bg-white/5 text-[#94a3b8] hover:bg-white/10'
            }`}
          >
            Todos ({totalCatalogAgents})
          </button>
          {divisions.map((div) => {
            const isSelected = selectedDivision === div.id;
            const ptLabel = div.label_pt || div.label;
            return (
              <button
                key={div.id}
                onClick={() => setSelectedDivision(div.id)}
                className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#3b82f6] text-white font-extrabold shadow-sm shadow-[#3b82f6]/30'
                    : 'bg-white/5 text-[#94a3b8] hover:bg-white/10'
                }`}
              >
                <span>{ptLabel}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-white/10 text-[#94a3b8]'}`}>
                  {div.agent_count || 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Filter Bar when division is filtered */}
        {selectedDivision !== 'all' && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#3b82f6]/10 border border-[#3b82f6]/30 text-xs">
            <span className="text-white flex items-center gap-2">
              <span className="text-[#3b82f6] font-bold">Filtro Ativo:</span>
              <span>{activeDivisionObj ? (activeDivisionObj.label_pt || activeDivisionObj.label) : selectedDivision} ({agents.length} especialistas disponíveis)</span>
            </span>
            <button
              onClick={() => setSelectedDivision('all')}
              className="text-[#94a3b8] hover:text-white flex items-center gap-1 text-[11px] underline"
            >
              <FilterX className="w-3.5 h-3.5" /> Mostrar todos os {totalCatalogAgents} agentes
            </button>
          </div>
        )}
      </Card>

      {/* Agents Count Status Bar */}
      <div className="flex items-center justify-between text-xs text-[#94a3b8] px-1">
        <span>
          Exibindo <strong className="text-white">{paginatedAgents.length}</strong> de <strong className="text-white">{agents.length}</strong> especialistas encontrados {selectedDivision !== 'all' ? `no departamento` : `no catálogo geral`}
        </span>
        {totalPages > 1 && (
          <span>
            Página <strong className="text-white">{page}</strong> de <strong className="text-white">{totalPages}</strong>
          </span>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="text-center py-12 text-xs text-[#94a3b8] flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-[#d9ff2f] border-t-transparent rounded-full animate-spin" />
          <span>Carregando especialistas do Agency Agents...</span>
        </div>
      )}

      {/* Agents Display */}
      {!loading && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedAgents.map((agent) => {
            const displayName = agent.name_pt || agent.name;
            const displayDesc = agent.description_pt || agent.description || agent.vibe || 'Especialista em fluxos operacionais da Agência WINC.';
            const displayDiv = agent.division_label_pt || agent.division_label;

            return (
              <Card
                key={agent.id}
                hoverable
                onClick={() => setSelectedAgent(agent)}
                className="cursor-pointer flex flex-col justify-between group border-white/8 hover:border-white/20 transition-all"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl shrink-0">
                        {agent.emoji || '🤖'}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-xs text-white leading-tight group-hover:text-[#d9ff2f] transition-colors truncate">
                          {displayName}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-[#3b82f6] font-semibold">
                            {displayDiv}
                          </span>
                          {agent.name_pt && agent.name !== agent.name_pt && (
                            <span className="text-[9px] text-[#64748b] truncate max-w-[120px] font-mono">
                              ({agent.name})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleToggle(e, agent.id)}
                      className={`p-1.5 rounded-lg text-[10px] transition-all shrink-0 ${
                        agent.is_active
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/25 hover:bg-red-500/20'
                      }`}
                      title={agent.is_active ? 'Ativo no sistema' : 'Inativo'}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-[11px] text-[#94a3b8] line-clamp-3 leading-relaxed">
                    {displayDesc}
                  </p>
                </div>

                <div className="mt-4 pt-2.5 border-t border-white/6 flex items-center justify-between text-[10px] text-[#64748b]">
                  <span className="truncate max-w-[150px] font-mono">{agent.id}</span>
                  <span className="text-[#d9ff2f] font-semibold flex items-center gap-1 group-hover:underline">
                    <Eye className="w-3 h-3" /> Ver Detalhes
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* List / Table View */}
      {!loading && viewMode === 'list' && (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#080c14] border-b border-white/8 text-[10px] font-mono text-[#64748b] uppercase">
                <tr>
                  <th className="py-3 px-4">Especialista</th>
                  <th className="py-3 px-4">Departamento</th>
                  <th className="py-3 px-4">Descrição em Português</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {paginatedAgents.map((agent) => (
                  <tr
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    className="hover:bg-white/3 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                      <span className="text-base">{agent.emoji || '🤖'}</span>
                      <div>
                        <div>{agent.name_pt || agent.name}</div>
                        {agent.name_pt && agent.name !== agent.name_pt && (
                          <div className="text-[10px] text-[#64748b] font-normal">{agent.name}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="purple" size="sm">{agent.division_label_pt || agent.division_label}</Badge>
                    </td>
                    <td className="py-3 px-4 text-[#94a3b8] max-w-sm truncate">
                      {agent.description_pt || agent.description || agent.vibe}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold ${agent.is_active ? 'text-emerald-400' : 'text-red-400'}`}>
                        {agent.is_active ? 'ATIVO' : 'INATIVO'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="sm" icon={<Eye className="w-3.5 h-3.5" />}>
                        Ver
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#94a3b8] pt-2 border-t border-white/8">
          <span>
            Mostrando página <strong className="text-white">{page}</strong> de <strong className="text-white">{totalPages}</strong> ({agents.length} agentes listados)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              icon={<ChevronLeft className="w-3.5 h-3.5" />}
            >
              Anterior
            </Button>

            {/* Quick page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && page > 3) {
                  pageNum = Math.min(totalPages - 4, page - 2) + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-7 h-7 rounded-md text-xs font-bold transition-colors ${
                      page === pageNum
                        ? 'bg-[#d9ff2f] text-black'
                        : 'bg-white/5 text-[#94a3b8] hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              icon={<ChevronRight className="w-3.5 h-3.5" />}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <Card className="max-w-2xl w-full max-h-[85vh] flex flex-col p-6 border border-white/10">
            <div className="flex items-center justify-between pb-3 border-b border-white/8">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedAgent.emoji || '🤖'}</span>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {selectedAgent.name_pt || selectedAgent.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="lime" size="sm">
                      {selectedAgent.division_label_pt || selectedAgent.division_label}
                    </Badge>
                    {selectedAgent.name_pt && selectedAgent.name !== selectedAgent.name_pt && (
                      <span className="text-[10px] text-[#64748b] font-mono">
                        Original: {selectedAgent.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedAgent(null)} className="text-[#94a3b8] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              <div>
                <label className="text-[10px] uppercase font-mono font-bold text-[#64748b]">Descrição & Especialidade:</label>
                <p className="text-xs text-white mt-0.5 leading-relaxed">
                  {selectedAgent.description_pt || selectedAgent.description}
                </p>
              </div>

              {selectedAgent.vibe && (
                <div>
                  <label className="text-[10px] uppercase font-mono font-bold text-[#64748b]">Vibe / Filosofia de Execução:</label>
                  <p className="text-xs text-[#d9ff2f] font-mono italic mt-0.5">"{selectedAgent.vibe}"</p>
                </div>
              )}

              <div>
                <label className="text-[10px] uppercase font-mono font-bold text-[#64748b]">Instruções do Sistema (System Prompt com Diretiva pt-BR):</label>
                <pre className="p-3.5 rounded-lg bg-[#06090e] border border-white/8 text-[11px] text-white/90 font-mono mt-1 whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed">
                  {selectedAgent.system_prompt}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t border-white/8 flex justify-between items-center">
              <span className="text-[10px] font-mono text-[#64748b]">{selectedAgent.id}</span>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setSelectedAgent(null)}>
                  Fechar
                </Button>
                {onStartChatWithAgent && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<MessageSquare className="w-3.5 h-3.5" />}
                    onClick={() => {
                      onStartChatWithAgent(selectedAgent.id);
                      setSelectedAgent(null);
                    }}
                  >
                    Conversar com este Especialista
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Create Custom Agent Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <Card className="max-w-lg w-full p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white">Criar Novo Especialista Personalizado</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-[#94a3b8] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAgent} className="space-y-4">
              <div>
                <label className="text-xs text-[#64748b] mb-1 block">Nome do Agente (em Português):</label>
                <input
                  type="text"
                  required
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  placeholder="Ex: Copywriter de Alta Conversão"
                  className="w-full bg-[#06090e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#d9ff2f]/50"
                />
              </div>

              <div>
                <label className="text-xs text-[#64748b] mb-1 block">Departamento:</label>
                <select
                  value={newAgentDiv}
                  onChange={(e) => setNewAgentDiv(e.target.value)}
                  className="w-full bg-[#06090e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#d9ff2f]/50"
                >
                  {divisions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label_pt || d.label} ({d.agent_count || 0})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-[#64748b] mb-1 block">Descrição da Especialidade:</label>
                <input
                  type="text"
                  value={newAgentDesc}
                  onChange={(e) => setNewAgentDesc(e.target.value)}
                  placeholder="Especialista em..."
                  className="w-full bg-[#06090e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#d9ff2f]/50"
                />
              </div>

              <div>
                <label className="text-xs text-[#64748b] mb-1 block">System Prompt (Diretivas de Atuação):</label>
                <textarea
                  rows={4}
                  required
                  value={newAgentPrompt}
                  onChange={(e) => setNewAgentPrompt(e.target.value)}
                  placeholder="Você é um especialista que executa..."
                  className="w-full bg-[#06090e] border border-white/10 rounded-lg p-3 text-xs text-white focus:border-[#d9ff2f]/50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Salvar Agente
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
