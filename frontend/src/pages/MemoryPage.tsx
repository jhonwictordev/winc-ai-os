import React, { useState, useEffect } from 'react';
import { Memory } from '../types';
import { api } from '../api';
import { Brain, Search, Plus, Trash2, X, CheckCircle2 } from 'lucide-react';

export const MemoryPage: React.FC = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState('all');
  const [loading, setLoading] = useState(true);

  // Add memory modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newEntityType, setNewEntityType] = useState('global');
  const [newCategory, setNewCategory] = useState('general');

  const loadMemories = async () => {
    try {
      setLoading(true);
      const data = await api.getMemories(entityType === 'all' ? undefined : entityType);
      setMemories(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemories();
  }, [entityType]);

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    await api.addMemory({
      content: newContent,
      entity_type: newEntityType,
      category: newCategory
    });

    setNewContent('');
    setShowAddModal(false);
    loadMemories();
  };

  const handleClear = async () => {
    if (confirm('Tem certeza que deseja limpar as memórias selecionadas?')) {
      await api.clearMemory(entityType === 'all' ? undefined : entityType);
      loadMemories();
    }
  };

  const filteredMemories = memories.filter(m =>
    m.content.toLowerCase().includes(search.toLowerCase()) ||
    m.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto overflow-y-auto">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-white">Memória Persistente de Contexto</h1>
          <p className="text-xs text-[#97a3b7]">
            Base de conhecimento e histórico compartilhado para recuperação contextual entre execuções.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpar Memórias</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#d9ff2f] hover:bg-[#cbf026] text-black font-bold text-xs tracking-wide transition-all shadow-[0_0_15px_rgba(217,255,47,0.2)]"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Memória</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="winc-glass rounded-2xl p-4 border border-white/10 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#97a3b7] absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por palavras-chave na memória..."
            className="w-full bg-[#03060c] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#d9ff2f]/50"
          />
        </div>

        <select
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          className="bg-[#03060c] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[#d9ff2f]/50"
        >
          <option value="all">Todas as Entidades</option>
          <option value="global">Global</option>
          <option value="project">Projeto</option>
          <option value="agent">Agente</option>
        </select>
      </div>

      {/* Memories List */}
      <div className="space-y-3">
        {filteredMemories.map((m) => (
          <div key={m.id} className="winc-glass rounded-2xl p-5 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-[#97a3b7]">
              <div className="flex items-center gap-2">
                <Brain className="w-3.5 h-3.5 text-[#1f77ff]" />
                <span className="font-bold text-white uppercase text-[10px] tracking-wider">{m.entity_type}</span>
                <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-[#d9ff2f]">{m.category}</span>
              </div>
              <span className="font-mono text-[10px]">{new Date(m.created_at * 1000).toLocaleString()}</span>
            </div>

            <p className="text-xs text-white leading-relaxed">{m.content}</p>
          </div>
        ))}
        {filteredMemories.length === 0 && (
          <div className="p-8 text-center text-xs text-[#97a3b7] winc-glass rounded-2xl border border-white/10">
            Nenhuma memória registrada para os critérios selecionados.
          </div>
        )}
      </div>

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="winc-glass max-w-lg w-full rounded-2xl p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white">Adicionar Novo Contexto à Memória</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#97a3b7] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMemory} className="space-y-4">
              <div>
                <label className="text-xs text-[#97a3b7] mb-1 block">Tipo de Entidade:</label>
                <select
                  value={newEntityType}
                  onChange={(e) => setNewEntityType(e.target.value)}
                  className="w-full bg-[#03060c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d9ff2f]/50"
                >
                  <option value="global">Global (Toda a agência)</option>
                  <option value="project">Projeto Específico</option>
                  <option value="agent">Agente Específico</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-[#97a3b7] mb-1 block">Categoria:</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Ex: branding, diretriz, regra_negocio"
                  className="w-full bg-[#03060c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d9ff2f]/50"
                />
              </div>

              <div>
                <label className="text-xs text-[#97a3b7] mb-1 block">Conteúdo / Fato Persistente:</label>
                <textarea
                  rows={4}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Ex: Os sites da clínica devem sempre usar paleta clean, com destaques em dourado e verde suave..."
                  className="w-full bg-[#03060c] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#d9ff2f]/50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#d9ff2f] hover:bg-[#cbf026] text-black text-xs font-bold"
                >
                  Salvar Memória
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
