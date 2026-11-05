import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../api';
import { voiceManager } from '../../utils/voiceManager';
import {
  Mic,
  MicOff,
  Sparkles,
  X,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Volume2
} from 'lucide-react';

export type VoiceHUDStatus = 'idle' | 'recording' | 'processing' | 'speaking' | 'executing' | 'error';

interface VoiceRecordingOverlayProps {
  onRefreshData?: () => void;
}

export const VoiceRecordingOverlay: React.FC<VoiceRecordingOverlayProps> = ({ onRefreshData }) => {
  const [status, setStatus] = useState<VoiceHUDStatus>('idle');
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shortcutKey, setShortcutKey] = useState<string>('KeyF');
  const [shortcutEnabled, setShortcutEnabled] = useState<boolean>(true);

  const timerRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');

  // Synchronize transcriptRef for event listener closures
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Load configured shortcut key
  useEffect(() => {
    const loadShortcutSettings = () => {
      try {
        const stored = localStorage.getItem('winc_shortcut_settings');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.triggerKey) setShortcutKey(parsed.triggerKey);
          if (typeof parsed.enabled === 'boolean') setShortcutEnabled(parsed.enabled);
        }
      } catch (e) {}
    };

    loadShortcutSettings();
    window.addEventListener('storage', loadShortcutSettings);
    return () => window.removeEventListener('storage', loadShortcutSettings);
  }, []);

  // Broadcast state to all character components (Hero and Floating)
  const broadcastState = (st: string, amp?: number) => {
    window.dispatchEvent(new CustomEvent('winc-voice-state-change', {
      detail: { state: st, amplitude: amp || 0 }
    }));
  };

  // Start recording
  const handleStartRecording = () => {
    voiceManager.stopSpeaking();
    setStatus('recording');
    setSeconds(0);
    setTranscript('');
    setLastResponse(null);
    setErrorMessage(null);
    transcriptRef.current = '';

    broadcastState('listening');

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);

    const started = voiceManager.startListening(
      (text) => {
        setTranscript(text);
        transcriptRef.current = text;
      },
      (err) => {
        setErrorMessage(err);
        setStatus('error');
        broadcastState('error');
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeout(() => {
          setStatus('idle');
          broadcastState('idle');
        }, 3500);
      },
      () => {
        // onEnd
      }
    );

    if (!started) {
      if (timerRef.current) clearInterval(timerRef.current);
      setStatus('error');
      setErrorMessage('Permissão de microfone negada ou não suportada.');
      broadcastState('error');
      setTimeout(() => {
        setStatus('idle');
        broadcastState('idle');
      }, 3500);
    }
  };

  // Cancel recording (ESC)
  const handleCancelRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    voiceManager.abortListening();
    setStatus('idle');
    setTranscript('');
    transcriptRef.current = '';
    broadcastState('idle');
  };

  // Submit recorded command (Second F)
  const handleSubmitCommand = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    voiceManager.stopListening();

    const finalCmd = transcriptRef.current.trim();
    if (!finalCmd) {
      setStatus('error');
      setErrorMessage('Nenhuma instrução reconhecida. Fale após pressionar F.');
      broadcastState('error');
      setTimeout(() => {
        setStatus('idle');
        broadcastState('idle');
      }, 2500);
      return;
    }

    setStatus('processing');
    broadcastState('thinking');

    try {
      const res = await api.interactMaster(finalCmd);
      setLastResponse(res.spoken_response || res.response || res.text_response);

      if (res.action_type === 'project_created') {
        setStatus('executing');
        broadcastState('executing');
      } else if (res.action_type === 'ram_purged') {
        setStatus('executing');
        broadcastState('completed');
      } else {
        setStatus('speaking');
        broadcastState('speaking');
      }

      if (onRefreshData) {
        onRefreshData();
      }

      // Synthesize and play official male voice
      const phraseToSpeak = res.spoken_response || res.response || res.text_response;
      if (phraseToSpeak) {
        setStatus('speaking');
        broadcastState('speaking');

        await voiceManager.speak(
          phraseToSpeak,
          () => {
            setStatus('speaking');
            broadcastState('speaking');
          },
          () => {
            if (res.action_type === 'project_created') {
              setStatus('executing');
              broadcastState('executing');
              setTimeout(() => {
                setStatus('idle');
                broadcastState('idle');
              }, 4000);
            } else {
              setStatus('idle');
              broadcastState('idle');
            }
          },
          (amp) => {
            broadcastState('speaking', amp);
          }
        );
      } else {
        setTimeout(() => {
          setStatus('idle');
          broadcastState('idle');
        }, 2000);
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(`Falha na execução: ${err.message}`);
      broadcastState('error');
      setTimeout(() => {
        setStatus('idle');
        broadcastState('idle');
      }, 4000);
    }
  };

  // Global Keyboard Listener for Key F and ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!shortcutEnabled) return;

      // Ignore held-down key repeats (Test 9)
      if (e.repeat) return;

      // Ignore if modifier keys are held (Ctrl, Alt, Meta/Windows)
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      // Ignore IME composition
      if (e.isComposing) return;

      // Check if user is typing in an input, textarea, select, or contentEditable element (Test 8)
      const target = e.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName ? target.tagName.toUpperCase() : '';
        if (
          tagName === 'INPUT' ||
          tagName === 'TEXTAREA' ||
          tagName === 'SELECT' ||
          target.isContentEditable ||
          target.getAttribute('contenteditable') === 'true'
        ) {
          return;
        }
      }

      // 1. ESC cancels recording immediately (Test 7)
      if (e.code === 'Escape' || e.key === 'Escape') {
        if (status === 'recording') {
          e.preventDefault();
          handleCancelRecording();
        }
        return;
      }

      // 2. Key F toggle behavior (Test 1 & Test 2)
      if (e.code === shortcutKey) {
        e.preventDefault();

        if (status === 'idle' || status === 'error') {
          handleStartRecording();
        } else if (status === 'recording') {
          handleSubmitCommand();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcutKey, shortcutEnabled, status]);

  if (status === 'idle') return null;

  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="bg-[#06090e]/95 backdrop-blur-xl border-2 border-[#d9ff2f]/50 rounded-2xl shadow-[0_0_35px_rgba(217,255,47,0.25)] p-4 text-white">
        {/* Header with status badge & controls */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            {status === 'recording' && (
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
              </span>
            )}
            {status === 'processing' && (
              <Loader2 className="w-4 h-4 text-[#8a2be2] animate-spin" />
            )}
            {status === 'speaking' && (
              <Volume2 className="w-4 h-4 text-[#d9ff2f] animate-pulse" />
            )}
            {status === 'executing' && (
              <Sparkles className="w-4 h-4 text-[#d9ff2f] animate-spin" />
            )}
            {status === 'error' && (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}

            <span className="text-xs font-extrabold uppercase tracking-wider text-white">
              {status === 'recording' && 'Ouvindo você...'}
              {status === 'processing' && 'Processando comando...'}
              {status === 'speaking' && 'WINC Master AI respondendo...'}
              {status === 'executing' && 'Executando tarefa com agentes...'}
              {status === 'error' && 'Atenção'}
            </span>

            {status === 'recording' && (
              <span className="text-[11px] font-mono font-bold bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30">
                Tempo: {formatTimer(seconds)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {status === 'recording' && (
              <button
                type="button"
                onClick={handleCancelRecording}
                className="p-1 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/10 transition-colors"
                title="Cancelar gravação (ESC)"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Live transcript or status message */}
        <div className="py-3">
          {status === 'recording' && (
            <div>
              <p className="text-sm font-medium text-white min-h-[2.5rem] flex items-center">
                {transcript ? (
                  <span className="text-[#f8fafc]">"{transcript}"</span>
                ) : (
                  <span className="text-[#64748b] italic">
                    Diga sua instrução em português (ex: "WINC, abra meu projeto da agência e verifique os erros do frontend")...
                  </span>
                )}
              </p>
            </div>
          )}

          {status === 'processing' && (
            <div className="flex items-center gap-2 text-xs text-[#94a3b8] py-1">
              <span>Interpretando comando com o modelo de inteligência e selecionando especialistas...</span>
            </div>
          )}

          {status === 'speaking' && lastResponse && (
            <div className="text-xs text-[#d9ff2f] font-medium py-1 line-clamp-2">
              "{lastResponse}"
            </div>
          )}

          {status === 'executing' && (
            <div className="text-xs text-[#d9ff2f] font-medium py-1">
              Agente acionado na fila sequencial FIFO (trava de 1 agente por vez).
            </div>
          )}

          {status === 'error' && (
            <div className="text-xs text-red-400 font-semibold py-1">
              {errorMessage || 'Ocorreu um erro no processamento do áudio.'}
            </div>
          )}
        </div>

        {/* Action Shortcuts Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px]">
          {status === 'recording' ? (
            <>
              <div className="flex items-center gap-2">
                <span className="bg-[#d9ff2f]/20 text-[#d9ff2f] font-mono font-bold px-2 py-0.5 rounded border border-[#d9ff2f]/40">
                  Tecla F
                </span>
                <span className="text-[#94a3b8] font-medium">pressione novamente para enviar</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="bg-white/10 text-[#94a3b8] font-mono px-2 py-0.5 rounded border border-white/10">
                  ESC
                </span>
                <span className="text-[#64748b]">cancelar</span>

                <button
                  type="button"
                  onClick={handleSubmitCommand}
                  className="ml-2 flex items-center gap-1 bg-[#d9ff2f] text-black px-2.5 py-1 rounded-lg font-bold text-xs hover:bg-[#c2e625] transition-colors"
                >
                  <Send className="w-3 h-3" /> Enviar
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between w-full text-[#94a3b8]">
              <span>WINC Master AI — Controle Ativo por Voz</span>
              <span className="text-[#d9ff2f] font-mono font-bold">pt-BR-AntonioNeural</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
