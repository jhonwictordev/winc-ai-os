import React, { useState, useEffect, useRef } from 'react';
import { WincCharacter, CharacterState } from './WincCharacter';
import { voiceManager } from '../../utils/voiceManager';
import { api } from '../../api';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Send,
  Sparkles,
  Maximize2,
  Trash2,
  FolderKanban,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface FloatingWincAssistantProps {
  onNavigateToMaster: () => void;
  onRefreshTelemetry?: () => void;
  currentTab?: string;
}

export const FloatingWincAssistant: React.FC<FloatingWincAssistantProps> = ({
  onNavigateToMaster,
  onRefreshTelemetry,
  currentTab
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<CharacterState>('idle');
  const [amplitude, setAmplitude] = useState<number>(0);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [responseText, setResponseText] = useState('');
  const [inputText, setInputText] = useState('');
  const [activeTaskInfo, setActiveTaskInfo] = useState<{ title?: string; agent?: string } | null>(null);

  // Dragging state
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('winc_floating_pos');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { x: window.innerWidth - 100, y: window.innerHeight - 130 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0
  });

  // Save pos
  useEffect(() => {
    try {
      localStorage.setItem('winc_floating_pos', JSON.stringify(position));
    } catch (e) {}
  }, [position]);

  // Synchronize state with global Voice shortcut (Key F)
  useEffect(() => {
    const handleSyncState = (e: any) => {
      const { state: newState, amplitude: newAmp } = e.detail || {};
      if (newState) setState(newState);
      if (typeof newAmp === 'number') setAmplitude(newAmp);
    };
    window.addEventListener('winc-voice-state-change', handleSyncState);
    return () => window.removeEventListener('winc-voice-state-change', handleSyncState);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const newX = Math.max(20, Math.min(window.innerWidth - 80, dragRef.current.posX + dx));
    const newY = Math.max(20, Math.min(window.innerHeight - 80, dragRef.current.posY + dy));
    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
  };

  const handleVoiceCommand = async (command: string) => {
    if (!command.trim()) return;

    setState('thinking');
    setTranscript(`"${command}"`);
    setResponseText('Processando solicitação com o WINC Master AI...');

    try {
      const res = await api.interactMaster(command);

      setResponseText(res.text_response || res.spoken_response);

      if (res.action_type === 'project_created') {
        setState('executing');
        setActiveTaskInfo({ title: 'Orquestrando projeto multiagente', agent: 'WINC Master AI' });
      } else if (res.action_type === 'ram_purged') {
        setState('completed');
        if (onRefreshTelemetry) onRefreshTelemetry();
        setTimeout(() => setState('idle'), 3500);
      } else {
        setState('speaking');
      }

      // Voice output
      const speechToPlay = res.spoken_response || res.text_response;
      if (speechToPlay) {
        setState('speaking');
        await voiceManager.speak(
          speechToPlay,
          () => setState('speaking'),
          () => {
            setState(res.action_type === 'project_created' ? 'executing' : 'idle');
          },
          (amp) => setAmplitude(amp)
        );
      }
    } catch (err: any) {
      setState('error');
      setResponseText(`Erro na solicitação: ${err.message}`);
      setTimeout(() => setState('idle'), 4000);
    }
  };

  const toggleMic = () => {
    if (isListening) {
      voiceManager.stopListening();
      setIsListening(false);
      setState('idle');
    } else {
      voiceManager.stopSpeaking();
      setState('listening');
      setIsListening(true);
      setTranscript('Ouvindo em português...');

      voiceManager.startListening(
        (text, isFinal) => {
          setTranscript(text);
          if (isFinal) {
            setIsListening(false);
            handleVoiceCommand(text);
          }
        },
        (err) => {
          setIsListening(false);
          setState('idle');
          setTranscript(`Erro microfone: ${err}`);
        },
        () => {
          setIsListening(false);
        }
      );
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      const msg = inputText;
      setInputText('');
      handleVoiceCommand(msg);
    }
  };

  // If user is currently on the full master AI page, hide the floating pill to avoid duplicate avatar
  if (currentTab === 'master') {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 50
      }}
      className="touch-none select-none transition-shadow"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Floating Compact Avatar Button */}
      {!isOpen ? (
        <div
          onClick={() => setIsOpen(true)}
          className="relative cursor-pointer flex items-center justify-center group"
          title="Abrir WINC Master AI Assistente"
        >
          {/* Luminous Glow Floor */}
          <div className="absolute inset-0 rounded-full bg-[#d9ff2f]/20 blur-lg group-hover:bg-[#d9ff2f]/35 transition-colors" />

          {/* Character */}
          <div className="relative p-1.5 rounded-2xl bg-[#080c14]/90 border border-white/15 group-hover:border-[#d9ff2f]/50 backdrop-blur-md shadow-2xl transition-all">
            <WincCharacter
              size="compact"
              state={state}
              speakingAmplitude={amplitude}
              showStatusBadge={false}
            />

            {/* Micro Activity Dot */}
            <span
              className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full border border-black shadow-sm ${
                state === 'listening'
                  ? 'bg-cyan-400 animate-ping'
                  : state === 'speaking'
                  ? 'bg-[#d9ff2f] animate-pulse'
                  : state === 'executing'
                  ? 'bg-blue-400 animate-spin'
                  : 'bg-[#d9ff2f]'
              }`}
            />
          </div>
        </div>
      ) : (
        /* Expanded Voice Dialogue Popup */
        <div
          className="w-84 sm:w-96 rounded-2xl bg-[#080c14]/95 border border-white/15 backdrop-blur-xl shadow-2xl p-4 space-y-3.5 text-xs text-white"
          style={{ transform: 'translate(-50%, -85%)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-white/8 cursor-move">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#d9ff2f] shadow-[0_0_8px_#d9ff2f]" />
              <span className="font-extrabold text-white text-xs tracking-wide">WINC Master AI</span>
              <Badge variant="lime" size="sm">Voz pt-BR</Badge>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNavigateToMaster();
                }}
                className="p-1.5 rounded-md hover:bg-white/10 text-[#94a3b8] hover:text-white"
                title="Abrir painel completo"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  voiceManager.stopSpeaking();
                  voiceManager.stopListening();
                  setIsOpen(false);
                }}
                className="p-1.5 rounded-md hover:bg-white/10 text-[#94a3b8] hover:text-white"
                title="Recolher"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Character & Visualizer Area */}
          <div className="flex items-center gap-4 py-1">
            <div className="shrink-0">
              <WincCharacter
                size="compact"
                state={state}
                speakingAmplitude={amplitude}
                showStatusBadge={false}
              />
            </div>

            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="text-[10px] uppercase font-mono font-bold text-[#64748b]">
                {state === 'listening' ? 'Ouvindo...' : state === 'speaking' ? 'Falando...' : state === 'thinking' ? 'Analisando...' : 'Pronto para agir'}
              </div>

              {transcript && (
                <div className="text-[11px] text-[#d9ff2f] font-mono italic truncate">
                  {transcript}
                </div>
              )}

              <p className="text-[11px] text-[#f8fafc] leading-relaxed max-h-20 overflow-y-auto">
                {responseText || 'Clique no microfone para falar comigo ou envie uma instrução.'}
              </p>
            </div>
          </div>

          {/* Quick Action Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              { label: 'Crie um site para cliente', cmd: 'WINC, crie um site premium para cliente' },
              { label: 'Liberar RAM', cmd: 'WINC, libere a memória RAM' },
              { label: 'Verificar erros', cmd: 'WINC, analise os erros do projeto' },
            ].map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleVoiceCommand(q.cmd)}
                className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-[10px] text-[#94a3b8] hover:text-white transition-colors"
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Input & Mic Controls */}
          <form onSubmit={handleTextSubmit} className="flex items-center gap-2 pt-1 border-t border-white/8">
            <button
              type="button"
              onClick={toggleMic}
              className={`p-2.5 rounded-xl transition-all shadow-md ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse shadow-red-500/30'
                  : 'bg-[#d9ff2f] text-black hover:bg-[#cbf026] shadow-[#d9ff2f]/20'
              }`}
              title={isListening ? 'Parar escuta' : 'Falar pelo microfone'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Fale ou digite um comando..."
              className="flex-1 bg-[#04060a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-[#64748b] focus:border-[#d9ff2f]/50"
            />

            <Button
              type="submit"
              variant="secondary"
              size="sm"
              disabled={!inputText.trim()}
              icon={<Send className="w-3.5 h-3.5" />}
            >
              Enviar
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};
