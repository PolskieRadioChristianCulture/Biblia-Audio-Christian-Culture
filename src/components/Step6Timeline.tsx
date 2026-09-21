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
  UploadCloud,
  Folder,
  Music,
  Radio,
  ChevronDown,
  ChevronUp,
  Trash2,
  Mic,
} from 'lucide-react';
import { GeneratedAudioClip, ProductionProject, CustomAudioTrack } from '../types';
import { CustomAudioUploader } from './CustomAudioUploader';
import { formatDuration } from '../lib/customAudioUtils';
import { useStudioPlayback } from '../lib/useStudioPlayback';

interface Step6TimelineProps {
  project: ProductionProject;
  onUpdateProject: (updated: Partial<ProductionProject>) => void;
  onProceedToExport: () => void;
  onProceedToVideo: () => void;
  onSynthesizeAllVoices: (forceAll?: boolean) => Promise<void>;
  onRenderMasterAudio: () => Promise<void>;
  isSynthesizing: boolean;
  synthesisProgress: { current: number; total: number; currentSpeaker: string };
  isRenderingMaster: boolean;
  ttsEngine?: 'auto' | 'polish_neural' | 'gemini';
  onSetTtsEngine?: (engine: 'auto' | 'polish_neural' | 'gemini') => void;
  onAuditionLine?: (line: any) => void;
  onSynthesizeSingleLine?: (line: any) => Promise<void>;
  onClearTtsCache?: () => Promise<void>;
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
  ttsEngine = 'auto',
  onSetTtsEngine,
  onAuditionLine,
  onSynthesizeSingleLine,
  onClearTtsCache,
}) => {
  const playback = useStudioPlayback(project);
  const isPlaying = playback.isPlaying && !playback.isPaused;
  const currentLineIndex = playback.currentLineIndex;

  const [zoomLevel, setZoomLevel] = useState(1);
  const [showCustomAudioDock, setShowCustomAudioDock] = useState(false);
  const [mutedTracks, setMutedTracks] = useState<{ [track: string]: boolean }>({
    narrator: false,
    characters: false,
    music: false,
    sfx: false,
    introOutro: false,
  });

  const lines = project.script?.lines || [];
  const characters = project.script?.characters || [];
  const generatedClips = project.generatedClips || [];

  const generatedCount = lines.filter((l) => generatedClips.some((c) => c.lineId === l.id)).length;
  const allClipsGenerated = lines.length > 0 && generatedCount === lines.length;

  const toggleMute = (trackKey: string) => {
    setMutedTracks((prev) => ({ ...prev, [trackKey]: !prev[trackKey] }));
    if (trackKey === 'music') playback.toggleMute('music');
    if (trackKey === 'sfx') playback.toggleMute('fx');
  };

  // Playback control synchronized with central engine
  const handleTogglePlay = () => {
    playback.togglePlay();
  };

  const playLine = (index: number) => {
    playback.seekToLine(index);
  };

  const handleStop = () => {
    playback.stop();
  };

  const handleUpdateLineCustomAudio = (lineId: string, track?: CustomAudioTrack) => {
    const updatedLines = lines.map((l) => (l.id === lineId ? { ...l, customAudioFile: track } : l));
    const existingClips = generatedClips.filter((c) => c.lineId !== lineId);
    if (track) {
      const targetLine = lines.find((l) => l.id === lineId);
      existingClips.push({
        lineId,
        characterId: targetLine?.characterId || '',
        audioBase64: track.base64 || '',
        audioUrl: track.audioUrl,
        durationSec: track.durationSec,
      });
    }
    onUpdateProject({
      script: { ...project.script, lines: updatedLines },
      generatedClips: existingClips,
    });
  };

  const handleUpdateMixerTrack = (
    key: 'customMusicTrack' | 'customJingleTrack' | 'customIntroTrack' | 'customOutroTrack',
    track?: CustomAudioTrack
  ) => {
    onUpdateProject({
      mixerSettings: {
        ...project.mixerSettings,
        [key]: track,
      },
    });
  };

  const customVoiceCount = lines.filter((l) => Boolean(l.customAudioFile)).length;
  const customMixerCount = [
    project.mixerSettings?.customMusicTrack,
    project.mixerSettings?.customJingleTrack,
    project.mixerSettings?.customIntroTrack,
    project.mixerSettings?.customOutroTrack,
  ].filter(Boolean).length;
  const customAudioCount = customVoiceCount + customMixerCount;

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
              <span>Synteza głosów lektorskich i aktorskich</span>
            </h3>
            <p className="text-xs text-stone-400">
              Stan klipów audio: <strong className="text-amber-300">{generatedCount} z {lines.length}</strong> wygenerowanych.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onClearTtsCache && (
              <button
                type="button"
                disabled={isSynthesizing || isRenderingMaster}
                onClick={onClearTtsCache}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-stone-800/80 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-colors"
                title="Wyczyść pamięć podręczną audio i zacznij od nowa"
              >
                Wyczyść pamięć audio
              </button>
            )}

            <button
              type="button"
              disabled={isSynthesizing || isRenderingMaster}
              onClick={() => onSynthesizeAllVoices(allClipsGenerated)}
              className={`flex items-center gap-2 px-4 py-2 rounded font-mono text-xs font-bold transition-all shadow-md ${
                isSynthesizing
                  ? 'bg-[#252c38] text-stone-500 cursor-not-allowed border border-[#353e4f]'
                  : 'bg-gradient-to-b from-[#ff8c1a] to-[#d65f00] hover:from-[#ffa033] hover:to-[#e66800] text-black border border-[#ffa33a] shadow-[0_0_14px_rgba(255,122,0,0.4)]'
              }`}
            >
              {isSynthesizing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#ff7a00]" />
                  <span>SYNTEZA W TOKU...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{allClipsGenerated ? 'PRZEGENERUJ GŁOSY (ODŚWIEŻ)' : 'WYGENERUJ WSZYSTKIE GŁOSY AI'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isRenderingMaster || isSynthesizing || lines.length === 0}
              onClick={onRenderMasterAudio}
              className={`flex items-center gap-2 px-4 py-2 rounded font-mono text-xs font-bold transition-all shadow-md ${
                isRenderingMaster
                  ? 'bg-[#252c38] text-stone-500 cursor-not-allowed border border-[#353e4f]'
                  : 'bg-gradient-to-b from-[#2ecc71] to-[#219d55] hover:from-[#3df087] hover:to-[#27b361] text-black border border-[#48f28f] shadow-[0_0_14px_rgba(46,204,113,0.4)]'
              }`}
            >
              {isRenderingMaster ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#2ecc71]" />
                  <span>MONTOWANIE FFmpeg (-16 LUFS)...</span>
                </>
              ) : (
                <>
                  <Disc className="w-3.5 h-3.5" />
                  <span>MASTER AUDIO (WAV / MP3)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Engine Selection Bar */}
        {onSetTtsEngine && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-2.5 bg-[#0e1116] border border-[#262f3c] rounded text-xs font-mono">
            <div className="flex items-center gap-2 text-stone-300">
              <span className="font-bold text-[#ff8c1a]">GENERATOR SPEECH V3:</span>
              <span className="text-stone-500 hidden md:inline">wybierz silnik lektorski</span>
            </div>
            <div className="flex items-center gap-1 bg-[#161a22] p-0.5 rounded border border-[#2d3644]">
              <button
                type="button"
                onClick={() => onSetTtsEngine('auto')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                  ttsEngine === 'auto'
                    ? 'bg-[#ff7a00] text-black shadow-[0_0_8px_rgba(255,122,0,0.5)]'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Auto: Gemini AI Cloud + inteligentny fallback na Polish Studio Voice"
              >
                AUTO (ZALECANY)
              </button>
              <button
                type="button"
                onClick={() => onSetTtsEngine('polish_neural')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                  ttsEngine === 'polish_neural'
                    ? 'bg-[#ff7a00] text-black shadow-[0_0_8px_rgba(255,122,0,0.5)]'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Lektor Radia CC: polska fonetyka bez limitów API"
              >
                PL STUDIO (NO LIMIT)
              </button>
              <button
                type="button"
                onClick={() => onSetTtsEngine('gemini')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                  ttsEngine === 'gemini'
                    ? 'bg-[#ff7a00] text-black shadow-[0_0_8px_rgba(255,122,0,0.5)]'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Gemini AI Cloud TTS"
              >
                GEMINI AI
              </button>
            </div>
          </div>
        )}

        {/* Custom Audio Dock Toggle Banner */}
        <div className="flex items-center justify-between p-3.5 bg-[#10141d] border border-[#263548] rounded-xl flex-wrap gap-2 font-mono">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-[#ff8c1a] border border-amber-500/30">
              <Folder className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">WŁASNE PLIKI AUDIO (DŻINGIEL, MUZYKA, INTRO/OUTRO)</span>
                {customAudioCount > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold">
                    {customAudioCount} AKTYWNE
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-400">
                Wgrywaj własne nagrania lektorskie, oficjalny dżingiel radia oraz czołówkę audycji
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowCustomAudioDock(!showCustomAudioDock)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18212e] hover:bg-[#222e40] text-amber-300 hover:text-white border border-[#2f3f58] text-xs font-bold transition-colors"
          >
            <span>{showCustomAudioDock ? 'Ukryj bibliotekę plików' : 'Zarządzaj własnymi plikami audio'}</span>
            {showCustomAudioDock ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Custom Audio Dock Accordion */}
        {showCustomAudioDock && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <CustomAudioUploader
              label="Własny podkład muzyczny"
              description="Wgraj plik MP3/WAV, który będzie grał w tle całego słuchowiska"
              trackType="music"
              currentTrack={project.mixerSettings?.customMusicTrack}
              onTrackUploaded={(track) => handleUpdateMixerTrack('customMusicTrack', track)}
              onTrackRemoved={() => handleUpdateMixerTrack('customMusicTrack', undefined)}
            />
            <CustomAudioUploader
              label="Dżingiel stacji radiowej"
              description="Oficjalny identyfikator dźwiękowy stacji Christian Culture (MP3/WAV)"
              trackType="jingle"
              currentTrack={project.mixerSettings?.customJingleTrack}
              onTrackUploaded={(track) => handleUpdateMixerTrack('customJingleTrack', track)}
              onTrackRemoved={() => handleUpdateMixerTrack('customJingleTrack', undefined)}
            />
            <CustomAudioUploader
              label="Czołówka / Intro audycji"
              description="Dźwiękowy wstęp odtwarzany przed pierwszym wersetem (MP3/WAV)"
              trackType="intro"
              currentTrack={project.mixerSettings?.customIntroTrack}
              onTrackUploaded={(track) => handleUpdateMixerTrack('customIntroTrack', track)}
              onTrackRemoved={() => handleUpdateMixerTrack('customIntroTrack', undefined)}
            />
            <CustomAudioUploader
              label="Tyłówka / Outro audycji"
              description="Oficjalne zakończenie audycji i zapowiedź kolejnego odcinka (MP3/WAV)"
              trackType="outro"
              currentTrack={project.mixerSettings?.customOutroTrack}
              onTrackUploaded={(track) => handleUpdateMixerTrack('customOutroTrack', track)}
              onTrackRemoved={() => handleUpdateMixerTrack('customOutroTrack', undefined)}
            />
          </div>
        )}

        {/* Synthesis Progress Bar */}
        {isSynthesizing && (
          <div className="p-3 bg-[#0d1015] border border-[#ff7a00]/40 rounded space-y-1.5 font-mono">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#ff8c1a] font-bold flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                RENDERING: {synthesisProgress.currentSpeaker}
              </span>
              <span className="text-stone-400 text-[11px]">
                {synthesisProgress.current} / {synthesisProgress.total} ({Math.round((synthesisProgress.current / (synthesisProgress.total || 1)) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-[#171b22] rounded h-2 overflow-hidden border border-[#2b3341]">
              <div
                className="bg-gradient-to-r from-[#ff7a00] to-[#00d2d3] h-full transition-all duration-300"
                style={{
                  width: `${(synthesisProgress.current / (synthesisProgress.total || 1)) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Master rendered status */}
        {project.masterAudioWavUrl && !isRenderingMaster && (
          <div className="p-2.5 bg-[#0f2117] border border-[#2ecc71]/50 rounded flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-[#2ecc71]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>MASTERING UKOŃCZONY: STANDARD RADIOWY EBU R128 (-16 LUFS, 48 kHz / 24-bit).</span>
            </div>
            <span className="text-stone-300 font-bold">
              {project.masterAudioWavUrl.includes('wav') ? 'WAV 48kHz / MP3' : 'READY'}
            </span>
          </div>
        )}
      </div>

      {/* FL Studio Multi-track Playlist Arranger */}
      <div className="bg-[#14171e] border border-[#29313f] rounded-xl p-4 space-y-3 shadow-xl">
        {/* Playlist Header & Transport Strip */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-2.5 border-b border-[#232a36]">
          {/* Playlist Transport buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (currentLineIndex > 0) playLine(currentLineIndex - 1);
              }}
              className="p-1.5 rounded bg-[#1c222c] hover:bg-[#252d3b] text-stone-300 hover:text-white border border-[#2e3746] transition-colors"
              title="Poprzednia kwestia"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleTogglePlay}
              className={`px-3 py-1.5 rounded font-mono font-black text-xs flex items-center gap-1.5 transition-all ${
                isPlaying
                  ? 'bg-[#2ecc71] text-black border border-[#38ef7d] shadow-[0_0_12px_rgba(46,204,113,0.7)]'
                  : 'bg-gradient-to-b from-[#ff8c1a] to-[#d65f00] hover:from-[#ffa033] hover:to-[#e66800] text-black border border-[#ffa33a] shadow-[0_0_12px_rgba(255,122,0,0.5)]'
              }`}
              title={isPlaying ? 'Pauza' : 'Odtwórz słuchowisko'}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-black" />
                  <span>PAUZA</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>ODTWÓRZ</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleStop}
              className="p-1.5 rounded bg-[#1c222c] hover:bg-[#252d3b] text-stone-300 hover:text-white border border-[#2e3746] transition-colors"
              title="Zatrzymaj"
            >
              <Square className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (currentLineIndex + 1 < lines.length) playLine(currentLineIndex + 1);
              }}
              className="p-1.5 rounded bg-[#1c222c] hover:bg-[#252d3b] text-stone-300 hover:text-white border border-[#2e3746] transition-colors"
              title="Następna kwestia"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Time & Position */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-[#38ef7d] font-black bg-[#0a0c10] px-2.5 py-1 rounded border border-[#252c38]">
              BAR {currentLineIndex + 1}.1 // {lines.length}
            </span>

            {/* Zoom Slider */}
            <div className="flex items-center gap-1.5 text-stone-400">
              <ZoomOut className="w-3 h-3 text-stone-400" />
              <input
                type="range"
                min="0.8"
                max="2.0"
                step="0.1"
                value={zoomLevel}
                onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                className="w-16 accent-[#ff7a00] cursor-pointer"
              />
              <ZoomIn className="w-3 h-3 text-stone-400" />
            </div>
          </div>
        </div>

        {/* FL Studio Playlist Ruler (Bar:Beat measure markers) */}
        <div className="flex items-center gap-3 min-w-[720px] text-[9px] font-mono text-stone-400 bg-[#0c0e12] px-2 py-1 rounded border border-[#212732]">
          <span className="w-40 shrink-0 font-bold uppercase tracking-wider text-stone-400">
            PLAYLIST TRACKS
          </span>
          <div className="flex-1 flex justify-between px-1">
            <span>| 01.1</span>
            <span>| 02.1</span>
            <span>| 03.1</span>
            <span>| 04.1</span>
            <span>| 05.1</span>
            <span>| 06.1</span>
            <span>| 07.1</span>
            <span>| 08.1</span>
            <span>| 09.1</span>
            <span>| 10.1</span>
          </div>
        </div>

        {/* FL Studio Playlist Tracks */}
        <div className="space-y-1.5 overflow-x-auto pb-2 scrollbar-none">
          {/* Track 1: Narrator */}
          <div className="flex items-center gap-3 min-w-[720px]">
            {/* FL Studio Track Header */}
            <div className="w-40 shrink-0 flex items-center justify-between p-1.5 rounded bg-[#1a1e27] border-l-4 border-l-[#ff9426] border border-[#2c3444] text-[11px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-stone-400 text-[10px]">01</span>
                <span className="font-bold text-white truncate max-w-[75px]">Narrator</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => toggleMute('narrator')}
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all ${
                    mutedTracks.narrator
                      ? 'bg-[#291e20] text-red-400 border border-red-800'
                      : 'bg-[#2ecc71] shadow-[0_0_8px_#2ecc71]'
                  }`}
                  title="Mute Track (Wycisz ścieżkę)"
                />
              </div>
            </div>

            {/* Clips Line */}
            <div className="flex-1 flex gap-1 h-9 bg-[#0b0e13] rounded p-0.5 border border-[#222935] overflow-hidden">
              {lines.map((line, idx) => {
                const isNarrator = line.characterId === 'narrator' || line.characterName.toLowerCase().includes('narrator');
                const isCurrent = currentLineIndex === idx;
                if (!isNarrator) return <div key={line.id} className="flex-1 opacity-5" />;
                return (
                  <div
                    key={line.id}
                    onClick={() => playLine(idx)}
                    className={`flex-1 rounded cursor-pointer transition-all border text-[9px] flex items-center justify-center font-mono relative overflow-hidden ${
                      isCurrent
                        ? 'bg-[#ff7a00] text-black border-[#ffa033] font-black scale-105 shadow-[0_0_10px_rgba(255,122,0,0.6)] z-10'
                        : 'bg-[#2d2217] border-[#593d25] text-[#ff9426] hover:bg-[#3d2e1f]'
                    }`}
                    title={line.text}
                  >
                    <span className="truncate px-0.5">#{idx + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Track 2: Characters */}
          <div className="flex items-center gap-3 min-w-[720px]">
            {/* FL Studio Track Header */}
            <div className="w-40 shrink-0 flex items-center justify-between p-1.5 rounded bg-[#1a1e27] border-l-4 border-l-[#00d2d3] border border-[#2c3444] text-[11px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-stone-400 text-[10px]">02</span>
                <span className="font-bold text-white truncate max-w-[75px]">Postacie</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => toggleMute('characters')}
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all ${
                    mutedTracks.characters
                      ? 'bg-[#291e20] text-red-400 border border-red-800'
                      : 'bg-[#2ecc71] shadow-[0_0_8px_#2ecc71]'
                  }`}
                  title="Mute Track"
                />
              </div>
            </div>

            {/* Clips Line */}
            <div className="flex-1 flex gap-1 h-9 bg-[#0b0e13] rounded p-0.5 border border-[#222935] overflow-hidden">
              {lines.map((line, idx) => {
                const isNarrator = line.characterId === 'narrator' || line.characterName.toLowerCase().includes('narrator');
                const isCurrent = currentLineIndex === idx;
                if (isNarrator) return <div key={line.id} className="flex-1 opacity-5" />;
                return (
                  <div
                    key={line.id}
                    onClick={() => playLine(idx)}
                    className={`flex-1 rounded cursor-pointer transition-all border text-[9px] flex items-center justify-center font-mono relative overflow-hidden ${
                      isCurrent
                        ? 'bg-[#00d2d3] text-black border-[#48f2f3] font-black scale-105 shadow-[0_0_10px_rgba(0,210,211,0.6)] z-10'
                        : 'bg-[#12252c] border-[#1d4856] text-[#00d2d3] hover:bg-[#1a343e]'
                    }`}
                    title={`${line.characterName}: ${line.text}`}
                  >
                    <span className="truncate px-0.5">#{idx + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Track 3: Music Bed */}
          <div className="flex items-center gap-3 min-w-[720px]">
            {/* FL Studio Track Header */}
            <div className="w-40 shrink-0 flex items-center justify-between p-1.5 rounded bg-[#1a1e27] border-l-4 border-l-[#a55eea] border border-[#2c3444] text-[11px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-stone-400 text-[10px]">03</span>
                <span className="font-bold text-white truncate max-w-[75px]">Muzyka</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => toggleMute('music')}
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all ${
                    mutedTracks.music
                      ? 'bg-[#291e20] text-red-400 border border-red-800'
                      : 'bg-[#2ecc71] shadow-[0_0_8px_#2ecc71]'
                  }`}
                  title="Mute Track"
                />
              </div>
            </div>

            <div className="flex-1 h-9 bg-[#0b0e13] rounded p-1 border border-[#222935] flex items-center justify-between px-3">
              {project.mixerSettings?.customMusicTrack ? (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-purple-200 truncate">
                    <Music className="w-3 h-3 text-[#a55eea] shrink-0" />
                    <span className="font-bold text-white truncate max-w-[280px]">
                      WŁASNY PLIK: {project.mixerSettings.customMusicTrack.fileName}
                    </span>
                    <span className="text-stone-400">
                      ({formatDuration(project.mixerSettings.customMusicTrack.durationSec)})
                    </span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800">
                      AUTO-DUCK -12dB
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUpdateMixerTrack('customMusicTrack', undefined)}
                    className="text-[9px] text-stone-400 hover:text-red-400 font-mono underline ml-2"
                    title="Usuń własny plik podkładu i wróć do procedury"
                  >
                    Usuń
                  </button>
                </div>
              ) : (
                <div className="w-full h-4 rounded bg-[#2c173d] border border-[#5d2b86] flex items-center justify-between px-2 text-[9px] font-mono text-purple-300">
                  <span>WAVEFORM: {project.mixerSettings?.backgroundMusic || 'SAKRALNY PODKŁAD'} (EBU R128 DUCKED)</span>
                  <span className="text-[8px] text-purple-400">-12 dB AUTO-DUCK</span>
                </div>
              )}
            </div>
          </div>

          {/* Track 4: SFX */}
          <div className="flex items-center gap-3 min-w-[720px]">
            {/* FL Studio Track Header */}
            <div className="w-40 shrink-0 flex items-center justify-between p-1.5 rounded bg-[#1a1e27] border-l-4 border-l-[#2ecc71] border border-[#2c3444] text-[11px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-stone-400 text-[10px]">04</span>
                <span className="font-bold text-white truncate max-w-[75px]">SFX / FX</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => toggleMute('sfx')}
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all ${
                    mutedTracks.sfx
                      ? 'bg-[#291e20] text-red-400 border border-red-800'
                      : 'bg-[#2ecc71] shadow-[0_0_8px_#2ecc71]'
                  }`}
                  title="Mute Track"
                />
              </div>
            </div>

            <div className="flex-1 flex gap-1 h-9 bg-[#0b0e13] rounded p-0.5 border border-[#222935] overflow-hidden">
              {lines.map((line, idx) => (
                <div
                  key={line.id}
                  className={`flex-1 rounded border text-[8px] font-mono flex items-center justify-center ${
                    line.sfxCue
                      ? 'bg-[#132c1c] border-[#226338] text-[#2ecc71]'
                      : 'opacity-5'
                  }`}
                  title={line.sfxCue || 'Brak efektu'}
                >
                  {line.sfxCue ? 'SFX' : ''}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FL Studio 16-Step Beat Pad Sequencer Strip */}
        <div className="p-2 bg-[#0b0d12] rounded border border-[#202733] flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-mono text-stone-400">
            <span className="text-[#ff7a00] font-bold">STEP SEQUENCER:</span>
            <span>BEAT GRID 16</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {Array.from({ length: 16 }).map((_, stepIdx) => {
              const isOrangeGroup = (stepIdx >= 0 && stepIdx < 4) || (stepIdx >= 8 && stepIdx < 12);
              const isStepActive = isPlaying && (currentLineIndex % 16 === stepIdx);
              return (
                <div
                  key={`pad-${stepIdx}`}
                  className={`fl-step-pad ${isOrangeGroup ? 'group-orange' : ''} ${isStepActive ? 'active' : ''}`}
                  title={`Step ${stepIdx + 1}`}
                />
              );
            })}
          </div>
        </div>

        {/* Current Active Line Preview (FL Studio Piano Roll / Clip Inspector) */}
        {lines[currentLineIndex] && (
          <div className="p-3 bg-[#0d1016] border border-[#2c3546] rounded space-y-2 font-mono">
            <div className="flex items-center justify-between text-xs text-stone-400 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#ff8c1a]">
                  CLIP {currentLineIndex + 1}: {lines[currentLineIndex].characterName}
                </span>
                <span className="text-stone-500 font-mono">
                  [{lines[currentLineIndex].verseRef}]
                </span>
                {lines[currentLineIndex].customAudioFile ? (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700 flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    WŁASNE NAGRANIE ({formatDuration(lines[currentLineIndex].customAudioFile?.durationSec)})
                  </span>
                ) : generatedClips.some((c) => c.lineId === lines[currentLineIndex].id && c.audioBase64) ? (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#102919] text-[#2ecc71] border border-[#206338] flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    PCM 24k READY
                  </span>
                ) : (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1e2430] text-stone-400 border border-[#313b4c]">
                    PENDING SYNTH
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {lines[currentLineIndex].emotionCue && (
                  <span className="text-stone-400 text-[10px] italic">
                    {lines[currentLineIndex].emotionCue}
                  </span>
                )}
                {onAuditionLine && (
                  <button
                    type="button"
                    onClick={() => onAuditionLine(lines[currentLineIndex])}
                    className="px-2 py-1 rounded bg-[#1c222c] hover:bg-[#252d3a] text-stone-200 text-xs font-bold flex items-center gap-1 border border-[#313b4c] transition-colors"
                  >
                    <Volume2 className="w-3 h-3 text-[#00d2d3]" />
                    <span>ODSŁUCHAJ</span>
                  </button>
                )}
                {onSynthesizeSingleLine && (
                  <button
                    type="button"
                    disabled={isSynthesizing}
                    onClick={() => onSynthesizeSingleLine(lines[currentLineIndex])}
                    className="px-2.5 py-1 rounded bg-gradient-to-b from-[#ff8c1a] to-[#d65f00] hover:from-[#ffa033] hover:to-[#e66800] text-black text-xs font-bold flex items-center gap-1 shadow transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>GENERUJ TĘ KWESTIĘ</span>
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-stone-200 font-sans leading-relaxed pl-2 border-l-2 border-[#ff7a00]">
              "{lines[currentLineIndex].text}"
            </p>

            {/* Custom Audio Line Action */}
            <div className="pt-2 border-t border-[#232c3d] flex items-center justify-between gap-2 flex-wrap text-xs">
              <div className="flex items-center gap-2 text-stone-400">
                <Mic className="w-3.5 h-3.5 text-[#ff8c1a]" />
                <span>Własne nagranie dla tej kwestii (zamiast głosu AI):</span>
              </div>
              <CustomAudioUploader
                compact
                label="Własny plik audio"
                trackType="voice"
                currentTrack={lines[currentLineIndex].customAudioFile}
                onTrackUploaded={(track) => handleUpdateLineCustomAudio(lines[currentLineIndex].id, track)}
                onTrackRemoved={() => handleUpdateLineCustomAudio(lines[currentLineIndex].id, undefined)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#262f3d]">
        <button
          type="button"
          onClick={onProceedToExport}
          className="text-stone-400 hover:text-stone-200 text-xs font-mono underline underline-offset-4"
        >
          Przejdź bezpośrednio do publikacji audio (Krok 8)
        </button>

        <button
          type="button"
          onClick={onProceedToVideo}
          className="flex items-center gap-2 px-6 py-3 rounded bg-gradient-to-b from-[#ff8c1a] to-[#d65f00] hover:from-[#ffa033] hover:to-[#e66800] text-black text-xs font-mono font-black shadow-[0_0_18px_rgba(255,122,0,0.5)] border border-[#ffaa4d] transition-all hover:scale-105"
        >
          <Video className="w-4 h-4 fill-current" />
          <span>UTWÓRZ WIDEO NA YOUTUBE (KROK 7)</span>
          <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};
