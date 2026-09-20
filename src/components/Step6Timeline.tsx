import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Sparkles,
  RefreshCw,
  Volume2,
  VolumeX,
  Layers,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Film,
  ZoomIn,
  ZoomOut,
  Disc,
  Video,
} from 'lucide-react';
import { GeneratedAudioClip, ProductionProject } from '../types';

interface Step6TimelineProps {
  project: ProductionProject;
  onUpdateProject: (updated: Partial<ProductionProject>) => void;
  onProceedToExport: () => void;
  onProceedToVideo: () => void;
  onSynthesizeAllVoices: () => Promise<void>;
  onRenderMasterAudio: () => Promise<void>;
  isSynthesizing: boolean;
  synthesisProgress: { current: number; total: number; currentSpeaker: string };
  isRenderingMaster: boolean;
}

export const Step6Timeline: React.FC<Step6TimelineProps> = ({
  project,
  onUpdateProject,
  onProceedToExport,
  onProceedToVideo,
  onSynthesizeAllVoices,
  onRenderMasterAudio,
  isSynthesizing,
  synthesisProgress,
  isRenderingMaster,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [mutedTracks, setMutedTracks] = useState<{ [track: string]: boolean }>({
    narrator: false,
    characters: false,
    music: false,
    sfx: false,
    introOutro: false,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const lines = project.script?.lines || [];
  const characters = project.script?.characters || [];
  const generatedClips = project.generatedClips || [];

  const generatedCount = lines.filter((l) => generatedClips.some((c) => c.lineId === l.id)).length;
  const allClipsGenerated = lines.length > 0 && generatedCount === lines.length;

  const toggleMute = (trackKey: string) => {
    setMutedTracks((prev) => ({ ...prev, [trackKey]: !prev[trackKey] }));
  };

  // Playback control
  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    } else {
      setIsPlaying(true);
      playLine(currentLineIndex);
    }
  };

  const playLine = (index: number) => {
    if (index < 0 || index >= lines.length) {
      setIsPlaying(false);
      return;
    }
    setCurrentLineIndex(index);
    const line = lines[index];
    const clip = generatedClips.find((c) => c.lineId === line.id);

    if (clip && clip.audioUrl) {
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      audioRef.current.src = clip.audioUrl;
      audioRef.current.playbackRate = line.tempoMultiplier || 1.0;
      audioRef.current.onended = () => {
        const pause = line.pauseAfterMs || 700;
        setTimeout(() => {
          if (index + 1 < lines.length) {
            playLine(index + 1);
          } else {
            setIsPlaying(false);
          }
        }, pause);
      };
      audioRef.current.play().catch((e) => {
        console.warn('Playback error:', e);
        setIsPlaying(false);
      });
    } else {
      // If clip is not yet generated, simulate brief playback or fallback
      const timer = setTimeout(() => {
        if (index + 1 < lines.length) {
          playLine(index + 1);
        } else {
          setIsPlaying(false);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setCurrentLineIndex(0);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-900 to-amber-950/30 border border-amber-800/40 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[11px] font-bold uppercase tracking-wider border border-amber-500/30">
                Krok 6 z 7
              </span>
              <h2 className="text-lg font-serif font-bold text-stone-100">
                Generowanie AI i Montaż Osi Czasu
              </h2>
            </div>
            <p className="text-xs text-stone-300">
              Synteza głosów aktorskich Gemini TTS oraz zgranie całości w profesjonalny miks radiowy (-16 LUFS).
            </p>
          </div>

          <div className="flex items-center gap-2">
            {project.masterAudioWavUrl ? (
              <button
                type="button"
                onClick={onProceedToExport}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-bold shadow-md transition-all hover:scale-102"
              >
                <span>Miks gotowy → Krok 7: Eksport</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <span className="text-xs text-amber-400 font-semibold px-3 py-1.5 rounded-lg bg-amber-950/50 border border-amber-800/50">
                Wymagany montaż mastera
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Synthesis & Generation Dashboard */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-6 space-y-5 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
          <div>
            <h3 className="text-sm font-bold text-stone-100 mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Synteza głosów aktorskich (Gemini TTS)</span>
            </h3>
            <p className="text-xs text-stone-400">
              Stan klipów audio: <strong className="text-amber-300">{generatedCount} z {lines.length}</strong> wygenerowanych.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              disabled={isSynthesizing || isRenderingMaster}
              onClick={onSynthesizeAllVoices}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                isSynthesizing
                  ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600'
              }`}
            >
              {isSynthesizing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Synteza w toku...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{allClipsGenerated ? 'Przegeneruj głosy' : 'Wygeneruj wszystkie głosy AI'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isRenderingMaster || isSynthesizing || lines.length === 0}
              onClick={onRenderMasterAudio}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                isRenderingMaster
                  ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950'
              }`}
            >
              {isRenderingMaster ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-stone-950" />
                  <span>Montowanie FFmpeg (-16 LUFS)...</span>
                </>
              ) : (
                <>
                  <Disc className="w-4 h-4" />
                  <span>Zmontuj audycję (Master WAV / MP3)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Synthesis Progress Bar */}
        {isSynthesizing && (
          <div className="p-4 bg-stone-950 border border-amber-900/60 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-300 font-semibold flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Generowanie wypowiedzi: {synthesisProgress.currentSpeaker}
              </span>
              <span className="font-mono text-stone-400">
                {synthesisProgress.current} / {synthesisProgress.total} (
                {Math.round((synthesisProgress.current / (synthesisProgress.total || 1)) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-stone-900 rounded-full h-2 overflow-hidden border border-stone-800">
              <div
                className="bg-amber-500 h-full transition-all duration-300 rounded-full"
                style={{
                  width: `${(synthesisProgress.current / (synthesisProgress.total || 1)) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Master rendered status */}
        {project.masterAudioWavUrl && !isRenderingMaster && (
          <div className="p-3.5 bg-emerald-950/40 border border-emerald-700/60 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Audycja została pomyślnie zmontowana i zmasterowana w standardzie radiowym (-16 LUFS).
              </span>
            </div>
            <span className="font-mono font-bold text-stone-200">
              {project.masterAudioWavUrl.includes('wav') ? 'WAV 48kHz / MP3 192k' : 'Gotowy'}
            </span>
          </div>
        )}
      </div>

      {/* Multi-track Timeline Visualizer */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 space-y-4 shadow-md">
        {/* Timeline Header & Transport Controls */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-stone-800">
          {/* Transport buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (currentLineIndex > 0) playLine(currentLineIndex - 1);
              }}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-stone-100 border border-stone-700 transition-colors"
              title="Poprzednia kwestia"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleTogglePlay}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs flex items-center gap-2 shadow-md transition-all hover:scale-102"
              title={isPlaying ? 'Pauza' : 'Odtwórz słuchowisko'}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-stone-950" />
                  <span>Pauza</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-stone-950" />
                  <span>Odtwórz</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleStop}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-stone-100 border border-stone-700 transition-colors"
              title="Zatrzymaj"
            >
              <Square className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (currentLineIndex + 1 < lines.length) playLine(currentLineIndex + 1);
              }}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-stone-100 border border-stone-700 transition-colors"
              title="Następna kwestia"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Time & Position */}
          <div className="flex items-center gap-3 text-xs">
            <span className="font-mono text-amber-300 font-bold bg-stone-950 px-3 py-1.5 rounded-lg border border-stone-800">
              Kwestia {currentLineIndex + 1} z {lines.length}
            </span>

            {/* Zoom Slider */}
            <div className="flex items-center gap-1.5 text-stone-400">
              <ZoomOut className="w-3.5 h-3.5" />
              <input
                type="range"
                min="0.8"
                max="2.0"
                step="0.1"
                value={zoomLevel}
                onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                className="w-20 accent-amber-500 cursor-pointer"
              />
              <ZoomIn className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Tracks Board */}
        <div className="space-y-2 overflow-x-auto pb-2 scrollbar-none">
          {/* Track 1: Narrator */}
          <div className="flex items-center gap-3 min-w-[700px]">
            <div className="w-36 shrink-0 flex items-center justify-between p-2 rounded-xl bg-amber-950/40 border border-amber-800/40 text-xs">
              <span className="font-bold text-amber-300">1. Narrator</span>
              <button
                type="button"
                onClick={() => toggleMute('narrator')}
                className={`p-1 rounded ${mutedTracks.narrator ? 'text-red-400' : 'text-stone-400'}`}
              >
                {mutedTracks.narrator ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              </button>
            </div>
            <div className="flex-1 flex gap-1.5 h-9 bg-stone-950/80 rounded-xl p-1 border border-stone-800 overflow-hidden">
              {lines.map((line, idx) => {
                const isNarrator = line.characterId === 'narrator' || line.characterName.toLowerCase().includes('narrator');
                const isCurrent = currentLineIndex === idx;
                if (!isNarrator) return <div key={line.id} className="flex-1 opacity-10" />;
                return (
                  <div
                    key={line.id}
                    onClick={() => playLine(idx)}
                    className={`flex-1 rounded cursor-pointer transition-all border text-[10px] flex items-center justify-center font-mono ${
                      isCurrent
                        ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold scale-105'
                        : 'bg-amber-950/70 border-amber-800/60 text-amber-300 hover:bg-amber-900/60'
                    }`}
                    title={line.text}
                  >
                    #{idx + 1}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Track 2: Characters */}
          <div className="flex items-center gap-3 min-w-[700px]">
            <div className="w-36 shrink-0 flex items-center justify-between p-2 rounded-xl bg-blue-950/40 border border-blue-800/40 text-xs">
              <span className="font-bold text-blue-300">2. Postacie</span>
              <button
                type="button"
                onClick={() => toggleMute('characters')}
                className={`p-1 rounded ${mutedTracks.characters ? 'text-red-400' : 'text-stone-400'}`}
              >
                {mutedTracks.characters ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              </button>
            </div>
            <div className="flex-1 flex gap-1.5 h-9 bg-stone-950/80 rounded-xl p-1 border border-stone-800 overflow-hidden">
              {lines.map((line, idx) => {
                const isNarrator = line.characterId === 'narrator' || line.characterName.toLowerCase().includes('narrator');
                const isCurrent = currentLineIndex === idx;
                if (isNarrator) return <div key={line.id} className="flex-1 opacity-10" />;
                return (
                  <div
                    key={line.id}
                    onClick={() => playLine(idx)}
                    className={`flex-1 rounded cursor-pointer transition-all border text-[10px] flex items-center justify-center font-mono ${
                      isCurrent
                        ? 'bg-blue-500 text-stone-950 border-blue-400 font-bold scale-105'
                        : 'bg-blue-950/70 border-blue-800/60 text-blue-300 hover:bg-blue-900/60'
                    }`}
                    title={`${line.characterName}: ${line.text}`}
                  >
                    #{idx + 1}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Track 3: Music */}
          <div className="flex items-center gap-3 min-w-[700px]">
            <div className="w-36 shrink-0 flex items-center justify-between p-2 rounded-xl bg-purple-950/40 border border-purple-800/40 text-xs">
              <span className="font-bold text-purple-300">3. Muzyka</span>
              <button
                type="button"
                onClick={() => toggleMute('music')}
                className={`p-1 rounded ${mutedTracks.music ? 'text-red-400' : 'text-stone-400'}`}
              >
                {mutedTracks.music ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              </button>
            </div>
            <div className="flex-1 h-9 bg-stone-950/80 rounded-xl p-1 border border-stone-800 flex items-center px-3">
              <div className="w-full h-3 rounded bg-purple-900/40 border border-purple-700/50 flex items-center justify-center text-[9px] text-purple-300">
                Podkład smyczkowy Christian Culture (ciągły z duckingiem pod Słowo)
              </div>
            </div>
          </div>

          {/* Track 4: SFX */}
          <div className="flex items-center gap-3 min-w-[700px]">
            <div className="w-36 shrink-0 flex items-center justify-between p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-xs">
              <span className="font-bold text-emerald-300">4. Efekty (SFX)</span>
              <button
                type="button"
                onClick={() => toggleMute('sfx')}
                className={`p-1 rounded ${mutedTracks.sfx ? 'text-red-400' : 'text-stone-400'}`}
              >
                {mutedTracks.sfx ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              </button>
            </div>
            <div className="flex-1 flex gap-1.5 h-9 bg-stone-950/80 rounded-xl p-1 border border-stone-800 overflow-hidden">
              {lines.map((line, idx) => (
                <div
                  key={line.id}
                  className={`flex-1 rounded border text-[9px] flex items-center justify-center ${
                    line.sfxCue
                      ? 'bg-emerald-950/70 border-emerald-800/60 text-emerald-300'
                      : 'opacity-10'
                  }`}
                  title={line.sfxCue || 'Brak efektu'}
                >
                  {line.sfxCue ? 'SFX' : ''}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Current Active Line Preview */}
        {lines[currentLineIndex] && (
          <div className="p-4 bg-stone-950 border border-amber-900/40 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span className="font-bold text-amber-300">
                {lines[currentLineIndex].characterName} ({lines[currentLineIndex].verseRef})
              </span>
              <span className="italic text-stone-500">
                {lines[currentLineIndex].emotionCue}
              </span>
            </div>
            <p className="text-sm text-stone-100 font-serif">
              "{lines[currentLineIndex].text}"
            </p>
          </div>
        )}
      </div>

      {/* Bottom Actions to Step 7 Video Studio or Step 8 Export */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-stone-800">
        <button
          type="button"
          onClick={onProceedToExport}
          className="text-stone-400 hover:text-stone-200 text-xs font-semibold underline underline-offset-4"
        >
          Przejdź bezpośrednio do publikacji audio (Krok 8)
        </button>

        <button
          type="button"
          onClick={onProceedToVideo}
          className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 text-sm font-extrabold shadow-2xl transition-all hover:scale-105 border border-amber-300/60 ring-2 ring-amber-500/30 animate-pulse"
        >
          <Video className="w-5 h-5 fill-current" />
          <span>UTWÓRZ FILM NA YOUTUBE (KROK 7)</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
