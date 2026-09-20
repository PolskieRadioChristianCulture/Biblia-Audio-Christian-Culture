import React, { useState, useEffect } from 'react';
import {
  Users,
  Volume2,
  Sparkles,
  ArrowRight,
  Sliders,
  BookmarkCheck,
  Save,
  Check,
  RotateCcw,
  Sparkle,
  Shield,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { DramaCharacter, GeminiVoiceName, ProductionProject, RoleArchetype } from '../types';
import {
  auditAndGuardFemaleCharacters,
  FEMALE_VOICES,
  isFemaleCharacter,
  MALE_VOICES,
} from '../lib/audioDirector';

interface Step4CastingProps {
  project: ProductionProject;
  onUpdateProject: (updated: Partial<ProductionProject>) => void;
  onAuditionVoice: (character: DramaCharacter) => void;
  onProceedToDirection: () => void;
}

export const Step4Casting: React.FC<Step4CastingProps> = ({
  project,
  onUpdateProject,
  onAuditionVoice,
  onProceedToDirection,
}) => {
  const [voiceBookSaved, setVoiceBookSaved] = useState(false);
  const [guardNotice, setGuardNotice] = useState<string | null>(null);
  const characters = project.script?.characters || [];

  // Run initial automatic female voice audit on mount to protect female roles
  useEffect(() => {
    const audit = auditAndGuardFemaleCharacters(characters, project.script?.lines || []);
    if (audit.correctedNames.length > 0) {
      onUpdateProject({
        script: { ...project.script, characters: audit.guardedCharacters },
      });
      setGuardNotice(
        `Tarcza Głosów Żeńskich zabezpieczyła role: ${audit.correctedNames.join(', ')} (przypisano właściwe głosy żeńskie).`
      );
    }
  }, []);

  const voiceOptions: { id: GeminiVoiceName; label: string; desc: string; isFemale: boolean }[] = [
    { id: 'Kore', label: 'Kore (Głos Żeński - Ciepły alt / lektor)', desc: 'Ciepły, aksamitny, harmonijny głos kobiecy lub poetycki lektor.', isFemale: true },
    { id: 'Aoede', label: 'Aoede (Głos Żeński - Melodyjny sopran)', desc: 'Delikatny, czysty, przejmujący tembr. Aniołowie, Matka Boża, młode niewiasty, modlitwa.', isFemale: true },
    { id: 'Puck', label: 'Puck (Głos Męski - Baryton lektorski)', desc: 'Szlachetny, ciepły i wyważony głos narracyjny stacji radiowej.', isFemale: false },
    { id: 'Charon', label: 'Charon (Głos Męski - Tembr wyrazisty)', desc: 'Męski, wyrazisty i naturalny głos. Postacie męskie, synowie, apostołowie.', isFemale: false },
    { id: 'Zephyr', label: 'Zephyr (Głos Męski - Spokojny mędrzec)', desc: 'Spokojny, refleksyjny tembr. Mędrcy, kapłani, faryzeusze.', isFemale: false },
    { id: 'Fenrir', label: 'Fenrir (Głos Męski - Bas majestatyczny)', desc: 'Głęboki, radiowy bas z autorytetem. Bóg Ojciec, Jezus w chwale, Prorok.', isFemale: false },
  ];

  const femaleRolesCount = characters.filter(
    (c) => c.gender === 'female' || isFemaleCharacter(c.name)
  ).length;

  const handleGuardFemaleVoices = () => {
    const result = auditAndGuardFemaleCharacters(characters, project.script?.lines || []);
    onUpdateProject({
      script: { ...project.script, characters: result.guardedCharacters },
    });
    if (result.correctedNames.length > 0) {
      setGuardNotice(
        `Zabezpieczono postacie kobiece: ${result.correctedNames.join(', ')}. Przypisano właściwe głosy żeńskie Kore/Aoede.`
      );
    } else {
      setGuardNotice(
        `Wszystkie postacie kobiece (${result.guardedCount}) są w 100% bezpieczne i posiadają certyfikowane głosy żeńskie.`
      );
    }
    setTimeout(() => setGuardNotice(null), 5000);
  };

  const handleUpdateCharacter = (charId: string, updates: Partial<DramaCharacter>) => {
    const updatedChars = characters.map((c) => (c.id === charId ? { ...c, ...updates } : c));
    onUpdateProject({
      script: { ...project.script, characters: updatedChars },
    });
  };

  // Voice Book (Księga Głosów) persistence in localStorage
  const handleSaveToVoiceBook = () => {
    try {
      const bookEntries: Record<string, { voice: GeminiVoiceName; pitch: number; rate: number }> = {};
      characters.forEach((c) => {
        bookEntries[c.name.toLowerCase()] = {
          voice: c.geminiVoice,
          pitch: c.recommendedPitch,
          rate: c.recommendedRate,
        };
      });
      localStorage.setItem('biblia_audio_voice_book', JSON.stringify(bookEntries));
      setVoiceBookSaved(true);
      setTimeout(() => setVoiceBookSaved(false), 3000);
    } catch (e) {
      console.warn('Failed to save to voice book:', e);
    }
  };

  const handleApplyVoiceBook = () => {
    try {
      const raw = localStorage.getItem('biblia_audio_voice_book');
      if (!raw) return;
      const book = JSON.parse(raw);
      const updatedChars = characters.map((c) => {
        const key = c.name.toLowerCase();
        if (book[key]) {
          return {
            ...c,
            geminiVoice: book[key].voice,
            recommendedPitch: book[key].pitch,
            recommendedRate: book[key].rate,
          };
        }
        return c;
      });
      onUpdateProject({
        script: { ...project.script, characters: updatedChars },
      });
    } catch (e) {
      console.warn('Failed to load voice book:', e);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-900 to-amber-950/30 border border-amber-800/40 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[11px] font-bold uppercase tracking-wider border border-amber-500/30">
                Krok 4 z 7
              </span>
              <h2 className="text-lg font-serif font-bold text-stone-100">
                Obsada Głosowa i Profile Aktorskie Gemini
              </h2>
            </div>
            <p className="text-xs text-stone-300">
              Przypisz każdej postaci szlachetny głos syntetyczny Gemini TTS z dostrojeniem wysokości (pitch) i tempa narracji.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleGuardFemaleVoices}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-pink-950/70 hover:bg-pink-900/80 text-pink-200 text-xs font-semibold border border-pink-700/60 shadow-sm transition-all"
              title="Wymuś audyt i zabezpieczenie ról kobiecych"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-pink-400" />
              <span>Tarcza Głosów Żeńskich</span>
            </button>

            <button
              type="button"
              onClick={handleSaveToVoiceBook}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 transition-colors"
              title="Zapisz te przypisania w stałej Księdze Głosów"
            >
              {voiceBookSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300 font-semibold">Zapisano w Księdze!</span>
                </>
              ) : (
                <>
                  <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Zapisz w Księdze</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleApplyVoiceBook}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 transition-colors"
              title="Wczytaj stałe głosy z Księgi Głosów"
            >
              <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
              <span>Wczytaj Księgę</span>
            </button>
          </div>
        </div>

        {/* Female Voice Guard Banner Notice */}
        {guardNotice && (
          <div className="mt-3 p-3 rounded-xl bg-pink-950/50 border border-pink-600/50 flex items-center justify-between text-xs text-pink-200 animate-fadeIn">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-pink-400 shrink-0" />
              <span>{guardNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setGuardNotice(null)}
              className="text-pink-400 hover:text-pink-200 text-xs ml-3"
            >
              ✕
            </button>
          </div>
        )}

        {/* Status indicator for female guard */}
        <div className="mt-3 pt-3 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-stone-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>
              Tarcza Głosów Żeńskich: <strong className="text-emerald-300">Aktywna</strong> (
              {femaleRolesCount} ról kobiecych pod stałą ochroną lektoratu Kore/Aoede)
            </span>
          </div>
          <span className="text-stone-400 text-[11px] italic">
            Zgodnie z wymogami stacji Christian Culture, żadna postać kobieca w Piśmie Świętym nie zostanie obsadzona głosem męskim.
          </span>
        </div>
      </div>

      {/* Characters Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {characters.map((char) => {
          const isCharFemale = char.gender === 'female' || isFemaleCharacter(char.name);
          const isMaleVoiceAssigned = MALE_VOICES.includes(char.geminiVoice);
          const hasGenderConflict = isCharFemale && isMaleVoiceAssigned;

          return (
            <div
              key={char.id}
              className={`bg-stone-900/90 border rounded-2xl p-5 space-y-4 shadow-md transition-all ${
                hasGenderConflict
                  ? 'border-red-500/80 ring-2 ring-red-500/30'
                  : isCharFemale
                  ? 'border-pink-800/50 hover:border-pink-600/60'
                  : 'border-stone-800 hover:border-stone-700'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-stone-100">{char.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase bg-amber-950/60 border border-amber-800/60 text-amber-300">
                      {char.roleType || char.gender}
                    </span>
                    {isCharFemale && (
                      <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-pink-950/80 text-pink-300 border border-pink-700 font-bold">
                        <Shield className="w-3 h-3 text-pink-400" />
                        Rola żeńska
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400 mt-0.5">{char.voiceProfile}</p>
                </div>

                <button
                  type="button"
                  onClick={() => onAuditionVoice(char)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 text-xs font-bold shadow-sm transition-all"
                  title="Przetestuj brzmienie tego aktora"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Przetestuj (HD)</span>
                </button>
              </div>

              {/* Warning if gender conflict */}
              {hasGenderConflict && (
                <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-700 text-red-200 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>Niezgodność płci: dla roli żeńskiej wybrano głos męski ({char.geminiVoice}).</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateCharacter(char.id, {
                        geminiVoice: 'Kore',
                        gender: 'female',
                      })
                    }
                    className="px-2 py-1 rounded bg-red-800 hover:bg-red-700 text-white font-bold text-[11px] shrink-0"
                  >
                    Napraw (Kore)
                  </button>
                </div>
              )}

              {/* Gemini Voice Selection */}
              <div>
                <label className="text-[11px] font-semibold text-stone-300 block mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Głos aktorski Gemini TTS:
                </label>
                <select
                  value={char.geminiVoice || (isCharFemale ? 'Kore' : 'Puck')}
                  onChange={(e) => {
                    const newVoice = e.target.value as GeminiVoiceName;
                    const updates: Partial<DramaCharacter> = { geminiVoice: newVoice };
                    if (isCharFemale && FEMALE_VOICES.includes(newVoice)) {
                      updates.gender = 'female';
                    }
                    handleUpdateCharacter(char.id, updates);
                  }}
                  className={`w-full border rounded-xl px-3 py-2 text-stone-100 text-xs font-medium focus:outline-none ${
                    isCharFemale
                      ? 'bg-stone-950 border-pink-800/80 focus:border-pink-500'
                      : 'bg-stone-950 border-stone-700 focus:border-amber-500'
                  }`}
                >
                  <optgroup label="Głosy Żeńskie (Zabezpieczone)">
                    {voiceOptions
                      .filter((v) => v.isFemale)
                      .map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.label}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Głosy Męskie">
                    {voiceOptions
                      .filter((v) => !v.isFemale)
                      .map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.label}
                        </option>
                      ))}
                  </optgroup>
                </select>
                <p className="text-[11px] text-stone-400 mt-1 italic">
                  {voiceOptions.find((v) => v.id === char.geminiVoice)?.desc}
                </p>
              </div>

              {/* Sliders: Pitch & Rate */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1">
                    <span>Wysokość (Pitch):</span>
                    <span className="font-mono text-amber-300 font-bold">
                      {char.recommendedPitch?.toFixed(2) || '1.00'}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.7"
                    max="1.3"
                    step="0.05"
                    value={char.recommendedPitch || 1.0}
                    onChange={(e) =>
                      handleUpdateCharacter(char.id, {
                        recommendedPitch: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1">
                    <span>Tempo (Rate):</span>
                    <span className="font-mono text-amber-300 font-bold">
                      {char.recommendedRate?.toFixed(2) || '1.00'}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.8"
                    max="1.2"
                    step="0.05"
                    value={char.recommendedRate || 1.0}
                    onChange={(e) =>
                      handleUpdateCharacter(char.id, {
                        recommendedRate: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Pronunciation & Director Notes */}
              <div>
                <span className="text-[10px] text-stone-400 block mb-1">
                  Uwagi realizatorskie i fonetyka:
                </span>
                <input
                  type="text"
                  value={char.pronunciationNotes || ''}
                  onChange={(e) =>
                    handleUpdateCharacter(char.id, { pronunciationNotes: e.target.value })
                  }
                  placeholder="np. czytać z powolną dykcją, akcent aramejski"
                  className="w-full bg-stone-950/80 border border-stone-800 rounded-lg px-2.5 py-1.5 text-stone-300 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Action */}
      <div className="pt-4 flex justify-end">
        <button
          type="button"
          onClick={onProceedToDirection}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-sm font-bold shadow-lg transition-all hover:scale-102"
        >
          <span>Zatwierdź obsadę → Krok 5: Reżyseria dźwięku</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
