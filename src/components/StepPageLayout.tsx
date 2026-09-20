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
      {/* Top Page Stage Header */}
      <div className="rounded-2xl bg-stone-900/90 border border-stone-800 shadow-xl overflow-hidden">
        {/* Subtle Progress Bar */}
        <div className="h-1.5 w-full bg-stone-800 relative">
          <div
            className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            {/* Breadcrumb & Phase */}
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-amber-400">
              <span>{activeStepDef.phaseName}</span>
              <span className="text-stone-600">•</span>
              <span className="text-stone-300">
                Strona {currentStep} z {PRODUCTION_STEPS.length}
              </span>
              <span className="text-stone-600">•</span>
              <span className="text-stone-400">{progressPercent}% produkcji</span>
            </div>

            {/* Page Title & Icon */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-center shrink-0">
                <StepIcon className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-stone-100 tracking-tight">
                {activeStepDef.title}
              </h1>
            </div>

            {/* Page Subtitle / Purpose */}
            <p className="text-xs sm:text-sm text-stone-400 max-w-3xl leading-relaxed">
              {activeStepDef.subtitle}
            </p>
          </div>

          {/* Project Active Context Badge & Jump Navigator */}
          <div className="flex items-center gap-3 self-start md:self-center shrink-0">
            <div className="hidden sm:flex flex-col items-end text-right px-3 py-1.5 rounded-xl bg-stone-950/70 border border-stone-800 text-xs">
              <span className="font-semibold text-stone-200 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                {project.bookName} {project.chapterNumber}
              </span>
              <span className="text-[11px] text-stone-400">
                {lineCount > 0 ? `${lineCount} kwestii` : 'Brak scenariusza'} •{' '}
                {characterCount > 0 ? `${characterCount} postaci` : 'Brak obsady'}
              </span>
            </div>

            {/* Quick Page Jump Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsJumpMenuOpen(!isJumpMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 transition-colors"
                title="Wybierz stronę z listy"
              >
                <ListOrdered className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Wszystkie strony ({currentStep}/8)</span>
                <span className="sm:hidden">Strona {currentStep}/8</span>
              </button>

              {isJumpMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-stone-900 border border-stone-700 shadow-2xl z-50 p-2 space-y-1 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-stone-800 text-xs font-bold text-stone-400 uppercase tracking-wider">
                    Spis stron produkcji (8 kroków)
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
