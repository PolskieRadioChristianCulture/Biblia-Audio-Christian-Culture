import React from 'react';
import {
  Sparkles,
  Compass,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { ProductionProject } from '../types';

interface ProductionGuideProps {
  currentStep: number;
  project: ProductionProject;
  onSelectStep: (step: number) => void;
}

interface StepGuidance {
  step: number;
  badge: string;
  headline: string;
  description: string;
  actionText: string;
  targetElementId: string;
}

const STEP_GUIDANCES: Record<number, StepGuidance> = {
  1: {
    step: 1,
    badge: 'KROK 1 • ŹRÓDŁO TEKSTU',
    headline: 'Wczytaj rozdział z oficjalnej Biblii UBG lub wprowadź własny tekst',
    description:
      'Wybierz z katalogu 66 ksiąg (1189 rozdziałów) autentyczny przekład Uwspółcześnionej Biblii Gdańskiej (UBG 2024) lub wklej dowolny fragment do adaptacji.',
    actionText: 'Pokaż następną czynność',
    targetElementId: 'action-load-ubg',
  },
  2: {
    step: 2,
    badge: 'KROK 2 • ANALIZA I POSTACIE',
    headline: 'Uruchom inteligentną analizę podziału ról i kwestii dramatycznych',
    description:
      'Silnik automatycznie wyodrębni kwestie Narratora, Jezusa, uczniów i postaci pobocznych, przygotowując profesjonalną partyturę słuchowiska.',
    actionText: 'Pokaż następną czynność',
    targetElementId: 'action-analyze-script',
  },
  3: {
    step: 3,
    badge: 'KROK 3 • SCENARIUSZ',
    headline: 'Zweryfikuj partyturę dialogową i przejdź do castingu lektorów',
    description:
      'Sprawdź przypisanie ról, zredaguj ewentualne kwestie i zatwierdź scenariusz do etapu doboru głosów.',
    actionText: 'Pokaż następną czynność',
    targetElementId: 'action-proceed-step4',
  },
  4: {
    step: 4,
    badge: 'KROK 4 • CASTING GŁOSÓW',
    headline: 'Dopasuj głosy lektorskie lub nagraj własną recytację mikrofonem',
    description:
      'Skorzystaj z polskiego silnika mowy, ElevenLabs BYOK, głosów Gemini lub zarejestruj własny głos z radiowym torem DSP.',
    actionText: 'Pokaż następną czynność',
    targetElementId: 'action-proceed-step5',
  },
  5: {
    step: 5,
    badge: 'KROK 5 • REŻYSERIA AUDIO',
    headline: 'Skonfiguruj tempo narracji, pauzy dramatyczne i ładunek emocjonalny',
    description:
      'Dostosuj szybkość wypowiedzi, intonację i pauzy między wersetami, aby nadać słuchowisku głęboki, radiowy charakter.',
    actionText: 'Pokaż następną czynność',
    targetElementId: 'action-proceed-step6',
  },
  6: {
    step: 6,
    badge: 'KROK 6 • OŚ CZASU I MIKSER DAW',
    headline: 'Wygeneruj kwestie lektorskie i zmasteruj audycję (-16 LUFS)',
    description:
      'Uruchom syntezę wszystkich partii, ustaw muzykę w tle, ducking i wygeneruj profesjonalny miks radiowy WAV/MP3.',
    actionText: 'Pokaż następną czynność',
    targetElementId: 'action-synthesize-all',
  },
  7: {
    step: 7,
    badge: 'KROK 7 • STUDIO WIDEO 4K',
    headline: 'Wybierz obraz, włącz korektor segmentowy LED i wyrenderuj MP4',
    description:
      'Dostosuj format (1080p, 4K, Shorts), dynamiczny korektor LED reagujący na dźwięk, napisy wersetów i uruchom render wideo.',
    actionText: 'Pokaż następną czynność',
    targetElementId: 'action-render-video',
  },
  8: {
    step: 8,
    badge: 'KROK 8 • EKSPORT I EMISJA',
    headline: 'Pobierz gotowe pliki radiowe WAV, MP3 oraz wideo emisyjne MP4',
    description:
      'Wszystkie materiały są zgodne ze standardem emisyjnym Christian Culture i gotowe do publikacji.',
    actionText: 'Pokaż następną czynność',
    targetElementId: 'action-download-all',
  },
};

export const ProductionGuide: React.FC<ProductionGuideProps> = ({
  currentStep,
  project,
}) => {
  const guide = STEP_GUIDANCES[currentStep] || STEP_GUIDANCES[1];

  const handleShowNextAction = () => {
    const target =
      document.getElementById(guide.targetElementId) ||
      document.querySelector(`[data-action="${guide.targetElementId}"]`) ||
      document.getElementById('primary-action-btn');

    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add(
        'ring-4',
        'ring-[#ff8c1a]',
        'ring-offset-2',
        'ring-offset-[#10141d]',
        'shadow-[0_0_25px_#ff8c1a]',
        'transition-all',
        'duration-500'
      );
      setTimeout(() => {
        target.classList.remove(
          'ring-4',
          'ring-[#ff8c1a]',
          'ring-offset-2',
          'ring-offset-[#10141d]',
          'shadow-[0_0_25px_#ff8c1a]',
          'transition-all',
          'duration-500'
        );
      }, 3500);
    } else {
      // Fallback: scroll down slightly to first interactive element
      window.scrollBy({ top: 250, behavior: 'smooth' });
    }
  };

  return (
    <div
      id="production-guide-panel"
      className="rounded-xl bg-[#12161f] border border-[#2a3445] p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.4)] relative overflow-hidden"
    >
      {/* Decorative ambient flare */}
      <div className="absolute top-0 right-0 w-64 h-32 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />

      {/* Row 1: Header and Guidance Details */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#212937]">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#1c2331] border border-[#344258] text-[#ff8c1a] flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#ff8c1a] uppercase bg-[#241a10] px-2 py-0.5 rounded border border-[#ff8c1a]/30">
                PANEL: NASTĘPNY RUCH
              </span>
              <span className="text-xs font-mono text-stone-400">• {guide.badge}</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
              {guide.headline}
            </h3>
          </div>
        </div>

        {/* Quick step counter indicator */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-stone-400 bg-[#0e1117] px-3 py-1.5 rounded-lg border border-[#222b3a] shrink-0">
          <span className="text-stone-500">ETAP</span>
          <span className="text-white font-bold">{currentStep} / 8</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
        </div>
      </div>

      {/* Row 2: Description and Actions (aligned to the right) */}
      <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Tactical explanation */}
        <p className="text-xs sm:text-sm text-stone-300 max-w-3xl leading-relaxed">
          {guide.description}
        </p>

        {/* Right: Explicitly aligned to the right */}
        <div className="flex items-center justify-end gap-3 sm:ml-auto shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleShowNextAction}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff8c1a] to-[#d65f00] hover:from-[#ffa033] hover:to-[#e66800] text-stone-950 font-black text-xs sm:text-sm shadow-[0_0_15px_rgba(255,140,26,0.35)] transition-all hover:scale-102 border border-[#ffa33a] cursor-pointer"
            title="Kliknij, aby podświetlić i przewinąć do właściwego przycisku na tej stronie"
          >
            <Sparkles className="w-4 h-4 text-stone-950 fill-stone-950" />
            <span>{guide.actionText}</span>
            <ArrowRight className="w-4 h-4 text-stone-950" />
          </button>
        </div>
      </div>
    </div>
  );
};
