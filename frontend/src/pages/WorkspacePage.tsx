import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { api } from '../api';
import { Code, Terminal, Play, Folder, FileCode, CheckCircle2, ShieldCheck, Save } from 'lucide-react';

export const WorkspacePage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [files, setFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Terminal command state
  const [command, setCommand] = useState('python --version');
  const [cmdOutput, setCmdOutput] = useState<{ stdout?: string; stderr?: string; exit_code?: number } | null>(null);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    api.getProjects().then(list => {
      setProjects(list);
      if (list.length > 0) {
        setSelectedProjectId(list[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      api.browseFiles(`projects/${selectedProjectId}`).then(data => {
        setFiles(data.items || []);
      });
    }
  }, [selectedProjectId]);

  const handleSelectFile = async (item: any) => {
    if (item.is_dir) return;
    setSelectedFile(item.relative_path);
    const res = await api.readFile(item.relative_path);
    setFileContent(res.content || '');
  };

  const handleSaveFile = async () => {
    if (!selectedFile) return;
    try {
      setSaving(true);
      await api.writeFile(selectedFile, fileContent);
      setSaveMsg('Arquivo salvo!');
      setTimeout(() => setSaveMsg(null), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleRunCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    try {
      setExecuting(true);
      const res = await api.executeWorkspaceCmd(command, selectedProjectId);
      setCmdOutput(res);
    } catch (err: any) {
      setCmdOutput({ stderr: err.message, exit_code: 1 });
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-white">Workspace de Desenvolvimento</h1>
          <p className="text-xs text-[#97a3b7]">
            Ambiente seguro para inspeção de código, edição de artefatos e testes controlados.
          </p>
        </div>

        {projects.length > 0 && (
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-[#0a1524] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#d9ff2f]/50"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Editor & File Explorer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[420px]">
        {/* File Tree */}
        <div className="winc-glass rounded-2xl p-4 border border-white/10 flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-2">
            <Folder className="w-3.5 h-3.5 text-[#1f77ff]" />
            <span>Arquivos do Projeto</span>
          </h3>

          <div className="flex-1 overflow-y-auto space-y-1">
            {files.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectFile(item)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs truncate flex items-center gap-2 transition-all ${
                  selectedFile === item.relative_path
                    ? 'bg-[#d9ff2f]/10 text-[#d9ff2f] font-bold border border-[#d9ff2f]/30'
                    : 'text-[#97a3b7] hover:bg-white/5 hover:text-white'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{item.name}</span>
              </button>
            ))}
            {files.length === 0 && (
              <div className="text-center py-8 text-[11px] text-[#97a3b7]/60">Nenhum arquivo ainda.</div>
            )}
          </div>
        </div>

        {/* Code Editor */}
        <div className="winc-glass rounded-2xl p-4 border border-white/10 md:col-span-3 flex flex-col">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
            <div className="text-xs font-mono text-white truncate max-w-md">
              {selectedFile || 'Selecione um arquivo para editar'}
            </div>
            {selectedFile && (
              <button
                onClick={handleSaveFile}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#d9ff2f] hover:bg-[#cbf026] text-black font-bold text-xs transition-all disabled:opacity-50"
              >
                <Save className="w-3 h-3" />
                <span>{saving ? 'Salvando...' : saveMsg || 'Salvar'}</span>
              </button>
            )}
          </div>

          <textarea
            value={fileContent}
            onChange={(e) => setFileContent(e.target.value)}
            placeholder="Conteúdo do código ou documento..."
            className="flex-1 w-full bg-[#03060c] border border-white/5 rounded-xl p-3 text-xs font-mono text-white focus:outline-none resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* Controlled Sandboxed Terminal */}
      <div className="winc-glass rounded-2xl p-5 border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#d9ff2f]" />
            <span>Terminal Controlado & Verificação de Testes</span>
          </h3>
          <span className="text-[10px] text-[#97a3b7] font-mono flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Sandbox de Segurança Ativa
          </span>
        </div>

        <form onSubmit={handleRunCommand} className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-2 text-xs font-mono text-[#d9ff2f]">$</span>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Digite comando seguro (ex: python -m unittest, git status)..."
              className="w-full bg-[#03060c] border border-white/10 rounded-xl pl-7 pr-4 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#d9ff2f]/50"
            />
          </div>
          <button
            type="submit"
            disabled={executing}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 text-[#d9ff2f]" />
            <span>{executing ? 'Executando...' : 'Executar'}</span>
          </button>
        </form>

        {cmdOutput && (
          <div className="p-3.5 rounded-xl bg-black/80 border border-white/10 font-mono text-[11px] max-h-48 overflow-y-auto space-y-1">
            <div className="text-[#97a3b7] text-[10px] pb-1 border-b border-white/5">
              Código de saída: <span className={cmdOutput.exit_code === 0 ? 'text-emerald-400' : 'text-red-400'}>{cmdOutput.exit_code}</span>
            </div>
            {cmdOutput.stdout && <pre className="text-emerald-300 whitespace-pre-wrap">{cmdOutput.stdout}</pre>}
            {cmdOutput.stderr && <pre className="text-red-400 whitespace-pre-wrap">{cmdOutput.stderr}</pre>}
          </div>
        )}
      </div>
    </div>
  );
};
