import React, { useState } from 'react';
import {
  FileText,
  Upload,
  ShieldCheck,
  Clock,
  Sparkles,
  BookOpen,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { BIBLE_BOOKS, DEMO_SCRIPTS } from '../data/presets';
import { BibleSourceType, ProductionProject } from '../types';

interface Step1TextInputProps {
  project: ProductionProject;
  onUpdateProject: (updated: Partial<ProductionProject>) => void;
  onProceedToAnalyze: () => void;
}

export const Step1TextInput: React.FC<Step1TextInputProps> = ({
  project,
  onUpdateProject,
  onProceedToAnalyze,
}) => {
  const [fileError, setFileError] = useState<string | null>(null);

  const characterCount = project.rawSourceText.length;
  // Professional radio recitation speed: approx. 800-900 characters per minute
  const estimatedMinutes = Math.max(1, Math.round(characterCount / 850));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'txt') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          onUpdateProject({
            rawSourceText: text,
            title: project.title === 'Nowe Słuchowisko' ? file.name.replace('.txt', '') : project.title,
          });
        }
      };
      reader.readAsText(file);
    } else {
      // For simple plain text extraction of small files or prompt to paste
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          // Clean non-printable characters if text-like
          const cleaned = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
          if (cleaned.length > 50) {
            onUpdateProject({ rawSourceText: cleaned });
          } else {
            setFileError('Dla plików DOCX/PDF zalecamy skopiowanie i wklejenie tekstu bezpośrednio w polu poniżej.');
          }
        } catch {
          setFileError('Nie udało się odczytać pliku. Skopiuj i wklej tekst ręcznie.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleLoadDemo = () => {
    const demo = DEMO_SCRIPTS.prodigal_son;
    // Combine demo lines to create raw source text
    const fullVerbatimText = demo.lines.map((l) => l.originalVerbatimText || l.text).join('\n\n');
    onUpdateProject({
      title: 'Przypowieść o Synu Marnotrawnym (Łk 15)',
      bookName: 'Ewangelia wg św. Łukasza',
      chapterNumber: '15',
      translation: 'Przekład z domeny publicznej (Biblia Gdańska / Wujka)',
      sourceType: 'public_domain',
      rightsConfirmed: true,
      rawSourceText: fullVerbatimText,
      script: demo,
      status: 'analyzed',
    });
  };

  const canProceed =
    project.rawSourceText.trim().length > 20 &&
    project.rightsConfirmed &&
    project.bookName.trim().length > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner / Mission */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-900 to-amber-950/30 border border-amber-800/40 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[11px] font-bold uppercase tracking-wider border border-amber-500/30">
                Krok 1 z 7
              </span>
              <h2 className="text-lg font-serif font-bold text-stone-100">
                Wprowadzenie Tekstu Pisma Świętego
              </h2>
            </div>
            <p className="text-xs text-stone-300">
              Wklej rozdział Biblii lub wczytaj plik. Tekst biblijny pozostanie ściśle nienaruszony.
            </p>
          </div>
          <button
            onClick={handleLoadDemo}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-900/40 hover:bg-amber-800/60 border border-amber-700/60 text-amber-200 text-xs font-semibold transition-all hover:scale-102 shrink-0"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Załaduj fragment demo (Łk 15)</span>
          </button>
        </div>
      </div>

      {/* Main Form Fields Grid */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-6 space-y-5 shadow-md">
        {/* Row 1: Title & Book */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              Nazwa projektu audycji:
            </label>
            <input
              type="text"
              value={project.title}
              onChange={(e) => onUpdateProject({ title: e.target.value })}
              placeholder="np. Przypowieść o Synu Marnotrawnym"
              className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-xl px-3.5 py-2 text-stone-100 text-sm focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              Język produkcji:
            </label>
            <div className="flex items-center gap-1.5">
              <span className="px-3 py-2 bg-stone-950 border border-amber-600/60 text-amber-300 rounded-xl text-xs font-bold w-full text-center">
                Polski (Domyślny)
              </span>
            </div>
          </div>
        </div>

        {/* Row 2: Book Quick Selection & Chapter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-stone-300">
                Księga Pisma Świętego:
              </label>
              <span className="text-[11px] text-stone-400">lub wybierz z listy poniżej</span>
            </div>
            <input
              type="text"
              value={project.bookName}
              onChange={(e) => onUpdateProject({ bookName: e.target.value })}
              placeholder="np. Ewangelia wg św. Łukasza"
              className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-xl px-3.5 py-2 text-stone-100 text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              Rozdział:
            </label>
            <input
              type="text"
              value={project.chapterNumber}
              onChange={(e) => onUpdateProject({ chapterNumber: e.target.value })}
              placeholder="np. 15"
              className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-xl px-3.5 py-2 text-stone-100 text-sm focus:outline-none text-center font-bold"
            />
          </div>
        </div>

        {/* Quick select chips for popular books */}
        <div>
          <span className="text-[11px] text-stone-400 block mb-2 font-medium">
            Szybki wybór księgi:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {BIBLE_BOOKS.slice(0, 10).map((b) => (
              <button
                key={b.abbr}
                type="button"
                onClick={() => onUpdateProject({ bookName: b.name })}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  project.bookName === b.name
                    ? 'bg-amber-600 text-stone-950 border-amber-500 font-bold'
                    : 'bg-stone-950 text-stone-300 border-stone-800 hover:border-stone-600'
                }`}
              >
                {b.abbr} • {b.name}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Translation & Copyright Source */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-800">
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              Źródło i przekład Biblii:
            </label>
            <select
              value={project.sourceType}
              onChange={(e) =>
                onUpdateProject({
                  sourceType: e.target.value as BibleSourceType,
                  translation:
                    e.target.value === 'public_domain'
                      ? 'Przekład z domeny publicznej (Biblia Gdańska / Wujka)'
                      : e.target.value === 'licensed_cc'
                      ? 'Przekład licencjonowany przez Christian Culture'
                      : 'Własny tekst użytkownika',
                })
              }
              className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-xl px-3 py-2 text-stone-100 text-xs focus:outline-none"
            >
              <option value="public_domain">
                Przekład należący do domeny publicznej (np. Biblia Gdańska / Wujka)
              </option>
              <option value="licensed_cc">
                Przekład licencjonowany przez Christian Culture
              </option>
              <option value="user_text">Tekst własny użytkownika</option>
              <option value="other_authorized">
                Inne — użytkownik potwierdza prawo do wykorzystania
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              Nazwa / sygnatura przekładu:
            </label>
            <input
              type="text"
              value={project.translation}
              onChange={(e) => onUpdateProject({ translation: e.target.value })}
              placeholder="np. Biblia Gdańska (Domena Publiczna)"
              className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-xl px-3.5 py-2 text-stone-100 text-xs focus:outline-none"
            />
          </div>
        </div>

        {/* Scripture Textarea & File Drag/Drop */}
        <div className="space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              Treść rozdziału biblijnego:
            </label>

            <div className="flex items-center gap-4 text-xs text-stone-400">
              <span className="flex items-center gap-1 font-mono">
                <FileText className="w-3.5 h-3.5 text-stone-500" />
                {characterCount} znaków
              </span>
              <span className="flex items-center gap-1 font-mono text-amber-300 font-semibold">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                ~{estimatedMinutes} min audycji
              </span>
            </div>
          </div>

          <textarea
            value={project.rawSourceText}
            onChange={(e) => onUpdateProject({ rawSourceText: e.target.value })}
            rows={10}
            placeholder="Wklej tutaj pełny, oryginalny tekst rozdziału biblijnego wraz z wersetami... Tekst nie zostanie samowolnie zmieniony przez aplikację."
            className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-xl p-4 text-stone-200 text-sm font-sans leading-relaxed focus:outline-none resize-y"
          />

          {/* File Upload Option */}
          <div className="flex items-center justify-between flex-wrap gap-3 pt-1 text-xs">
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-stone-100 border border-stone-700 transition-colors">
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Wczytaj plik TXT / DOCX / PDF</span>
              <input
                type="file"
                accept=".txt,.docx,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <span className="text-[11px] text-stone-500">
              Maksymalny zalecany rozmiar: 1 pełny rozdział na sesję produkcyjną
            </span>
          </div>

          {fileError && (
            <div className="p-3 bg-amber-950/40 border border-amber-700/60 rounded-xl text-xs text-amber-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{fileError}</span>
            </div>
          )}
        </div>

        {/* Legal & Rights Confirmation */}
        <div className="p-4 bg-stone-950 border border-amber-900/40 rounded-xl space-y-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={project.rightsConfirmed}
              onChange={(e) => onUpdateProject({ rightsConfirmed: e.target.checked })}
              className="mt-0.5 rounded accent-amber-500 w-4 h-4"
            />
            <div className="text-xs text-stone-300">
              <span className="font-semibold text-stone-100 block mb-0.5">
                Oświadczenie o prawach do tekstu (Wymagane):
              </span>
              <span>
                Potwierdzam, że mam prawo wykorzystać i opublikować podany tekst (przekład należy do domeny publicznej, posiadam licencję Christian Culture lub zgodę właściciela praw autorskich).
              </span>
            </div>
          </label>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            disabled={!canProceed}
            onClick={onProceedToAnalyze}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold shadow-lg transition-all ${
              canProceed
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 hover:scale-102'
                : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Przejdź do analizy tekstu (Krok 2) →</span>
          </button>
        </div>
      </div>
    </div>
  );
};
