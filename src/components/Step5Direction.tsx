import React, { useState } from 'react';
import {
  Sliders,
  Volume2,
  Music,
  Radio,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Headphones,
  Check,
  Disc,
  Play,
  Sparkle,
  Brain,
  Shield,
  Clock,
  RotateCcw,
  SlidersHorizontal,
  Flame,
  Feather,
  Compass,
} from 'lucide-react';
import {
  AudioMixerSettings,
  DirectorReport,
  DirectorStyle,
  DramaCharacter,
  DramaLine,
  ProductionMode,
  ProductionProject,
} from '../types';
import {
  applyIntelligentAudioDirection,
  auditAndGuardFemaleCharacters,
  isFemaleCharacter,
} from '../lib/audioDirector';

interface Step5DirectionProps {
  project: ProductionProject;
  onUpdateProject: (updated: Partial<ProductionProject>) => void;
  onProceedToTimeline: () => void;
  onAuditionLine?: (line: DramaLine) => void;
}

export const Step5Direction: React.FC<Step5DirectionProps> = ({
  project,
  onUpdateProject,
  onProceedToTimeline,
  onAuditionLine,
}) => {
  const mixer = project.mixerSettings || {
    mode: 'radio_drama',
    voiceVolume: 100,
    musicVolume: 35,
    sfxVolume: 40,
    reverbLevel: 15,
    stereoWidth: 80,
    speechRate: 1.0,
    wordClarityPriority: true,
    enableIntroOutro: true,
    radioTubeWarmth: true,
  };

  const script = project.script;
  const characters = script?.characters || [];
  const lines = script?.lines || [];

  const [selectedStyle, setSelectedStyle] = useState<DirectorStyle>(
    mixer.directorStyle || 'balanced'
  );
  const [isDirecting, setIsDirecting] = useState(false);
  const [directorSuccessMessage, setDirectorSuccessMessage] = useState<string | null>(null);
  const [selectedCharFilter, setSelectedCharFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'director' | 'mixer'>('director');

  const directorReport = project.directorReport;

  const femaleCharacters = characters.filter(
    (c) => c.gender === 'female' || isFemaleCharacter(c.name)
  );

  const updateMixer = (updates: Partial<AudioMixerSettings>) => {
    onUpdateProject({
      mixerSettings: { ...mixer, ...updates },
    });
  };

  const applyModePreset = (mode: ProductionMode) => {
    if (mode === 'pure_bible') {
      updateMixer({
        mode,
        voiceVolume: 100,
        musicVolume: 0,
        sfxVolume: 0,
        reverbLevel: 5,
        stereoWidth: 30,
        wordClarityPriority: true,
        enableIntroOutro: false,
        radioTubeWarmth: false,
      });
    } else if (mode === 'radio_broadcast') {
      updateMixer({
        mode,
        voiceVolume: 100,
        musicVolume: 25,
        sfxVolume: 25,
        reverbLevel: 12,
        stereoWidth: 60,
        wordClarityPriority: true,
        enableIntroOutro: true,
        radioTubeWarmth: true,
      });
    } else {
      // cinematic drama
      updateMixer({
        mode,
        voiceVolume: 100,
        musicVolume: 45,
        sfxVolume: 50,
        reverbLevel: 25,
        stereoWidth: 90,
        wordClarityPriority: true,
        enableIntroOutro: true,
        radioTubeWarmth: true,
      });
    }
  };

  // Run the Intelligent Sound Director AI
  const handleRunAiDirector = async () => {
    if (!script) return;
    setIsDirecting(true);
    setDirectorSuccessMessage(null);

    try {
      // Try asking server endpoint if available
      let aiRefinements = null;
      try {
        const res = await fetch('/api/direction/ai-direct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ script, directorStyle: selectedStyle }),
        });
        const data = await res.json();
        if (data.success && data.aiRefinements) {
          aiRefinements = data.aiRefinements;
        }
      } catch (e) {
        console.warn('API direction fallback to local audioDirector engine:', e);
      }

      // Apply audio director rule engine
      const { script: directedScript, report } = applyIntelligentAudioDirection(
        script,
        selectedStyle
      );

      // If server returned specific AI directives, merge them cleanly
      if (aiRefinements && Array.isArray(aiRefinements.lineDirectives)) {
        const dirMap = new Map<string, any>();
        aiRefinements.lineDirectives.forEach((d: any) => dirMap.set(d.id, d));

        directedScript.lines = directedScript.lines.map((l) => {
          const refined = dirMap.get(l.id);
          if (refined) {
            return {
              ...l,
              emotionCue: refined.emotionCue || l.emotionCue,
              tempoMultiplier: refined.tempoMultiplier || l.tempoMultiplier,
              pauseAfterMs: refined.pauseAfterMs || l.pauseAfterMs,
            };
          }
          return l;
        });
      }

      onUpdateProject({
        script: directedScript,
        mixerSettings: {
          ...mixer,
          directorStyle: selectedStyle,
        },
        directorReport: report,
      });

      const femaleCount = report.femaleRolesGuardedCount;
      setDirectorSuccessMessage(
        `Reżyseria ukończona! Przeanalizowano ${report.totalLinesDirected} kwestii. Średnie tempo: ${report.averageTempo}x. Tarcza Głosów Żeńskich: zabezpieczono ${femaleCount} ról kobiecych.`
      );
    } catch (err: any) {
      alert(`Błąd podczas pracy reżysera dźwięku: ${err.message || err}`);
    } finally {
      setIsDirecting(false);
    }
  };

  const handleUpdateLineDirection = (lineId: string, updates: Partial<DramaLine>) => {
    if (!script) return;
    const updatedLines = lines.map((l) => (l.id === lineId ? { ...l, ...updates } : l));
    onUpdateProject({
      script: { ...script, lines: updatedLines },
    });
  };

  const filteredLines = lines.filter((l) => {
    if (selectedCharFilter === 'all') return true;
    return l.characterId === selectedCharFilter;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-900 to-amber-950/30 border border-amber-800/40 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[11px] font-bold uppercase tracking-wider border border-amber-500/30">
                Krok 5 z 7
              </span>
              <h2 className="text-lg font-serif font-bold text-stone-100">
                Inteligentny Reżyser Dźwięku i Konsoleta Emisyjna
              </h2>
            </div>
            <p className="text-xs text-stone-300">
              Dobór tempa narracji i emocji aktorskich w oparciu o kontekst teologiczny tekstu, stała ochrona lektorek żeńskich oraz mikser audio Christian Culture.
            </p>
          </div>

          <button
            type="button"
            onClick={onProceedToTimeline}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-bold shadow-md transition-all hover:scale-102 shrink-0"
          >
            <span>Przejdź do montażu (Krok 6)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-stone-800">
          <button
            type="button"
            onClick={() => setActiveTab('director')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'director'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'bg-stone-800/80 hover:bg-stone-800 text-stone-300'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Inteligentny Reżyser Dźwięku AI</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mixer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'mixer'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'bg-stone-800/80 hover:bg-stone-800 text-stone-300'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Konsoleta Mikserska & Oprawa Radiowa</span>
          </button>
        </div>
      </div>

      {/* TAB 1: INTELIGENTNY REŻYSER DŹWIĘKU */}
      {activeTab === 'director' && (
        <div className="space-y-6">
          {/* Main Director Control Board */}
          <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 border border-amber-500/40 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <h3 className="text-base font-bold text-stone-100 font-serif">
                    Studio Reżyserskie Christian Culture AI
                  </h3>
                </div>
                <p className="text-xs text-stone-300 max-w-2xl leading-relaxed">
                  Reżyser analizuje treść i dramaturgię każdego wersetu, dobierając adekwatne tempo (0.85x – 1.15x), niuansując emocje lektorskie i bezwzględnie egzekwując właściwy lektorat żeński (Kore / Aoede).
                </p>
              </div>

              <button
                type="button"
                disabled={isDirecting}
                onClick={handleRunAiDirector}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-bold shadow-lg transition-all hover:scale-102 disabled:opacity-50 shrink-0"
              >
                {isDirecting ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin text-stone-950" />
                    <span>Reżyser analizuje tekst i tempo...</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 text-stone-950" />
                    <span>Uruchom Inteligentnego Reżysera AI</span>
                  </>
                )}
              </button>
            </div>

            {/* Director Styles Selection */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-3 font-mono">
                Wybierz styl interpretacji tekstu biblijnego:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Reverent */}
                <div
                  onClick={() => setSelectedStyle('reverent')}
                  className={`cursor-pointer rounded-xl p-4 border transition-all ${
                    selectedStyle === 'reverent'
                      ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/30 shadow-md'
                      : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                      <Feather className="w-3.5 h-3.5 text-amber-400" />
                      Uroczysty i Sakralny
                    </span>
                    {selectedStyle === 'reverent' && (
                      <Check className="w-4 h-4 text-amber-400 stroke-[3]" />
                    )}
                  </div>
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    Wolniejsze, kontemplacyjne tempo (0.88x – 0.94x), wydłużone pauzy oddechowe, nabożne uniesienie i głęboki szacunek dla Sacrum.
                  </p>
                </div>

                {/* Balanced */}
                <div
                  onClick={() => setSelectedStyle('balanced')}
                  className={`cursor-pointer rounded-xl p-4 border transition-all ${
                    selectedStyle === 'balanced'
                      ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/30 shadow-md'
                      : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-amber-400" />
                      Zrównoważony Radiowy
                    </span>
                    {selectedStyle === 'balanced' && (
                      <Check className="w-4 h-4 text-amber-400 stroke-[3]" />
                    )}
                  </div>
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    Standard emisyjny stacji Christian Culture (0.94x – 1.04x). Płynna, klarowna dykcja lektorska, naturalny rytm i wyważona dynamika.
                  </p>
                </div>

                {/* Dramatic */}
                <div
                  onClick={() => setSelectedStyle('dramatic')}
                  className={`cursor-pointer rounded-xl p-4 border transition-all ${
                    selectedStyle === 'dramatic'
                      ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/30 shadow-md'
                      : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      Dramatyzowany Filmowy
                    </span>
                    {selectedStyle === 'dramatic' && (
                      <Check className="w-4 h-4 text-amber-400 stroke-[3]" />
                    )}
                  </div>
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    Teatr wyobraźni (0.86x – 1.15x). Wyraziste kontrasty między szeptem skruchy a dynamiką sporu lub radosną proklamacją zmartwychwstania.
                  </p>
                </div>
              </div>
            </div>

            {/* Female Voice Guard Guarantee Banner */}
            <div className="p-4 rounded-xl bg-pink-950/40 border border-pink-700/60 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-pink-400 shrink-0" />
                  <span className="text-xs font-bold text-pink-200">
                    Tarcza Głosów Żeńskich (Female Voice Guard): 100% Ochrony
                  </span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-pink-900/60 text-pink-300 border border-pink-700">
                  Lektorat: Kore (alt) & Aoede (sopran)
                </span>
              </div>
              <p className="text-[11px] text-pink-300/90 leading-relaxed">
                Reżyser gwarantuje, że postacie kobiece (np. Matka Boża, Maria Magdalena, Marta, Samarytanka, służąca, wdowa) bezwzględnie otrzymują żeński głos lektorski i nie mogą zostać zniekształcone głosem męskim.
              </p>
              {femaleCharacters.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {femaleCharacters.map((fc) => (
                    <span
                      key={fc.id}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-pink-900/80 border border-pink-600 text-pink-100 flex items-center gap-1 font-semibold"
                    >
                      <Shield className="w-3 h-3 text-pink-300" />
                      {fc.name} → {fc.geminiVoice}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-[10px] text-pink-400 italic block">
                  W tym fragmencie scenariusza występują wyłącznie postacie męskie i narracyjne.
                </span>
              )}
            </div>

            {/* Success Notification */}
            {directorSuccessMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-600/60 text-emerald-200 text-xs flex items-center justify-between animate-fadeIn">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 stroke-[3]" />
                  <span>{directorSuccessMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDirectorSuccessMessage(null)}
                  className="text-emerald-400 hover:text-emerald-200 text-xs ml-3"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Director Report Cards */}
            {directorReport && (
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block font-mono">
                  Aktualny raport z reżyserii akustycznej:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-3">
                    <span className="text-[10px] text-stone-400 block mb-0.5">Kwestie wyreżyserowane:</span>
                    <span className="text-base font-bold text-amber-300 font-mono">
                      {directorReport.totalLinesDirected}
                    </span>
                  </div>
                  <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-3">
                    <span className="text-[10px] text-stone-400 block mb-0.5">Średnie tempo:</span>
                    <span className="text-base font-bold text-emerald-300 font-mono">
                      {directorReport.averageTempo}x
                    </span>
                    <span className="text-[10px] text-stone-500 block">
                      zakres: {directorReport.tempoRange.min}x - {directorReport.tempoRange.max}x
                    </span>
                  </div>
                  <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-3">
                    <span className="text-[10px] text-stone-400 block mb-0.5">Dominujący nastrój:</span>
                    <span className="text-xs font-bold text-stone-200 truncate block" title={directorReport.dominantMood}>
                      {directorReport.dominantMood}
                    </span>
                  </div>
                  <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-3">
                    <span className="text-[10px] text-stone-400 block mb-0.5">Role żeńskie:</span>
                    <span className="text-base font-bold text-pink-300 font-mono">
                      {directorReport.femaleRolesGuardedCount}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold block">100% chronione</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Line-by-Line Direction Inspector */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-6 space-y-4 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-stone-200">
                  Stół Reżyserski: Kwestie, Tempo i Emocje Aktorów
                </h3>
              </div>

              {/* Character Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-400">Filtruj postać:</span>
                <select
                  value={selectedCharFilter}
                  onChange={(e) => setSelectedCharFilter(e.target.value)}
                  className="bg-stone-950 border border-stone-700 text-stone-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">Wszystkie postacie ({lines.length})</option>
                  {characters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({lines.filter((l) => l.characterId === c.id).length})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lines List */}
            <div className="space-y-3">
              {filteredLines.map((line, index) => {
                const char = characters.find((c) => c.id === line.characterId);
                const isCharFemale = char?.gender === 'female' || isFemaleCharacter(char?.name || line.characterName);
                const tempo = line.tempoMultiplier ?? 1.0;

                // Color coding for tempo
                let tempoColor = 'text-emerald-300 bg-emerald-950/60 border-emerald-700/60';
                let tempoLabel = 'Zrównoważone';
                if (tempo < 0.93) {
                  tempoColor = 'text-amber-300 bg-amber-950/60 border-amber-700/60';
                  tempoLabel = 'Uroczyste / Podniosłe';
                } else if (tempo > 1.04) {
                  tempoColor = 'text-blue-300 bg-blue-950/60 border-blue-700/60';
                  tempoLabel = 'Dynamiczne';
                }

                return (
                  <div
                    key={line.id}
                    className="p-4 rounded-xl bg-stone-950/70 border border-stone-800/90 hover:border-stone-700 transition-all space-y-3"
                  >
                    {/* Header info */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-100">{line.characterName}</span>
                        {isCharFemale && (
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-pink-950 text-pink-300 border border-pink-700/70 font-semibold flex items-center gap-1">
                            <Shield className="w-2.5 h-2.5 text-pink-400" />
                            Głos żeński ({char?.geminiVoice || 'Kore'})
                          </span>
                        )}
                        <span className="text-[11px] px-2 py-0.5 rounded bg-stone-900 text-stone-400 font-mono border border-stone-800">
                          Scena {line.sceneNumber || 1}
                        </span>
                        {line.verseRef && (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 font-mono font-semibold border border-amber-800/40">
                            {line.verseRef}
                          </span>
                        )}
                      </div>

                      {/* Audition Button */}
                      {onAuditionLine && (
                        <button
                          type="button"
                          onClick={() => onAuditionLine(line)}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-900 hover:bg-amber-600 hover:text-stone-950 text-stone-200 text-xs font-medium border border-stone-700 transition-all"
                          title="Przetestuj brzmienie tej kwestii z aktualnym tempem i emocją"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Odsłuchaj z tempem</span>
                        </button>
                      )}
                    </div>

                    {/* Verbatim text */}
                    <p className="text-xs text-stone-200 bg-stone-900/50 p-2.5 rounded-lg border border-stone-800/60 font-sans italic leading-relaxed">
                      „{line.text}”
                    </p>

                    {/* Interactive Direction Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                      {/* Emotion Cue */}
                      <div>
                        <span className="text-[10px] text-stone-400 block mb-1">
                          Wskazówka emocjonalna aktora (didaskalia):
                        </span>
                        <input
                          type="text"
                          value={line.emotionCue || ''}
                          onChange={(e) =>
                            handleUpdateLineDirection(line.id, { emotionCue: e.target.value })
                          }
                          placeholder="np. (ze skruchą i cichym głosem)"
                          className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1 text-stone-200 text-xs focus:outline-none focus:border-amber-500"
                        />
                        {/* Quick preset emotions */}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {[
                            '(ze skruchą)',
                            '(z autorytetem)',
                            '(z radością)',
                            '(z modlitwą)',
                            '(z czułością)',
                          ].map((emo) => (
                            <button
                              key={emo}
                              type="button"
                              onClick={() => handleUpdateLineDirection(line.id, { emotionCue: emo })}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800"
                            >
                              {emo}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Tempo Multiplier */}
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-stone-400 mb-1">
                          <span>Tempo wypowiedzi:</span>
                          <span className={`font-mono font-bold px-1.5 py-0.2 rounded border ${tempoColor}`}>
                            {tempo.toFixed(2)}x ({tempoLabel})
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.85"
                          max="1.15"
                          step="0.01"
                          value={tempo}
                          onChange={(e) =>
                            handleUpdateLineDirection(line.id, {
                              tempoMultiplier: parseFloat(e.target.value),
                            })
                          }
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                        <div className="flex justify-between text-[9px] text-stone-500 mt-0.5">
                          <span>0.85x Podniosłe</span>
                          <span>1.00x Emisyjne</span>
                          <span>1.15x Dynamiczne</span>
                        </div>
                      </div>

                      {/* Pause after */}
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-stone-400 mb-1">
                          <span>Pauza po kwestii (ms):</span>
                          <span className="font-mono text-amber-300 font-bold">
                            {line.pauseAfterMs || 750} ms
                          </span>
                        </div>
                        <input
                          type="range"
                          min="300"
                          max="2000"
                          step="50"
                          value={line.pauseAfterMs || 750}
                          onChange={(e) =>
                            handleUpdateLineDirection(line.id, {
                              pauseAfterMs: parseInt(e.target.value),
                            })
                          }
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                        <div className="flex justify-between text-[9px] text-stone-500 mt-0.5">
                          <span>300ms Szybka</span>
                          <span>750ms Naturalna</span>
                          <span>2000ms Kontemplacyjna</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KONSOLETA MIKSERSKA */}
      {activeTab === 'mixer' && (
        <div className="space-y-6">
          {/* 3 Production Modes Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Mode 1: Czysta Biblia */}
            <div
              onClick={() => applyModePreset('pure_bible')}
              className={`cursor-pointer rounded-2xl p-5 border transition-all ${
                mixer.mode === 'pure_bible'
                  ? 'bg-amber-950/30 border-amber-500 ring-2 ring-amber-500/40 shadow-xl'
                  : 'bg-stone-900/90 border-stone-800 hover:border-stone-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase font-bold text-amber-400">Tryb 1</span>
                {mixer.mode === 'pure_bible' && (
                  <span className="p-1 rounded-full bg-amber-500 text-stone-950">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-stone-100 font-serif mb-1">Czysta Biblia</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Same głosy aktorskie i lektorskie. Całkowity brak muzyki i efektów. Najczystszy przekaz Słowa Bożego do medytacji i modlitwy.
              </p>
            </div>

            {/* Mode 2: Audycja Radiowa */}
            <div
              onClick={() => applyModePreset('radio_broadcast')}
              className={`cursor-pointer rounded-2xl p-5 border transition-all ${
                mixer.mode === 'radio_broadcast'
                  ? 'bg-amber-950/30 border-amber-500 ring-2 ring-amber-500/40 shadow-xl'
                  : 'bg-stone-900/90 border-stone-800 hover:border-stone-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase font-bold text-amber-400">
                  Tryb 2 (Rekomendowany)
                </span>
                {mixer.mode === 'radio_broadcast' && (
                  <span className="p-1 rounded-full bg-amber-500 text-stone-950">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-stone-100 font-serif mb-1">Audycja Radiowa</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Intro stacji www.polskieradio.cc, szlachetna oprawa narracyjna, subtelne tło instrumentalne i outro z identyfikacją marki Christian Culture.
              </p>
            </div>

            {/* Mode 3: Słuchowisko Filmowe */}
            <div
              onClick={() => applyModePreset('radio_drama')}
              className={`cursor-pointer rounded-2xl p-5 border transition-all ${
                mixer.mode === 'radio_drama'
                  ? 'bg-amber-950/30 border-amber-500 ring-2 ring-amber-500/40 shadow-xl'
                  : 'bg-stone-900/90 border-stone-800 hover:border-stone-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase font-bold text-amber-400">Tryb 3</span>
                {mixer.mode === 'radio_drama' && (
                  <span className="p-1 rounded-full bg-amber-500 text-stone-950">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-stone-100 font-serif mb-1">
                Słuchowisko Filmowe
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Szeroka panorama stereo, realistyczne efekty otoczenia (wiatr, tłum, kroki, woda), dynamiczna oprawa symfoniczna i kinowy montaż.
              </p>
            </div>
          </div>

          {/* Mixer Sliders Board */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-6 space-y-6 shadow-md">
            <h3 className="text-sm font-bold text-stone-200 flex items-center gap-2 pb-3 border-b border-stone-800">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Suwaki mikserskie i parametry akustyczne</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {/* Voice Volume */}
              <div>
                <div className="flex items-center justify-between text-xs text-stone-300 mb-2">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-amber-400" /> Głośność głosu (Główna)
                  </span>
                  <span className="font-mono text-amber-300 font-bold">{mixer.voiceVolume}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={mixer.voiceVolume}
                  onChange={(e) => updateMixer({ voiceVolume: parseInt(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Music Volume */}
              <div>
                <div className="flex items-center justify-between text-xs text-stone-300 mb-2">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-amber-400" /> Muzyka tła
                  </span>
                  <span className="font-mono text-amber-300 font-bold">{mixer.musicVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={mixer.musicVolume}
                  onChange={(e) => updateMixer({ musicVolume: parseInt(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* SFX Volume */}
              <div>
                <div className="flex items-center justify-between text-xs text-stone-300 mb-2">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Disc className="w-3.5 h-3.5 text-amber-400" /> Efekty otoczenia (SFX)
                  </span>
                  <span className="font-mono text-amber-300 font-bold">{mixer.sfxVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={mixer.sfxVolume}
                  onChange={(e) => updateMixer({ sfxVolume: parseInt(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Reverb */}
              <div>
                <div className="flex items-center justify-between text-xs text-stone-300 mb-2">
                  <span className="font-semibold">Pogłos sakralny (Reverb)</span>
                  <span className="font-mono text-amber-300 font-bold">{mixer.reverbLevel}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={mixer.reverbLevel}
                  onChange={(e) => updateMixer({ reverbLevel: parseInt(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Stereo Width */}
              <div>
                <div className="flex items-center justify-between text-xs text-stone-300 mb-2">
                  <span className="font-semibold">Szerokość bazy Stereo</span>
                  <span className="font-mono text-amber-300 font-bold">{mixer.stereoWidth}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={mixer.stereoWidth}
                  onChange={(e) => updateMixer({ stereoWidth: parseInt(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Overall Speech Rate */}
              <div>
                <div className="flex items-center justify-between text-xs text-stone-300 mb-2">
                  <span className="font-semibold">Ogólne tempo stacyjne</span>
                  <span className="font-mono text-amber-300 font-bold">
                    {(mixer.speechRate ?? 1.0).toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.2"
                  step="0.05"
                  value={mixer.speechRate ?? 1.0}
                  onChange={(e) => updateMixer({ speechRate: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Priority Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-stone-800">
              <label className="flex items-start gap-3 p-3.5 rounded-xl bg-stone-950 border border-amber-900/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mixer.wordClarityPriority}
                  onChange={(e) => updateMixer({ wordClarityPriority: e.target.checked })}
                  className="mt-0.5 rounded accent-amber-500 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold text-stone-200 block mb-0.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Priorytet: „Czytelność Słowa” (Ducking)
                  </span>
                  <span className="text-[11px] text-stone-400">
                    Automatycznie przycisza muzykę i efekty o 6 dB, gdy wybrzmiewają słowa Pisma Świętego.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl bg-stone-950 border border-stone-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mixer.radioTubeWarmth}
                  onChange={(e) => updateMixer({ radioTubeWarmth: e.target.checked })}
                  className="mt-0.5 rounded accent-amber-500 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold text-stone-200 block mb-0.5 flex items-center gap-1.5">
                    <Headphones className="w-3.5 h-3.5 text-amber-400" />
                    Ciepło lampowe (Acoustic Tube Warmth)
                  </span>
                  <span className="text-[11px] text-stone-400">
                    Wzorzec nasycenia analogowego, nadający głosom ciepłe, radiowe brzmienie.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Christian Culture Station Intro & Outro Editor */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-6 space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-200 flex items-center gap-2">
                <Radio className="w-4 h-4 text-amber-400" />
                <span>Oprawa stacyjna Christian Culture (polskieradio.cc)</span>
              </h3>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-300">
                <input
                  type="checkbox"
                  checked={mixer.enableIntroOutro}
                  onChange={(e) => updateMixer({ enableIntroOutro: e.target.checked })}
                  className="rounded accent-amber-500 w-4 h-4"
                />
                <span>Dołącz intro i outro</span>
              </label>
            </div>

            {mixer.enableIntroOutro && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1">
                    Tekst Intro stacji:
                  </label>
                  <textarea
                    rows={3}
                    value={
                      script?.stationIntro ||
                      `Biblia Audio Christian Culture. Słowo, które możesz usłyszeć na polskieradio.cc. ${project.bookName}, rozdział ${project.chapterNumber}.`
                    }
                    onChange={(e) =>
                      onUpdateProject({
                        script: { ...script, stationIntro: e.target.value },
                      })
                    }
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl p-3 text-stone-200 text-xs focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1">
                    Tekst Outro stacji:
                  </label>
                  <textarea
                    rows={3}
                    value={
                      script?.stationOutro ||
                      'Słuchałeś Biblii Audio Christian Culture. Więcej audycji i całodobowego radia znajdziesz na polskieradio.cc.'
                    }
                    onChange={(e) =>
                      onUpdateProject({
                        script: { ...script, stationOutro: e.target.value },
                      })
                    }
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl p-3 text-stone-200 text-xs focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Action */}
      <div className="pt-4 flex justify-end">
        <button
          type="button"
          onClick={onProceedToTimeline}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-sm font-bold shadow-lg transition-all hover:scale-102"
        >
          <span>Zatwierdź reżyserię → Krok 6: Generowanie i montaż</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
