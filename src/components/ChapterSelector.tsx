import React, { useState } from 'react';
import { BookOpen, Sparkles, Wand2, FileText, CheckCircle2, AlertCircle, Radio } from 'lucide-react';
import { BIBLE_BOOKS, PRESET_SCRIPTS } from '../data/presets';
import { RadioDramaScript } from '../types';

interface ChapterSelectorProps {
  currentScript: RadioDramaScript;
  onSelectScript: (script: RadioDramaScript) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ChapterSelector: React.FC<ChapterSelectorProps> = ({
  currentScript,
  onSelectScript,
  isOpen,
  onClose,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('prodigal_son');
  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>('preset');
  
  // Custom generation state
  const [selectedBook, setSelectedBook] = useState<string>('Ewangelia Łukasza');
  const [chapterNumber, setChapterNumber] = useState<string>('15');
  const [versesRange, setVersesRange] = useState<string>('');
  const [customText, setCustomText] = useState<string>('');
  const [translation, setTranslation] = useState<string>('Uwspółcześniona Biblia Gdańska (UBG 2024)');
  const [dramaStyle, setDramaStyle] = useState<string>('Pełne słuchowisko radiowe z efektami SFX');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isLoadingUbg, setIsLoadingUbg] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyPreset = (presetKey: string) => {
    setSelectedPreset(presetKey);
    const script = PRESET_SCRIPTS[presetKey];
    if (script) {
      onSelectScript(script);
      onClose();
    }
  };

  const handleGenerateScript = async () => {
    setIsGenerating(true);
    setErrorMessage(null);

    const passage = `${selectedBook} ${chapterNumber}${versesRange ? `, ${versesRange}` : ''}`;

    try {
      const response = await fetch('/api/drama/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          passage,
          customText: customText.trim() || undefined,
          translation,
          dramaPace: dramaStyle,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Nie udało się przetworzyć rozdziału.');
      }

      if (data.script) {
        onSelectScript(data.script);
        onClose();
      } else {
        throw new Error('Otrzymano nieprawidłowy format słuchowiska.');
      }
    } catch (err: any) {
      console.error('Błąd generowania:', err);
      setErrorMessage(err.message || 'Wystąpił błąd podczas adaptacji radiowej.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadUbgText = async () => {
    setIsLoadingUbg(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/bible/ubg/chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book: selectedBook,
          chapter: parseInt(chapterNumber || '1', 10) || 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Nie udało się pobrać tekstu z UBG');
      setCustomText(data.text);
      setTranslation('Uwspółcześniona Biblia Gdańska (UBG 2024)');
    } catch (e: any) {
      setErrorMessage(e.message || 'Błąd podczas wczytywania rozdziału z UBG');
    } finally {
      setIsLoadingUbg(false);
    }
  };

  return (
    <div
      id="modal-chapter-selector"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="w-full max-w-2xl bg-stone-900 border border-amber-900/50 rounded-2xl shadow-2xl overflow-hidden text-stone-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-stone-950/60 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-900/60 border border-amber-700/60 flex items-center justify-center text-amber-300">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-amber-300">
                Wybór Rozdziału Biblijnego do Słuchowiska
              </h2>
              <p className="text-xs text-stone-400">
                Christian Culture • Polskie Radio www.polskieradio.cc
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-200 text-sm px-2.5 py-1 rounded-md bg-stone-800 hover:bg-stone-700 transition-colors"
          >
            Zamknij
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-stone-800 bg-stone-950/40 p-1.5 gap-2 px-5">
          <button
            onClick={() => setActiveTab('preset')}
            className={`flex-1 py-2 px-3 text-xs sm:text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'preset'
                ? 'bg-amber-900/60 text-amber-200 border border-amber-700/70 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Gotowe Arcydzieła Słuchowisk</span>
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-2 px-3 text-xs sm:text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'custom'
                ? 'bg-amber-900/60 text-amber-200 border border-amber-700/70 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            <span>Dowolny Rozdział (AI Adaptacja)</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-800/80 text-red-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === 'preset' ? (
            <div className="space-y-3">
              <p className="text-xs text-stone-400 leading-relaxed">
                Wybierz jedno z przygotowanych radiowych słuchowisk z pełnym podziałem na role, wskazówkami reżyserskimi i udźwiękowieniem:
              </p>

              <div className="grid sm:grid-cols-2 gap-3 pt-1">
                {Object.entries(PRESET_SCRIPTS).map(([key, script]) => {
                  const isCurrent = currentScript.title === script.title;
                  return (
                    <div
                      key={key}
                      onClick={() => handleApplyPreset(key)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all text-left flex flex-col justify-between group ${
                        isCurrent
                          ? 'bg-amber-950/40 border-amber-500/80 ring-1 ring-amber-500/40'
                          : 'bg-stone-850 border-stone-750 hover:border-amber-700/60 hover:bg-stone-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400/90 font-semibold">
                            {script.bibleReference}
                          </span>
                          {isCurrent && (
                            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                          )}
                        </div>
                        <h3 className="font-serif font-bold text-sm text-stone-100 group-hover:text-amber-200 transition-colors">
                          {script.title}
                        </h3>
                        <p className="text-xs text-stone-400 mt-1 line-clamp-2">
                          {script.subtitle || script.atmosphereMood}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
                        <span>{script.characters.length} ról aktorskich</span>
                        <span>{script.lines.length} kwestii</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-stone-400 leading-relaxed">
                Podaj dowolny rozdział z Pisma Świętego lub wklej własny tekst. Nasz reżyser AI dla Christian Culture automatycznie rozpisze dialogi, role, zapowiedzi stacji i oprawę SFX:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-stone-300 mb-1">
                    Księga Pisma Świętego
                  </label>
                  <select
                    value={selectedBook}
                    onChange={(e) => setSelectedBook(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-stone-200 focus:outline-none focus:border-amber-500"
                  >
                    <optgroup label="Nowy Testament">
                      {BIBLE_BOOKS.filter((b) => b.testament === 'NT').map((b) => (
                        <option key={b.abbr} value={b.name}>
                          {b.name} ({b.abbr})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Stary Testament">
                      {BIBLE_BOOKS.filter((b) => b.testament === 'ST').map((b) => (
                        <option key={b.abbr} value={b.name}>
                          {b.name} ({b.abbr})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">
                    Rozdział (np. 1, 15)
                  </label>
                  <input
                    type="text"
                    value={chapterNumber}
                    onChange={(e) => setChapterNumber(e.target.value)}
                    placeholder="np. 1"
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">
                    Zakres wersetów (opcjonalnie)
                  </label>
                  <input
                    type="text"
                    value={versesRange}
                    onChange={(e) => setVersesRange(e.target.value)}
                    placeholder="np. 1-25 lub cały rozdział"
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">
                    Przekład Biblijny
                  </label>
                  <select
                    value={translation}
                    onChange={(e) => setTranslation(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Uwspółcześniona Biblia Gdańska (UBG 2024)">Uwspółcześniona Biblia Gdańska (UBG 2024 - Domyślna)</option>
                    <option value="Biblia Tysiąclecia">Biblia Tysiąclecia (Liturgiczna)</option>
                    <option value="Biblia Paulistów">Edycja Świętego Pawła (Paulistów)</option>
                    <option value="Biblia Warszawska">Biblia Warszawska</option>
                    <option value="Biblia Gdańska">Biblia Gdańska (Tradycyjna)</option>
                    <option value="Współczesny język radiowy">Adaptacja do współczesnego języka żywego radia</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-stone-300">
                    Oryginalny tekst rozdziału lub fragmentu:
                  </label>
                  <button
                    type="button"
                    onClick={handleLoadUbgText}
                    disabled={isLoadingUbg}
                    className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>{isLoadingUbg ? 'Wczytywanie z PDF...' : 'Wczytaj z oficjalnego PDF UBG'}</span>
                  </button>
                </div>
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Kliknij 'Wczytaj z oficjalnego PDF UBG' powyżej lub wklej własny tekst..."
                  rows={4}
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500 placeholder:text-stone-600 font-sans"
                />
              </div>

              <div className="pt-2">
                <button
                  id="btn-trigger-ai-script"
                  disabled={isGenerating}
                  onClick={handleGenerateScript}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-stone-950 font-bold text-sm shadow-lg flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <span className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                      <span>Reżyserowanie Słuchowiska Radiowego...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-stone-950" />
                      <span>Generuj Radiowe Słuchowisko z Podziałem na Role</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
