import React, { useEffect, useState } from 'react';
import { Division } from '../types';
import { api } from '../api';
import { Layers, ArrowRight, Users } from 'lucide-react';
import { Badge } from '../components/ui/Badge';

interface DepartmentsPageProps {
  onSelectDepartment: (divisionId: string) => void;
}

export const DepartmentsPage: React.FC<DepartmentsPageProps> = ({ onSelectDepartment }) => {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDivisions().then(data => {
      setDivisions(data);
      setLoading(false);
    });
  }, []);

  const totalAgents = divisions.reduce((sum, d) => sum + (d.agent_count || 0), 0);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      <div className="pb-2 border-b border-white/8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Departamentos & Especialidades WINC
            <Badge variant="lime" size="sm">{totalAgents || 283} Especialistas</Badge>
          </h1>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            18 divisões técnicas especializadas integrando toda a equipe de agentes inteligentes da Agência WINC.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-[#94a3b8]">Carregando divisões técnicas...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {divisions.map((div) => {
            const displayName = div.label_pt || div.label;
            const count = div.agent_count || 0;

            return (
              <div
                key={div.id}
                onClick={() => onSelectDepartment(div.id)}
                className="bg-[#0b0f19] hover:bg-[#101726] rounded-2xl p-5 border border-white/8 hover:border-[#d9ff2f]/40 cursor-pointer flex flex-col justify-between group transition-all shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-md"
                      style={{ backgroundColor: `${div.color}20`, color: div.color, border: `1px solid ${div.color}40` }}
                    >
                      <Layers className="w-5 h-5" />
                    </div>
                    <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/6 text-white font-bold">
                      <Users className="w-3 h-3 text-[#d9ff2f]" /> {count}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-sm text-white group-hover:text-[#d9ff2f] transition-colors leading-tight">
                    {displayName}
                  </h3>
                  <p className="text-[11px] text-[#94a3b8] mt-1.5 line-clamp-2">
                    {count} {count === 1 ? 'especialista ativo' : 'especialistas ativos'} preparados para projetos de {displayName.toLowerCase()}.
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-white/6 flex items-center justify-between text-xs text-[#94a3b8] group-hover:text-white">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748b]">{div.id}</span>
                  <span className="flex items-center gap-1 text-[11px] text-[#d9ff2f] font-semibold group-hover:translate-x-0.5 transition-transform">
                    Acessar <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
