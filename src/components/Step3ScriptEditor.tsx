import React, { useState } from 'react';
import {
  Film,
  Play,
  RotateCcw,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  Filter,
  CheckCircle,
  Volume2,
  AlertCircle,
  Clock,
  Sparkle,
} from 'lucide-react';
import { DramaCharacter, DramaLine, ProductionProject } from '../types';
import { CustomAudioUploader } from './CustomAudioUploader';

interface Step3ScriptEditorProps {
  project: ProductionProject;
  onUpdateProject: (updated: Partial<ProductionProject>) => void;
  onAuditionLine: (line: DramaLine) => void;
  onProceedToCasting: () => void;
}

export const Step3ScriptEditor: React.FC<Step3ScriptEditorProps> = ({
  project,
  onUpdateProject,
  onAuditionLine,
  onProceedToCasting,
}) => {
  const [selectedCharacterFilter, setSelectedCharacterFilter] = useState<string>('all');
  const [editingLineId, setEditingLineId] = useState<string | null>(null);

  const script = project.script;
  const characters = script?.characters || [];
  const lines = script?.lines || [];

  const getRoleColorStyle = (char?: DramaCharacter) => {
    if (!char) return 'bg-stone-900 border-stone-800 text-stone-300';
    if (char.roleType === 'god' || char.gender === 'divine') {
      return 'bg-amber-950/40 border-amber-500/60 text-amber-200';
    }
    if (char.roleType === 'jesus') {
      return 'bg-purple-950/40 border-purple-500/60 text-purple-200';
    }
    if (char.roleType === 'narrator') {
      return 'bg-amber-900/30 border-amber-700/50 text-amber-100';
    }
    if (char.gender === 'female') {
      return 'bg-teal-950/40 border-teal-600/50 text-teal-200';
    }
    if (char.roleType === 'crowd') {
      return 'bg-stone-900 border-stone-600 text-stone-200';
    }
    return 'bg-blue-950/40 border-blue-600/50 text-blue-200';
  };

  const handleUpdateLine = (lineId: string, updates: Partial<DramaLine>) => {
    const updatedLines = lines.map((line) => {
      if (line.id === lineId) {
        return { ...line, ...updates };
      }
      return line;
    });
    onUpdateProject({
      script: { ...script, lines: updatedLines },
    });
  };

  const handleRestoreVerbatim = (lineId: string) => {
    const targetLine = lines.find((l) => l.id === lineId);
    if (targetLine && targetLine.originalVerbatimText) {
      handleUpdateLine(lineId, { text: targetLine.originalVerbatimText });
    }
  };

  const handleDeleteLine = (lineId: string) => {
    if (lines.length <= 1) return;
    const updatedLines = lines.filter((l) => l.id !== lineId);
    onUpdateProject({
      script: { ...script, lines: updatedLines },
    });
  };

  const handleAddLineAfter = (index: number) => {
    const prev = lines[index];
    const newLine: DramaLine = {
      id: `line_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      sceneNumber: prev.sceneNumber || 1,
      verseRef: prev.verseRef || '',
      characterId: prev.characterId,
      characterName: prev.characterName,
      text: 'Wpisz tekst wersetu...',
      originalVerbatimText: 'Wpisz tekst wersetu...',
      emotionCue: '(spokojnie)',
      pauseAfterMs: 700,
    };
    const newLines = [...lines.slice(0, index + 1), newLine, ...lines.slice(index + 1)];
    onUpdateProject({
      script: { ...script, lines: newLines },
    });
  };

  const filteredLines = lines.filter((l) => {
    if (selectedCharacterFilter === 'all') return true;
    return l.characterId === selectedCharacterFilter;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-900 to-amber-950/30 border border-amber-800/40 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[11px] font-bold uppercase tracking-wider border border-amber-500/30">
                Krok 3 z 7
              </span>
              <h2 className="text-lg font-serif font-bold text-stone-100">
                Edytor Scenariusza Słuchowiska
              </h2>
            </div>
            <p className="text-xs text-stone-300">
              Zweryfikuj podział na role, emocje i pauzy. Możesz odsłuchać pojedynczą kwestię lub przywrócić tekst źródłowy.
            </p>
          </div>

          <button
            type="button"
            onClick={onProceedToCasting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-bold shadow-md transition-all hover:scale-102 shrink-0"
          >
            <span>Zatwierdź scenariusz → Krok 4: Obsada</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-stone-400 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            Filtruj role:
          </span>
          <button
            type="button"
            onClick={() => setSelectedCharacterFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              selectedCharacterFilter === 'all'
                ? 'bg-amber-600 text-stone-950 font-bold border-amber-500'
                : 'bg-stone-950 text-stone-300 border-stone-800 hover:border-stone-700'
            }`}
          >
            Wszystkie kwestie ({lines.length})
          </button>
          {characters.map((char) => (
            <button
              key={char.id}
              type="button"
              onClick={() => setSelectedCharacterFilter(char.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                selectedCharacterFilter === char.id
                  ? 'bg-amber-600 text-stone-950 font-bold border-amber-500'
                  : 'bg-stone-950 text-stone-300 border-stone-800 hover:border-stone-700'
              }`}
            >
              {char.name} ({lines.filter((l) => l.characterId === char.id).length})
            </button>
          ))}
        </div>

        <div className="text-xs text-stone-400 font-mono">
          Łącznie scen: {Math.max(1, ...lines.map((l) => l.sceneNumber || 1))}
        </div>
      </div>

      {/* Lines List */}
      <div className="space-y-3.5">
        {filteredLines.map((line, idx) => {
          const char = characters.find((c) => c.id === line.characterId);
          const colorClass = getRoleColorStyle(char);
          const isVerbatimAltered =
            line.originalVerbatimText && line.text.trim() !== line.originalVerbatimText.trim();

          return (
            <div
              key={line.id}
              className={`border rounded-2xl p-4 transition-all shadow-md ${colorClass}`}
            >
              {/* Header row: Speaker selector, scene/verse tags, action buttons */}
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2 pb-2 border-b border-stone-800/60">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Speaker selector */}
                  <select
                    value={line.characterId}
                    onChange={(e) => {
                      const newChar = characters.find((c) => c.id === e.target.value);
                      handleUpdateLine(line.id, {
                        characterId: e.target.value,
                        characterName: newChar?.name || line.characterName,
                      });
                    }}
                    className="bg-stone-950/80 border border-stone-700 text-stone-100 text-xs font-bold rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-500"
                  >
                    {characters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.geminiVoice || 'Kore'})
                      </option>
                    ))}
                  </select>

                  {/* Scene and verse tags */}
                  <span className="text-[11px] px-2 py-0.5 rounded bg-stone-900/90 text-stone-300 font-mono border border-stone-700">
                    Scena {line.sceneNumber || 1}
                  </span>
                  {line.verseRef && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 font-mono border border-amber-800/60 font-semibold">
                      {line.verseRef}
                    </span>
                  )}
                </div>

                {/* Right actions: Audition, Restore, Delete */}
                <div className="flex items-center gap-1.5">
                  {isVerbatimAltered && (
                    <button
                      type="button"
                      onClick={() => handleRestoreVerbatim(line.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-amber-900/60 hover:bg-amber-800 text-amber-200 text-[11px] font-semibold transition-colors"
                      title="Przywróć oryginalny tekst wersetu"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Przywróć werset</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onAuditionLine(line)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-amber-700 hover:text-stone-950 text-stone-200 text-xs font-medium border border-stone-700 transition-colors"
                    title="Odsłuchaj tę kwestię"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Odsłuchaj</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddLineAfter(idx)}
                    className="p-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-700"
                    title="Dodaj kwestię poniżej"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteLine(line.id)}
                    className="p-1 rounded-lg bg-stone-900 hover:bg-red-950/60 text-stone-400 hover:text-red-300 border border-stone-700"
                    title="Usuń tę kwestię"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Textarea for line content */}
              <div className="space-y-2">
                <textarea
                  value={line.text}
                  onChange={(e) => handleUpdateLine(line.id, { text: e.target.value })}
                  rows={2}
                  className="w-full bg-stone-950/60 border border-stone-800/80 focus:border-amber-500 rounded-xl p-3 text-stone-100 text-sm font-sans leading-relaxed focus:outline-none resize-y"
                />

                {/* Didaskalia and timing row */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-stone-400 block mb-0.5">
                      Wskazówka aktorska (emocja):
                    </span>
                    <input
                      type="text"
                      value={line.emotionCue || ''}
                      onChange={(e) => handleUpdateLine(line.id, { emotionCue: e.target.value })}
                      placeholder="np. (z głębokim wzruszeniem)"
                      className="w-full bg-stone-950/80 border border-stone-800 rounded-lg px-2 py-1 text-stone-300 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-stone-400 block mb-0.5">
                      Tempo (Reżyser AI):
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="range"
                        min="0.85"
                        max="1.15"
                        step="0.01"
                        value={line.tempoMultiplier ?? 1.0}
                        onChange={(e) =>
                          handleUpdateLine(line.id, { tempoMultiplier: parseFloat(e.target.value) })
                        }
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                      <span className="text-[11px] font-mono text-amber-300 font-bold shrink-0">
                        {(line.tempoMultiplier ?? 1.0).toFixed(2)}x
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-stone-400 block mb-0.5">
                      Efekt tła (SFX):
                    </span>
                    <input
                      type="text"
                      value={line.sfxCue || ''}
                      onChange={(e) => handleUpdateLine(line.id, { sfxCue: e.target.value })}
                      placeholder="np. szum fal, echo jaskini"
                      className="w-full bg-stone-950/80 border border-stone-800 rounded-lg px-2 py-1 text-stone-300 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-stone-400 block mb-0.5">
                      Pauza po kwestii (ms):
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="100"
                        min="200"
                        max="3000"
                        value={line.pauseAfterMs || 700}
                        onChange={(e) =>
                          handleUpdateLine(line.id, { pauseAfterMs: parseInt(e.target.value) || 700 })
                        }
                        className="w-full bg-stone-950/80 border border-stone-800 rounded-lg px-2 py-1 text-stone-300 text-xs font-mono text-center focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-[11px] text-stone-400">ms</span>
                    </div>
                  </div>
                </div>

                {/* Custom Voice / Audio Recording */}
                <div className="pt-2 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-stone-400">Ścieżka audio:</span>
                    {line.customAudioFile ? (
                      <span className="text-emerald-400 font-mono text-xs flex items-center gap-1 font-bold">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        Własny plik ({line.customAudioFile.fileName})
                      </span>
                    ) : (
                      <span className="text-stone-400 font-mono text-xs">
                        Głos syntezowany AI ({line.characterName})
                      </span>
                    )}
                  </div>
                  <CustomAudioUploader
                    compact
                    label={`Kwestia #${line.id}`}
                    trackType="voice"
                    currentTrack={line.customAudioFile}
                    lineText={line.text}
                    characterName={line.characterName}
                    onTrackUploaded={(track) => {
                      handleUpdateLine(line.id, { customAudioFile: track });
                      const existingClips = project.generatedClips || [];
                      const updatedClips = existingClips.filter((c) => c.lineId !== line.id);
                      updatedClips.push({
                        lineId: line.id,
                        characterId: line.characterId,
                        audioBase64: '',
                        audioUrl: track.audioUrl,
                        durationSec: track.durationSec,
                      });
                      onUpdateProject({ generatedClips: updatedClips });
                    }}
                    onTrackRemoved={() => {
                      handleUpdateLine(line.id, { customAudioFile: undefined });
                      const existingClips = project.generatedClips || [];
                      const updatedClips = existingClips.filter((c) => c.lineId !== line.id);
                      onUpdateProject({ generatedClips: updatedClips });
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-4 flex justify-end">
        <button
          id="action-proceed-step4"
          type="button"
          onClick={onProceedToCasting}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-sm font-bold shadow-lg transition-all hover:scale-102"
        >
          <span>Zatwierdź scenariusz i przejdź do obsady (Krok 4)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
