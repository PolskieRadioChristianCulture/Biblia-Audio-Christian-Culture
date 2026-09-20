import {
  FileText,
  Sparkles,
  Film,
  Users,
  Sliders,
  Volume2,
  Video,
  Download,
  LucideIcon,
} from 'lucide-react';
import { ProductionProject } from '../types';

export interface StepDefinition {
  num: number;
  phaseNumber: 1 | 2 | 3;
  phaseName: string;
  shortLabel: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  checkCompleted: (project: ProductionProject) => boolean;
}

export const PRODUCTION_STEPS: StepDefinition[] = [
  {
    num: 1,
    phaseNumber: 1,
    phaseName: 'Etap I: Przygotowanie tekstu',
    shortLabel: 'Tekst',
    title: 'Wybór i wczytanie tekstu biblijnego',
    subtitle: 'Wklej lub wczytaj natchniony fragment Pisma Świętego albo wybierz gotowy rozdział z Biblii Tysiąclecia.',
    icon: FileText,
    checkCompleted: (p) => p.rawSourceText.trim().length > 20,
  },
  {
    num: 2,
    phaseNumber: 1,
    phaseName: 'Etap I: Przygotowanie tekstu',
    shortLabel: 'Analiza AI',
    title: 'Inteligentna analiza i podział na role',
    subtitle: 'Gemini AI rozpoznaje strukturę dialogową, wyodrębnia postacie biblijne, Narratora oraz nastrój sceny.',
    icon: Sparkles,
    checkCompleted: (p) => (p.script?.characters?.length || 0) > 0 || (p.script?.lines?.length || 0) > 0,
  },
  {
    num: 3,
    phaseNumber: 1,
    phaseName: 'Etap I: Przygotowanie tekstu',
    shortLabel: 'Scenariusz',
    title: 'Redakcja scenariusza i kwestii dialogowych',
    subtitle: 'Zweryfikuj każdą linijkę, przypisane postacie, didaskalia i pauzy oddechowe przed przejściem do dźwięku.',
    icon: Film,
    checkCompleted: (p) => (p.script?.lines?.length || 0) > 0,
  },
  {
    num: 4,
    phaseNumber: 2,
    phaseName: 'Etap II: Realizacja dźwiękowa',
    shortLabel: 'Obsada (Casting)',
    title: 'Casting głosów i aktorzy AI',
    subtitle: 'Dobierz unikalne, naturalne głosy Gemini Neural TTS dla każdej postaci i przetestuj ich brzmienie w próbkach.',
    icon: Users,
    checkCompleted: (p) => (p.script?.characters?.length || 0) > 0,
  },
  {
    num: 5,
    phaseNumber: 2,
    phaseName: 'Etap II: Realizacja dźwiękowa',
    shortLabel: 'Reżyseria',
    title: 'Reżyseria dźwięku, muzyka i sacrum',
    subtitle: 'Skonfiguruj sakralny podkład muzyczny, pogłos katedralny oraz tło akustyczne słuchowiska.',
    icon: Sliders,
    checkCompleted: (p) => !!p.mixerSettings,
  },
  {
    num: 6,
    phaseNumber: 2,
    phaseName: 'Etap II: Realizacja dźwiękowa',
    shortLabel: 'Montaż i Master',
    title: 'Montaż wielośladowy i mastering audio',
    subtitle: 'Wygeneruj głosy lektorskie, zbalansuj poziomy w mikserze i wyrenderuj plik master WAV/MP3 (-16 LUFS).',
    icon: Volume2,
    checkCompleted: (p) => !!(p.masterAudioWavUrl || p.masterAudioMp3Url),
  },
  {
    num: 7,
    phaseNumber: 3,
    phaseName: 'Etap III: Wideo i Emisja',
    shortLabel: 'Video Studio',
    title: 'Biblia Audio Video Studio (YouTube 16:9 / Shorts)',
    subtitle: 'Stwórz film wideo z klasycznymi dziełami sztuki sakralnej, animowanymi napisami i wizualizacją dźwięku.',
    icon: Video,
    checkCompleted: (p) => !!p.renderedVideoMp4Url,
  },
  {
    num: 8,
    phaseNumber: 3,
    phaseName: 'Etap III: Wideo i Emisja',
    shortLabel: 'Publikacja',
    title: 'Publikacja, eksport i pakiety emisyjne',
    subtitle: 'Pobierz gotowy film MP4, master WAV, podcast MP3, napisy SRT/VTT oraz pakiet do emisji w Christian Culture.',
    icon: Download,
    checkCompleted: (p) => !!(p.masterAudioWavUrl || p.renderedVideoMp4Url),
  },
];
