import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Files, Folder, FileText, Download, Eye, RefreshCw, X } from 'lucide-react';

export const FilesPage: React.FC = () => {
  const [currentPath, setCurrentPath] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // File preview modal
  const [previewFile, setPreviewFile] = useState<{ path: string; content: string } | null>(null);

  const loadDirectory = async (path = '') => {
    try {
      setLoading(true);
      const data = await api.browseFiles(path);
      setItems(data.items || []);
      setCurrentPath(path);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDirectory('');
  }, []);

  const handleItemClick = (item: any) => {
    if (item.is_dir) {
      loadDirectory(item.relative_path);
    } else {
      api.readFile(item.relative_path).then(res => {
        setPreviewFile({ path: item.relative_path, content: res.content });
      });
    }
  };

  const handleNavigateUp = () => {
    if (!currentPath) return;
    const parts = currentPath.split('/');
    parts.pop();
    loadDirectory(parts.join('/'));
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-white">Central de Arquivos & Entregáveis</h1>
          <p className="text-xs text-[#97a3b7]">
            Estrutura organizada de projetos, saídas de agentes, backups e documentos locais.
          </p>
        </div>
        <button
          onClick={() => loadDirectory(currentPath)}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10"
          title="Recarregar"
        >
          <RefreshCw className="w-4 h-4 text-[#97a3b7]" />
        </button>
      </div>

      {/* Breadcrumb Path Bar */}
      <div className="winc-glass rounded-2xl p-4 border border-white/10 flex items-center gap-2 text-xs">
        <button
          onClick={() => loadDirectory('')}
          className="text-[#d9ff2f] font-bold hover:underline"
        >
          storage
        </button>
        {currentPath && (
          <>
            <span className="text-[#97a3b7]">/</span>
            <span className="text-white font-mono">{currentPath}</span>
            <button
              onClick={handleNavigateUp}
              className="ml-auto px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[#97a3b7] text-[10px]"
            >
              Voltar um nível
            </button>
          </>
        )}
      </div>

      {/* Files Grid */}
      {loading ? (
        <div className="text-center py-12 text-xs text-[#97a3b7]">Carregando arquivos...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item, idx) => (
            <div
              key={idx}
              onClick={() => handleItemClick(item)}
              className="winc-glass winc-glass-hover rounded-2xl p-4 border border-white/10 cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-start gap-3">
                {item.is_dir ? (
                  <Folder className="w-6 h-6 text-[#1f77ff] shrink-0" />
                ) : (
                  <FileText className="w-6 h-6 text-[#d9ff2f] shrink-0" />
                )}
                <div className="overflow-hidden">
                  <h4 className="text-xs font-bold text-white truncate leading-tight">{item.name}</h4>
                  <p className="text-[10px] text-[#97a3b7] mt-0.5">
                    {item.is_dir ? 'Pasta' : `${Math.round(item.size_bytes / 1024)} KB`}
                  </p>
                </div>
              </div>

              {!item.is_dir && (
                <div className="mt-4 pt-2 border-t border-white/5 flex justify-end text-[11px] text-[#d9ff2f] font-semibold items-center gap-1">
                  <Eye className="w-3 h-3" /> Visualizar
                </div>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <div className="col-span-full p-8 text-center text-xs text-[#97a3b7] winc-glass rounded-2xl border border-white/10">
              Pasta vazia.
            </div>
          )}
        </div>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="winc-glass max-w-3xl w-full rounded-2xl p-6 border border-white/10 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs font-mono text-white truncate max-w-lg">{previewFile.path}</span>
              <button onClick={() => setPreviewFile(null)} className="text-[#97a3b7] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              <pre className="p-4 rounded-xl bg-black/70 border border-white/10 text-xs font-mono text-white whitespace-pre-wrap leading-relaxed">
                {previewFile.content}
              </pre>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setPreviewFile(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
