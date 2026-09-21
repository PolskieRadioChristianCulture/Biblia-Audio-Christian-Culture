import React, { useState } from 'react';
import {
  Activity,
  AudioWaveform,
  CircleDot,
  Film,
  Gauge,
  Radio,
  ShieldCheck,
  Volume2,
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Music,
  Mic,
} from 'lucide-react';
import { ProductionProject } from '../types';
import { useStudioPlayback } from '../lib/useStudioPlayback';
import { formatDuration } from '../lib/customAudioUtils';

interface StudioTransportProps {
  project: ProductionProject;
  currentStep: number;
  isSynthesizing: boolean;
  isRenderingMaster: boolean;
  isRenderingVideo: boolean;
}

export const StudioTransport: React.FC<StudioTransportProps> = ({
  project,
  currentStep,
  isSynthesizing,
  isRenderingMaster,
  isRenderingVideo,
}) => {
  const playback = useStudioPlayback(project);
  const [showVolumePopup, setShowVolumePopup] = useState(false);

  const busyLabel = isSynthesizing
    ? 'SYNTEZA GŁOSÓW AI'
    : isRenderingMaster
      ? 'MONTAŻ MASTERA EBU R128'
      : isRenderingVideo
        ? 'RENDEROWANIE MP4 WIDEO'
        : playback.isPlaying
          ? playback.isPaused
            ? 'PAUZA AUDYCJI'
            : 'EMISJA MASTER AUDIO'
          : 'SILNIK DSP GOTOWY';

  const clips = project.generatedClips?.length || 0;
  const lines = project.script?.lines || [];
  const customVoiceCount = lines.filter((l) => l.customAudioFile).length;
  const hasCustomMusic = !!project.mixerSettings?.customMusicTrack;

  // Segmented meter LED arrays for FL Studio L/R stereo meter
  const meterSegments = [
    { db: '-48', color: 'active-green' },
    { db: '-36', color: 'active-green' },
    { db: '-24', color: 'active-green' },
    { db: '-18', color: 'active-green' },
    { db: '-12', color: 'active-green' },
    { db: '-8', color: 'active-yellow' },
    { db: '-5', color: 'active-yellow' },
    { db: '-3', color: 'active-orange' },
    { db: '-1', color: 'active-orange' },
    { db: '0', color: 'active-red' },
  ];

  const isBusy = isSynthesizing || isRenderingMaster || isRenderingVideo;

  return (
    <section
      className="studio-transport bg-[#0d1017] border-b border-[#212936] px-3 sm:px-5 py-2.5 shadow-md flex items-center justify-between gap-3 text-stone-200"
      aria-label="Master Transport Bar"
    >
      {/* Left Identity & Master Controls */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-lg bg-[#181e29] border border-[#2f394a] flex items-center justify-center text-[#ff8c1a] shadow-[0_0_12px_rgba(255,140,26,0.25)] shrink-0">
          <AudioWaveform size={20} />
        </div>
        <div className="min-w-0 hidden sm:block">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#00d2d3] font-mono font-bold tracking-widest uppercase">
              STUDIO POLSKIERADIO.CC
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                playback.isPlaying && !playback.isPaused
                  ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-pulse'
                  : 'bg-[#2ecc71] shadow-[0_0_6px_#2ecc71]'
              }`}
            />
          </div>
          <strong className="block text-xs sm:text-sm font-mono text-white truncate max-w-[180px] md:max-w-xs font-bold">
            {project.title || 'Słuchowisko Biblijne'}
          </strong>
        </div>

        {/* Master Playback Transport Buttons */}
        <div className="flex items-center gap-1.5 bg-[#121620] p-1 rounded-xl border border-[#263244] shrink-0">
          <button
            type="button"
            onClick={playback.prev}
            title="Poprzednia kwestia"
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <SkipBack size={15} />
          </button>

          <button
            type="button"
            onClick={playback.togglePlay}
            title={playback.isPlaying && !playback.isPaused ? 'Wstrzymaj (Pauza)' : 'Odtwórz audycję (Master Play)'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold font-mono text-xs transition-all shadow ${
              playback.isPlaying && !playback.isPaused
                ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-[0_0_14px_rgba(245,158,11,0.4)]'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]'
            }`}
          >
            {playback.isPlaying && !playback.isPaused ? (
              <>
                <Pause size={14} className="fill-current" />
                <span className="hidden md:inline">PAUZA</span>
              </>
            ) : (
              <>
                <Play size={14} className="fill-current" />
                <span className="hidden md:inline">PLAY</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={playback.stop}
            title="Zatrzymaj i przewiń na początek (Stop)"
            className="p-1.5 rounded-lg text-stone-400 hover:text-red-400 hover:bg-stone-800 transition-colors"
          >
            <Square size={14} className="fill-current" />
          </button>

          <button
            type="button"
            onClick={playback.next}
            title="Następna kwestia"
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <SkipForward size={15} />
          </button>
        </div>

        {/* Master Volume Controller */}
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={() => setShowVolumePopup(!showVolumePopup)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#141822] hover:bg-[#1e2533] border border-[#2b3648] text-xs font-mono text-stone-300"
            title="Głośność główna (Master Volume)"
          >
            <Volume2 size={14} className="text-amber-400" />
            <span className="font-bold">{Math.round(playback.masterVolume * 100)}%</span>
          </button>

          {showVolumePopup && (
            <div className="absolute top-10 left-0 z-50 bg-[#121620] border border-[#2a374c] rounded-xl p-3 shadow-2xl w-48 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono font-bold text-stone-300">
                <span>MASTER VOL</span>
                <span className="text-amber-400">{Math.round(playback.masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={playback.masterVolume}
                onChange={(e) => playback.setMasterVolume(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-stone-500 font-mono">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center: VFD Screen + Dynamic Stereo VU Meters */}
      <div className="flex items-center gap-3">
        {/* VFD Status Readout */}
        <div className="fl-vfd-display bg-[#080a0f] border border-[#222a36] px-3.5 py-1.5 rounded-xl shadow-inner flex flex-col min-w-[170px] sm:min-w-[210px]">
          <span
            className={`text-[10px] font-mono font-black tracking-wider flex items-center gap-1.5 ${
              isBusy ? 'text-[#ff7a00]' : playback.isPlaying && !playback.isPaused ? 'text-amber-400' : 'text-[#38ef7d]'
            }`}
          >
            <CircleDot size={10} className={isBusy || (playback.isPlaying && !playback.isPaused) ? 'animate-spin' : ''} />
            {busyLabel}
          </span>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm sm:text-base font-black text-white font-mono tracking-wider drop-shadow-[0_0_6px_rgba(255,255,255,0.3)]">
              {formatDuration(playback.currentTimeSec)} / {formatDuration(playback.totalDurationSec)}
            </span>
            <span className="text-[10px] text-stone-400 font-mono font-bold">
              [KW: {playback.currentLineIndex + 1}/{lines.length || 1}]
            </span>
          </div>
        </div>

        {/* Dynamic Dual Peak Level Meter (Stereo L/R) */}
        <div className="hidden sm:flex flex-col gap-1 bg-[#090b0e] p-2 rounded-lg border border-[#2b3341] shadow-inner">
          {/* L Channel */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold text-stone-400 w-2.5">L</span>
            <div className="flex items-center gap-0.5">
              {meterSegments.map((seg, i) => (
                <div
                  key={`l-${i}`}
                  className={`fl-meter-segment ${
                    (playback.isPlaying && !playback.isPaused && i <= playback.meterL) || (isBusy && i < 6)
                      ? seg.color
                      : ''
                  }`}
                />
              ))}
            </div>
          </div>
          {/* R Channel */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold text-stone-400 w-2.5">R</span>
            <div className="flex items-center gap-0.5">
              {meterSegments.map((seg, i) => (
                <div
                  key={`r-${i}`}
                  className={`fl-meter-segment ${
                    (playback.isPlaying && !playback.isPaused && i <= playback.meterR) || (isBusy && i < 5)
                      ? seg.color
                      : ''
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Stats & Hardware Monitor */}
      <div className="hidden xl:flex items-center gap-2 overflow-x-auto">
        {/* Custom Audio Indicator */}
        {(customVoiceCount > 0 || hasCustomMusic) && (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded-md text-[11px] font-mono text-amber-300 font-bold">
            <Mic size={12} /> {customVoiceCount} własnych gł. {hasCustomMusic ? '+ muz.' : ''}
          </span>
        )}

        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#13171f] border border-[#28313e] rounded-md text-xs font-mono text-stone-300 font-medium">
          <Activity size={12} className="text-[#ff7a00]" /> {clips}/{lines.length} klipów
        </span>

        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#13171f] border border-[#28313e] rounded-md text-xs font-mono text-purple-300 font-medium">
          <Film size={12} className="text-purple-400" />
          {project.renderedVideoMp4Url ? 'MP4 GOTOWE' : 'MP4 OCZEKUJE'}
        </span>

        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#13171f] border border-[#28313e] rounded-md text-xs font-mono text-amber-300 font-bold">
          <Gauge size={12} /> -16 LUFS
        </span>
      </div>
    </section>
  );
};
