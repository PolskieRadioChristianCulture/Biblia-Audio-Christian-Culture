import React, { useState } from 'react';
import {
  FolderOpen,
  PlusCircle,
  Eye,
  CheckCircle2,
  Play,
  Square,
  Circle,
  Repeat,
  Sliders,
  Cpu,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { PRODUCTION_STEPS } from '../data/stepsData';
import { ProjectProductionStatus } from '../types';

interface HeaderProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
  projectStatus: ProjectProductionStatus;
  projectTitle: string;
  onOpenProjects: () => void;
  onNewProject: () => void;
  isPlaying: boolean;
  highContrast: boolean;
  onToggleHighContrast: () => void;
  uiScale?: 'normal' | 'large' | 'xlarge';
  onSetScale?: (scale: 'normal' | 'large' | 'xlarge') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentStep,
  onSelectStep,
  projectStatus,
  projectTitle,
  onOpenProjects,
  onNewProject,
  isPlaying,
  highContrast,
  onToggleHighContrast,
  uiScale = 'large',
  onSetScale,
}) => {
  const [transportMode, setTransportMode] = useState<'PAT' | 'SONG'>('SONG');
  const [isLooping, setIsLooping] = useState(true);

  const getStatusBadge = (status: ProjectProductionStatus) => {
    switch (status) {
      case 'ready':
        return { label: 'ONLINE / READY', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-600/60' };
      case 'generating_voices':
        return { label: 'SYNTH RUNNING...', color: 'text-orange-400 bg-orange-950/60 border-orange-500/60 animate-pulse' };
      case 'approved':
        return { label: 'SCRIPT LOCKED', color: 'text-cyan-400 bg-cyan-950/60 border-cyan-600/60' };
      case 'analyzed':
        return { label: 'ANALYSIS OK', color: 'text-blue-400 bg-blue-950/60 border-blue-600/60' };
      default:
        return { label: 'PROJECT DRAFT', color: 'text-stone-400 bg-stone-900 border-stone-700' };
    }
  };

  const statusInfo = getStatusBadge(projectStatus);

  const renderStepButton = (step: (typeof PRODUCTION_STEPS)[0]) => {
    const Icon = step.icon;
    const isActive = currentStep === step.num;
    const isCompleted = currentStep > step.num;

    return (
      <button
        key={step.num}
        id={`stepper-step-${step.num}`}
        onClick={() => onSelectStep(step.num)}
        className={`flex items-center gap-2 py-2 px-3 rounded-md text-xs sm:text-sm font-mono tracking-tight font-bold transition-all whitespace-nowrap border ${
          isActive
            ? 'bg-gradient-to-b from-[#ff8c1a] to-[#d65f00] text-black border-[#ffa33a] shadow-[0_0_16px_rgba(255,122,0,0.55)] scale-[1.03]'
            : isCompleted
            ? 'bg-[#1e242f] text-orange-200 hover:bg-[#28303e] border-[#384355]'
            : 'bg-[#151921] text-stone-300 hover:bg-[#1d232e] hover:text-white border-[#2a3240]'
        }`}
        title={`${step.title} (Krok ${step.num})`}
      >
        <span
          className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-mono font-black shrink-0 ${
            isActive
              ? 'bg-black text-[#ff8c1a]'
              : isCompleted
              ? 'bg-[#ff7a00]/20 text-[#ff8c1a]'
              : 'bg-[#262e3b] text-stone-300'
          }`}
        >
          {isCompleted ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : step.num}
        </span>
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span>{step.shortLabel}</span>
      </button>
    );
  };

  return (
    <header
      id="studio-header"
      className={`sticky top-0 z-40 border-b transition-colors ${
        highContrast
          ? 'bg-black border-amber-500 text-white'
          : 'bg-[#13161c] border-[#2b3341] text-[#e2e8f0]'
      }`}
    >
      {/* FL Studio Top Rack & Control Strip */}
      <div className="px-3 py-2 flex items-center justify-between gap-2 flex-wrap border-b border-[#252b37]">
        {/* Left: FL Studio Logo & Project Identity */}
        <div className="flex items-center gap-3">
          <a
            href="https://www.polskieradio.cc"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 group"
            title="Christian Culture Studio DAW - polskieradio.cc"
          >
            {/* FL Fruit / CC Sound Logo Mark */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff8c1a] via-[#e66000] to-[#b34000] p-0.5 flex items-center justify-center shadow-[0_0_18px_rgba(255,122,0,0.5)] border border-[#ffaa4d] group-hover:scale-105 transition-transform">
              <span className="text-black font-black text-xs tracking-tighter">FL</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-wider text-white uppercase font-mono">
                  CC STUDIO <span className="text-[#ff8c1a]">24</span>
                </span>
                <span className="text-[10px] text-stone-500 font-mono">|</span>
                <span className="text-[11px] font-semibold text-stone-300 truncate max-w-[200px] sm:max-w-xs">
                  {projectTitle || 'Biblia Audio Engine'}
                </span>
              </div>
              <p className="text-[9px] text-[#00d2d3] font-mono tracking-widest uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00d2d3] animate-ping" />
                PROFESSIONAL SCRIPTURE DAW
              </p>
            </div>
          </a>
        </div>

        {/* Center: FL Studio Master Transport Controls & VFD Displays */}
        <div className="flex items-center gap-2 bg-[#0c0e12] px-2.5 py-1 rounded-md border border-[#28303d] shadow-inner">
          {/* PAT / SONG Switcher */}
          <div className="flex bg-[#191e28] rounded p-0.5 border border-[#2f3847] text-[10px] font-mono font-bold">
            <button
              type="button"
              onClick={() => setTransportMode('PAT')}
              className={`px-1.5 py-0.5 rounded transition-all ${
                transportMode === 'PAT'
                  ? 'bg-[#ff7a00] text-black font-black shadow-[0_0_8px_rgba(255,122,0,0.6)]'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              PAT
            </button>
            <button
              type="button"
              onClick={() => setTransportMode('SONG')}
              className={`px-1.5 py-0.5 rounded transition-all ${
                transportMode === 'SONG'
                  ? 'bg-[#ff7a00] text-black font-black shadow-[0_0_8px_rgba(255,122,0,0.6)]'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              SONG
            </button>
          </div>

          {/* Transport Buttons */}
          <div className="flex items-center gap-1 px-1 border-x border-[#232935]">
            <button
              type="button"
              className={`p-1.5 rounded bg-[#1c222d] border border-[#323b4a] transition-all ${
                isPlaying
                  ? 'bg-[#2ecc71] text-black border-[#38ef7d] shadow-[0_0_12px_rgba(46,204,113,0.7)]'
                  : 'text-emerald-400 hover:bg-[#252c3b] hover:text-emerald-300'
              }`}
              title="Play (Odtwarzaj)"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>

            <button
              type="button"
              className="p-1.5 rounded bg-[#1c222d] border border-[#323b4a] text-stone-300 hover:bg-[#252c3b] hover:text-white transition-all"
              title="Stop"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>

            <button
              type="button"
              className={`p-1.5 rounded bg-[#1c222d] border border-[#323b4a] transition-all ${
                isPlaying
                  ? 'text-red-500 shadow-[0_0_10px_rgba(255,56,56,0.6)]'
                  : 'text-stone-500 hover:text-red-400 hover:bg-[#252c3b]'
              }`}
              title="Record / Master Capture"
            >
              <Circle className="w-3.5 h-3.5 fill-current" />
            </button>

            <button
              type="button"
              onClick={() => setIsLooping(!isLooping)}
              className={`p-1.5 rounded bg-[#1c222d] border border-[#323b4a] transition-all ${
                isLooping ? 'text-[#ff7a00]' : 'text-stone-500'
              }`}
              title="Loop Mode"
            >
              <Repeat className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* FL Studio VFD LCD: BPM / TEMPO */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#07090c] border border-[#262e3b] rounded font-mono">
            <span className="text-[9px] text-[#ff7a00] font-bold">BPM</span>
            <span className="text-xs font-black text-[#38ef7d] tracking-wider drop-shadow-[0_0_6px_rgba(56,239,125,0.4)]">
              120.00
            </span>
          </div>

          {/* FL Studio VFD LCD: Timecode Bar:Beat:Tick */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 bg-[#07090c] border border-[#262e3b] rounded font-mono">
            <span className="text-[9px] text-cyan-400 font-bold">BAR</span>
            <span className="text-xs font-black text-[#38ef7d] tracking-wider drop-shadow-[0_0_6px_rgba(56,239,125,0.4)]">
              00{currentStep}:01:00
            </span>
          </div>

          {/* Hardware CPU & RAM readout */}
          <div className="hidden lg:flex items-center gap-2 pl-1 text-[10px] font-mono text-stone-400">
            <div className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-[#00d2d3]" />
              <span className="text-stone-300 font-bold">14%</span>
            </div>
            <span className="text-stone-600">|</span>
            <span className="text-stone-400">48kHz / 24b</span>
          </div>
        </div>

        {/* Right: Status badge & Window Actions */}
        <div className="flex items-center gap-2">
          {isPlaying && (
            <div
              id="on-air-badge"
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-950/80 border border-red-500 text-red-300 text-[10px] font-mono font-bold animate-pulse shadow-[0_0_10px_rgba(255,0,0,0.5)]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span>ON AIR</span>
            </div>
          )}

          <div
            className={`hidden md:inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${statusInfo.color}`}
            title="Status silnika DAW"
          >
            <span>{statusInfo.label}</span>
          </div>

          <button
            id="btn-open-projects"
            onClick={onOpenProjects}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1b202a] hover:bg-[#252c3a] text-stone-200 text-xs font-medium border border-[#2e3747] hover:border-[#ff7a00] transition-colors"
            title="Przeglądaj projekty DAW"
          >
            <FolderOpen className="w-3.5 h-3.5 text-[#ff7a00]" />
            <span className="hidden sm:inline">Projekty</span>
          </button>

          <button
            id="btn-new-project"
            onClick={onNewProject}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1b202a] hover:bg-[#252c3a] text-stone-200 text-xs font-medium border border-[#2e3747] hover:border-[#ff7a00] transition-colors"
            title="Nowy projekt audio"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#ff7a00]" />
            <span className="hidden sm:inline">Nowy</span>
          </button>

          {/* Zoom / Accessibility Scale Controls */}
          <div
            id="accessibility-zoom-controls"
            className="flex items-center bg-[#181d27] border border-[#343e50] rounded-lg p-0.5 shadow-sm"
            title="Dopasuj rozmiar i czytelność tekstu (A- / A+)"
          >
            <button
              type="button"
              id="btn-zoom-out"
              onClick={() => onSetScale?.(uiScale === 'xlarge' ? 'large' : 'normal')}
              className="px-2 py-1 text-xs font-bold text-stone-300 hover:text-white hover:bg-[#252e3e] rounded transition-colors"
              title="Zmniejsz rozmiar (A-)"
            >
              A-
            </button>
            <span
              className="px-2 py-0.5 text-xs font-mono font-black text-[#ff9426] bg-[#0c0e13] rounded border border-[#2b3442] shadow-inner"
              title="Aktualne powiększenie interfejsu"
            >
              {uiScale === 'xlarge' ? '130%' : uiScale === 'large' ? '115%' : '100%'}
            </span>
            <button
              type="button"
              id="btn-zoom-in"
              onClick={() => onSetScale?.(uiScale === 'normal' ? 'large' : 'xlarge')}
              className="px-2 py-1 text-xs font-bold text-stone-300 hover:text-white hover:bg-[#252e3e] rounded transition-colors"
              title="Powiększ rozmiar (A+)"
            >
              A+
            </button>
          </div>

          <button
            id="btn-toggle-contrast"
            onClick={onToggleHighContrast}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              highContrast
                ? 'bg-amber-500 text-black border-amber-400'
                : 'bg-[#1b202a] text-stone-400 border-[#2e3747] hover:text-stone-200'
            }`}
            title="Tryb wysokiego kontrastu"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* FL Studio Channel Rack & Workflow Step Selector Strip */}
      <div className="bg-[#101318] px-3 py-1.5 overflow-x-auto scrollbar-none border-t border-[#1e2430]">
        <div className="flex items-center justify-between gap-2 min-w-[820px]">
          <div className="flex items-center gap-1">
            <span className="text-[9px] uppercase font-mono font-black text-stone-500 tracking-wider px-1">
              RACK:
            </span>
            {PRODUCTION_STEPS.map(renderStepButton)}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 text-[10px] font-mono text-stone-400 px-2 py-0.5 bg-[#171b23] border border-[#2b3341] rounded">
              <Sliders className="w-3 h-3 text-[#ff7a00]" />
              <span className="text-stone-300">MASTER EBU R128</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

