import React, { useRef } from 'react';
import {
  X,
  FolderOpen,
  Plus,
  Trash2,
  Copy,
  Download,
  Upload,
  Clock,
  BookOpen,
  Film,
  CheckCircle,
} from 'lucide-react';
import { ProductionProject } from '../types';

interface ProjectsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProductionProject[];
  currentProjectId: string;
  onSelectProject: (project: ProductionProject) => void;
  onNewProject: () => void;
  onDeleteProject: (projectId: string) => void;
  onDuplicateProject: (project: ProductionProject) => void;
  onImportProjectJson: (project: ProductionProject) => void;
}

export const ProjectsManagerModal: React.FC<ProjectsManagerModalProps> = ({
  isOpen,
  onClose,
  projects,
  currentProjectId,
  onSelectProject,
  onNewProject,
  onDeleteProject,
  onDuplicateProject,
  onImportProjectJson,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.title && parsed.rawSourceText !== undefined) {
          parsed.id = `project_${Date.now()}`;
          parsed.updatedAt = new Date().toISOString();
          onImportProjectJson(parsed);
          onClose();
        } else {
          alert('Wybrany plik nie jest poprawnym projektem Biblia Audio Studio.');
        }
      } catch (err) {
        alert('Błąd odczytu pliku JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-700/50 text-amber-400">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100 font-serif">
                Moje Produkcje Radiowe
              </h2>
              <p className="text-xs text-stone-400">
                Lokalne archiwum Twoich audycji biblijnych
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onNewProject();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nowy projekt</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List of projects */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {projects.map((proj) => {
            const isCurrent = proj.id === currentProjectId;
            const linesCount = proj.script?.lines?.length || 0;

            return (
              <div
                key={proj.id}
                className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                  isCurrent
                    ? 'bg-amber-950/30 border-amber-500 ring-1 ring-amber-500/50'
                    : 'bg-stone-950/80 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => {
                    onSelectProject(proj);
                    onClose();
                  }}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-stone-100">
                      {proj.title || 'Audycja bez tytułu'}
                    </h3>
                    {isCurrent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500 text-stone-950">
                        Aktywny
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-stone-400 mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-amber-400" />
                      {proj.bookName} {proj.chapterNumber}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Film className="w-3 h-3 text-stone-500" />
                      {linesCount} kwestii
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Clock className="w-3 h-3 text-stone-500" />
                      {new Date(proj.updatedAt).toLocaleDateString('pl-PL')}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onDuplicateProject(proj)}
                    className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800"
                    title="Zduplikuj projekt"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteProject(proj.id)}
                    className="p-1.5 rounded-lg bg-stone-900 hover:bg-red-950/60 text-stone-400 hover:text-red-300 border border-stone-800"
                    title="Usuń projekt"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer: Import JSON */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between text-xs">
          <label className="cursor-pointer inline-flex items-center gap-1.5 text-stone-400 hover:text-amber-300 transition-colors">
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>Zaimportuj projekt z pliku JSON</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          <span className="text-stone-500 font-mono text-[11px]">
            Zapisano w pamięci przeglądarki
          </span>
        </div>
      </div>
    </div>
  );
};
