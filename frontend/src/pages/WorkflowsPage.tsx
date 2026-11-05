import React, { useState, useEffect } from 'react';
import { Workflow } from '../types';
import { api } from '../api';
import { GitMerge, Play, CheckCircle2, ArrowRight, Plus, Sparkles, Layers } from 'lucide-react';

export const WorkflowsPage: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWf, setSelectedWf] = useState<Workflow | null>(null);
  const [running, setRunning] = useState(false);
  const [runMessage, setRunMessage] = useState<string | null>(null);

  const sampleDefaultWorkflow: Workflow = {
    id: 'wf-default-pipeline',
    title: 'Pipeline Padrão de Produção — WINC Agency',
    description: 'Fluxo sequencial automatizado de planejamento, criação de identidade, código e entrega.',
    status: 'idle',
    nodes: [
      { id: '1', label: 'Briefing do Cliente', type: 'input', role: 'Entrada de dados e escopo' },
      { id: '2', label: 'Brand Designer', type: 'agent', agent_id: 'design-design-brand-designer', role: 'Direção de Arte e Paleta' },
      { id: '3', label: 'Frontend Architect', type: 'agent', agent_id: 'engineering-engineering-frontend-developer', role: 'Interfaces e Componentes' },
      { id: '4', label: 'Backend Architect', type: 'agent', agent_id: 'engineering-engineering-backend-architect', role: 'APIs e Banco de Dados' },
      { id: '5', label: 'Quality & Delivery', type: 'qa', role: 'Checklist de Entrega WINC' }
    ],
    edges: [
      { from: '1', to: '2' },
      { from: '2', to: '3' },
      { from: '3', to: '4' },
      { from: '4', to: '5' }
    ]
  };

  useEffect(() => {
    api.getWorkflows().then(list => {
      if (list.length === 0) {
        setWorkflows([sampleDefaultWorkflow]);
        setSelectedWf(sampleDefaultWorkflow);
      } else {
        setWorkflows(list);
        setSelectedWf(list[0]);
      }
    });
  }, []);

  const handleRun = async () => {
    if (!selectedWf) return;
    try {
      setRunning(true);
      setRunMessage(null);
      const res = await api.runWorkflow(selectedWf.id);
      setRunMessage(`Workflow iniciado com sucesso! ${res.tasks.length} etapas enfileiradas sequencialmente.`);
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-white">Workflows & Automações Multiagente</h1>
          <p className="text-xs text-[#97a3b7]">
            Pipelines com nós encadeados e execução sequencial controlada para baixo consumo de memória.
          </p>
        </div>
      </div>

      {selectedWf && (
        <div className="space-y-6">
          {/* Header of selected workflow */}
          <div className="winc-glass rounded-2xl p-6 border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <GitMerge className="w-4 h-4 text-[#d9ff2f]" />
                <h2 className="text-base font-extrabold text-white">{selectedWf.title}</h2>
              </div>
              <p className="text-xs text-[#97a3b7]">{selectedWf.description}</p>
            </div>

            <button
              onClick={handleRun}
              disabled={running}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1f77ff] hover:bg-[#1866db] text-white font-bold text-xs tracking-wider transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(31,119,255,0.3)]"
            >
              <Play className="w-4 h-4" />
              <span>{running ? 'Enfileirando...' : 'Executar Workflow'}</span>
            </button>
          </div>

          {/* Success Message */}
          {runMessage && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-xs text-white">{runMessage}</span>
            </div>
          )}

          {/* Visual DAG Node Flow */}
          <div className="winc-glass rounded-2xl p-8 border border-white/10 overflow-x-auto">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-6">
              Diagrama do Fluxo Operacional (DAG)
            </h3>

            <div className="flex items-center gap-4 min-w-[750px]">
              {selectedWf.nodes.map((node, index) => (
                <React.Fragment key={node.id}>
                  <div className="p-4 rounded-xl bg-[#03060c] border border-white/10 hover:border-[#d9ff2f]/50 transition-all w-52 flex flex-col justify-between shrink-0 shadow-lg">
                    <div>
                      <div className="flex justify-between items-center text-[10px] uppercase font-mono font-bold text-[#97a3b7] mb-2">
                        <span>NÓ {index + 1}</span>
                        <span className="px-1.5 py-0.5 rounded bg-white/5 text-[#d9ff2f]">{node.type}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white leading-tight">{node.label}</h4>
                      <p className="text-[11px] text-[#97a3b7] mt-1">{node.role}</p>
                    </div>

                    {node.agent_id && (
                      <div className="mt-3 pt-2 border-t border-white/5 text-[10px] font-mono text-[#1f77ff] truncate">
                        {node.agent_id}
                      </div>
                    )}
                  </div>

                  {index < selectedWf.nodes.length - 1 && (
                    <div className="text-[#97a3b7] shrink-0">
                      <ArrowRight className="w-5 h-5 text-[#d9ff2f]/70" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
