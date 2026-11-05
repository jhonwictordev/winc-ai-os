import React, { useState, useEffect } from 'react';
import { Task, Agent } from '../types';
import { api } from '../api';
import { CheckSquare, Clock, Play, AlertCircle, CheckCircle2, Plus, X, RefreshCw } from 'lucide-react';

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Manual Task creation
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [agentId, setAgentId] = useState('');

  const loadTasks = async () => {
    try {
      setLoading(true);
      const [tList, aList] = await Promise.all([api.getTasks(), api.getAgents()]);
      setTasks(tList);
      setAgents(aList);
      if (aList.length > 0 && !agentId) {
        setAgentId(aList[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !agentId) return;

    await api.createTask({ title, description, agent_id: agentId });
    setTitle('');
    setDescription('');
    setShowCreateModal(false);
    loadTasks();
  };

  const runningTask = tasks.find(t => t.status === 'running');
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'error');

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-white">Fila de Tarefas Sequencial</h1>
          <p className="text-xs text-[#97a3b7]">
            Trava rígida de 1 agente por vez para proteção da memória física do Windows.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadTasks}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10"
            title="Atualizar tarefas"
          >
            <RefreshCw className="w-4 h-4 text-[#97a3b7]" />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#d9ff2f] hover:bg-[#cbf026] text-black font-bold text-xs tracking-wide transition-all shadow-[0_0_15px_rgba(217,255,47,0.2)]"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Tarefa</span>
          </button>
        </div>
      </div>

      {/* Currently Running Task Box */}
      {runningTask ? (
        <div className="winc-glass rounded-2xl p-5 border border-[#1f77ff]/40 bg-gradient-to-r from-[#07111c] to-[#0a1829] shadow-[0_0_25px_rgba(31,119,255,0.15)]">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-2 text-xs font-bold text-[#1f77ff] uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1f77ff] animate-ping" />
              Executando Agora (Single-Agent Lock)
            </span>
            <span className="text-[10px] font-mono text-[#97a3b7]">{runningTask.id}</span>
          </div>

          <h3 className="text-sm font-extrabold text-white">{runningTask.title}</h3>
          <p className="text-xs text-[#97a3b7] mt-1">{runningTask.description}</p>

          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#97a3b7]">
            <span className="font-mono text-[#d9ff2f]">Agente: {runningTask.agent_id}</span>
            <span className="text-[11px] text-[#97a3b7]">Prioridade: {runningTask.priority}</span>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs text-[#97a3b7]">
          <span>Nenhum agente em execução no momento. Fila em espera.</span>
          <span className="text-[11px] font-mono text-[#d9ff2f] font-bold">Fila Pronta</span>
        </div>
      )}

      {/* Pending Queue Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Fila de Espera FIFO ({pendingTasks.length})</span>
        </h3>

        <div className="space-y-2">
          {pendingTasks.map((task, idx) => (
            <div
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className="p-3.5 rounded-xl bg-[#03060c] border border-white/10 hover:border-[#d9ff2f]/30 transition-all flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-white/10 font-mono text-xs flex items-center justify-center text-white">
                  {idx + 1}
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white">{task.title}</h4>
                  <p className="text-[11px] text-[#97a3b7]">{task.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-[#d9ff2f]">{task.agent_id.split('-').pop()}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 font-bold border border-amber-400/20">
                  Pendente
                </span>
              </div>
            </div>
          ))}
          {pendingTasks.length === 0 && (
            <div className="p-4 rounded-xl bg-white/5 border border-dashed border-white/10 text-center text-xs text-[#97a3b7]">
              Fila vazia.
            </div>
          )}
        </div>
      </div>

      {/* Completed & Execution Logs Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#d9ff2f]" />
          <span>Tarefas Finalizadas ({completedTasks.length})</span>
        </h3>

        <div className="space-y-2">
          {completedTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className="p-3.5 rounded-xl bg-[#03060c] border border-white/10 hover:border-[#d9ff2f]/30 transition-all flex items-center justify-between cursor-pointer"
            >
              <div>
                <h4 className="text-xs font-bold text-white">{task.title}</h4>
                <p className="text-[11px] text-[#97a3b7] truncate max-w-xl">{task.result || task.description}</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-[#97a3b7]">
                  {task.completed_at ? new Date(task.completed_at * 1000).toLocaleTimeString() : ''}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                    task.status === 'completed'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-red-500/10 text-red-400 border-red-500/30'
                  }`}
                >
                  {task.status === 'completed' ? 'Sucesso' : 'Erro'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Inspection Drawer / Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="winc-glass max-w-2xl w-full rounded-2xl p-6 border border-white/10 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#d9ff2f] font-bold">DETALHES DA TAREFA</span>
                <h3 className="text-sm font-extrabold text-white mt-0.5">{selectedTask.title}</h3>
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-[#97a3b7] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-[#97a3b7]">Agente Responsável:</label>
                <p className="text-xs font-mono text-[#d9ff2f] mt-0.5">{selectedTask.agent_id}</p>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-[#97a3b7]">Descrição:</label>
                <p className="text-xs text-white mt-0.5">{selectedTask.description}</p>
              </div>

              {selectedTask.logs && (
                <div>
                  <label className="text-[10px] uppercase font-bold text-[#97a3b7]">Logs de Execução:</label>
                  <pre className="p-3 rounded-xl bg-black/60 border border-white/10 text-[10px] text-white/80 font-mono mt-1">
                    {selectedTask.logs}
                  </pre>
                </div>
              )}

              {selectedTask.result && (
                <div>
                  <label className="text-[10px] uppercase font-bold text-[#97a3b7]">Resultado Gerado pelo Agente:</label>
                  <pre className="p-4 rounded-xl bg-black/60 border border-white/10 text-xs text-white font-mono mt-1 whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
                    {selectedTask.result}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Manual Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="winc-glass max-w-lg w-full rounded-2xl p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white">Adicionar Tarefa à Fila</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-[#97a3b7] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-xs text-[#97a3b7] mb-1 block">Título da Tarefa:</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Auditoria de Segurança da API"
                  className="w-full bg-[#03060c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d9ff2f]/50"
                />
              </div>

              <div>
                <label className="text-xs text-[#97a3b7] mb-1 block">Agente Especialista:</label>
                <select
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  className="w-full bg-[#03060c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d9ff2f]/50"
                >
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.division_label})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-[#97a3b7] mb-1 block">Instruções / Descrição:</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="O que o agente deve produzir..."
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
                  Enfileirar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
