import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Cpu, AlertTriangle, CheckCircle2, Play, Trash2, ShieldCheck, Zap } from 'lucide-react';

export const ModelsPage: React.FC = () => {
  const [modelStatus, setModelStatus] = useState<any | null>(null);
  const [provider, setProvider] = useState('auto');
  const [model, setModel] = useState('qwen2.5:0.5b');
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [unloadMsg, setUnloadMsg] = useState<string | null>(null);

  const loadStatus = async () => {
    const data = await api.getModelsStatus();
    setModelStatus(data);
    setProvider(data.active_provider);
    setModel(data.active_model);
    if (data.api_base_url) setApiBaseUrl(data.api_base_url);
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.configureModel({
        provider,
        model,
        api_base_url: apiBaseUrl || undefined,
        api_key: apiKey || undefined
      });
      alert('Configuração de inferência atualizada com sucesso!');
      loadStatus();
    } finally {
      setSaving(false);
    }
  };

  const handleTestInference = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      const res = await api.testInference('Responda confirmando que a inferência do WINC AI OS está operacional.');
      setTestResult(res);
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleUnload = async () => {
    await api.unloadModel();
    setUnloadMsg('Pesos do modelo purgados e memória RAM liberada!');
    setTimeout(() => setUnloadMsg(null), 3000);
  };

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto overflow-y-auto">
      {/* Title */}
      <div>
        <h1 className="text-xl font-extrabold text-white">Gerenciador de Modelos de IA & Inferência</h1>
        <p className="text-xs text-[#97a3b7]">
          Controle de modelos quantizados locais e provedores de API compatíveis para ambientes de 4 GB de RAM.
        </p>
      </div>

      {/* Hardware Safety Warning Card */}
      <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-4">
        <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
            Arquitetura Host: 4 GB RAM Física Detectada
          </h3>
          <p className="text-xs text-[#97a3b7] leading-relaxed">
            Para evitar travamento do Windows e saturação de memória swap, o sistema prioriza modelos ultraleves quantizados de <strong>0.5B a 1.1B</strong> parâmetros (ex: Qwen 2.5 0.5B, SmolLM2 360M) ou conexão com APIs externas para raciocínios complexos sem consumir RAM local.
          </p>
        </div>
      </div>

      {/* Recommended Models Grid */}
      <div className="winc-glass rounded-2xl p-6 border border-white/10 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#d9ff2f]" />
          <span>Modelos Recomendados para 4 GB de RAM</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#03060c] border border-[#d9ff2f]/50 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-xs text-white">Google Gemini API</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#d9ff2f] text-black font-extrabold">0 MB RAM</span>
            </div>
            <p className="text-[11px] text-[#97a3b8]">Antigravity AI Provider. Alta velocidade, raciocínio avançado e zero alocação de RAM.</p>
            <button
              onClick={() => { setProvider('gemini'); setModel('gemini-2.0-flash'); }}
              className="w-full py-1.5 rounded-lg bg-[#d9ff2f]/20 hover:bg-[#d9ff2f]/30 text-[#d9ff2f] text-xs font-bold"
            >
              Ativar Gemini 2.0 Flash
            </button>
          </div>

          <div className="p-4 rounded-xl bg-[#03060c] border border-white/10 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-xs text-white">Qwen 2.5</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#3b82f6] text-white font-bold">0.5B</span>
            </div>
            <p className="text-[11px] text-[#97a3b8]">Consumo RAM: ~600 MB. Rápido, leve e excelente para tarefas locais de agência.</p>
            <button
              onClick={() => { setModel('qwen2.5:0.5b'); setProvider('auto'); }}
              className="w-full py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold"
            >
              Selecionar Local
            </button>
          </div>

          <div className="p-4 rounded-xl bg-[#03060c] border border-white/10 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-xs text-white">SmolLM2</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#1f77ff] text-white font-bold">360M</span>
            </div>
            <p className="text-[11px] text-[#97a3b8]">Consumo RAM: ~450 MB. Ultracompacto, inferência quase instantânea na CPU.</p>
            <button
              onClick={() => { setModel('smollm2:360m'); setProvider('auto'); }}
              className="w-full py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold"
            >
              Selecionar Local
            </button>
          </div>

          <div className="p-4 rounded-xl bg-[#03060c] border border-white/10 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-xs text-white">OpenRouter</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">0 MB RAM</span>
            </div>
            <p className="text-[11px] text-[#97a3b8]">Multi-modelos remotos (Claude, GPT, Llama). Zero impacto na memória host.</p>
            <button
              onClick={() => { setProvider('openrouter'); setModel('google/gemini-2.0-flash-001'); }}
              className="w-full py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold"
            >
              Configurar OpenRouter
            </button>
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="winc-glass rounded-2xl p-6 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Configuração do Provedor Ativo</h3>
          <button
            onClick={handleUnload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Descarregar Modelo da RAM</span>
          </button>
        </div>

        {unloadMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{unloadMsg}</span>
          </div>
        )}

        <form onSubmit={handleSaveConfig} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#97a3b7] mb-1 block">Modo do Provedor:</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full bg-[#03060c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d9ff2f]/50"
              >
                <option value="auto">Automático / Local (Ollama + Motor Nativo WINC)</option>
                <option value="ollama">Ollama Local Obrigatório</option>
                <option value="openai_compatible">API Externa (OpenAI, Groq, OpenRouter)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-[#97a3b7] mb-1 block">Identificador do Modelo:</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Ex: qwen2.5:0.5b ou gpt-4o-mini"
                className="w-full bg-[#03060c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d9ff2f]/50"
              />
            </div>
          </div>

          {provider === 'openai_compatible' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs text-[#97a3b7] mb-1 block">Endpoint Base URL:</label>
                <input
                  type="text"
                  value={apiBaseUrl}
                  onChange={(e) => setApiBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1 ou http://localhost:1234/v1"
                  className="w-full bg-[#03060c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d9ff2f]/50"
                />
              </div>

              <div>
                <label className="text-xs text-[#97a3b7] mb-1 block">Chave de API (API Key):</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-[#03060c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d9ff2f]/50"
                />
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={handleTestInference}
              disabled={testing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 text-[#d9ff2f]" />
              <span>{testing ? 'Testando...' : 'Testar Inferência Real'}</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 rounded-xl bg-[#d9ff2f] hover:bg-[#cbf026] text-black font-extrabold text-xs transition-all disabled:opacity-50"
            >
              Salvar Alterações
            </button>
          </div>
        </form>

        {testResult && (
          <div className="p-4 rounded-xl bg-[#03060c] border border-white/10 space-y-2">
            <div className="flex justify-between items-center text-[11px] text-[#97a3b7]">
              <span>Tempo de Resposta: <strong className="text-[#d9ff2f] font-mono">{testResult.latency_ms} ms</strong></span>
              <span className="font-mono">Provedor: {testResult.provider} ({testResult.model})</span>
            </div>
            <pre className="text-xs text-white whitespace-pre-wrap font-mono p-3 rounded-lg bg-black/60 border border-white/5">
              {testResult.response}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
