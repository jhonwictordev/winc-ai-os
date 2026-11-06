import React, { useEffect, useRef, useState, useMemo } from 'react';
import { CharacterState } from './WincCharacter';

export interface VoiceReactiveAuraProps {
  state?: CharacterState;
  amplitude?: number; // 0.0 to 1.0 (from Web Audio API AnalyserNode)
  size?: 'hero' | 'compact' | 'mini';
  isMicActive?: boolean;
  isSpeaking?: boolean;
  sensitivity?: number; // default 1.0
  reducedMotion?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const VoiceReactiveAura: React.FC<VoiceReactiveAuraProps> = ({
  state = 'idle',
  amplitude = 0.0,
  size = 'hero',
  isMicActive = false,
  isSpeaking = false,
  sensitivity = 1.0,
  reducedMotion = false,
  className = '',
  children
}) => {
  // Smoothed amplitude using exponential moving average (LERP)
  const [smoothedAmp, setSmoothedAmp] = useState<number>(0);
  const animRef = useRef<number | null>(null);
  const targetAmpRef = useRef<number>(amplitude);
  const currentAmpRef = useRef<number>(0);

  // Update target amp reference
  useEffect(() => {
    targetAmpRef.current = Math.max(0, Math.min(1.0, amplitude * sensitivity));
  }, [amplitude, sensitivity]);

  // High performance smoothing loop for fluid 60fps aura reactivity
  useEffect(() => {
    if (reducedMotion) {
      setSmoothedAmp(targetAmpRef.current);
      return;
    }

    let isMounted = true;
    const smoothLoop = () => {
      if (!isMounted) return;
      const target = targetAmpRef.current;
      const current = currentAmpRef.current;
      // Responsive attack (quick rise), smooth decay (gentle fade out)
      const factor = target > current ? 0.35 : 0.12;
      const next = current + (target - current) * factor;
      currentAmpRef.current = next;

      // Update state when change is noticeable
      if (Math.abs(next - current) > 0.002 || (next < 0.005 && current > 0)) {
        setSmoothedAmp(Math.max(0, Math.min(1.0, next)));
      }
      animRef.current = requestAnimationFrame(smoothLoop);
    };

    animRef.current = requestAnimationFrame(smoothLoop);
    return () => {
      isMounted = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [reducedMotion]);

  // Color schemes and dynamics based on assistant state
  const theme = useMemo(() => {
    switch (state) {
      case 'listening':
        return {
          primary: '#06b6d4',      // Cyan
          secondary: '#d9ff2f',    // Lime
          coreGlow: 'rgba(6, 182, 212, 0.45)',
          floorGlow: 'rgba(217, 255, 47, 0.35)',
          upperRingStroke: '#06b6d4',
          lowerRingStroke: '#d9ff2f',
          particleColor: '#22d3ee',
          orbitSpeed: '8s',
          intensity: 0.95
        };
      case 'thinking':
        return {
          primary: '#a855f7',      // Purple
          secondary: '#c084fc',    // Light purple
          coreGlow: 'rgba(168, 85, 247, 0.45)',
          floorGlow: 'rgba(147, 51, 234, 0.35)',
          upperRingStroke: '#a855f7',
          lowerRingStroke: '#c084fc',
          particleColor: '#e9d5ff',
          orbitSpeed: '4s',
          intensity: 0.9
        };
      case 'speaking':
        return {
          primary: '#a855f7',      // WINC Purple
          secondary: '#d9ff2f',    // WINC Neon Lime
          coreGlow: 'rgba(168, 85, 247, 0.55)',
          floorGlow: 'rgba(217, 255, 47, 0.45)',
          upperRingStroke: '#a855f7',
          lowerRingStroke: '#d9ff2f',
          particleColor: '#d9ff2f',
          orbitSpeed: '6s',
          intensity: 1.0
        };
      case 'executing':
        return {
          primary: '#3b82f6',      // Tech Blue
          secondary: '#06b6d4',    // Cyan
          coreGlow: 'rgba(59, 130, 246, 0.5)',
          floorGlow: 'rgba(6, 182, 212, 0.4)',
          upperRingStroke: '#3b82f6',
          lowerRingStroke: '#06b6d4',
          particleColor: '#60a5fa',
          orbitSpeed: '5s',
          intensity: 0.85
        };
      case 'completed':
        return {
          primary: '#10b981',      // Emerald
          secondary: '#34d399',    // Light Emerald
          coreGlow: 'rgba(16, 185, 129, 0.6)',
          floorGlow: 'rgba(52, 211, 153, 0.4)',
          upperRingStroke: '#10b981',
          lowerRingStroke: '#34d399',
          particleColor: '#a7f3d0',
          orbitSpeed: '10s',
          intensity: 0.9
        };
      case 'error':
        return {
          primary: '#ef4444',      // Red
          secondary: '#f97316',    // Amber
          coreGlow: 'rgba(239, 68, 68, 0.35)',
          floorGlow: 'rgba(249, 115, 22, 0.25)',
          upperRingStroke: '#ef4444',
          lowerRingStroke: '#f97316',
          particleColor: '#fca5a5',
          orbitSpeed: '12s',
          intensity: 0.5
        };
      case 'idle':
      default:
        return {
          primary: '#8a2be2',      // Deep purple
          secondary: '#06b6d4',    // Soft cyan
          coreGlow: 'rgba(138, 43, 226, 0.25)',
          floorGlow: 'rgba(6, 182, 212, 0.18)',
          upperRingStroke: '#8a2be2',
          lowerRingStroke: '#06b6d4',
          particleColor: '#c084fc',
          orbitSpeed: '12s',
          intensity: 0.45
        };
    }
  }, [state]);

  // Dimensions based on size
  const scaleMultiplier = size === 'mini' ? 0.35 : size === 'compact' ? 0.65 : 1.0;
  const svgWidth = 280 * scaleMultiplier;
  const svgHeight = 340 * scaleMultiplier;

  // Reactivity calculations
  const ampScale = 1.0 + smoothedAmp * 0.28;
  const glowOpacity = Math.min(1.0, theme.intensity * (0.4 + smoothedAmp * 0.6));
  const rippleExpansion1 = 1.0 + (smoothedAmp * 0.45);
  const rippleExpansion2 = 1.0 + (smoothedAmp * 0.75);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* =========================================================================
          BACKGROUND AURA LAYER (Positioned BEHIND character)
          ========================================================================= */}
      <div
        className="absolute inset-0 pointer-events-none flex items-center justify-center transition-all duration-300"
        style={{ transform: `scale(${ampScale})` }}
      >
        {/* Volumetric SVG Filter Container */}
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox="0 0 280 340"
          className="absolute overflow-visible"
        >
          <defs>
            {/* Soft Volumetric Blur */}
            <filter id={`auraGlow-${size}`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Intense Ring Glow */}
            <filter id={`ringGlow-${size}`} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3.5" result="blur1" />
              <feGaussianBlur stdDeviation="8" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Upper Ring Gradient */}
            <linearGradient id={`upperGrad-${size}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={theme.primary} stopOpacity="0.95" />
              <stop offset="50%" stopColor={theme.secondary} stopOpacity="0.8" />
              <stop offset="100%" stopColor={theme.primary} stopOpacity="0.95" />
            </linearGradient>

            {/* Lower Pedestal Gradient */}
            <linearGradient id={`lowerGrad-${size}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={theme.secondary} stopOpacity="0.9" />
              <stop offset="50%" stopColor={theme.primary} stopOpacity="0.75" />
              <stop offset="100%" stopColor={theme.secondary} stopOpacity="0.9" />
            </linearGradient>

            {/* Floor Radial Reflection */}
            <radialGradient id={`floorReflect-${size}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={theme.secondary} stopOpacity="0.45" />
              <stop offset="40%" stopColor={theme.primary} stopOpacity="0.25" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* 1. Floor Reflection Under Feet */}
          <ellipse
            cx="140"
            cy="312"
            rx={95 * ampScale}
            ry={24 * ampScale}
            fill={`url(#floorReflect-${size})`}
            opacity={glowOpacity}
            className="transition-all duration-300"
          />

          {/* 2. Lower Ring Pedestal: Expanding Circular Soundwaves / Ripples */}
          <g transform="translate(140, 310)">
            {/* Outer expanding ripple 2 */}
            <ellipse
              cx="0"
              cy="0"
              rx={105 * rippleExpansion2}
              ry={22 * rippleExpansion2}
              fill="none"
              stroke={theme.lowerRingStroke}
              strokeWidth={smoothedAmp > 0.1 ? "1.5" : "0.75"}
              strokeDasharray="6 8"
              opacity={Math.max(0.1, 0.45 - smoothedAmp * 0.15)}
              className="transition-all duration-150"
            />

            {/* Inner expanding ripple 1 */}
            <ellipse
              cx="0"
              cy="0"
              rx={88 * rippleExpansion1}
              ry={18 * rippleExpansion1}
              fill="none"
              stroke={theme.secondary}
              strokeWidth="1.2"
              opacity={0.35 + smoothedAmp * 0.4}
              filter={`url(#ringGlow-${size})`}
              className="transition-all duration-150"
            />

            {/* Base Platform Ring (High-Tech Platform Rim) */}
            <ellipse
              cx="0"
              cy="0"
              rx="76"
              ry="16"
              fill="none"
              stroke={`url(#lowerGrad-${size})`}
              strokeWidth="2.2"
              filter={`url(#ringGlow-${size})`}
              opacity={0.85 + smoothedAmp * 0.15}
            />

            {/* Platform Crosshairs / Energy Nodes */}
            <circle cx="-76" cy="0" r="2.5" fill={theme.secondary} filter={`url(#ringGlow-${size})`} />
            <circle cx="76" cy="0" r="2.5" fill={theme.secondary} filter={`url(#ringGlow-${size})`} />
            <circle cx="0" cy="16" r="2" fill={theme.primary} />
            <circle cx="0" cy="-16" r="2" fill={theme.primary} />
          </g>

          {/* 3. Upper Orbital Ring — BACK HALF (passes behind shoulders/back) */}
          {/* Shoulder height center is ~ Y: 135 */}
          <g transform="translate(140, 135) rotate(-14)">
            <path
              d="M -90,0 A 90 28 0 0 1 90,0"
              fill="none"
              stroke={`url(#upperGrad-${size})`}
              strokeWidth="2"
              strokeDasharray={state === 'thinking' ? "8 4" : "none"}
              filter={`url(#ringGlow-${size})`}
              opacity={0.75 + smoothedAmp * 0.25}
              className="transition-all duration-150"
            />
            {/* Orbital Electric Energy Arc (Back) */}
            <path
              d="M -70,-8 A 90 28 0 0 1 60,-5"
              fill="none"
              stroke={theme.secondary}
              strokeWidth="1.2"
              strokeDasharray="16 35"
              opacity={0.5 + smoothedAmp * 0.5}
            />
          </g>

          {/* 4. Ambient Floating Micro-Particles (Rising Tech Dust) */}
          <g opacity={0.6 + smoothedAmp * 0.4}>
            <circle cx="95" cy={180 - smoothedAmp * 25} r="1.5" fill={theme.particleColor} />
            <circle cx="185" cy={165 - smoothedAmp * 30} r="1.8" fill={theme.secondary} />
            <circle cx="80" cy={230 - smoothedAmp * 20} r="1.2" fill={theme.primary} />
            <circle cx="205" cy={220 - smoothedAmp * 35} r="1.6" fill={theme.particleColor} />
            <circle cx="130" cy={90 - smoothedAmp * 15} r="1.2" fill={theme.secondary} />
          </g>
        </svg>

        {/* Ambient Back Glow Core */}
        <div
          className="absolute rounded-full blur-2xl pointer-events-none transition-all duration-300"
          style={{
            width: `${190 * scaleMultiplier}px`,
            height: `${230 * scaleMultiplier}px`,
            background: `radial-gradient(circle, ${theme.coreGlow} 0%, rgba(0,0,0,0) 70%)`,
            opacity: glowOpacity,
            transform: `scale(${1.0 + smoothedAmp * 0.3})`
          }}
        />
      </div>

      {/* =========================================================================
          CHARACTER CONTENT LAYER (Middle Layer — Unobstructed Face & Helmet)
          ========================================================================= */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        {children}
      </div>

      {/* =========================================================================
          FOREGROUND AURA LAYER (Positioned IN FRONT of torso/feet, strictly below chin)
          ========================================================================= */}
      <div
        className="absolute inset-0 pointer-events-none flex items-center justify-center transition-all duration-300 z-20"
        style={{ transform: `scale(${ampScale})` }}
      >
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox="0 0 280 340"
          className="absolute overflow-visible"
        >
          {/* Upper Orbital Ring — FRONT HALF (passes in front of chest/torso, below chin!) */}
          <g transform="translate(140, 135) rotate(-14)">
            <path
              d="M 90,0 A 90 28 0 0 1 -90,0"
              fill="none"
              stroke={`url(#upperGrad-${size})`}
              strokeWidth={1.8 + smoothedAmp * 1.2}
              filter={`url(#ringGlow-${size})`}
              opacity={0.85 + smoothedAmp * 0.15}
              className="transition-all duration-150"
            />

            {/* Orbiting Tech Light Node (Moves along the front arc) */}
            <circle
              cx={Math.cos((Date.now() / 800) % (Math.PI * 2)) * 75}
              cy={Math.sin((Date.now() / 800) % (Math.PI * 2)) * 22}
              r={2.2 + smoothedAmp * 1.5}
              fill={theme.secondary}
              filter={`url(#ringGlow-${size})`}
              opacity={0.9}
            />

            {/* Foreground Energy Sparkle */}
            <path
              d="M -40,12 A 90 28 0 0 0 50,14"
              fill="none"
              stroke={theme.secondary}
              strokeWidth="1.5"
              strokeDasharray="12 28"
              opacity={0.7 + smoothedAmp * 0.3}
            />
          </g>

          {/* Lower Platform Front Rim (crisp neon highlight on top of feet floor) */}
          <g transform="translate(140, 310)">
            <path
              d="M 76,0 A 76 16 0 0 1 -76,0"
              fill="none"
              stroke={theme.secondary}
              strokeWidth={1.8 + smoothedAmp * 1.0}
              opacity={0.75 + smoothedAmp * 0.25}
              filter={`url(#ringGlow-${size})`}
            />
          </g>
        </svg>
      </div>
    </div>
  );
};
