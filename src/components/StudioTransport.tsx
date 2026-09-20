import React from 'react';
import { Activity, AudioWaveform, CircleDot, Film, Gauge, Radio, ShieldCheck, Volume2 } from 'lucide-react';
import { ProductionProject } from '../types';

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
  const busyLabel = isSynthesizing
    ? 'SYNTHESIZING AUDIO CLIPS'
    : isRenderingMaster
      ? 'MASTERING EBU R128'
      : isRenderingVideo
        ? 'RENDERING MP4 VIDEO'
        : 'STUDIO ENGINE READY';
  const clips = project.generatedClips?.length || 0;
  const lines = project.script?.lines?.length || 0;

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
    <section className="studio-transport" aria-label="FL Studio Master Transport Bar">
      {/* Left Identity & Master Knobs */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded bg-[#1e2430] border border-[#374254] flex items-center justify-center text-[#ff7a00] shadow-[0_0_12px_rgba(255,122,0,0.3)] shrink-0">
          <AudioWaveform size={18} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-[#00d2d3] font-mono font-bold tracking-widest uppercase">
              DSP ENGINE 24
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#2ecc71] shadow-[0_0_6px_#2ecc71]" />
          </div>
          <strong className="block text-xs font-mono text-white truncate max-w-[200px] sm:max-w-xs">
            {project.title || 'Nowy Projekt'}
          </strong>
        </div>

        {/* FL Studio Master Knobs Simulation */}
        <div className="hidden xl:flex items-center gap-2 pl-2 border-l border-[#2d3544]">
          <div className="flex flex-col items-center">
            <div className="fl-knob" title="Master Volume (Głośność główna)">
              <Volume2 className="w-2.5 h-2.5 text-stone-400" />
            </div>
            <span className="text-[8px] font-mono text-stone-400 mt-0.5">VOL</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="fl-knob" title="Master Pitch (Tonacja)">
              <span className="text-[8px] font-mono text-stone-400">0</span>
            </div>
            <span className="text-[8px] font-mono text-stone-400 mt-0.5">PITCH</span>
          </div>
        </div>
      </div>

      {/* Center: VFD Screen + Stereo VU Meters */}
      <div className="flex items-center gap-3">
        {/* VFD Status Readout */}
        <div className="fl-vfd-display">
          <div className="flex flex-col">
            <span
              className={`text-[8px] font-mono font-black tracking-wider flex items-center gap-1 ${
                isBusy ? 'text-[#ff7a00]' : 'text-[#38ef7d]'
              }`}
            >
              <CircleDot size={9} className={isBusy ? 'animate-spin' : ''} />
              {busyLabel}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-black text-white font-mono tracking-wider drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                0{currentStep}:00:00
              </span>
              <span className="text-[9px] text-stone-400 font-mono">
                [PAT {currentStep}/8]
              </span>
            </div>
          </div>
        </div>

        {/* FL Studio Dual Peak Level Meter (Stereo L/R) */}
        <div className="hidden sm:flex flex-col gap-1 bg-[#090b0e] p-1.5 rounded border border-[#2b3341] shadow-inner">
          {/* L Channel */}
          <div className="flex items-center gap-1">
            <span className="text-[8px] font-mono font-bold text-stone-400 w-2.5">L</span>
            <div className="flex items-center gap-0.5">
              {meterSegments.map((seg, i) => (
                <div
                  key={`l-${i}`}
                  className={`fl-meter-segment ${isBusy || i < 6 ? seg.color : ''}`}
                />
              ))}
            </div>
          </div>
          {/* R Channel */}
          <div className="flex items-center gap-1">
            <span className="text-[8px] font-mono font-bold text-stone-400 w-2.5">R</span>
            <div className="flex items-center gap-0.5">
              {meterSegments.map((seg, i) => (
                <div
                  key={`r-${i}`}
                  className={`fl-meter-segment ${isBusy || i < 5 ? seg.color : ''}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Stats & Hardware Monitor */}
      <div className="hidden md:flex items-center gap-1.5 overflow-x-auto">
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#13171f] border border-[#28313e] rounded text-[10px] font-mono text-stone-300">
          <Radio size={11} className="text-[#00d2d3]" /> 48 kHz / 24b
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#13171f] border border-[#28313e] rounded text-[10px] font-mono text-stone-300">
          <Activity size={11} className="text-[#ff7a00]" /> {clips}/{lines} clips
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#13171f] border border-[#28313e] rounded text-[10px] font-mono text-stone-300">
          <Film size={11} className="text-purple-400" />
          {project.renderedVideoMp4Url ? 'MP4 RENDERED' : 'MP4 QUEUED'}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#13171f] border border-[#28313e] rounded text-[10px] font-mono text-emerald-400">
          <ShieldCheck size={11} /> LOCKED
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#13171f] border border-[#28313e] rounded text-[10px] font-mono text-amber-400">
          <Gauge size={11} /> -16 LUFS
        </span>
      </div>
    </section>
  );
};

