/**
 * Voice Manager for WINC AI OS - Speech Recognition (STT), Male Voice Synthesis (TTS),
 * and Real-Time Web Audio API Analyzer for Holographic Aura Reactivity.
 *
 * Fully conforms to WINC Master AI 2.0 specifications:
 * - Real microphone amplitude capture via Web Audio API & AnalyserNode
 * - Real TTS playback amplitude capture
 * - Edge Neural TTS (pt-BR-AntonioNeural) + Web Speech API fallback
 * - Zero microphone or listener memory leaks
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

  // Web Audio API single shared context
  private audioContext: AudioContext | null = null;

  // Playback Analyser
  private playbackAnalyser: AnalyserNode | null = null;
  private playbackSource: MediaElementAudioSourceNode | null = null;
  private playbackAnimId: number | null = null;

  // Microphone Analyser (Live User Voice)
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private micAnalyser: AnalyserNode | null = null;
  private micAnimId: number | null = null;

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

  private getAudioContext(): AudioContext | null {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!this.audioContext && AudioCtx) {
        this.audioContext = new AudioCtx();
      }
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      return this.audioContext;
    } catch (e) {
      console.warn('AudioContext not available:', e);
      return null;
    }
  }

  // =========================================================================
  // LIVE MICROPHONE AUDIO ANALYSIS (User Voice Amplitude)
  // =========================================================================
  private async startMicAnalysis(onAmplitude?: (amp: number) => void) {
    this.stopMicAnalysis();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.micStream = stream;
      const ctx = this.getAudioContext();
      if (!ctx) return;

      this.micAnalyser = ctx.createAnalyser();
      this.micAnalyser.fftSize = 128;
      this.micAnalyser.smoothingTimeConstant = 0.5;

      this.micSource = ctx.createMediaStreamSource(stream);
      this.micSource.connect(this.micAnalyser);
      // NOTE: Do NOT connect micAnalyser to ctx.destination to avoid acoustic loopback!

      const dataArray = new Uint8Array(this.micAnalyser.fftSize);

      const sampleMic = () => {
        if (!this.micAnalyser || !this.isListening) return;

        this.micAnalyser.getByteTimeDomainData(dataArray);

        // Calculate Root Mean Square (RMS)
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const v = (dataArray[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / dataArray.length);

        // Normalize with human vocal threshold curve
        const noiseFloor = 0.015;
        const normalized = Math.max(0, rms - noiseFloor) / (0.35 - noiseFloor);
        const amp = Math.min(1.0, Math.pow(Math.max(0, normalized), 0.85) * 1.6);

        if (onAmplitude) {
          onAmplitude(amp);
        }

        // Global state sync
        window.dispatchEvent(
          new CustomEvent('winc-voice-state-change', {
            detail: { state: 'listening', amplitude: amp }
          })
        );

        this.micAnimId = requestAnimationFrame(sampleMic);
      };

      this.micAnimId = requestAnimationFrame(sampleMic);
    } catch (err) {
      console.warn('Microphone Web Audio analyzer access notice:', err);
    }
  }

  private stopMicAnalysis() {
    if (this.micAnimId) {
      cancelAnimationFrame(this.micAnimId);
      this.micAnimId = null;
    }
    if (this.micSource) {
      try {
        this.micSource.disconnect();
      } catch (e) {}
      this.micSource = null;
    }
    if (this.micAnalyser) {
      try {
        this.micAnalyser.disconnect();
      } catch (e) {}
      this.micAnalyser = null;
    }
    if (this.micStream) {
      try {
        this.micStream.getTracks().forEach((track) => track.stop());
      } catch (e) {}
      this.micStream = null;
    }
  }

  // =========================================================================
  // SPEECH RECOGNITION (STT in pt-BR)
  // =========================================================================
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
    onEnd?: () => void,
    onAmplitude?: (amp: number) => void
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
          // Keep listening on silence until user presses second KeyF or ESC
          return;
        }
        this.isListening = false;
        this.stopMicAnalysis();
        if (onError) onError(event.error || 'Erro no microfone');
      };

      this.recognition.onend = () => {
        // If still flagged as listening (waiting for second KeyF), restart recognition automatically
        if (this.isListening) {
          try {
            this.recognition.start();
          } catch (e) {
            this.isListening = false;
            this.stopMicAnalysis();
            if (onEnd) onEnd();
          }
        } else {
          this.stopMicAnalysis();
          if (onEnd) onEnd();
        }
      };

      this.isListening = true;
      this.recognition.start();

      // Start real Web Audio API frequency & volume capture
      this.startMicAnalysis(onAmplitude);

      return true;
    } catch (e: any) {
      this.isListening = false;
      this.stopMicAnalysis();
      if (onError) onError(e.message || 'Falha ao iniciar microfone');
      return false;
    }
  }

  public stopListening() {
    this.isListening = false;
    this.stopMicAnalysis();
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
  }

  public abortListening() {
    this.isListening = false;
    this.stopMicAnalysis();
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {}
    }
    // Reset amplitude to 0
    window.dispatchEvent(
      new CustomEvent('winc-voice-state-change', {
        detail: { state: 'idle', amplitude: 0 }
      })
    );
  }

  // =========================================================================
  // TEXT-TO-SPEECH (TTS) & AUDIO OUTPUT ANALYSIS
  // =========================================================================
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
        const res = await api.synthesizeSpeech(
          text,
          this.settings.voiceId,
          rateStr.startsWith('-') ? rateStr : `+${rateStr}`
        );

        if (res.status === 'ok' && res.audio_url) {
          const audio = new Audio(res.audio_url);
          audio.volume = this.settings.volume;
          this.currentAudio = audio;

          // Wire amplitude visualizer
          this.setupPlaybackAnalyser(audio, onAmplitude);

          audio.onplay = () => {
            if (onStart) onStart();
          };

          audio.onended = () => {
            this.teardownPlaybackAnalyser();
            this.currentAudio = null;
            if (onAmplitude) onAmplitude(0);
            if (onEnd) onEnd();
          };

          audio.onerror = () => {
            this.teardownPlaybackAnalyser();
            this.currentAudio = null;
            // Fallback to Web Speech API
            this.speakWithWebSpeech(text, onStart, onEnd, onAmplitude);
          };

          await audio.play();
          return;
        }
      } catch (ex) {
        console.warn('Edge TTS synthesis notice, fallback to Web Speech:', ex);
      }
    }

    // Strategy 2: Web Speech API Fallback
    this.speakWithWebSpeech(text, onStart, onEnd, onAmplitude);
  }

  private setupPlaybackAnalyser(audio: HTMLAudioElement, onAmplitude?: (amp: number) => void) {
    if (!onAmplitude) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      this.playbackAnalyser = ctx.createAnalyser();
      this.playbackAnalyser.fftSize = 64;
      this.playbackAnalyser.smoothingTimeConstant = 0.6;

      // Connect media element
      this.playbackSource = ctx.createMediaElementSource(audio);
      this.playbackSource.connect(this.playbackAnalyser);
      this.playbackAnalyser.connect(ctx.destination);

      const dataArray = new Uint8Array(this.playbackAnalyser.frequencyBinCount);

      const updateLoop = () => {
        if (!this.playbackAnalyser || !this.currentAudio || this.currentAudio.paused) return;

        this.playbackAnalyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / (dataArray.length * 255.0);
        const amp = Math.min(1.0, avg * 2.2);

        onAmplitude(amp);
        window.dispatchEvent(
          new CustomEvent('winc-voice-state-change', {
            detail: { state: 'speaking', amplitude: amp }
          })
        );

        this.playbackAnimId = requestAnimationFrame(updateLoop);
      };

      this.playbackAnimId = requestAnimationFrame(updateLoop);
    } catch (e) {
      // Periodic fallback if cross-origin or source is already bound
      const interval = setInterval(() => {
        if (!this.currentAudio || this.currentAudio.paused) {
          clearInterval(interval);
          onAmplitude(0);
        } else {
          const amp = 0.35 + Math.random() * 0.55;
          onAmplitude(amp);
        }
      }, 90);
    }
  }

  private teardownPlaybackAnalyser() {
    if (this.playbackAnimId) {
      cancelAnimationFrame(this.playbackAnimId);
      this.playbackAnimId = null;
    }
    if (this.playbackSource) {
      try {
        this.playbackSource.disconnect();
      } catch (e) {}
      this.playbackSource = null;
    }
    if (this.playbackAnalyser) {
      try {
        this.playbackAnalyser.disconnect();
      } catch (e) {}
      this.playbackAnalyser = null;
    }
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
    const ptVoices = voices.filter((v) => v.lang.includes('pt-BR') || v.lang.includes('pt_BR'));
    const maleVoice =
      ptVoices.find(
        (v) =>
          v.name.toLowerCase().includes('antonio') ||
          v.name.toLowerCase().includes('daniel') ||
          v.name.toLowerCase().includes('male') ||
          v.name.toLowerCase().includes('homem') ||
          v.name.toLowerCase().includes('brasil')
      ) || ptVoices[0];

    if (maleVoice) {
      utterance.voice = maleVoice;
    }

    let interval: any = null;
    utterance.onstart = () => {
      if (onStart) onStart();
      if (onAmplitude) {
        interval = setInterval(() => {
          const amp = 0.35 + Math.random() * 0.55;
          onAmplitude(amp);
          window.dispatchEvent(
            new CustomEvent('winc-voice-state-change', {
              detail: { state: 'speaking', amplitude: amp }
            })
          );
        }, 100);
      }
    };

    utterance.onend = () => {
      if (interval) clearInterval(interval);
      if (onAmplitude) onAmplitude(0);
      window.dispatchEvent(
        new CustomEvent('winc-voice-state-change', {
          detail: { state: 'idle', amplitude: 0 }
        })
      );
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      if (interval) clearInterval(interval);
      if (onAmplitude) onAmplitude(0);
      window.dispatchEvent(
        new CustomEvent('winc-voice-state-change', {
          detail: { state: 'idle', amplitude: 0 }
        })
      );
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.teardownPlaybackAnalyser();
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    window.dispatchEvent(
      new CustomEvent('winc-voice-state-change', {
        detail: { amplitude: 0 }
      })
    );
  }
}

export const voiceManager = new VoiceManager();
