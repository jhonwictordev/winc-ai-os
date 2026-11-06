import React, { useState, useEffect } from 'react';
import { api } from '../api';
import {
  Settings,
  Save,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Cpu,
  Key,
  Globe,
  Activity,
  AlertTriangle,
  Eye,
  EyeOff,
  Volume2,
  Mic,
  Play
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ptBR } from '../i18n/ptBR';

export const SettingsPage: React.FC = () => {
  // Provider settings
  const [provider, setProvider] = useState<string>('gemini');
  const [model, setModel] = useState<string>('gemini-2.0-flash');
  const [geminiKey, setGeminiKey] = useState<string>('');
  const [openrouterKey, setOpenrouterKey] = useState<string>('');
  const [openaiKey, setOpenaiKey] = useState<string>('');
  const [openaiBaseUrl, setOpenaiBaseUrl] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);

  // Hardware Low RAM settings
  const [lowRam, setLowRam] = useState(true);
  const [maxTokens, setMaxTokens] = useState('1536');
  const [ollamaUrl, setOllamaUrl] = useState('http://127.0.0.1:11434');
  const [singleLock, setSingleLock] = useState(true);

  // Status feedback
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Virtual Assistant Settings
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState('pt-BR-AntonioNeural');
  const [speechRate, setSpeechRate] = useState('+0%');
  const [voiceVolume, setVoiceVolume] = useState('100');
  const [shortcutEnabled, setShortcutEnabled] = useState(true);
  const [shortcutKey, setShortcutKey] = useState('KeyF');
  const [realtimeTranscribe, setRealtimeTranscribe] = useState(true);
  const [visualIndicator, setVisualIndicator] = useState(true);
  const [playingSample, setPlayingSample] = useState(false);
  const [sampleError, setSampleError] = useState<string | null>(null);

  const handlePlaySample = async () => {
    setPlayingSample(true);
    setSampleError(null);
    try {
      const res = await api.getTtsSample();
      if (res.audio_url) {
        const audio = new Audio(res.audio_url);
        audio.onended = () => setPlayingSample(false);
        audio.onerror = () => {
          setSampleError('Erro ao reproduzir áudio');
          setPlayingSample(false);
        };
        await audio.play();
      } else {
        setPlayingSample(false);
      }
    } catch (e: any) {
      setSampleError(e.message || 'Erro ao carregar amostra');
      setPlayingSample(false);
    }
  };

  useEffect(() => {
    api.getSettings().then(settings => {
      if (settings.ai_provider) setProvider(settings.ai_provider);
      if (settings.ai_model) setModel(settings.ai_model);
      if (settings.gemini_api_key_masked) setGeminiKey(settings.gemini_api_key_masked);
      if (settings.openrouter_api_key_masked) setOpenrouterKey(settings.openrouter_api_key_masked);
      if (settings.openai_api_key_masked) setOpenaiKey(settings.openai_api_key_masked);
      if (settings.openai_base_url) setOpenaiBaseUrl(settings.openai_base_url);
      if (settings.max_tokens) setMaxTokens(settings.max_tokens);
      if (settings.ollama_url) setOllamaUrl(settings.ollama_url);
      if (settings.low_ram_mode) setLowRam(settings.low_ram_mode === 'true');
      if (settings.single_agent_lock) setSingleLock(settings.single_agent_lock === 'true');
      if (settings.voice_shortcut_enabled) setShortcutEnabled(settings.voice_shortcut_enabled === 'true');
      if (settings.voice_shortcut_key) setShortcutKey(settings.voice_shortcut_key);
      if (settings.voice_realtime_transcribe) setRealtimeTranscribe(settings.voice_realtime_transcribe === 'true');
      if (settings.voice_visual_indicator) setVisualIndicator(settings.voice_visual_indicator === 'true');
      if (settings.voice_volume) setVoiceVolume(settings.voice_volume);
    });

    try {
      const stored = localStorage.getItem('winc_shortcut_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed.enabled === 'boolean') setShortcutEnabled(parsed.enabled);
        if (parsed.triggerKey) setShortcutKey(parsed.triggerKey);
        if (typeof parsed.realtimeTranscribe === 'boolean') setRealtimeTranscribe(parsed.realtimeTranscribe);
        if (typeof parsed.visualIndicator === 'boolean') setVisualIndicator(parsed.visualIndicator);
        if (parsed.voiceVolume) setVoiceVolume(parsed.voiceVolume);
      }
    } catch (e) {}
  }, []);

  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider);
    if (newProvider === 'gemini') {
      setModel('gemini-2.0-flash');
    } else if (newProvider === 'openrouter') {
      setModel('google/gemini-2.0-flash-001');
    } else if (newProvider === 'ollama') {
      setModel('qwen2.5:0.5b');
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      let activeKey = '';
      if (provider === 'gemini') activeKey = geminiKey;
      else if (provider === 'openrouter') activeKey = openrouterKey;
      else if (provider === 'openai_compatible') activeKey = openaiKey;

      const res = await api.testAiConnection({
        provider,
        model,
        api_key: activeKey.includes('...') ? undefined : activeKey,
        base_url: provider === 'ollama' ? ollamaUrl : openaiBaseUrl
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ status: 'error', error: err.message || 'Falha ao conectar com o provedor' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, string> = {
      ai_provider: provider,
      ai_model: model,
      max_tokens: maxTokens,
      ollama_url: ollamaUrl,
      low_ram_mode: lowRam ? 'true' : 'false',
      single_agent_lock: singleLock ? 'true' : 'false',
      voice_shortcut_enabled: shortcutEnabled ? 'true' : 'false',
      voice_shortcut_key: shortcutKey,
      voice_realtime_transcribe: realtimeTranscribe ? 'true' : 'false',
      voice_visual_indicator: visualIndicator ? 'true' : 'false',
      voice_volume: voiceVolume
    };

    // Save to localStorage for instant shortcut access
    try {
      localStorage.setItem('winc_shortcut_settings', JSON.stringify({
        enabled: shortcutEnabled,
        triggerKey: shortcutKey,
        realtimeTranscribe,
        visualIndicator,
        voiceVolume
      }));
    } catch (e) {}

    if (geminiKey && !geminiKey.includes('...')) payload.gemini_api_key = geminiKey;
    if (openrouterKey && !openrouterKey.includes('...')) payload.openrouter_api_key = openrouterKey;
    if (openaiKey && !openaiKey.includes('...')) payload.openai_api_key = openaiKey;
    if (openaiBaseUrl) payload.openai_base_url = openaiBaseUrl;

    await api.updateSettings(payload);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl mx-auto overflow-y-auto">
      {/* Header */}
      <div className="pb-2 border-b border-white/8">
        <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#d9ff2f]" /> Configurações do WINC AI OS
        </h1>
        <p className="text-xs text-[#94a3b8] mt-0.5">
          Provedores de Inteligência Artificial, limites de memória RAM, chaves de API e proteções de hardware.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: AI Provider & Antigravity AI Engine */}
        <Card className="space-y-5 border-white/10">
          <div className="flex items-center justify-between pb-3 border-b border-white/8">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#d9ff2f]" />
              <h2 className="text-sm font-extrabold text-white">Provedor de Inteligência Artificial</h2>
            </div>
            <Badge variant="lime" size="sm">Zero Consumo de RAM Local em Modo Remoto</Badge>
          </div>

          <p className="text-xs text-[#94a3b8] leading-relaxed">
            Selecione o provedor de IA utilizado pelo WINC Master AI e pelos 283 especialistas. O uso da 
            <strong className="text-white"> Google Gemini API</strong> executa os modelos na nuvem oficial do Google, garantindo 
            desempenho máximo com <strong className="text-[#d9ff2f]">0 MB de consumo de memória RAM</strong> no seu computador.
          </p>

          {/* Provider Selection Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: 'gemini', name: 'Google Gemini API', desc: 'Antigravity AI (Recomendado)', tag: 'Zero RAM' },
              { id: 'openrouter', name: 'OpenRouter', desc: 'Multi-modelos em nuvem', tag: 'Zero RAM' },
              { id: 'ollama', name: 'Ollama Local', desc: '0.5B a 1.1B quantizados', tag: 'Offline' },
              { id: 'openai_compatible', name: 'OpenAI Compatível', desc: 'Servidor personalizado', tag: 'Custom' }
            ].map((p) => {
              const active = provider === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => handleProviderChange(p.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    active
                      ? 'bg-[#d9ff2f]/10 border-[#d9ff2f] text-white shadow-sm shadow-[#d9ff2f]/10'
                      : 'bg-white/4 border-white/8 text-[#94a3b8] hover:bg-white/7'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                        active ? 'bg-[#d9ff2f] text-black' : 'bg-white/10 text-white/70'
                      }`}>
                        {p.tag}
                      </span>
                    </div>
                    <h3 className={`text-xs font-bold leading-tight ${active ? 'text-white' : 'text-[#94a3b8]'}`}>
                      {p.name}
                    </h3>
                  </div>
                  <p className="text-[10px] text-[#64748b] mt-1.5">{p.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Dynamic Configuration based on selected provider */}
          {provider === 'gemini' && (
            <div className="space-y-4 pt-3 border-t border-white/8">
              <div>
                <label className="text-xs font-semibold text-white mb-1 flex items-center justify-between">
                  <span>Chave de API do Google Gemini (Antigravity AI):</span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#3b82f6] hover:underline"
                  >
                    Obter chave gratuita no Google AI Studio →
                  </a>
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-[#06090e] border border-white/10 rounded-lg pl-3 pr-10 py-2.5 text-xs text-white placeholder-[#64748b] focus:border-[#d9ff2f]/50 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-2.5 text-[#64748b] hover:text-white"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-white mb-1 block">Modelo Gemini:</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-[#06090e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#d9ff2f]/50"
                >
                  <option value="gemini-2.0-flash">gemini-2.0-flash (Recomendado — Ultrarrápido & Multimodal)</option>
                  <option value="gemini-1.5-flash">gemini-1.5-flash (Alta estabilidade e baixo consumo)</option>
                  <option value="gemini-1.5-pro">gemini-1.5-pro (Raciocínio analítico avançado e contexto longo)</option>
                </select>
              </div>
            </div>
          )}

          {provider === 'openrouter' && (
            <div className="space-y-4 pt-3 border-t border-white/8">
              <div>
                <label className="text-xs font-semibold text-white mb-1 flex items-center justify-between">
                  <span>Chave de API OpenRouter:</span>
                  <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-[11px] text-[#3b82f6] hover:underline">
                    Gerenciar chaves OpenRouter →
                  </a>
                </label>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={openrouterKey}
                  onChange={(e) => setOpenrouterKey(e.target.value)}
                  placeholder="sk-or-v1-..."
                  className="w-full bg-[#06090e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-[#64748b] focus:border-[#d9ff2f]/50 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white mb-1 block">Identificador do Modelo:</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="google/gemini-2.0-flash-001"
                  className="w-full bg-[#06090e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#d9ff2f]/50 font-mono"
                />
              </div>
            </div>
          )}

          {provider === 'ollama' && (
            <div className="space-y-4 pt-3 border-t border-white/8">
              <div>
                <label className="text-xs font-semibold text-white mb-1 block">URL do Serviço Ollama Local:</label>
                <input
                  type="text"
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  className="w-full bg-[#06090e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#d9ff2f]/50 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white mb-1 block">Modelo Quantizado Local (Compatível com 4 GB RAM):</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-[#06090e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#d9ff2f]/50"
                >
                  <option value="qwen2.5:0.5b">qwen2.5:0.5b (~600 MB RAM — Recomendado)</option>
                  <option value="smollm2:360m">smollm2:360m (~450 MB RAM — Ultraleve)</option>
                  <option value="tinyllama:1.1b">tinyllama:1.1b (~900 MB RAM)</option>
                </select>
              </div>
            </div>
          )}

          {provider === 'openai_compatible' && (
            <div className="space-y-4 pt-3 border-t border-white/8">
              <div>
                <label className="text-xs font-semibold text-white mb-1 block">Base URL do Endpoint:</label>
                <input
                  type="text"
                  value={openaiBaseUrl}
                  onChange={(e) => setOpenaiBaseUrl(e.target.value)}
                  placeholder="https://api.exemplo.com/v1"
                  className="w-full bg-[#06090e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#d9ff2f]/50 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white mb-1 block">Chave de Autenticação (Bearer):</label>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-[#06090e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-[#64748b] focus:border-[#d9ff2f]/50 font-mono"
                />
              </div>
            </div>
          )}

          {/* Test Connection Button & Result */}
          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={testing}
              onClick={handleTestConnection}
              icon={<Activity className="w-3.5 h-3.5 text-[#d9ff2f]" />}
            >
              Testar Conexão com a IA
            </Button>

            {testResult && (
              <div className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-2 ${
                testResult.status === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {testResult.status === 'success' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Conexão OK: <strong>{testResult.latency_ms}ms</strong> de latência ({testResult.provider})</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                    <span className="truncate max-w-sm">{testResult.error}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Section 2: Low RAM Safeguards */}
        <Card className="space-y-4 border-white/10">
          <div className="flex items-center gap-2 pb-3 border-b border-white/8">
            <Cpu className="w-4 h-4 text-[#3b82f6]" />
            <h2 className="text-sm font-extrabold text-white">Salvaguardas de Memória (Ambiente 4 GB RAM)</h2>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-white/4 border border-white/8">
            <div>
              <h3 className="text-xs font-bold text-white">Modo LOW RAM Ativo</h3>
              <p className="text-[11px] text-[#94a3b8] mt-0.5">
                Força a política de descarregamento imediato de pesos após cada resposta e previne travamento do sistema operacional.
              </p>
            </div>
            <input
              type="checkbox"
              checked={lowRam}
              onChange={(e) => setLowRam(e.target.checked)}
              className="w-4 h-4 accent-[#d9ff2f]"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-white/4 border border-white/8">
            <div>
              <h3 className="text-xs font-bold text-white">Trava de Execução Exclusiva (1 Agente por Vez)</h3>
              <p className="text-[11px] text-[#94a3b8] mt-0.5">
                Executa tarefas em fila sequencial FIFO estrita, impedindo que múltiplos agentes saturem a CPU e memória física.
              </p>
            </div>
            <input
              type="checkbox"
              checked={singleLock}
              onChange={(e) => setSingleLock(e.target.checked)}
              className="w-4 h-4 accent-[#d9ff2f]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-white mb-1 block">Janela de Contexto de Tokens:</label>
            <select
              value={maxTokens}
              onChange={(e) => setMaxTokens(e.target.value)}
              className="w-full bg-[#06090e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#d9ff2f]/50"
            >
              <option value="1024">1.024 tokens (Menor consumo de memória e resposta mais rápida)</option>
              <option value="1536">1.536 tokens (Padrão recomendado para equilíbrio de qualidade)</option>
              <option value="2048">2.048 tokens (Contexto moderado)</option>
            </select>
          </div>
        </Card>

        {/* Section 3: WINC Master AI Virtual Assistant */}
        <Card className="space-y-4 border-white/10">
          <div className="flex items-center justify-between pb-3 border-b border-white/8">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#8a2be2]" />
              <h2 className="text-sm font-extrabold text-white">Assistente Virtual Inteligente — WINC Master AI</h2>
            </div>
            <Badge variant="purple" size="sm">Oficial WINC OS</Badge>
          </div>

          <div className="flex items-start gap-4 p-3 rounded-xl bg-white/4 border border-white/8">
            <img
              src="/brand/winc_master_avatar.png"
              alt="WINC Master AI"
              className="w-16 h-24 object-contain filter drop-shadow-[0_0_12px_rgba(138,43,226,0.3)] shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                Personagem Oficial & Motor Audiovisual
                <Badge variant="lime" size="sm">HyperFrames Core</Badge>
              </h3>
              <p className="text-[11px] text-[#94a3b8] mt-1 leading-relaxed">
                Assistente oficial com modelo de animação reativa inspirado em HyperFrames, visor com pulso dinâmico sincronizado em tempo real com a voz e execução autônoma de tarefas no sistema operacional.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-[#d9ff2f] font-mono bg-[#d9ff2f]/10 px-2 py-0.5 rounded border border-[#d9ff2f]/20">
                  Consumo de RAM: 0 MB (Nuvem / Edge TTS)
                </span>
                <span className="text-[10px] text-[#8a2be2] font-mono bg-[#8a2be2]/10 px-2 py-0.5 rounded border border-[#8a2be2]/20">
                  Voz: Masculina pt-BR
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-white/4 border border-white/8">
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-[#d9ff2f]" />
                Síntese de Voz por IA (Edge Neural TTS)
              </h3>
              <p className="text-[11px] text-[#94a3b8] mt-0.5">
                Responde audivelmente em português brasileiro natural quando ativado.
              </p>
            </div>
            <input
              type="checkbox"
              checked={voiceEnabled}
              onChange={(e) => setVoiceEnabled(e.target.checked)}
              className="w-4 h-4 accent-[#d9ff2f]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-white mb-1 block">Voz Masculina Oficial:</label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full bg-[#06090e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#d9ff2f]/50"
              >
                <option value="pt-BR-AntonioNeural">pt-BR-AntonioNeural (Recomendado — Oficial Jovem/Confiante)</option>
                <option value="pt-BR-FabioNeural">pt-BR-FabioNeural (Masculino Formal)</option>
                <option value="web_speech">Nativa do Navegador (Web Speech Fallback)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-white mb-1 block">Velocidade da Fala:</label>
              <select
                value={speechRate}
                onChange={(e) => setSpeechRate(e.target.value)}
                className="w-full bg-[#06090e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#d9ff2f]/50"
              >
                <option value="-10%">Ligeiramente Pausada (-10%)</option>
                <option value="+0%">Normal (+0%) (Padrão)</option>
                <option value="+10%">Dinâmica (+10%)</option>
                <option value="+20%">Rápida (+20%)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePlaySample}
                disabled={playingSample}
                icon={playingSample ? <Volume2 className="w-3.5 h-3.5 animate-pulse text-[#d9ff2f]" /> : <Play className="w-3.5 h-3.5" />}
              >
                {playingSample ? 'Reproduzindo Amostra...' : 'Ouvir Amostra de Voz Oficial'}
              </Button>
              {sampleError && (
                <span className="text-[11px] text-red-400">{sampleError}</span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-[#94a3b8]">
              <Mic className="w-3.5 h-3.5 text-[#d9ff2f]" />
              <span>Reconhecimento por Voz: Web Speech API pt-BR Ativo</span>
            </div>
          </div>

          {/* Subseção: Comandos de Voz pela Tecla F */}
          <div className="pt-3 border-t border-white/8 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-[#d9ff2f]" />
                Comandos de Voz & Atalho Tecla F
              </h3>
              <span className="text-[10px] font-mono text-[#d9ff2f] bg-[#d9ff2f]/10 px-2 py-0.5 rounded border border-[#d9ff2f]/20">
                Padrão: F para falar, F para enviar, ESC para cancelar
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/4 border border-white/8">
              <div>
                <h4 className="text-xs font-bold text-white">Ativar Atalho de Voz por Tecla</h4>
                <p className="text-[11px] text-[#94a3b8] mt-0.5">
                  Primeiro toque ativa o microfone e o HUD de gravação; segundo toque finaliza e envia a instrução sem precisar clicar.
                </p>
              </div>
              <input
                type="checkbox"
                checked={shortcutEnabled}
                onChange={(e) => setShortcutEnabled(e.target.checked)}
                className="w-4 h-4 accent-[#d9ff2f]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-white mb-1 block">Tecla de Ativação do Microfone:</label>
                <select
                  value={shortcutKey}
                  onChange={(e) => setShortcutKey(e.target.value)}
                  className="w-full bg-[#06090e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#d9ff2f]/50"
                >
                  <option value="KeyF">Tecla F (Padrão Oficial WINC)</option>
                  <option value="KeyV">Tecla V</option>
                  <option value="Space">Barra de Espaço</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-white mb-1 block">Volume da Resposta por Voz ({voiceVolume}%):</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={voiceVolume}
                  onChange={(e) => setVoiceVolume(e.target.value)}
                  className="w-full accent-[#d9ff2f] mt-2 cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/3 border border-white/6">
                <div>
                  <h5 className="text-[11px] font-semibold text-white">Transcrição em Tempo Real</h5>
                  <p className="text-[10px] text-[#64748b]">Exibe as palavras sendo reconhecidas na tela.</p>
                </div>
                <input
                  type="checkbox"
                  checked={realtimeTranscribe}
                  onChange={(e) => setRealtimeTranscribe(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#d9ff2f]"
                />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/3 border border-white/6">
                <div>
                  <h5 className="text-[11px] font-semibold text-white">Indicador Visual HUD</h5>
                  <p className="text-[10px] text-[#64748b]">Mostra o banner pulsante neon WINC durante a gravação.</p>
                </div>
                <input
                  type="checkbox"
                  checked={visualIndicator}
                  onChange={(e) => setVisualIndicator(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#d9ff2f]"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-2">
          {saved ? (
            <div className="flex items-center gap-2 text-xs text-[#d9ff2f] font-bold">
              <CheckCircle2 className="w-4 h-4" /> Configurações salvas e aplicadas ao WINC AI OS com sucesso!
            </div>
          ) : (
            <span className="text-[11px] text-[#64748b]">
              As alterações nos provedores de IA são aplicadas imediatamente a todas as novas tarefas.
            </span>
          )}

          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={<Save className="w-4 h-4" />}
          >
            Salvar Configurações
          </Button>
        </div>
      </form>
    </div>
  );
};
