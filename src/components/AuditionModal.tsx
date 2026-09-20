import React, { useEffect, useRef } from 'react';
import { X, Play, Pause, Volume2, RefreshCw, Sparkles, Gauge } from 'lucide-react';

interface AuditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  text: string;
  audioUrl: string | null;
  isLoading: boolean;
  onReplay: () => void;
  playbackRate?: number;
  emotionCue?: string;
}

export const AuditionModal: React.FC<AuditionModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  text,
  audioUrl,
  isLoading,
  onReplay,
  playbackRate = 1.0,
  emotionCue,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioUrl && !isLoading) {
      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl);
      } else {
        audioRef.current.src = audioUrl;
      }
      if (audioRef.current) {
        audioRef.current.playbackRate = playbackRate;
      }
      audioRef.current.play().catch((e) => console.warn('Autoplay error:', e));
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [audioUrl, isLoading, playbackRate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-100"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-700/50 flex items-center justify-center text-amber-400 shrink-0">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-100 font-serif">{title}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              {subtitle && <p className="text-xs text-amber-300 font-medium">{subtitle}</p>}
              {playbackRate && playbackRate !== 1.0 && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-mono font-bold border border-amber-800 flex items-center gap-1">
                  <Gauge className="w-3 h-3" />
                  Tempo: {playbackRate.toFixed(2)}x
                </span>
              )}
              {emotionCue && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-stone-800 text-stone-300 italic border border-stone-700">
                  {emotionCue}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Text of utterance */}
        <div className="p-4 bg-stone-950 border border-stone-800 rounded-xl">
          <p className="text-xs text-stone-400 mb-1 font-semibold">Tekst próbki audio:</p>
          <p className="text-sm text-stone-100 font-serif leading-relaxed italic">
            "{text}"
          </p>
        </div>

        {/* Audio status & wave animation */}
        <div className="flex items-center justify-between p-3.5 bg-stone-950/60 border border-stone-800 rounded-xl">
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-amber-300">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Syntezowanie głosu aktorskiego Gemini TTS...</span>
            </div>
          ) : audioUrl ? (
            <div className="flex items-center gap-3 w-full justify-between">
              <div className="flex items-center gap-1.5 h-6">
                <span className="w-1 h-3 bg-amber-500 rounded-full animate-pulse" />
                <span className="w-1 h-5 bg-amber-400 rounded-full animate-pulse delay-75" />
                <span className="w-1 h-2 bg-amber-600 rounded-full animate-pulse delay-150" />
                <span className="w-1 h-6 bg-amber-300 rounded-full animate-pulse" />
                <span className="w-1 h-4 bg-amber-500 rounded-full animate-pulse delay-100" />
                <span className="text-xs font-mono text-emerald-400 font-bold ml-2">
                  Próbka gotowa (PCM HD)
                </span>
              </div>

              <button
                type="button"
                onClick={onReplay}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-stone-950" />
                <span>Odtwórz ponownie</span>
              </button>
            </div>
          ) : (
            <span className="text-xs text-stone-400">Oczekiwanie na generowanie...</span>
          )}
        </div>
      </div>
    </div>
  );
};
