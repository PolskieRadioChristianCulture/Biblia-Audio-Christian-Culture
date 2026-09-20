import React from 'react';
import { Users, Volume2, Sliders, Mic, Sparkles } from 'lucide-react';
import { DramaCharacter } from '../types';

interface CharactersCastingProps {
  characters: DramaCharacter[];
  onUpdateCharacter: (updated: DramaCharacter) => void;
  onAuditionVoice: (character: DramaCharacter) => void;
}

export const CharactersCasting: React.FC<CharactersCastingProps> = ({
  characters,
  onUpdateCharacter,
  onAuditionVoice,
}) => {
  return (
    <div
      id="casting-deck"
      className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 sm:p-5 text-stone-100 shadow-md"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-900/40 border border-amber-700/50 flex items-center justify-center text-amber-300">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-sm sm:text-base text-amber-200">
              Obsada Aktorska Słuchowiska
            </h3>
            <p className="text-[11px] text-stone-400">
              Dopasuj barwę, tonację i dynamikę głosu dla każdej roli biblijnej
            </p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-stone-800 border border-stone-700 text-stone-300 font-mono">
          {characters.length} postaci
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {characters.map((char) => {
          return (
            <div
              key={char.id}
              className="bg-stone-950/70 border border-stone-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-amber-700/50 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        char.gender === 'divine'
                          ? 'bg-amber-400 ring-2 ring-amber-400/30'
                          : char.gender === 'narrator'
                          ? 'bg-blue-400'
                          : char.gender === 'female'
                          ? 'bg-rose-400'
                          : 'bg-emerald-400'
                      }`}
                    />
                    <h4 className="font-semibold text-xs sm:text-sm text-stone-100">
                      {char.name}
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 border border-stone-700">
                    {char.gender === 'narrator'
                      ? 'Lektor'
                      : char.gender === 'divine'
                      ? 'Bóg / Chrystus'
                      : char.gender === 'female'
                      ? 'Głos Żeński'
                      : 'Głos Męski'}
                  </span>
                </div>

                <p className="text-[11px] text-stone-400 leading-relaxed italic mb-3">
                  "{char.voiceProfile}"
                </p>
              </div>

              <div className="pt-2 border-t border-stone-800/80 space-y-2.5">
                {/* Neural Gemini Voice Selector */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      Głos aktorski AI (Gemini):
                    </span>
                    <span className="font-mono text-amber-300 font-bold">
                      {char.geminiVoice || 'Kore'}
                    </span>
                  </div>
                  <select
                    value={char.geminiVoice || 'Kore'}
                    onChange={(e) =>
                      onUpdateCharacter({
                        ...char,
                        geminiVoice: e.target.value as any,
                      })
                    }
                    className="w-full bg-stone-900 border border-stone-700 text-stone-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Fenrir">Fenrir • Głęboki, majestatyczny bas (Bóg / Ojciec / Prorok)</option>
                    <option value="Puck">Puck • Szlachetny radiowy baryton (Lektor / Narrator)</option>
                    <option value="Charon">Charon • Męski, stonowany, wyrazisty (Młody Mężczyzna / Apostoł)</option>
                    <option value="Zephyr">Zephyr • Czysty, wyważony tembr (Głos męski / Mędrzec)</option>
                    <option value="Kore">Kore • Ciepły, spokojny, aksamitny (Kobiecy / Ciepły Lektor)</option>
                    <option value="Aoede">Aoede • Delikatny, melodyjny, przejmujący (Postać kobieca / Anioł)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-400">
                  <span>Modulacja wysokości (Pitch):</span>
                  <span className="font-mono text-amber-300">{char.recommendedPitch.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.4"
                  step="0.05"
                  value={char.recommendedPitch}
                  onChange={(e) =>
                    onUpdateCharacter({
                      ...char,
                      recommendedPitch: parseFloat(e.target.value),
                    })
                  }
                  className="w-full h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => onAuditionVoice(char)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 text-amber-200 text-xs font-semibold border border-amber-800/60 transition-colors shadow-sm"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Przetestuj głos roli (AI HD)</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
