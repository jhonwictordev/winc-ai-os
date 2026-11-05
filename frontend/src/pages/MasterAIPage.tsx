import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { Message, Agent } from '../types';
import { WincCharacter, CharacterState } from '../components/character/WincCharacter';
import { voiceManager } from '../utils/voiceManager';
import {
  Sparkles,
  Send,
  Plus,
  Play,
  Cpu,
  CheckCircle2,
  Paperclip,
  Copy,
  Layers,
  ArrowRight,
  Clock,
  Terminal,
  MessageSquare,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Square,
  Activity,
  FolderKanban,
  CheckSquare
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

interface MasterAIPageProps {
  onPlanExecuted?: (projectId: string) => void;
}

export const MasterAIPage: React.FC<MasterAIPageProps> = ({ onPlanExecuted }) => {
  const [activeTab, setActiveTab] = useState<'voice_chat' | 'planner'>('voice_chat');

  // Character & Audio State
  const [charState, setCharState] = useState<CharacterState>('idle');
  const [amplitude, setAmplitude] = useState<number>(0);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [voiceMuted, setVoiceMuted] = useState<boolean>(false);
  const [currentSpokenText, setCurrentSpokenText] = useState<string>('');
  const [activeTaskTitle, setActiveTaskTitle] = useState<string>('');
  const [activeAgentName, setActiveAgentName] = useState<string>('');

  // Conversation State
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState('master-ai');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Planner State
  const [prompt, setPrompt] = useState(
    'Crie um site premium para uma barbearia com agendamento online, galeria de cortes e identidade visual.'
  );
  const [client, setClient] = useState('Barbearia Vintage WINC');
  const [category, setCategory] = useState('Desenvolvimento Web & Branding');
  const [planning, setPlanning] = useState(false);
  const [plan, setPlan] = useState<any | null>(null);
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any | null>(null);

  const loadData = async () => {
    try {
      const [cList, aList] = await Promise.all([
        api.getConversations(),
        api.getAgents(undefined, undefined)
      ]);
      setConversations(cList);
      setAgents(aList);
      if (cList.length > 0 && !activeConvId) {
        setActiveConvId(cList[0].id);
      }
    } catch (e) {
      console.error('Error loading master data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeConvId) {
      api.getMessages(activeConvId).then(setMessages);
    } else {
      setMessages([]);
    }
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // Synchronize character state with Global Voice Shortcut (Key F)
  useEffect(() => {
    const handleSyncState = (e: any) => {
      const { state: newState, amplitude: newAmp } = e.detail || {};
      if (newState) setCharState(newState);
      if (typeof newAmp === 'number') setAmplitude(newAmp);
      if (activeConvId) {
        api.getMessages(activeConvId).then(setMessages).catch(() => {});
      }
    };
    window.addEventListener('winc-voice-state-change', handleSyncState);
    return () => window.removeEventListener('winc-voice-state-change', handleSyncState);
  }, [activeConvId]);

  // Execute high-level command from voice or text
  const handleExecuteVoiceCommand = async (command: string) => {
    if (!command.trim() || sending) return;

    setCharState('thinking');
    setSending(true);
    setCurrentSpokenText(command);

    try {
      const res = await api.interactMaster(command, activeConvId || undefined);

      if (!activeConvId && res.conversation_id) {
        setActiveConvId(res.conversation_id);
        loadData();
      } else if (res.conversation_id) {
        const updated = await api.getMessages(res.conversation_id);
        setMessages(updated);
      }

      // Check actions
      if (res.action_type === 'project_created') {
        setCharState('executing');
        setActiveTaskTitle('Projeto inicializado na fila sequencial');
        setActiveAgentName('WINC Master AI');
        if (onPlanExecuted && res.project_id) {
          onPlanExecuted(res.project_id);
        }
      } else if (res.action_type === 'ram_purged') {
        setCharState('completed');
        setTimeout(() => setCharState('idle'), 3000);
      } else {
        setCharState('speaking');
      }

      // Play voice response
      const phraseToSpeak = res.spoken_response || res.text_response;
      if (phraseToSpeak && !voiceMuted) {
        setIsSpeaking(true);
        setCharState('speaking');
        setCurrentSpokenText(phraseToSpeak);

        await voiceManager.speak(
          phraseToSpeak,
          () => {
            setCharState('speaking');
            setIsSpeaking(true);
          },
          () => {
            setIsSpeaking(false);
            setCharState(res.action_type === 'project_created' ? 'executing' : 'idle');
          },
          (amp) => setAmplitude(amp)
        );
      } else {
        setCharState(res.action_type === 'project_created' ? 'executing' : 'idle');
      }
    } catch (err: any) {
      setCharState('error');
      alert(`Erro no processamento: ${err.message}`);
      setTimeout(() => setCharState('idle'), 3500);
    } finally {
      setSending(false);
    }
  };

  // Toggle Microphone
  const toggleListening = () => {
    if (isListening) {
      voiceManager.stopListening();
      setIsListening(false);
      setCharState('idle');
    } else {
      voiceManager.stopSpeaking();
      setIsSpeaking(false);
      setCharState('listening');
      setIsListening(true);
      setCurrentSpokenText('Ouvindo fala em Português Brasileiro...');

      voiceManager.startListening(
        (transcript, isFinal) => {
          setCurrentSpokenText(`"${transcript}"`);
          if (isFinal) {
            setIsListening(false);
            handleExecuteVoiceCommand(transcript);
          }
        },
        (error) => {
          setIsListening(false);
          setCharState('idle');
          console.warn('Speech error:', error);
        },
        () => {
          setIsListening(false);
        }
      );
    }
  };

  const handleInterruptSpeech = () => {
    voiceManager.stopSpeaking();
    setIsSpeaking(false);
    setCharState('idle');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    const msg = inputMessage;
    setInputMessage('');
    handleExecuteVoiceCommand(msg);
  };

  const handlePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    try {
      setPlanning(true);
      setExecutionResult(null);
      setCharState('thinking');
      const res = await api.planMasterRequest(prompt, client, category);
      setPlan(res);
      setCharState('idle');
    } catch (err: any) {
      setCharState('error');
      alert(`Erro no planejamento: ${err.message}`);
    } finally {
      setPlanning(false);
    }
  };

  const handleExecutePlan = async () => {
    if (!plan) return;
    try {
      setExecuting(true);
      setCharState('executing');
      setActiveTaskTitle('Executando sub-tarefas com especialistas');
      setActiveAgentName('Master AI');
      const res = await api.executeMasterPlan(plan);
      setExecutionResult(res);
      if (onPlanExecuted) {
        onPlanExecuted(plan.project_id);
      }
      // Speak confirmation
      if (!voiceMuted) {
        voiceManager.speak(
          `Plano de execução inicializado com ${plan.subtasks.length} especialistas na fila de tarefas sequencial.`
        );
      }
    } catch (err: any) {
      setCharState('error');
      alert(`Erro na execução: ${err.message}`);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="flex h-full overflow-hidden select-none">
      {/* LEFT COLUMN: HERO CHARACTER & VOICE CONTROLS (HyperFrames-compatible Architecture) */}
      <div className="w-80 lg:w-96 border-r border-white/8 bg-[#070b12] flex flex-col items-center justify-between p-6 shrink-0 z-10 shadow-xl overflow-y-auto">
        {/* Top Info */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-white/8">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d9ff2f] shadow-[0_0_8px_#d9ff2f]" />
            <h2 className="text-xs font-extrabold text-white tracking-wider font-mono">WINC MASTER AI</h2>
          </div>
          <Badge variant="lime" size="sm">Voz pt-BR Ativa</Badge>
        </div>

        {/* Hero Character Visual Component */}
        <div className="py-4 my-auto flex flex-col items-center">
          <WincCharacter
            size="hero"
            state={charState}
            speakingAmplitude={amplitude}
            activeTaskTitle={activeTaskTitle}
            activeAgentName={activeAgentName}
            onClick={() => {
              if (isSpeaking) handleInterruptSpeech();
              else toggleListening();
            }}
          />

          {/* Real-time Audio Waveform Simulation Bar */}
          <div className="mt-4 flex items-center justify-center gap-1 w-48 h-6 px-3 rounded-full bg-black/40 border border-white/10">
            {Array.from({ length: 16 }).map((_, i) => {
              const heightMultiplier = isSpeaking
                ? Math.min(1.0, 0.2 + amplitude * (1.2 + Math.sin(i * 0.8) * 0.4))
                : isListening
                ? 0.3 + Math.sin(Date.now() / 200 + i) * 0.3
                : 0.15;
              return (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-75 ${
                    isSpeaking
                      ? 'bg-[#d9ff2f]'
                      : isListening
                      ? 'bg-cyan-400'
                      : 'bg-white/20'
                  }`}
                  style={{ height: `${Math.max(4, heightMultiplier * 20)}px` }}
                />
              );
            })}
          </div>

          {/* Subtitle / Speech Bubble Preview */}
          <div className="mt-3 p-3 rounded-xl bg-white/4 border border-white/8 text-[11px] text-white/90 text-center max-w-xs leading-relaxed min-h-[48px] flex items-center justify-center">
            {currentSpokenText || 'Clique no microfone ou fale "WINC, você está aí?" para iniciar.'}
          </div>
        </div>

        {/* Voice Action & Audio Control Bar */}
        <div className="w-full space-y-3 pt-3 border-t border-white/8">
          <div className="flex items-center justify-center gap-3">
            {/* Big Mic Button */}
            <button
              onClick={toggleListening}
              className={`p-4 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse shadow-red-500/40 scale-105'
                  : 'bg-[#d9ff2f] text-black hover:bg-[#cbf026] hover:scale-102 shadow-[#d9ff2f]/25'
              }`}
              title={isListening ? 'Parar captura' : 'Falar com WINC Master AI'}
            >
              {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            {/* Interrupt speech button if speaking */}
            {isSpeaking && (
              <Button
                variant="secondary"
                size="md"
                onClick={handleInterruptSpeech}
                icon={<Square className="w-4 h-4 text-red-400" />}
                title="Interromper fala"
              >
                Parar Fala
              </Button>
            )}

            {/* Mute toggle button */}
            <button
              onClick={() => {
                setVoiceMuted(!voiceMuted);
                if (!voiceMuted) voiceManager.stopSpeaking();
              }}
              className={`p-3 rounded-xl border transition-colors ${
                voiceMuted
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : 'bg-white/5 border-white/10 text-[#94a3b8] hover:text-white'
              }`}
              title={voiceMuted ? 'Ativar voz do assistente' : 'Silenciar voz do assistente'}
            >
              {voiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          <div className="text-center text-[10px] text-[#64748b] font-mono">
            Voz Oficial: pt-BR-AntonioNeural (Natural pt-BR)
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: WORKSPACE / CHAT FEED & MULTI-AGENT PLANNER */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#06090e]">
        {/* Navigation Tabs Header */}
        <div className="px-6 py-3 border-b border-white/8 bg-[#080c14] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === 'voice_chat' ? 'primary' : 'secondary'}
              size="sm"
              icon={<MessageSquare className="w-3.5 h-3.5" />}
              onClick={() => setActiveTab('voice_chat')}
            >
              Conversa & Histórico
            </Button>
            <Button
              variant={activeTab === 'planner' ? 'primary' : 'secondary'}
              size="sm"
              icon={<Sparkles className="w-3.5 h-3.5" />}
              onClick={() => setActiveTab('planner')}
            >
              Orquestrador de Projetos Multiagente
            </Button>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[#64748b]">
            <Cpu className="w-3.5 h-3.5 text-[#d9ff2f]" />
            <span>Fila Sequencial: 1 Agente por Vez</span>
          </div>
        </div>

        {/* Tab 1: Voice & Text Interactive Conversation Feed */}
        {activeTab === 'voice_chat' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#d9ff2f]/10 border border-[#d9ff2f]/20 flex items-center justify-center text-[#d9ff2f]">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Central de Inteligência WINC Master AI</h3>
                  <p className="text-xs text-[#64748b] leading-relaxed">
                    Fale pelo microfone ou envie comandos digitados. O WINC Master AI interpreta solicitações, formula projetos, aciona os 283 especialistas e responde com voz masculina natural.
                  </p>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-[10px] font-mono font-bold uppercase text-[#64748b]">
                      {msg.role === 'user' ? 'Você' : 'WINC MASTER AI'}
                    </span>
                    <span className="text-[9px] text-[#64748b] font-mono">
                      {new Date(msg.created_at * 1000).toLocaleTimeString()}
                    </span>
                  </div>

                  <div
                    className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-[#131d2e] text-white border border-white/10'
                        : 'bg-[#0c121d] text-[#f8fafc] border border-white/8 shadow-md'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex items-center gap-2 text-xs text-[#94a3b8] p-3 rounded-lg bg-[#0c121d] border border-white/8 max-w-xs">
                  <span className="w-3.5 h-3.5 border-2 border-[#d9ff2f] border-t-transparent rounded-full animate-spin" />
                  <span>WINC Master AI processando com os agentes...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Suggestions */}
            <div className="px-6 py-2 border-t border-white/6 flex items-center gap-2 overflow-x-auto scrollbar-none">
              <span className="text-[10px] font-mono uppercase text-[#64748b] shrink-0">Sugestões rápidas:</span>
              {[
                'WINC, você está aí?',
                'WINC, crie um site premium para uma barbearia',
                'WINC, libere a memória RAM',
                'WINC, analise os erros do projeto'
              ].map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleExecuteVoiceCommand(p)}
                  className="px-2.5 py-1 rounded-md bg-white/4 hover:bg-white/8 border border-white/6 text-[10px] text-[#94a3b8] hover:text-white whitespace-nowrap transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Text Input Footer */}
            <div className="p-4 border-t border-white/8 bg-[#080c14]">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-4xl mx-auto">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Fale ou digite uma solicitação para o WINC Master AI..."
                  className="flex-1 bg-[#0c121d] border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-[#64748b] focus:border-[#d9ff2f]/50"
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!inputMessage.trim() || sending}
                  icon={<Send className="w-4 h-4" />}
                >
                  Enviar
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 2: Multi-Agent Project Planner */}
        {activeTab === 'planner' && (
          <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
            <Card className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Briefing do Projeto para Orquestração Multiagente
                </h3>
                <p className="text-xs text-[#94a3b8] mt-1">
                  O WINC Master AI decompõe o escopo e despacha tarefas sequencialmente para especialistas do Agency Agents.
                </p>
              </div>

              <form onSubmit={handlePlan} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#64748b] mb-1 block">Nome do Cliente:</label>
                    <input
                      type="text"
                      value={client}
                      onChange={(e) => setClient(e.target.value)}
                      className="w-full bg-[#06090e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#d9ff2f]/50"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-[#64748b] mb-1 block">Categoria:</label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-[#06090e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#d9ff2f]/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[#64748b] mb-1 block">Descrição do Objetivo:</label>
                  <textarea
                    rows={3}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full bg-[#06090e] border border-white/10 rounded-lg p-3 text-xs text-white focus:border-[#d9ff2f]/50 leading-relaxed"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    loading={planning}
                    icon={<Sparkles className="w-4 h-4" />}
                  >
                    Gerar Plano Multiagente
                  </Button>
                </div>
              </form>
            </Card>

            {/* Generated Plan Breakdown */}
            {plan && (
              <Card className="space-y-5 border-[#d9ff2f]/30">
                <div className="flex items-center justify-between pb-3 border-b border-white/8">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#d9ff2f] font-bold">Plano de Execução Formulado</span>
                    <h3 className="text-base font-extrabold text-white">Projeto ID: {plan.project_id}</h3>
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    loading={executing}
                    icon={<Play className="w-4 h-4" />}
                    onClick={handleExecutePlan}
                  >
                    Executar Plano na Fila Sequencial
                  </Button>
                </div>

                {/* Subtasks List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Especialistas Alocados ({plan.subtasks.length}):
                  </h4>

                  <div className="grid grid-cols-1 gap-2.5">
                    {plan.subtasks.map((task: any, index: number) => (
                      <div
                        key={index}
                        className="p-3.5 rounded-xl bg-[#06090e] border border-white/8 flex items-start justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{task.title}</span>
                            <Badge variant="blue" size="sm">{task.division_label || task.division}</Badge>
                          </div>
                          <p className="text-[11px] text-[#94a3b8]">{task.description}</p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-mono text-[#64748b] block">Agente Responsável</span>
                          <span className="text-xs font-bold text-[#d9ff2f]">{task.agent_name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {executionResult && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>
                      {executionResult.queued_tasks?.length || 0} subtarefas enfileiradas com sucesso na fila de execução sequencial (trava de 1 agente por vez).
                    </span>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
