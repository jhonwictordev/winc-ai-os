/**
 * Voice Manager for WINC AI OS - Speech Recognition (STT) and Male Voice Synthesis (TTS).
 * Integrates Edge Neural TTS (pt-BR-AntonioNeural) and Web Speech API.
 */

import { api } from '../api';

export interface VoiceSettings {
  enabled: boolean;
  provider: 'edge_neural' | 'web_speech';
  voiceId: string;
  rate: number; // 0.8 to 1.3
  volume: number; // 0.0 to 1.0
  autoListen: boolean;
}

const DEFAULT_SETTINGS: VoiceSettings = {
  enabled: true,
  provider: 'edge_neural',
  voiceId: 'pt-BR-AntonioNeural',
  rate: 1.0,
  volume: 1.0,
  autoListen: false
};

class VoiceManager {
  private settings: VoiceSettings;
  private currentAudio: HTMLAudioElement | null = null;
  private recognition: any = null;
  private isListening: boolean = false;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private amplitudeCallback: ((amp: number) => void) | null = null;
  private animFrameId: number | null = null;

  constructor() {
    this.settings = this.loadSettings();
    this.initRecognition();
  }

  public loadSettings(): VoiceSettings {
    try {
      const stored = localStorage.getItem('winc_voice_settings');
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Could not read voice settings:', e);
    }
    return DEFAULT_SETTINGS;
  }

  public saveSettings(newSettings: Partial<VoiceSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem('winc_voice_settings', JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Could not save voice settings:', e);
    }
  }

  public getSettings(): VoiceSettings {
    return { ...this.settings };
  }

  // Speech Recognition (STT)
  private initRecognition() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'pt-BR';
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
      } catch (e) {
        console.warn('SpeechRecognition initialization warning:', e);
      }
    }
  }

  public isCurrentlyListening(): boolean {
    return this.isListening;
  }

  public startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError?: (error: string) => void,
    onEnd?: () => void
  ): boolean {
    if (!this.recognition) {
      this.initRecognition();
    }
    if (!this.recognition) {
      if (onError) onError('Reconhecimento de voz não suportado neste navegador.');
      return false;
    }

    try {
      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const combined = (finalTranscript + interimTranscript).trim();
        if (combined) {
          onResult(combined, false);
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          // Keep listening on silence until user presses F again
          return;
        }
        this.isListening = false;
        if (onError) onError(event.error || 'Erro no microfone');
      };

      this.recognition.onend = () => {
        // If still flagged as listening (waiting for second KeyF), restart recognition automatically
        if (this.isListening) {
          try {
            this.recognition.start();
          } catch (e) {
            this.isListening = false;
            if (onEnd) onEnd();
          }
        } else {
          if (onEnd) onEnd();
        }
      };

      this.isListening = true;
      this.recognition.start();
      return true;
    } catch (e: any) {
      this.isListening = false;
      if (onError) onError(e.message || 'Falha ao iniciar microfone');
      return false;
    }
  }

  public stopListening() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
  }

  public abortListening() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {}
    }
  }

  // Text-To-Speech (TTS)
  public async speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void,
    onAmplitude?: (amp: number) => void
  ): Promise<void> {
    if (!this.settings.enabled) {
      if (onEnd) onEnd();
      return;
    }

    this.stopSpeaking();

    // Strategy 1: Edge Neural TTS via backend endpoint
    if (this.settings.provider === 'edge_neural') {
      try {
        const rateStr = `${Math.round((this.settings.rate - 1.0) * 100)}%`;
        const res = await api.synthesizeSpeech(text, this.settings.voiceId, rateStr.startsWith('-') ? rateStr : `+${rateStr}`);

        if (res.status === 'ok' && res.audio_url) {
          const audio = new Audio(res.audio_url);
          audio.volume = this.settings.volume;
          this.currentAudio = audio;

          // Wire amplitude visualizer
          this.setupAudioAnalyser(audio, onAmplitude);

          audio.onplay = () => {
            if (onStart) onStart();
          };

          audio.onended = () => {
            this.teardownAudioAnalyser();
            this.currentAudio = null;
            if (onEnd) onEnd();
          };

          audio.onerror = () => {
            this.teardownAudioAnalyser();
            this.currentAudio = null;
            // Fallback to Web Speech API
            this.speakWithWebSpeech(text, onStart, onEnd, onAmplitude);
          };

          await audio.play();
          return;
        }
      } catch (ex) {
        console.warn('Edge TTS failed, falling back to Web Speech:', ex);
      }
    }

    // Strategy 2: Web Speech API Fallback
    this.speakWithWebSpeech(text, onStart, onEnd, onAmplitude);
  }

  private speakWithWebSpeech(
    text: string,
    onStart?: () => void,
    onEnd?: () => void,
    onAmplitude?: (amp: number) => void
  ) {
    if (!window.speechSynthesis) {
      if (onEnd) onEnd();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = this.settings.rate;
    utterance.volume = this.settings.volume;

    // Pick best male Brazilian Portuguese voice if present
    const voices = window.speechSynthesis.getVoices();
    const ptVoices = voices.filter(v => v.lang.includes('pt-BR') || v.lang.includes('pt_BR'));
    const maleVoice = ptVoices.find(v =>
      v.name.toLowerCase().includes('antonio') ||
      v.name.toLowerCase().includes('daniel') ||
      v.name.toLowerCase().includes('male') ||
      v.name.toLowerCase().includes('homem') ||
      v.name.toLowerCase().includes('brasil')
    ) || ptVoices[0];

    if (maleVoice) {
      utterance.voice = maleVoice;
    }

    // Simulated speech amplitude fluctuation for visor sync
    let interval: any = null;
    utterance.onstart = () => {
      if (onStart) onStart();
      if (onAmplitude) {
        interval = setInterval(() => {
          const amp = 0.3 + Math.random() * 0.7;
          onAmplitude(amp);
        }, 120);
      }
    };

    utterance.onend = () => {
      if (interval) clearInterval(interval);
      if (onAmplitude) onAmplitude(0);
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      if (interval) clearInterval(interval);
      if (onAmplitude) onAmplitude(0);
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }

  private setupAudioAnalyser(audio: HTMLAudioElement, onAmplitude?: (amp: number) => void) {
    if (!onAmplitude) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!this.audioContext && AudioCtx) {
        this.audioContext = new AudioCtx();
      }

      if (this.audioContext && !this.analyser) {
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 64;
        const source = this.audioContext.createMediaElementSource(audio);
        source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
      }

      if (this.analyser) {
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        const update = () => {
          if (this.analyser) {
            this.analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / (dataArray.length * 255.0);
            onAmplitude(Math.min(1.0, avg * 1.8));
            this.animFrameId = requestAnimationFrame(update);
          }
        };
        this.animFrameId = requestAnimationFrame(update);
      }
    } catch (e) {
      // Fallback simple timer
      const interval = setInterval(() => {
        if (!this.currentAudio || this.currentAudio.paused) {
          clearInterval(interval);
          onAmplitude(0);
        } else {
          onAmplitude(0.25 + Math.random() * 0.75);
        }
      }, 100);
    }
  }

  private teardownAudioAnalyser() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public stopSpeaking() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.teardownAudioAnalyser();
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
}

export const voiceManager = new VoiceManager();
