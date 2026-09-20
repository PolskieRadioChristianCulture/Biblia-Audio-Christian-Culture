import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  Volume2,
  Video,
  ListOrdered,
  ArrowRight,
} from 'lucide-react';
import { PRODUCTION_STEPS, StepDefinition } from '../data/stepsData';
import { ProductionProject } from '../types';

interface StepPageLayoutProps {
  currentStep: number;
  project: ProductionProject;
  onSelectStep: (step: number) => void;
  children: React.ReactNode;
}

export const StepPageLayout: React.FC<StepPageLayoutProps> = ({
  currentStep,
  project,
  onSelectStep,
  children,
}) => {
  const [isJumpMenuOpen, setIsJumpMenuOpen] = useState(false);

  const activeStepDef: StepDefinition =
    PRODUCTION_STEPS.find((s) => s.num === currentStep) || PRODUCTION_STEPS[0];
  const StepIcon = activeStepDef.icon;

  const prevStepDef = PRODUCTION_STEPS.find((s) => s.num === currentStep - 1);
  const nextStepDef = PRODUCTION_STEPS.find((s) => s.num === currentStep + 1);

  const progressPercent = Math.round((currentStep / PRODUCTION_STEPS.length) * 100);

  // Quick stats
  const lineCount = project.script?.lines?.length || 0;
  const characterCount =
    project.script?.characters?.length || project.characterProfiles?.length || 0;
  const hasAudio = !!(project.masterAudioWavUrl || project.masterAudioMp3Url);
  const hasVideo = !!project.renderedVideoMp4Url;

  return (
    <div className="space-y-6">
      {/* Top Page Stage Header: FL Studio Window Chassis */}
      <div className="rounded-xl bg-[#161a22] border border-[#2d3545] shadow-[0_8px_24px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* FL Studio Window Title Strip */}
        <div className="bg-[#1c222d] px-4 py-1.5 border-b border-[#283141] flex items-center justify-between text-[10px] font-mono">
          <div className="flex items-center gap-2 text-stone-300">
            <span className="w-2 h-2 rounded-full bg-[#ff7a00] shadow-[0_0_6px_#ff7a00]" />
            <span className="font-bold uppercase tracking-wider text-white">
              FL MODULE 0{currentStep} // {activeStepDef.phaseName}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500">PROG: {progressPercent}%</span>
            <div className="w-16 h-1.5 bg-[#0e1116] rounded-full overflow-hidden border border-[#2b3342]">
              <div
                className="h-full bg-gradient-to-r from-[#ff7a00] to-[#00d2d3]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center gap-1 pl-2 text-stone-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#272f3d] inline-block" />
              <span className="w-2.5 h-2.5 rounded-sm bg-[#272f3d] inline-block" />
              <span className="w-2.5 h-2.5 rounded-sm bg-[#3a2020] text-red-400 inline-flex items-center justify-center text-[7px]">✕</span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            {/* Breadcrumb & Phase */}
            <div className="flex items-center gap-2 text-[11px] font-mono font-bold tracking-wider uppercase text-[#ff8c1a]">
              <span>KROK 0{currentStep} / 0{PRODUCTION_STEPS.length}</span>
              <span className="text-stone-600">•</span>
              <span className="text-stone-300">{activeStepDef.shortLabel}</span>
              <span className="text-stone-600">•</span>
              <span className="text-[#00d2d3]">{progressPercent}% PRODUKCJI</span>
            </div>

            {/* Page Title & Icon */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#1e2532] border border-[#374358] text-[#ff8c1a] flex items-center justify-center shadow-[0_0_12px_rgba(255,122,0,0.2)] shrink-0">
                <StepIcon className="w-4 h-4" />
              </div>
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight font-mono">
                {activeStepDef.title}
              </h1>
            </div>

            {/* Page Subtitle / Purpose */}
            <p className="text-xs text-stone-400 max-w-3xl leading-relaxed">
              {activeStepDef.subtitle}
            </p>
          </div>

          {/* Project Active Context Badge & Jump Navigator */}
          <div className="flex items-center gap-3 self-start md:self-center shrink-0">
            <div className="hidden sm:flex flex-col items-end text-right px-3 py-1.5 rounded-lg bg-[#0e1116] border border-[#293241] text-xs font-mono">
              <span className="font-bold text-white flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#ff8c1a]" />
                {project.bookName} {project.chapterNumber}
              </span>
              <span className="text-[10px] text-stone-400">
                {lineCount > 0 ? `${lineCount} kwestii` : '0 kwestii'} •{' '}
                {characterCount > 0 ? `${characterCount} postaci` : '0 postaci'}
              </span>
            </div>

            {/* Quick Page Jump Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsJumpMenuOpen(!isJumpMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e2430] hover:bg-[#283141] text-stone-200 text-xs font-mono font-medium border border-[#343e50] transition-colors"
                title="Wybierz moduł z listy"
              >
                <ListOrdered className="w-3.5 h-3.5 text-[#ff8c1a]" />
                <span className="hidden sm:inline">RACK ({currentStep}/8)</span>
                <span className="sm:hidden">RACK {currentStep}/8</span>
              </button>

              {isJumpMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-xl bg-[#171b23] border border-[#323d4e] shadow-2xl z-50 p-2 space-y-1 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-[#252c38] text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider">
                    KANAŁY / MODUŁY PRODUKCJI (8 KROKÓW)
                  </div>
                  <div className="max-h-80 overflow-y-auto space-y-1">
                    {PRODUCTION_STEPS.map((step) => {
                      const Icon = step.icon;
                      const isActive = step.num === currentStep;
                      const isDone = step.checkCompleted(project);

                      return (
                        <button
                          key={step.num}
                          type="button"
                          onClick={() => {
                            onSelectStep(step.num);
                            setIsJumpMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between gap-2 p-2 rounded-xl text-left text-xs transition-colors ${
                            isActive
                              ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                              : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                isActive
                                  ? 'bg-amber-400 text-stone-950'
                                  : 'bg-stone-800 text-stone-400'
                              }`}
                            >
                              {step.num}
                            </span>
                            <Icon className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span className="truncate">{step.shortLabel}</span>
                          </div>

                          {isDone && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 shrink-0">
                              Gotowe
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Page Workspace Content */}
      <div className="min-h-[500px]">{children}</div>

      {/* Bottom Page Navigation Bar: One Step = One Page */}
      <div className="rounded-2xl bg-stone-900/90 border border-stone-800 p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Previous Step Button */}
        <div>
          {prevStepDef ? (
            <button
              type="button"
              onClick={() => onSelectStep(prevStepDef.num)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white text-xs sm:text-sm font-medium border border-stone-700 transition-all hover:scale-102"
            >
              <ChevronLeft className="w-4 h-4 text-amber-400" />
              <span>
                Wróć: Krok {prevStepDef.num} ({prevStepDef.shortLabel})
              </span>
            </button>
          ) : (
            <div className="text-xs text-stone-500 italic">
              To jest pierwsza strona produkcji
            </div>
          )}
        </div>

        {/* Center Current Page Indicator */}
        <div className="flex items-center gap-2 text-xs text-stone-400">
          <span className="font-semibold text-stone-200">
            Strona {currentStep} z {PRODUCTION_STEPS.length}
          </span>
          <span>•</span>
          <span className="text-amber-400 font-medium">{activeStepDef.shortLabel}</span>
        </div>

        {/* Next Step Button */}
        <div>
          {nextStepDef ? (
            <button
              type="button"
              onClick={() => onSelectStep(nextStepDef.num)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs sm:text-sm font-bold shadow-lg transition-all hover:scale-102"
            >
              <span>
                Przejdź: Krok {nextStepDef.num} ({nextStepDef.shortLabel})
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSelectStep(1)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs sm:text-sm font-medium border border-amber-500/30 transition-all"
            >
              <span>Zacznij nową audycję</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
