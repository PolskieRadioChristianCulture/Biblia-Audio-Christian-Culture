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

        <div className="p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            {/* Breadcrumb & Phase */}
            <div className="flex items-center gap-2 text-xs sm:text-sm font-mono font-bold tracking-wider uppercase text-[#ff8c1a]">
              <span>KROK 0{currentStep} / 0{PRODUCTION_STEPS.length}</span>
              <span className="text-stone-600">•</span>
              <span className="text-stone-200">{activeStepDef.shortLabel}</span>
              <span className="text-stone-600">•</span>
              <span className="text-[#00d2d3]">{progressPercent}% PRODUKCJI</span>
            </div>

            {/* Page Title & Icon */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#1e2532] border border-[#374358] text-[#ff8c1a] flex items-center justify-center shadow-[0_0_14px_rgba(255,122,0,0.25)] shrink-0">
                <StepIcon className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight font-mono">
                {activeStepDef.title}
              </h1>
            </div>

            {/* Page Subtitle / Purpose */}
            <p className="text-sm sm:text-base text-stone-200 max-w-3xl leading-relaxed">
              {activeStepDef.subtitle}
            </p>
          </div>

          {/* Project Active Context Badge & Jump Navigator */}
          <div className="flex items-center gap-3 self-start md:self-center shrink-0">
            <div className="hidden sm:flex flex-col items-end text-right px-3.5 py-2 rounded-lg bg-[#0e1116] border border-[#293241] text-xs font-mono">
              <span className="font-bold text-white flex items-center gap-1.5 text-sm">
                <BookOpen className="w-4 h-4 text-[#ff8c1a]" />
                {project.bookName} {project.chapterNumber}
              </span>
              <span className="text-xs text-stone-300 font-medium">
                {lineCount > 0 ? `${lineCount} kwestii` : '0 kwestii'} •{' '}
                {characterCount > 0 ? `${characterCount} postaci` : '0 postaci'}
              </span>
            </div>

            {/* Quick Page Jump Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsJumpMenuOpen(!isJumpMenuOpen)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#1e2430] hover:bg-[#283141] text-white text-xs sm:text-sm font-mono font-bold border border-[#343e50] transition-colors shadow-sm"
                title="Wybierz moduł z listy"
              >
                <ListOrdered className="w-4 h-4 text-[#ff8c1a]" />
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
      <div className="rounded-2xl bg-stone-900/95 border border-[#374358] p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Previous Step Button */}
        <div>
          {prevStepDef ? (
            <button
              type="button"
              onClick={() => onSelectStep(prevStepDef.num)}
              className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-[#202734] hover:bg-[#2c3647] text-white text-sm sm:text-base font-bold border border-[#3e4c63] transition-all hover:scale-102 shadow-sm"
            >
              <ChevronLeft className="w-5 h-5 text-[#ff8c1a]" />
              <span>
                Wróć: Krok {prevStepDef.num} ({prevStepDef.shortLabel})
              </span>
            </button>
          ) : (
            <div className="text-sm text-stone-400 italic">
              To jest pierwsza strona produkcji
            </div>
          )}
        </div>

        {/* Center Current Page Indicator */}
        <div className="flex items-center gap-2.5 text-sm sm:text-base text-stone-300 font-mono">
          <span className="font-bold text-white">
            Strona {currentStep} z {PRODUCTION_STEPS.length}
          </span>
          <span>•</span>
          <span className="text-[#ff8c1a] font-bold">{activeStepDef.shortLabel}</span>
        </div>

        {/* Next Step Button */}
        <div>
          {nextStepDef ? (
            <button
              type="button"
              onClick={() => onSelectStep(nextStepDef.num)}
              className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff8c1a] to-[#d65f00] hover:from-[#ffa033] hover:to-[#e66800] text-black text-sm sm:text-base font-black shadow-[0_0_18px_rgba(255,122,0,0.5)] transition-all hover:scale-102 border border-[#ffa33a]"
            >
              <span>
                Przejdź: Krok {nextStepDef.num} ({nextStepDef.shortLabel})
              </span>
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSelectStep(1)}
              className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-[#202734] hover:bg-[#2c3647] text-[#ff8c1a] text-sm sm:text-base font-bold border border-[#ff8c1a]/40 transition-all"
            >
              <span>Zacznij nową audycję</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
