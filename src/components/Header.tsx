import React from 'react';
import {
  Radio,
  FolderOpen,
  PlusCircle,
  Globe,
  Eye,
  CheckCircle2,
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
}) => {
  const getStatusBadge = (status: ProjectProductionStatus) => {
    switch (status) {
      case 'ready':
        return { label: 'Gotowe do emisji', color: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60' };
      case 'generating_voices':
        return { label: 'Generowanie AI...', color: 'bg-amber-950/80 text-amber-300 border-amber-700/60 animate-pulse' };
      case 'approved':
        return { label: 'Scenariusz zatwierdzony', color: 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60' };
      case 'analyzed':
        return { label: 'Przeanalizowano', color: 'bg-blue-950/80 text-blue-300 border-blue-700/60' };
      default:
        return { label: 'Szkic roboczy', color: 'bg-stone-800 text-stone-300 border-stone-700' };
    }
  };

  const statusInfo = getStatusBadge(projectStatus);

  // Group steps by phase for clear visual structure
  const phase1 = PRODUCTION_STEPS.filter((s) => s.phaseNumber === 1);
  const phase2 = PRODUCTION_STEPS.filter((s) => s.phaseNumber === 2);
  const phase3 = PRODUCTION_STEPS.filter((s) => s.phaseNumber === 3);

  const renderStepButton = (step: (typeof PRODUCTION_STEPS)[0]) => {
    const Icon = step.icon;
    const isActive = currentStep === step.num;
    const isCompleted = currentStep > step.num;

    return (
      <button
        key={step.num}
        id={`stepper-step-${step.num}`}
        onClick={() => onSelectStep(step.num)}
        className={`flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
          isActive
            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-lg scale-102 ring-2 ring-amber-400/50'
            : isCompleted
            ? 'bg-stone-900/90 text-amber-200/90 hover:bg-stone-800 border border-amber-900/40'
            : 'bg-stone-950/60 text-stone-400 hover:bg-stone-900 hover:text-stone-200 border border-stone-800/80'
        }`}
        title={`${step.title} (Krok ${step.num})`}
      >
        <span
          className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
            isActive
              ? 'bg-stone-950 text-amber-400'
              : isCompleted
              ? 'bg-amber-900/80 text-amber-300'
              : 'bg-stone-800 text-stone-400'
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
      className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${
        highContrast
          ? 'bg-black border-amber-500 text-white'
          : 'bg-stone-950/95 border-amber-900/30 text-stone-100 shadow-xl'
      }`}
    >
      {/* Top Station Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Brand Logo & Station Identity */}
        <div className="flex items-center gap-3">
          <a
            href="https://www.polskieradio.cc"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800 flex items-center justify-center shadow-lg border border-amber-400/40 text-stone-950 shrink-0 hover:scale-105 transition-transform"
            title="Christian Culture - polskieradio.cc"
          >
            <Radio className="w-5 h-5 stroke-[2.5]" />
          </a>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm sm:text-base font-extrabold tracking-tight text-stone-100 uppercase">
                CC Studio
              </span>
              <span className="text-stone-500 hidden sm:inline">•</span>
              <span className="text-xs sm:text-sm font-semibold tracking-wide text-stone-200">
                BIBLIA AUDIO / VIDEO ENGINE
              </span>
              <a
                href="https://www.polskieradio.cc"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-950/60 hover:bg-amber-900/60 border border-amber-700/50 text-amber-300 transition-colors"
              >
                <Globe className="w-3 h-3 text-amber-400" />
                polskieradio.cc
              </a>
            </div>
            <p className="text-[10px] text-cyan-400 font-mono tracking-[0.16em] uppercase">
              Professional Scripture Production
            </p>
          </div>
        </div>

        {/* Status & Project Actions */}
        <div className="flex items-center gap-2">
          {isPlaying && (
            <div
              id="on-air-badge"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/90 border border-red-500 text-red-300 text-xs font-bold animate-pulse shadow-md"
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>ON AIR</span>
            </div>
          )}

          <div
            className={`hidden lg:inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusInfo.color}`}
            title="Status aktualnego projektu"
          >
            <span>{statusInfo.label}</span>
          </div>

          <button
            id="btn-open-projects"
            onClick={onOpenProjects}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-200 text-xs font-medium border border-stone-700 hover:border-amber-600 transition-colors"
            title="Przeglądaj zapisane produkcje"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Moje Produkcje</span>
          </button>

          <button
            id="btn-new-project"
            onClick={onNewProject}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-200 text-xs font-medium border border-stone-700 hover:border-amber-600 transition-colors"
            title="Rozpocznij nową audycję"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Nowy Projekt</span>
          </button>

          <button
            id="btn-toggle-contrast"
            onClick={onToggleHighContrast}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              highContrast
                ? 'bg-amber-500 text-black border-amber-400'
                : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
            }`}
            title="Tryb wysokiego kontrastu / Dostępność WCAG"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Production Pipeline Navigation: 3 Clear Phases, 8 Discrete Pages */}
      <div className="bg-stone-900/90 border-t border-stone-800/80 px-3 py-2 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 min-w-[760px]">
          {/* Phase 1: Tekst (1-3) */}
          <div className="flex items-center gap-1.5 bg-stone-950/40 p-1 rounded-2xl border border-stone-800/60">
            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider px-2 hidden xl:inline">
              I. Tekst
            </span>
            {phase1.map(renderStepButton)}
          </div>

          <div className="w-px h-6 bg-stone-800 shrink-0" />

          {/* Phase 2: Dźwięk (4-6) */}
          <div className="flex items-center gap-1.5 bg-stone-950/40 p-1 rounded-2xl border border-stone-800/60">
            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider px-2 hidden xl:inline">
              II. Dźwięk
            </span>
            {phase2.map(renderStepButton)}
          </div>

          <div className="w-px h-6 bg-stone-800 shrink-0" />

          {/* Phase 3: Wideo & Emisja (7-8) */}
          <div className="flex items-center gap-1.5 bg-stone-950/40 p-1 rounded-2xl border border-stone-800/60">
            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider px-2 hidden xl:inline">
              III. Emisja
            </span>
            {phase3.map(renderStepButton)}
          </div>
        </div>
      </div>
    </header>
  );
};
