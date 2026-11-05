import React, { useEffect, useState, useMemo } from 'react';
import { Sparkles, Mic, Volume2, Cpu, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export type CharacterState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'executing'
  | 'completed'
  | 'error';

interface WincCharacterProps {
  state?: CharacterState;
  size?: 'hero' | 'compact' | 'mini';
  speakingAmplitude?: number; // 0.0 to 1.0 (from audio visualizer)
  activeTaskTitle?: string;
  activeAgentName?: string;
  onClick?: () => void;
  showStatusBadge?: boolean;
  className?: string;
}

export const WincCharacter: React.FC<WincCharacterProps> = ({
  state = 'idle',
  size = 'hero',
  speakingAmplitude = 0.5,
  activeTaskTitle,
  activeAgentName,
  onClick,
  showStatusBadge = true,
  className = ''
}) => {
  // Height sizing
  const dimensions = useMemo(() => {
    switch (size) {
      case 'mini':
        return { height: 'h-16', width: 'w-10', scale: 0.25 };
      case 'compact':
        return { height: 'h-28', width: 'w-18', scale: 0.45 };
      case 'hero':
      default:
        return { height: 'h-72', width: 'w-44', scale: 1 };
    }
  }, [size]);

  // State metadata
  const stateMeta = useMemo(() => {
    switch (state) {
      case 'listening':
        return {
          label: 'Ouvindo...',
          badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          glowColor: 'rgba(6, 182, 212, 0.45)',
          icon: Mic,
          pulseSpeed: 'animate-ping'
        };
      case 'thinking':
        return {
          label: 'Pensando...',
          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          glowColor: 'rgba(168, 85, 247, 0.45)',
          icon: Sparkles,
          pulseSpeed: 'animate-pulse'
        };
      case 'speaking':
        return {
          label: 'Falando...',
          badgeColor: 'bg-[#d9ff2f]/20 text-[#d9ff2f] border-[#d9ff2f]/40',
          glowColor: 'rgba(217, 255, 47, 0.45)',
          icon: Volume2,
          pulseSpeed: 'animate-pulse'
        };
      case 'executing':
        return {
          label: 'Executando Tarefa...',
          badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          glowColor: 'rgba(59, 130, 246, 0.45)',
          icon: Cpu,
          pulseSpeed: 'animate-spin'
        };
      case 'completed':
        return {
          label: 'Concluído!',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          glowColor: 'rgba(16, 185, 129, 0.45)',
          icon: CheckCircle2,
          pulseSpeed: ''
        };
      case 'error':
        return {
          label: 'Atenção / Erro',
          badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
          glowColor: 'rgba(239, 68, 68, 0.45)',
          icon: AlertCircle,
          pulseSpeed: ''
        };
      case 'idle':
      default:
        return {
          label: 'WINC Master AI (Pronto)',
          badgeColor: 'bg-white/10 text-white/80 border-white/15',
          glowColor: 'rgba(147, 51, 234, 0.25)',
          icon: Sparkles,
          pulseSpeed: ''
        };
    }
  }, [state]);

  const StatusIcon = stateMeta.icon;

  return (
    <div
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center select-none group ${className}`}
    >
      {/* Container with dynamic floating micro-animation */}
      <div
        className={`relative flex items-center justify-center transition-all duration-300 ${
          state === 'idle'
            ? 'animate-winc-float'
            : state === 'listening'
            ? 'animate-winc-listen-pulse'
            : state === 'thinking'
            ? 'animate-winc-think'
            : state === 'speaking'
            ? 'animate-winc-speak'
            : state === 'executing'
            ? 'animate-winc-work'
            : ''
        }`}
      >
        {/* Holographic Ambient Floor Glow */}
        <div
          className="absolute -bottom-3 w-3/4 h-6 rounded-full blur-md transition-all duration-500"
          style={{
            background: `radial-gradient(ellipse at center, ${stateMeta.glowColor} 0%, rgba(0,0,0,0) 70%)`
          }}
        />

        {/* Luminous Pulsing Aura behind character */}
        <div
          className="absolute inset-0 rounded-full blur-xl pointer-events-none transition-all duration-300"
          style={{
            background: stateMeta.glowColor,
            opacity: state === 'speaking' ? 0.35 + speakingAmplitude * 0.4 : 0.22,
            transform: `scale(${state === 'listening' ? 1.15 : state === 'speaking' ? 1.08 : 1.0})`
          }}
        />

        {/* The Exact Reference Character Image */}
        <img
          src="/brand/winc_master_avatar.png"
          alt="WINC Master AI Character"
          className={`relative z-10 object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.65)] ${dimensions.height} ${dimensions.width}`}
          style={{
            filter:
              state === 'listening'
                ? 'drop-shadow(0 0 14px rgba(6, 182, 212, 0.6)) contrast(1.05)'
                : state === 'speaking'
                ? `drop-shadow(0 0 ${12 + speakingAmplitude * 18}px rgba(217, 255, 47, ${0.4 + speakingAmplitude * 0.4})) contrast(1.04)`
                : state === 'thinking'
                ? 'drop-shadow(0 0 14px rgba(168, 85, 247, 0.55))'
                : state === 'completed'
                ? 'drop-shadow(0 0 18px rgba(16, 185, 129, 0.6))'
                : state === 'error'
                ? 'drop-shadow(0 0 16px rgba(239, 68, 68, 0.6))'
                : 'drop-shadow(0 4px 16px rgba(147, 51, 234, 0.35))'
          }}
        />

        {/* Reactive Visor Shimmer Overlay (No mouth! Only visor reflection glow) */}
        {(state === 'speaking' || state === 'thinking' || state === 'listening') && (
          <div
            className="absolute z-20 pointer-events-none rounded-full blur-[2px] transition-opacity duration-150"
            style={{
              top: '20%',
              left: '36%',
              width: '28%',
              height: '18%',
              background:
                state === 'speaking'
                  ? `radial-gradient(circle, rgba(217, 255, 47, ${0.3 + speakingAmplitude * 0.5}) 0%, rgba(168, 85, 247, 0.4) 60%, transparent 100%)`
                  : state === 'listening'
                  ? 'radial-gradient(circle, rgba(6, 182, 212, 0.5) 0%, rgba(147, 51, 234, 0.3) 60%, transparent 100%)'
                  : 'radial-gradient(circle, rgba(168, 85, 247, 0.6) 0%, transparent 70%)',
              opacity: state === 'speaking' ? 0.6 + speakingAmplitude * 0.4 : 0.75
            }}
          />
        )}
      </div>

      {/* Floating State Badge & Info Pill (Hero and Compact only) */}
      {showStatusBadge && size !== 'mini' && (
        <div className="mt-3 flex flex-col items-center gap-1 z-20">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border backdrop-blur-md transition-all shadow-md ${stateMeta.badgeColor}`}
          >
            <StatusIcon className={`w-3.5 h-3.5 ${state === 'executing' ? 'animate-spin' : ''}`} />
            <span>{stateMeta.label}</span>
          </div>

          {/* Active task pill when executing */}
          {state === 'executing' && activeTaskTitle && (
            <div className="max-w-[240px] truncate text-[10px] font-mono text-[#94a3b8] px-2 py-0.5 rounded bg-black/60 border border-white/10 mt-0.5">
              {activeAgentName ? `${activeAgentName}: ` : ''}{activeTaskTitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
