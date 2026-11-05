import React, { useState, useEffect } from 'react';
import { Project, Task } from '../types';
import { api } from '../api';
import { FolderKanban, Plus, X, Folder, Calendar, CheckCircle2, Clock } from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [kanbanData, setKanbanData] = useState<{ project: Project; columns: Record<string, Task[]> } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [category, setCategory] = useState('Desenvolvimento');
  const [description, setDescription] = useState('');

  const loadProjects = async () => {
    const data = await api.getProjects();
    setProjects(data);
    if (data.length > 0 && !selectedProjectId) {
      setSelectedProjectId(data[0].id);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      api.getProjectKanban(selectedProjectId).then(setKanbanData);
    }
  }, [selectedProjectId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await api.createProject({ name, client, category, description });
    setName('');
    setClient('');
    setDescription('');
    setShowCreateModal(false);
    loadProjects();
  };

  const columnLabels: Record<string, { label: string; color: string }> = {
    planning: { label: 'Planejamento', color: '#97a3b7' },
    pending: { label: 'Pendente', color: '#eab308' },
    execution: { label: 'Em Execução', color: '#1f77ff' },
    review: { label: 'Em Revisão', color: '#a855f7' },
    done: { label: 'Concluído', color: '#d9ff2f' },
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* Title & Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-white">Gerenciamento de Projetos</h1>
          <p className="text-xs text-[#97a3b7]">Kanban operacional com isolamento de diretórios em sandbox local.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#d9ff2f] hover:bg-[#cbf026] text-black font-bold text-xs tracking-wide transition-all shadow-[0_0_15px_rgba(217,255,47,0.2)]"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Projeto</span>
        </button>
      </div>

      {/* Project Selector Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedProjectId(p.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-2 ${
              selectedProjectId === p.id
                ? 'bg-gradient-to-r from-[#0a1524] to-[#07111c] text-white border-[#d9ff2f]/50 shadow-[0_0_15px_rgba(217,255,47,0.15)]'
                : 'bg-white/5 text-[#97a3b7] border-white/10 hover:text-white'
            }`}
          >
            <Folder className={`w-3.5 h-3.5 ${selectedProjectId === p.id ? 'text-[#d9ff2f]' : 'text-[#97a3b7]'}`} />
            <span>{p.name}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-white/60">
              {p.completed_tasks || 0}/{p.total_tasks || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Kanban Board */}
      {kanbanData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
            <div className="text-[#97a3b7]">
              Cliente: <strong className="text-white">{kanbanData.project.client}</strong> | Categoria: <strong className="text-white">{kanbanData.project.category}</strong>
            </div>
            <div className="text-[#97a3b7] font-mono text-[11px] truncate max-w-md">
              Diretório: {kanbanData.project.directory_path}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Object.entries(columnLabels).map(([colKey, colMeta]) => {
              const colTasks = kanbanData.columns[colKey] || [];
              return (
                <div key={colKey} className="winc-glass rounded-2xl p-4 border border-white/10 flex flex-col min-h-[450px]">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colMeta.color }} />
                      <h3 className="font-bold text-xs text-white">{colMeta.label}</h3>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 text-white">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto">
                    {colTasks.map((t) => (
                      <div
                        key={t.id}
                        className="p-3.5 rounded-xl bg-[#03060c] border border-white/10 hover:border-[#d9ff2f]/40 transition-all text-xs space-y-2"
                      >
                        <h4 className="font-bold text-white leading-tight">{t.title}</h4>
                        <p className="text-[11px] text-[#97a3b7] line-clamp-3 leading-relaxed">{t.description}</p>
                        
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-[#97a3b7]">
                          <span className="font-mono text-[#d9ff2f]">{t.agent_id.split('-').pop()}</span>
                          <span className="capitalize">{t.status}</span>
                        </div>
                      </div>
                    ))}
                    {colTasks.length === 0 && (
                      <div className="text-center py-8 text-[11px] text-[#97a3b7]/50 italic">
                        Nenhuma tarefa nesta etapa
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="winc-glass max-w-md w-full rounded-2xl p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white">Criar Novo Projeto</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-[#97a3b7] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs text-[#97a3b7] mb-1 block">Nome do Projeto:</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Redesign Portal Imobiliário"
                  className="w-full bg-[#03060c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d9ff2f]/50"
                />
              </div>

              <div>
                <label className="text-xs text-[#97a3b7] mb-1 block">Cliente:</label>
                <input
                  type="text"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="Ex: Construtora Horizon"
                  className="w-full bg-[#03060c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d9ff2f]/50"
                />
              </div>

              <div>
                <label className="text-xs text-[#97a3b7] mb-1 block">Categoria:</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#03060c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d9ff2f]/50"
                />
              </div>

              <div>
                <label className="text-xs text-[#97a3b7] mb-1 block">Descrição / Escopo:</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Objetivos principais..."
                  className="w-full bg-[#03060c] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#d9ff2f]/50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#d9ff2f] hover:bg-[#cbf026] text-black text-xs font-bold"
                >
                  Criar Projeto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
