import React, { useState } from 'react';
import { Radio, Volume2, Sparkles, Edit3, Trash2, Plus, Music, Play, Check } from 'lucide-react';
import { DramaCharacter, DramaLine, RadioDramaScript } from '../types';

interface ScriptStudioProps {
  script: RadioDramaScript;
  onUpdateScript: (updated: RadioDramaScript) => void;
  activeLineId: string | null;
  onPlaySingleLine: (line: DramaLine) => void;
  onPlayFromLine: (index: number) => void;
}

export const ScriptStudio: React.FC<ScriptStudioProps> = ({
  script,
  onUpdateScript,
  activeLineId,
  onPlaySingleLine,
  onPlayFromLine,
}) => {
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [editEmotion, setEditEmotion] = useState<string>('');
  const [editSfx, setEditSfx] = useState<string>('');

  const startEdit = (line: DramaLine) => {
    setEditingLineId(line.id);
    setEditText(line.text);
    setEditEmotion(line.emotionCue || '');
    setEditSfx(line.sfxCue || '');
  };

  const saveEdit = (lineId: string) => {
    const updatedLines = script.lines.map((l) =>
      l.id === lineId
        ? {
            ...l,
            text: editText,
            emotionCue: editEmotion.trim() || undefined,
            sfxCue: editSfx.trim() || undefined,
          }
        : l
    );
    onUpdateScript({ ...script, lines: updatedLines });
    setEditingLineId(null);
  };

  const handleDeleteLine = (lineId: string) => {
    const updatedLines = script.lines.filter((l) => l.id !== lineId);
    onUpdateScript({ ...script, lines: updatedLines });
  };

  const handleAddNewLine = () => {
    const newLine: DramaLine = {
      id: `custom_${Date.now()}`,
      sceneNumber: 1,
      characterId: script.characters[0]?.id || 'narrator',
      characterName: script.characters[0]?.name || 'Lektor',
      text: 'Wpisz nową kwestię biblijną lub komentarz lektorski...',
      emotionCue: '(ze spokojem)',
      pauseAfterMs: 700,
    };
    onUpdateScript({ ...script, lines: [...script.lines, newLine] });
  };

  return (
    <div id="script-teleprompter" className="space-y-4">
      {/* Script Title Card */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 text-stone-100 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-950/60 border border-amber-700/50">
                {script.bibleReference}
              </span>
              <span className="text-xs text-stone-400">
                Czas: ok. {script.estimatedDurationMinutes} min
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-amber-100 mt-2">
              {script.title}
            </h1>
            {script.subtitle && (
              <p className="text-xs sm:text-sm text-stone-400 mt-0.5">
                {script.subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-xs text-stone-400 bg-stone-950 px-3 py-1.5 rounded-lg border border-stone-800 flex items-center gap-1.5 font-mono">
              <Music className="w-3.5 h-3.5 text-amber-400" />
              {script.atmosphereMood}
            </span>
          </div>
        </div>

        {/* Station Radio Intro Box */}
        <div className="mt-4 p-3.5 rounded-xl bg-amber-950/25 border border-amber-900/50 text-xs text-amber-200/90 leading-relaxed flex items-start gap-2.5">
          <Radio className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-300 block mb-0.5">
              Oficjalna Zapowiedź Radiowa (Intro Christian Culture):
            </span>
            "{script.stationIntro}"
          </div>
        </div>
      </div>

      {/* Script Lines Flow */}
      <div className="space-y-3">
        {script.lines.map((line, index) => {
          const char = script.characters.find((c) => c.id === line.characterId);
          const isActive = activeLineId === line.id;
          const isEditing = editingLineId === line.id;

          return (
            <div
              key={line.id}
              id={`line-${line.id}`}
              className={`rounded-2xl border transition-all duration-200 ${
                isActive
                  ? 'bg-amber-950/50 border-amber-500 ring-2 ring-amber-500/30 shadow-lg scale-[1.01]'
                  : 'bg-stone-900/90 border-stone-800 hover:border-stone-700'
              } p-4 sm:p-5`}
            >
              {isEditing ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <select
                      value={line.characterId}
                      onChange={(e) => {
                        const selChar = script.characters.find((c) => c.id === e.target.value);
                        if (selChar) {
                          const updated = script.lines.map((l) =>
                            l.id === line.id
                              ? { ...l, characterId: selChar.id, characterName: selChar.name }
                              : l
                          );
                          onUpdateScript({ ...script, lines: updated });
                        }
                      }}
                      className="bg-stone-950 border border-stone-700 rounded-lg px-2.5 py-1 text-xs text-amber-200 focus:outline-none"
                    >
                      {script.characters.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.gender})
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => saveEdit(line.id)}
                      className="flex items-center gap-1 text-xs bg-amber-600 text-stone-950 px-3 py-1 rounded-md font-semibold hover:bg-amber-500"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Zapisz
                    </button>
                  </div>

                  <input
                    type="text"
                    value={editEmotion}
                    onChange={(e) => setEditEmotion(e.target.value)}
                    placeholder="Wskazówka aktorska, np. (ze skruchą)"
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 placeholder:text-stone-600"
                  />

                  <input
                    type="text"
                    value={editSfx}
                    onChange={(e) => setEditSfx(e.target.value)}
                    placeholder="Efekt dźwiękowy SFX, np. (szum wiatru)"
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-blue-300 placeholder:text-stone-600"
                  />

                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-stone-200"
                  />
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-mono text-stone-500">
                        #{index + 1}
                      </span>
                      <div
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          char?.gender === 'divine'
                            ? 'bg-amber-950/70 text-amber-300 border-amber-700/60'
                            : char?.gender === 'narrator'
                            ? 'bg-stone-800 text-stone-300 border-stone-700'
                            : char?.gender === 'female'
                            ? 'bg-rose-950/70 text-rose-300 border-rose-700/60'
                            : 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60'
                        }`}
                      >
                        {line.characterName}
                      </div>

                      {line.emotionCue && (
                        <span className="text-xs text-amber-400/90 italic font-serif">
                          {line.emotionCue}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onPlaySingleLine(line)}
                        className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-amber-300 transition-colors"
                        title="Odsłuchaj tylko tę kwestię"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onPlayFromLine(index)}
                        className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-amber-300 transition-colors"
                        title="Odtwarzaj od tego miejsca"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => startEdit(line)}
                        className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-stone-100 transition-colors"
                        title="Edytuj kwestię"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteLine(line.id)}
                        className="p-1.5 rounded-lg bg-stone-800 hover:bg-red-950 text-stone-400 hover:text-red-400 transition-colors"
                        title="Usuń kwestię"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {line.sfxCue && (
                    <div className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-mono text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-900/40">
                      <Music className="w-3 h-3 text-blue-400" />
                      <span>{line.sfxCue}</span>
                    </div>
                  )}

                  <p className="text-sm sm:text-base text-stone-200 leading-relaxed font-sans mt-1">
                    {line.text}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Line Button */}
      <div className="flex justify-center pt-2">
        <button
          onClick={handleAddNewLine}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-850 hover:bg-stone-800 border border-dashed border-stone-700 text-stone-300 text-xs font-medium hover:border-amber-600 transition-all"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Dodaj kolejną kwestię lub narrację</span>
        </button>
      </div>

      {/* Station Radio Outro Box */}
      <div className="mt-4 p-4 rounded-xl bg-amber-950/25 border border-amber-900/50 text-xs text-amber-200/90 leading-relaxed flex items-start gap-2.5">
        <Radio className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-300 block mb-0.5">
            Oficjalne Zakończenie Radiowe (Outro Christian Culture):
          </span>
          "{script.stationOutro}"
        </div>
      </div>
    </div>
  );
};
