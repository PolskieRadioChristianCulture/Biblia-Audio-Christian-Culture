import React, { useEffect, useRef, useState } from 'react';
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
  ChevronUp,
  Sparkles,
  Folder,
} from 'lucide-react';
import { AudioMixerSettings, DramaLine, MusicAtmosphere, RadioDramaScript } from '../types';
import { CustomAudioUploader } from './CustomAudioUploader';

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
  meterL?: number;    // 0..10
  meterR?: number;    // 0..10
  analyserData?: Uint8Array | null;
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
  meterL = 0,
  meterR = 0,
  analyserData,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const [showCustomAudio, setShowCustomAudio] = useState(false);
  const [showEq, setShowEq] = useState(false);

  const customTracksCount = [
    settings.customMusicTrack,
    settings.customJingleTrack,
    settings.customIntroTrack,
    settings.customOutroTrack,
  ].filter(Boolean).length;

  // Real FFT visualizer — draws actual AnalyserNode frequency data
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const centerY = h / 2;

      // Baseline
      ctx.strokeStyle = '#292524';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(w, centerY);
      ctx.stroke();

      if (analyserData && analyserData.length > 0 && isPlaying && !isPaused) {
        // Real FFT bars from AnalyserNode
        const barCount = analyserData.length;
        const barW = w / barCount;
        for (let i = 0; i < barCount; i++) {
          const val = analyserData[i] / 255; // 0..1
          const barH = Math.max(2, val * h * 0.9);
          const x = i * barW;
          const gradient = ctx.createLinearGradient(0, centerY - barH / 2, 0, centerY + barH / 2);
          gradient.addColorStop(0, val > 0.7 ? '#ef4444' : '#f59e0b');
          gradient.addColorStop(0.5, '#d97706');
          gradient.addColorStop(1, '#78350f');
          ctx.fillStyle = gradient;
          ctx.fillRect(x + 0.5, centerY - barH / 2, barW - 1, barH);
        }
      } else if (isPlaying && !isPaused) {
        // Fallback: gentle sine animation when no analyserData yet
        const t = Date.now() / 300;
        const barsCount = 32;
        const barW2 = w / barsCount;
        for (let i = 0; i < barsCount; i++) {
          const amp = Math.sin(t + i * 0.4) * Math.cos(t * 0.6 + i * 0.2);
          const barH = Math.max(3, Math.abs(amp) * h * 0.38 + 3);
          const gradient = ctx.createLinearGradient(0, centerY - barH, 0, centerY + barH);
          gradient.addColorStop(0, '#f59e0b');
          gradient.addColorStop(1, '#78350f');
          ctx.fillStyle = gradient;
          ctx.fillRect(i * barW2 + 0.5, centerY - barH / 2, barW2 - 1, barH);
        }
      } else {
        // Idle flat bars
        ctx.fillStyle = '#44403c';
        const barsCount = 32;
        const barW3 = w / barsCount;
        for (let i = 0; i < barsCount; i++) {
          ctx.fillRect(i * barW3 + 0.5, centerY - 1.5, barW3 - 1, 3);
        }
      }
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying, isPaused, analyserData]);

  const currentLine: DramaLine | undefined = script.lines[currentLineIndex];

  // EQ values with defaults matching CC broadcast spec
  const eqHighPassHz = settings.eqHighPassHz ?? 80;
  const eqMidGainDb = settings.eqMidGainDb ?? 2;
  const eqAirGainDb = settings.eqAirGainDb ?? 1;

  return (
    <div
      id="studio-mixer-console"
      className="sticky top-4 h-fit rounded-2xl bg-stone-950/95 border border-amber-900/40 shadow-2xl backdrop-blur-lg text-stone-100 p-4 flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-6rem)]"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
        <h3 className="font-serif text-sm font-bold text-amber-200 leading-tight">
          Konsoleta Emisyjna
          <span className="block text-[10px] font-sans font-normal text-stone-400 tracking-wide">
            Christian Culture · Biblia Audio Studio
          </span>
        </h3>
      </div>

      {/* Waveform Visualizer */}
      <div className="w-full h-12 bg-stone-950 rounded-xl overflow-hidden border border-stone-800">
        <canvas ref={canvasRef} width={280} height={48} className="w-full h-full" />
      </div>

      {/* VU Meters */}
      <div className="flex gap-2 items-end h-8">
        <span className="text-[9px] font-mono text-stone-500 shrink-0 pb-0.5">VU</span>
        {/* Left */}
        <div className="flex-1 flex gap-0.5 items-end h-full">
          {Array.from({ length: 10 }, (_, i) => {
            const active = meterL > i;
            const isHot = i >= 8;
            const isMid = i >= 5;
            return (
              <div
                key={i}
                className={`flex-1 rounded-sm transition-all duration-75 ${
                  active
                    ? isHot
                      ? 'bg-red-500'
                      : isMid
                      ? 'bg-amber-400'
                      : 'bg-emerald-500'
                    : 'bg-stone-800'
                }`}
                style={{ height: `${50 + i * 5}%` }}
              />
            );
          })}
        </div>
        <span className="text-[9px] font-mono text-stone-500 shrink-0 self-end pb-0.5">L</span>
        {/* Right */}
        <div className="flex-1 flex gap-0.5 items-end h-full">
          {Array.from({ length: 10 }, (_, i) => {
            const active = meterR > i;
            const isHot = i >= 8;
            const isMid = i >= 5;
            return (
              <div
                key={i}
                className={`flex-1 rounded-sm transition-all duration-75 ${
                  active
                    ? isHot
                      ? 'bg-red-500'
                      : isMid
                      ? 'bg-amber-400'
                      : 'bg-emerald-500'
                    : 'bg-stone-800'
                }`}
                style={{ height: `${50 + i * 5}%` }}
              />
            );
          })}
        </div>
        <span className="text-[9px] font-mono text-stone-500 shrink-0 self-end pb-0.5">R</span>
      </div>

      {/* Current Line Monitor */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800/60 font-semibold shrink-0">
            {currentLineIndex + 1}/{script.lines.length}
          </span>
          <span className="text-xs font-semibold text-stone-200 truncate">
            {currentLine ? currentLine.characterName : 'Oczekiwanie…'}
          </span>
          {currentLine?.emotionCue && (
            <span className="text-[10px] text-amber-400/90 italic truncate">{currentLine.emotionCue}</span>
          )}
        </div>
        <p className="text-[11px] text-stone-300 line-clamp-2">
          {currentLine ? currentLine.text : 'Wciśnij Odtwarzaj, aby uruchomić pełne słuchowisko radiowe.'}
        </p>
      </div>

      {/* Transport Controls */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onPrevLine}
          disabled={currentLineIndex <= 0}
          className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-stone-300 transition-colors border border-stone-800"
          title="Poprzednia kwestia"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        {isPlaying && !isPaused ? (
          <button
            onClick={onPause}
            className="flex-1 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold shadow-lg shadow-amber-600/20 transition-all flex items-center justify-center gap-2"
            title="Pauza"
          >
            <Pause className="w-5 h-5 fill-current" />
            <span className="text-sm">Pauza</span>
          </button>
        ) : isPaused ? (
          <button
            onClick={onPlay}
            className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
            title="Wznów"
          >
            <Play className="w-5 h-5 fill-current" />
            <span className="text-sm">Wznów</span>
          </button>
        ) : (
          <button
            onClick={onPlay}
            className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
            title="Odtwórz słuchowisko"
          >
            <Play className="w-5 h-5 fill-current ml-0.5" />
            <span className="text-sm">Odtwórz</span>
          </button>
        )}

        <button
          onClick={onStop}
          className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 transition-colors border border-stone-800"
          title="Zatrzymaj"
        >
          <Square className="w-4 h-4 fill-current" />
        </button>

        <button
          onClick={onNextLine}
          disabled={currentLineIndex >= script.lines.length - 1}
          className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-stone-300 transition-colors border border-stone-800"
          title="Następna kwestia"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Volume Sliders */}
      <div className="space-y-2 text-xs text-stone-400 pt-1 border-t border-stone-800/80">
        <div className="flex items-center gap-2">
          <span className="w-14 shrink-0">Głos:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.voiceVolume}
            onChange={(e) =>
              onUpdateSettings({ ...settings, voiceVolume: parseFloat(e.target.value) })
            }
            className="flex-1 h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <span className="w-8 font-mono text-amber-300 text-right">
            {Math.round(settings.voiceVolume * 100)}%
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-14 shrink-0">Muzyka:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.musicVolume}
            onChange={(e) =>
              onUpdateSettings({ ...settings, musicVolume: parseFloat(e.target.value) })
            }
            className="flex-1 h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <span className="w-8 font-mono text-amber-300 text-right">
            {Math.round(settings.musicVolume * 100)}%
          </span>
        </div>
      </div>

      {/* 3-Band EQ Panel */}
      <div className="border-t border-stone-800/80 pt-2">
        <button
          type="button"
          onClick={() => setShowEq(!showEq)}
          className="w-full flex items-center justify-between text-[11px] text-stone-400 hover:text-amber-300 transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <Sliders className="w-3 h-3 text-amber-400" />
            <span className="font-semibold">Korektor Radiowy (3 pasma)</span>
          </div>
          {showEq ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {showEq && (
          <div className="mt-2 space-y-2 text-[11px] text-stone-400">
            {/* HP Filter */}
            <div className="flex items-center gap-2">
              <span className="w-20 shrink-0">HP: {eqHighPassHz} Hz</span>
              <input
                type="range"
                min="60"
                max="120"
                step="5"
                value={eqHighPassHz}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, eqHighPassHz: parseInt(e.target.value) })
                }
                className="flex-1 h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
            {/* Mid Presence */}
            <div className="flex items-center gap-2">
              <span className="w-20 shrink-0">
                Obecność: {eqMidGainDb >= 0 ? '+' : ''}{eqMidGainDb} dB
              </span>
              <input
                type="range"
                min="-6"
                max="6"
                step="0.5"
                value={eqMidGainDb}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, eqMidGainDb: parseFloat(e.target.value) })
                }
                className="flex-1 h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
            {/* Air Shelf */}
            <div className="flex items-center gap-2">
              <span className="w-20 shrink-0">
                Powietrze: +{eqAirGainDb} dB
              </span>
              <input
                type="range"
                min="0"
                max="4"
                step="0.5"
                value={eqAirGainDb}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, eqAirGainDb: parseFloat(e.target.value) })
                }
                className="flex-1 h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
            <p className="text-[10px] text-stone-600 mt-1">
              Ustawienia stosowane przy masteringu do WAV/MP4. Domyślne: HP 80 Hz · Obecność +2 dB · Powietrze +1 dB
            </p>
          </div>
        )}
      </div>

      {/* Atmosphere & Jingle */}
      <div className="space-y-2 border-t border-stone-800/80 pt-2">
        <div className="flex items-center gap-2">
          <Music className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <select
            value={settings.backgroundMusic}
            onChange={(e) =>
              onUpdateSettings({ ...settings, backgroundMusic: e.target.value as MusicAtmosphere })
            }
            className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2 py-1.5 text-xs text-amber-200 focus:outline-none"
          >
            {settings.customMusicTrack && (
              <option value="sacred_strings">⭐ {settings.customMusicTrack.fileName}</option>
            )}
            <option value="sacred_strings">Majestatyczne Smyczki Sakralne</option>
            <option value="temple_harp">Harfa i Akordy Świątynne</option>
            <option value="solemn_choir">Uroczysty Chór Medytacyjny</option>
            <option value="deep_ambient">Głęboki Ambient Pustyni</option>
            <option value="none">Bez tła muzycznego</option>
          </select>
        </div>

        <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.includeStationJingle}
            onChange={(e) =>
              onUpdateSettings({ ...settings, includeStationJingle: e.target.checked })
            }
            className="rounded accent-amber-500 bg-stone-900 border-stone-700"
          />
          <Bell className="w-3 h-3 text-amber-400 shrink-0" />
          <span className="truncate">
            {settings.customJingleTrack
              ? `Własny dżingiel (${settings.customJingleTrack.fileName})`
              : 'Dżingiel stacji polskieradio.cc'}
          </span>
        </label>
      </div>

      {/* Custom Audio Files */}
      <div className="border-t border-stone-800/80 pt-2">
        <button
          type="button"
          onClick={() => setShowCustomAudio(!showCustomAudio)}
          className="w-full flex items-center justify-between p-2 rounded-lg bg-stone-900/80 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 text-xs transition-colors"
        >
          <div className="flex items-center gap-2">
            <Folder className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold">Własne pliki audio</span>
            {customTracksCount > 0 && (
              <span className="px-1.5 py-0 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
                {customTracksCount}
              </span>
            )}
          </div>
          {showCustomAudio ? (
            <ChevronUp className="w-3.5 h-3.5 text-stone-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
          )}
        </button>

        {showCustomAudio && (
          <div className="mt-2 p-3 bg-stone-950/80 border border-stone-800 rounded-xl space-y-3">
            <p className="text-[11px] text-stone-400">
              Wgraj własne pliki MP3/WAV dla stacji Christian Culture:
            </p>
            <div className="space-y-2.5">
              <CustomAudioUploader
                compact
                label="Własny podkład muzyczny"
                trackType="music"
                currentTrack={settings.customMusicTrack}
                onTrackUploaded={(track) => onUpdateSettings({ ...settings, customMusicTrack: track })}
                onTrackRemoved={() => onUpdateSettings({ ...settings, customMusicTrack: undefined })}
              />
              <CustomAudioUploader
                compact
                label="Dżingiel stacji radiowej"
                trackType="jingle"
                currentTrack={settings.customJingleTrack}
                onTrackUploaded={(track) => onUpdateSettings({ ...settings, customJingleTrack: track })}
                onTrackRemoved={() => onUpdateSettings({ ...settings, customJingleTrack: undefined })}
              />
              <CustomAudioUploader
                compact
                label="Czołówka / Intro audycji"
                trackType="intro"
                currentTrack={settings.customIntroTrack}
                onTrackUploaded={(track) => onUpdateSettings({ ...settings, customIntroTrack: track })}
                onTrackRemoved={() => onUpdateSettings({ ...settings, customIntroTrack: undefined })}
              />
              <CustomAudioUploader
                compact
                label="Tyłówka / Outro audycji"
                trackType="outro"
                currentTrack={settings.customOutroTrack}
                onTrackUploaded={(track) => onUpdateSettings({ ...settings, customOutroTrack: track })}
                onTrackRemoved={() => onUpdateSettings({ ...settings, customOutroTrack: undefined })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Speech Engine & Warm Filter */}
      <div className="space-y-2 border-t border-stone-800/80 pt-2">
        <div className="flex items-center justify-between">
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
              Neuralne AI
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
              Lokalny
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2 text-[11px] text-stone-400 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.warmBroadcastFilter}
            onChange={(e) =>
              onUpdateSettings({ ...settings, warmBroadcastFilter: e.target.checked })
            }
            className="rounded accent-amber-500 bg-stone-900 border-stone-700"
          />
          <Radio className="w-3 h-3 text-amber-400 shrink-0" />
          <span>Ciepły filtr lampowy radiowy</span>
        </label>
      </div>
    </div>
  );
};
