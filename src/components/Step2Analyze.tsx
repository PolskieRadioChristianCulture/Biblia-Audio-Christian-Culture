import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Users,
  Film,
  Clock,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { ProductionProject } from '../types';
import { studioFetch } from '../lib/apiClient';

interface Step2AnalyzeProps {
  project: ProductionProject;
  onUpdateProject: (updated: Partial<ProductionProject>) => void;
  onProceedToScript: () => void;
}

export const Step2Analyze: React.FC<Step2AnalyzeProps> = ({
  project,
  onUpdateProject,
  onProceedToScript,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [pacing, setPacing] = useState<'cinematic' | 'contemplative' | 'solemn'>('cinematic');

  const hasAnalysis = project.script && project.script.lines && project.script.lines.length > 0;

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await studioFetch('/api/drama/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passage: `${project.bookName} ${project.chapterNumber}`,
          bookName: project.bookName,
          chapterNumber: project.chapterNumber,
          customText: project.rawSourceText,
          translation: project.translation,
          language: project.language,
          dramaPace: pacing,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success || !data.script) {
        throw new Error(data.error || 'Nie udało się przeanalizować tekstu.');
      }

      onUpdateProject({
        script: data.script,
        title: data.script.title || project.title,
        status: 'analyzed',
      });
    } catch (err: any) {
      console.error('Analysis error:', err);
      setAnalysisError(err.message || 'Wystąpił błąd podczas analizy rozdziału.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-900 to-amber-950/30 border border-amber-800/40 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[11px] font-bold uppercase tracking-wider border border-amber-500/30">
                Krok 2 z 7
              </span>
              <h2 className="text-lg font-serif font-bold text-stone-100">
                Inteligentna Analiza Rozdziału i Ról
              </h2>
            </div>
            <p className="text-xs text-stone-300">
              Model językowy dzieli tekst na role aktorskie, sceny i didaskalia reżyserskie, gwarantując 100% nienaruszalność słów Biblii.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-600/50 text-emerald-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Słowo Boże nienaruszone
            </span>
          </div>
        </div>
      </div>

      {/* Analysis Control & Options */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-6 space-y-5 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
          <div>
            <span className="text-xs font-semibold text-stone-300 block mb-1">
              Styl dramaturgiczny audycji:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPacing('cinematic')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  pacing === 'cinematic'
                    ? 'bg-amber-600 text-stone-950 font-bold border-amber-500'
                    : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
                }`}
              >
                Kinowy / Dynamiczny
              </button>
              <button
                type="button"
                onClick={() => setPacing('contemplative')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  pacing === 'contemplative'
                    ? 'bg-amber-600 text-stone-950 font-bold border-amber-500'
                    : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
                }`}
              >
                Kontemplacyjny / Spokojny
              </button>
              <button
                type="button"
                onClick={() => setPacing('solemn')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  pacing === 'solemn'
                    ? 'bg-amber-600 text-stone-950 font-bold border-amber-500'
                    : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
                }`}
              >
                Uroczysty / Liturgiczny
              </button>
            </div>
          </div>

          <button
            id="action-analyze-script"
            type="button"
            disabled={isAnalyzing}
            onClick={handleRunAnalysis}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
              isAnalyzing
                ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950'
            }`}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                <span>Analizowanie wersetów...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-stone-950" />
                <span>{hasAnalysis ? 'Wykonaj analizę ponownie' : 'Uruchom analizę AI'}</span>
              </>
            )}
          </button>
        </div>

        {analysisError && (
          <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{analysisError}</p>
              <p className="text-red-300/80 mt-1">
                Upewnij się, że tekst źródłowy jest kompletny, lub odczekaj chwilę w przypadku limitu zapytań API.
              </p>
            </div>
          </div>
        )}

        {/* Results Overview */}
        {hasAnalysis ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-stone-950 border border-stone-800 p-3.5 rounded-xl">
                <span className="text-[11px] text-stone-400 block mb-1 flex items-center gap-1">
                  <Film className="w-3.5 h-3.5 text-amber-400" /> Kwestie aktorskie
                </span>
                <span className="text-xl font-bold font-mono text-stone-100">
                  {project.script.lines.length}
                </span>
              </div>

              <div className="bg-stone-950 border border-stone-800 p-3.5 rounded-xl">
                <span className="text-[11px] text-stone-400 block mb-1 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-amber-400" /> Wykryte postacie
                </span>
                <span className="text-xl font-bold font-mono text-amber-300">
                  {project.script.characters.length}
                </span>
              </div>

              <div className="bg-stone-950 border border-stone-800 p-3.5 rounded-xl">
                <span className="text-[11px] text-stone-400 block mb-1 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" /> Sceny dramatyczne
                </span>
                <span className="text-xl font-bold font-mono text-stone-100">
                  {Math.max(1, ...project.script.lines.map((l) => l.sceneNumber || 1))}
                </span>
              </div>

              <div className="bg-stone-950 border border-stone-800 p-3.5 rounded-xl">
                <span className="text-[11px] text-stone-400 block mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> Szacowany czas
                </span>
                <span className="text-xl font-bold font-mono text-stone-100">
                  ~{project.script.estimatedDurationMinutes || 4} min
                </span>
              </div>
            </div>

            {/* Characters summary */}
            <div className="bg-stone-950 border border-stone-800 rounded-xl p-4 space-y-2">
              <span className="text-xs font-semibold text-stone-300 block mb-2">
                Zidentyfikowane role w rozdziale:
              </span>
              <div className="flex flex-wrap gap-2">
                {project.script.characters.map((char) => (
                  <div
                    key={char.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-700/80 text-xs"
                  >
                    <span className="font-semibold text-stone-200">{char.name}</span>
                    <span className="text-[10px] text-amber-400 font-mono px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/40">
                      {char.geminiVoice || 'Kore'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scripture fidelity notice */}
            <div className="p-3.5 bg-stone-950/80 border border-amber-900/40 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-stone-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Wszystkie wypowiedzi są wiernym, niezmienionym tekstem Pisma Świętego.
                </span>
              </div>
            </div>

            {/* Action to Step 3 */}
            <div className="pt-2 flex justify-end">
              <button
                id="action-proceed-step3"
                type="button"
                onClick={onProceedToScript}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-sm font-bold shadow-lg transition-all hover:scale-102"
              >
                <span>Przejdź do edytora scenariusza (Krok 3)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 space-y-3">
            <Sparkles className="w-10 h-10 text-amber-500 mx-auto opacity-75" />
            <p className="text-sm font-medium text-stone-300">
              Tekst jest gotowy do analizy ról i podziału na sceny.
            </p>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Kliknij przycisk „Uruchom analizę AI”, aby rozpoznać narratora, dialogi i didaskalia dla stacji Christian Culture.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
