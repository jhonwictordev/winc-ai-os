import React, { useState } from 'react';
import { SystemTelemetry } from '../types';
import { api } from '../api';
import { Cpu, HardDrive, RefreshCw, Trash2, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  title: string;
  telemetry: SystemTelemetry | null;
  onRefreshTelemetry: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, telemetry, onRefreshTelemetry }) => {
  const [purging, setPurging] = useState(false);
  const [purgedMessage, setPurgedMessage] = useState<string | null>(null);

  const handlePurge = async () => {
    try {
      setPurging(true);
      await api.purgeMemory();
      setPurgedMessage('RAM Liberada!');
      setTimeout(() => setPurgedMessage(null), 2500);
      onRefreshTelemetry();
    } finally {
      setPurging(false);
    }
  };

  return (
    <header className="h-16 border-b border-white/10 bg-[#070d17]/80 backdrop-blur-md px-6 flex items-center justify-between z-10">
      <div>
        <h2 className="text-base font-bold text-white tracking-wide">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Hardware Status Pills */}
        {telemetry && (
          <div className="flex items-center gap-2 text-xs">
            {/* CPU pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[#97a3b7]">
              <Cpu className="w-3.5 h-3.5 text-[#1f77ff]" />
              <span>CPU:</span>
              <span className="font-mono font-bold text-white">{telemetry.cpu.percent}%</span>
            </div>

            {/* RAM pill */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono ${
              telemetry.ram.warning
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : 'bg-white/5 border-white/10 text-[#97a3b7]'
            }`}>
              <span>RAM:</span>
              <span className="font-bold text-white">{telemetry.ram.used_gb} / {telemetry.ram.total_gb} GB</span>
              <span className="text-[10px]">({telemetry.ram.percent}%)</span>
            </div>

            {/* OpenJarvis Status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#d9ff2f]/10 border border-[#d9ff2f]/30 text-[#d9ff2f] font-semibold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d9ff2f] animate-pulse" />
              <span>OpenJarvis Core</span>
            </div>
          </div>
        )}

        {/* Purge Memory Button */}
        <button
          onClick={handlePurge}
          disabled={purging}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#d9ff2f]/50 text-xs font-semibold text-white transition-all duration-150 disabled:opacity-50"
          title="Descarrega o modelo da memória e executa coleta de lixo"
        >
          {purging ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#d9ff2f]" />
          ) : purgedMessage ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-[#d9ff2f]" />
          ) : (
            <Trash2 className="w-3.5 h-3.5 text-[#d9ff2f]" />
          )}
          <span>{purgedMessage || 'Liberar RAM'}</span>
        </button>
      </div>
    </header>
  );
};
