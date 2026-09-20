import React, { useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  Volume2,
  Sliders,
  Music,
  Bell,
  Radio,
  SkipForward,
  SkipBack,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { AudioMixerSettings, DramaLine, MusicAtmosphere, RadioDramaScript } from '../types';

interface StudioMixerProps {
  script: RadioDramaScript;
  settings: AudioMixerSettings;
  onUpdateSettings: (newSettings: AudioMixerSettings) => void;
  isPlaying: boolean;
  isPaused: boolean;
  currentLineIndex: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onNextLine: () => void;
  onPrevLine: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const StudioMixer: React.FC<StudioMixerProps> = ({
  script,
  settings,
  onUpdateSettings,
  isPlaying,
  isPaused,
  currentLineIndex,
  onPlay,
  onPause,
  onStop,
  onNextLine,
  onPrevLine,
  isOpen,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animated visualizer
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      // Draw background baseline
      ctx.strokeStyle = '#292524';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      if (isPlaying && !isPaused) {
        // Draw dynamic waveforms
        phase += 0.08;
        const barsCount = 48;
        const barWidth = width / barsCount;

        for (let i = 0; i < barsCount; i++) {
          const x = i * barWidth;
          const distFromCenter = 1 - Math.abs((i - barsCount / 2) / (barsCount / 2));
          const amp = Math.sin(phase + i * 0.3) * Math.cos(phase * 0.7 + i * 0.2);
          const barHeight = Math.max(3, Math.abs(amp) * (height * 0.42) * distFromCenter + 4);

          const gradient = ctx.createLinearGradient(0, centerY - barHeight, 0, centerY + barHeight);
          gradient.addColorStop(0, '#f59e0b');
          gradient.addColorStop(0.5, '#d97706');
          gradient.addColorStop(1, '#78350f');

          ctx.fillStyle = gradient;
          ctx.fillRect(x + 1, centerY - barHeight / 2, barWidth - 2, barHeight);
        }
      } else {
        // Idle gentle pulse
        ctx.fillStyle = '#44403c';
        for (let i = 0; i < 48; i++) {
          const barWidth = width / 48;
          ctx.fillRect(i * barWidth + 1, centerY - 1.5, barWidth - 2, 3);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, isPaused]);

  if (!isOpen) return null;

  const currentLine = script.lines[currentLineIndex];

  return (
    <div
      id="studio-mixer-console"
      className="fixed inset-x-0 bottom-0 z-40 bg-stone-950/95 border-t border-amber-900/50 shadow-2xl backdrop-blur-lg text-stone-100 p-4 sm:p-5"
    >
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Top bar with close */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h3 className="font-serif text-sm sm:text-base font-bold text-amber-200">
              Konsoleta Emisyjna Słuchowiska • Christian Culture
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-stone-400 hover:text-stone-200 px-2 py-1 rounded bg-stone-900 border border-stone-800"
          >
            Zminimalizuj
          </button>
        </div>

        {/* Currently Speaking Line Monitor */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800/60 font-semibold">
                Kwestia {currentLineIndex + 1} / {script.lines.length}
              </span>
              <span className="text-xs font-semibold text-stone-200">
                {currentLine ? currentLine.characterName : 'Oczekiwanie na start audycji'}
              </span>
              {currentLine?.emotionCue && (
                <span className="text-xs text-amber-400/90 italic">
                  {currentLine.emotionCue}
                </span>
              )}
            </div>
            <p className="text-xs text-stone-300 truncate">
              {currentLine ? currentLine.text : 'Wciśnij Odtwarzaj, aby uruchomić pełne słuchowisko radiowe.'}
            </p>
          </div>

          {/* Waveform Canvas */}
          <div className="w-full sm:w-48 h-10 bg-stone-950 rounded-lg overflow-hidden border border-stone-800 shrink-0">
            <canvas ref={canvasRef} width={200} height={40} className="w-full h-full" />
          </div>
        </div>

        {/* Master Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Playback Buttons */}
          <div className="flex items-center justify-center md:justify-start gap-3">
            <button
              onClick={onPrevLine}
              disabled={currentLineIndex <= 0}
              className="p-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-stone-300 transition-colors border border-stone-800"
              title="Poprzednia kwestia"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {isPlaying && !isPaused ? (
              <button
                onClick={onPause}
                className="p-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold shadow-lg shadow-amber-600/20 transition-all scale-105"
                title="Pauza"
              >
                <Pause className="w-5 h-5 fill-current" />
              </button>
            ) : (
              <button
                onClick={onPlay}
                className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold shadow-lg shadow-amber-500/25 transition-all scale-105"
                title="Odtwórz słuchowisko"
              >
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </button>
            )}

            <button
              onClick={onStop}
              className="p-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 transition-colors border border-stone-800"
              title="Zatrzymaj"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>

            <button
              onClick={onNextLine}
              disabled={currentLineIndex >= script.lines.length - 1}
              className="p-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-stone-300 transition-colors border border-stone-800"
              title="Następna kwestia"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Atmosphere & Jingle Switchers */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Music className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <select
                value={settings.backgroundMusic}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    backgroundMusic: e.target.value as MusicAtmosphere,
                  })
                }
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-200 focus:outline-none"
              >
                <option value="sacred_strings">Tło: Majestatyczne Smyczki Sakralne</option>
                <option value="temple_harp">Tło: Harfa i Akordy Świątynne</option>
                <option value="solemn_choir">Tło: Uroczysty Chór Medytacyjny</option>
                <option value="deep_ambient">Tło: Głęboki Ambient Pustyni</option>
                <option value="none">Bez tła muzycznego</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.includeStationJingle}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    includeStationJingle: e.target.checked,
                  })
                }
                className="rounded accent-amber-500 bg-stone-900 border-stone-700"
              />
              <span className="flex items-center gap-1">
                <Bell className="w-3 h-3 text-amber-400" />
                Dżingiel stacji radiowej www.polskieradio.cc
              </span>
            </label>

            {/* Neural vs Natural Voice Selector */}
            <div className="flex items-center justify-between pt-1 border-t border-stone-800/80">
              <div className="flex items-center gap-1 text-[11px] text-stone-300">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Synteza:</span>
              </div>
              <div className="flex items-center gap-1 bg-stone-900 p-0.5 rounded border border-stone-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, speechEngine: 'ai_neural' })}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    settings.speechEngine === 'ai_neural'
                      ? 'bg-amber-600 text-stone-950 font-bold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                  title="Studio Gemini Neural Voice (24kHz HD)"
                >
                  Neuralne AI (HD)
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, speechEngine: 'browser_enhanced' })}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    settings.speechEngine === 'browser_enhanced'
                      ? 'bg-stone-700 text-stone-100 font-bold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                  title="Lektor lokalny z filtrem radiowym"
                >
                  Lokalny Lektor
                </button>
              </div>
            </div>

            {/* Warm broadcast acoustic filter */}
            <label className="flex items-center gap-2 text-[11px] text-stone-400 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.warmBroadcastFilter}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    warmBroadcastFilter: e.target.checked,
                  })
                }
                className="rounded accent-amber-500 bg-stone-900 border-stone-700"
              />
              <span>Ciepły lampowy filtr radiowy (Acoustic Tube Warmth)</span>
            </label>
          </div>

          {/* Volume Levels */}
          <div className="space-y-2 text-xs text-stone-400">
            <div className="flex items-center gap-2">
              <span className="w-16">Głos:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.voiceVolume}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    voiceVolume: parseFloat(e.target.value),
                  })
                }
                className="flex-1 h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <span className="w-8 font-mono text-amber-300">
                {Math.round(settings.voiceVolume * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-16">Muzyka:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.musicVolume}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    musicVolume: parseFloat(e.target.value),
                  })
                }
                className="flex-1 h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <span className="w-8 font-mono text-amber-300">
                {Math.round(settings.musicVolume * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
