import React from 'react';
import { SystemTelemetry } from '../types';
import { Activity, Cpu, HardDrive, ShieldAlert, CheckCircle2, Zap } from 'lucide-react';

interface MonitoringPageProps {
  telemetry: SystemTelemetry | null;
}

export const MonitoringPage: React.FC<MonitoringPageProps> = ({ telemetry }) => {
  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto overflow-y-auto">
      <div>
        <h1 className="text-xl font-extrabold text-white">Monitoramento do Sistema & Telemetria</h1>
        <p className="text-xs text-[#97a3b7]">
          Métricas de consumo de hardware em tempo real e proteção de memória para o ambiente Windows.
        </p>
      </div>

      {telemetry ? (
        <div className="space-y-6">
          {/* Main Gauges */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CPU */}
            <div className="winc-glass rounded-2xl p-5 border border-white/10 space-y-3">
              <div className="flex justify-between items-center text-xs text-[#97a3b7]">
                <span className="font-bold uppercase tracking-wider">Uso de CPU</span>
                <Cpu className="w-4 h-4 text-[#1f77ff]" />
              </div>
              <div className="text-3xl font-extrabold text-white font-mono">{telemetry.cpu.percent}%</div>
              <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                <div className="h-full bg-[#1f77ff]" style={{ width: `${Math.min(telemetry.cpu.percent, 100)}%` }} />
              </div>
              <p className="text-[10px] text-[#97a3b7]">{telemetry.cpu.cores} núcleos / {telemetry.cpu.threads} threads</p>
            </div>

            {/* Physical RAM */}
            <div className="winc-glass rounded-2xl p-5 border border-white/10 space-y-3">
              <div className="flex justify-between items-center text-xs text-[#97a3b7]">
                <span className="font-bold uppercase tracking-wider">RAM Física</span>
                <span className={`w-2.5 h-2.5 rounded-full ${telemetry.ram.warning ? 'bg-red-500' : 'bg-[#d9ff2f]'}`} />
              </div>
              <div className="text-3xl font-extrabold text-white font-mono">{telemetry.ram.percent}%</div>
              <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                <div
                  className={`h-full ${telemetry.ram.warning ? 'bg-red-500' : 'bg-[#d9ff2f]'}`}
                  style={{ width: `${Math.min(telemetry.ram.percent, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-[#97a3b7]">{telemetry.ram.used_gb} GB de {telemetry.ram.total_gb} GB</p>
            </div>

            {/* Virtual Memory / Swap */}
            <div className="winc-glass rounded-2xl p-5 border border-white/10 space-y-3">
              <div className="flex justify-between items-center text-xs text-[#97a3b7]">
                <span className="font-bold uppercase tracking-wider">Memória Virtual</span>
                <HardDrive className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-3xl font-extrabold text-white font-mono">{telemetry.swap.percent}%</div>
              <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500" style={{ width: `${Math.min(telemetry.swap.percent, 100)}%` }} />
              </div>
              <p className="text-[10px] text-[#97a3b7]">{telemetry.swap.used_gb} GB de {telemetry.swap.total_gb} GB</p>
            </div>

            {/* Disk C: */}
            <div className="winc-glass rounded-2xl p-5 border border-white/10 space-y-3">
              <div className="flex justify-between items-center text-xs text-[#97a3b7]">
                <span className="font-bold uppercase tracking-wider">Armazenamento C:</span>
                <HardDrive className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-extrabold text-white font-mono">{telemetry.disk.free_gb} GB</div>
              <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400" style={{ width: `${100 - telemetry.disk.percent}%` }} />
              </div>
              <p className="text-[10px] text-[#97a3b7]">Espaço livre disponível</p>
            </div>
          </div>

          {/* Low RAM Safety Report */}
          <div className="winc-glass rounded-2xl p-6 border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#d9ff2f]" />
              <span>Relatório Operacional de Proteção Low RAM</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-[#03060c] border border-white/10 space-y-1">
                <span className="text-[10px] text-[#97a3b7] uppercase font-bold">Trava de Concorrência:</span>
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 1 Agente por Vez (Ativo)
                </div>
                <p className="text-[11px] text-[#97a3b7] mt-1">Evita carregamento concorrente de múltiplos modelos na RAM.</p>
              </div>

              <div className="p-4 rounded-xl bg-[#03060c] border border-white/10 space-y-1">
                <span className="text-[10px] text-[#97a3b7] uppercase font-bold">Descarregamento Automático:</span>
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> keep_alive = 0s (Ativo)
                </div>
                <p className="text-[11px] text-[#97a3b7] mt-1">Pesos são purgados da memória logo após gerar a resposta.</p>
              </div>

              <div className="p-4 rounded-xl bg-[#03060c] border border-white/10 space-y-1">
                <span className="text-[10px] text-[#97a3b7] uppercase font-bold">Janela Deslizante de Contexto:</span>
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Máx 1.536 Tokens
                </div>
                <p className="text-[11px] text-[#97a3b7] mt-1">Histórico truncado para não inflar a memória do processo.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-xs text-[#97a3b7]">Carregando telemetria...</div>
      )}
    </div>
  );
};
