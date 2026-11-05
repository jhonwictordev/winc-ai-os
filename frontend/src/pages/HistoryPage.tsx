import React, { useState, useEffect } from 'react';
import { AuditLog } from '../types';
import { api } from '../api';
import { History, ShieldCheck, RefreshCw } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditLogs();
      setLogs(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto overflow-y-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-white">Histórico de Operações & Auditoria</h1>
          <p className="text-xs text-[#97a3b7]">
            Registro auditável de todas as decisões, execuções de agentes e mutações do sistema.
          </p>
        </div>
        <button
          onClick={loadLogs}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10"
        >
          <RefreshCw className="w-4 h-4 text-[#97a3b7]" />
        </button>
      </div>

      <div className="winc-glass rounded-2xl p-6 border border-white/10">
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-3.5 rounded-xl bg-[#03060c] border border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-[#d9ff2f]/10 text-[#d9ff2f] border border-[#d9ff2f]/20">
                    {log.action}
                  </span>
                  <span className="text-white font-semibold">{log.actor}</span>
                </div>
                <p className="text-[#97a3b7] text-[11px]">{log.details}</p>
              </div>

              <span className="font-mono text-[10px] text-[#97a3b7] shrink-0">
                {new Date(log.created_at * 1000).toLocaleString()}
              </span>
            </div>
          ))}

          {logs.length === 0 && (
            <div className="text-center py-8 text-xs text-[#97a3b7]">Nenhum evento registrado ainda.</div>
          )}
        </div>
      </div>
    </div>
  );
};
