import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Play,
  RotateCcw,
  CheckCircle2,
  X,
  Volume2,
  Clock,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { CustomAudioTrack } from '../types';
import { formatDuration } from '../lib/customAudioUtils';

interface VoiceRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordingComplete: (track: CustomAudioTrack) => void;
  characterName?: string;
  lineText?: string;
  title?: string;
}

export const VoiceRecorderModal: React.FC<VoiceRecorderModalProps> = ({
  isOpen,
  onClose,
  onRecordingComplete,
  characterName = 'Lektor / Postać',
  lineText,
  title = 'Studio Własnej Recytacji na Żywo',
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingDurationSec, setRecordingDurationSec] = useState<number>(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Clean up on unmount or close
  useEffect(() => {
    return () => {
      stopRecordingCleanup();
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
    };
  }, []);

  const stopRecordingCleanup = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  if (!isOpen) return null;

  const startRecording = async () => {
    setMicError(null);
    setRecordedAudioUrl(null);
    setRecordedBlob(null);
    setRecordingDurationSec(0);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Audio Metering Setup
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;

        const updateMeter = () => {
          if (!analyserRef.current) return;
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animFrameRef.current = requestAnimationFrame(updateMeter);
        };
        updateMeter();
      } catch (meterErr) {
        console.warn('Audio metering unavailable:', meterErr);
      }

      // MediaRecorder Setup
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedAudioUrl(url);
        stopRecordingCleanup();
      };

      recorder.start(100);
      setIsRecording(true);

      const startTime = Date.now();
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingDurationSec(Math.round((Date.now() - startTime) / 100) / 10);
      }, 100);
    } catch (err: unknown) {
      console.error('Błąd dostępu do mikrofonu:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setMicError(
        `Brak dostępu do mikrofonu (${errMsg}). Upewnij się, że przeglądarka ma uprawnienia do nagrywania.`
      );
      stopRecordingCleanup();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const togglePlayPreview = () => {
    if (!recordedAudioUrl) return;

    if (isPlayingPreview) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      setIsPlayingPreview(false);
    } else {
      if (!previewAudioRef.current) {
        const a = new Audio(recordedAudioUrl);
        a.onended = () => setIsPlayingPreview(false);
        previewAudioRef.current = a;
      } else {
        previewAudioRef.current.src = recordedAudioUrl;
      }
      previewAudioRef.current.play().catch((e) => console.error(e));
      setIsPlayingPreview(true);
    }
  };

  const handleAcceptRecording = async () => {
    if (!recordedBlob || !recordedAudioUrl) return;

    // Convert Blob to Base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = (reader.result as string) || '';
      const base64 = result.includes('base64,') ? result.split('base64,')[1] : result;

      const track: CustomAudioTrack = {
        fileName: `recytacja_${characterName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.webm`,
        fileSizeBytes: recordedBlob.size,
        audioUrl: recordedAudioUrl,
        base64,
        durationSec: recordingDurationSec || 1,
        uploadedAt: Date.now(),
        mimeType: recordedBlob.type || 'audio/webm',
      };

      onRecordingComplete(track);
      onClose();
    };
    reader.readAsDataURL(recordedBlob);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#10141d] border border-amber-800/60 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5 text-stone-100 font-mono relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#212b3a] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-stone-950 font-black shadow-lg">
              <Mic size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold font-serif text-white flex items-center gap-2">
                {title}
              </h3>
              <p className="text-xs text-amber-400">
                Postać / Rola: <span className="font-bold text-white">{characterName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#18202d] hover:bg-[#253043] text-stone-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Biblical Text to Recite */}
        {lineText && (
          <div className="bg-[#0b0e14] border border-[#212b3a] rounded-xl p-4 space-y-1.5">
            <span className="text-[11px] font-bold text-amber-400/90 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={13} />
              Tekst do wyrecytowania (Pismo Święte):
            </span>
            <p className="text-sm sm:text-base font-serif text-stone-100 italic leading-relaxed select-text bg-[#121722] p-3 rounded-lg border border-amber-900/30">
              „{lineText}”
            </p>
          </div>
        )}

        {/* Recording Monitor Panel */}
        <div className="bg-[#090c12] border border-[#1d2636] rounded-xl p-5 text-center space-y-4">
          {/* Status Indicator */}
          <div className="flex items-center justify-center gap-3">
            <span
              className={`w-3 h-3 rounded-full ${
                isRecording
                  ? 'bg-red-500 animate-ping'
                  : recordedAudioUrl
                  ? 'bg-emerald-400'
                  : 'bg-stone-600'
              }`}
            />
            <span className="text-xs font-bold uppercase tracking-widest text-stone-300">
              {isRecording
                ? '🔴 NAGRYWANIE W TOKU...'
                : recordedAudioUrl
                ? '🟢 NAGRANIE GOTOWE DO ODSŁUCHU'
                : 'GOTOWY DO NAGRANIA'}
            </span>
          </div>

          {/* Timecode */}
          <div className="text-3xl sm:text-4xl font-black font-mono text-amber-300 tracking-wider">
            {formatDuration(recordingDurationSec)}
            <span className="text-xs text-stone-400 ml-1">.{Math.floor((recordingDurationSec % 1) * 10)}s</span>
          </div>

          {/* Audio VU Meter */}
          {isRecording && (
            <div className="space-y-1">
              <div className="w-full bg-[#18202d] h-3 rounded-full overflow-hidden p-0.5 border border-[#29354a]">
                <div
                  className="h-full rounded-full transition-all duration-75 bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500"
                  style={{ width: `${audioLevel}%` }}
                />
              </div>
              <span className="text-[10px] text-stone-400 block font-mono">
                Poziom sygnału mikrofonu: {audioLevel}%
              </span>
            </div>
          )}

          {/* Error message */}
          {micError && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{micError}</span>
            </div>
          )}

          {/* Main Action Buttons */}
          <div className="flex items-center justify-center gap-3 pt-2">
            {!isRecording && !recordedAudioUrl && (
              <button
                type="button"
                onClick={startRecording}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs shadow-lg shadow-red-900/40 transition-all hover:scale-105"
              >
                <Mic size={18} />
                <span>ROZPOCZNIJ NAGRYWANIE RECYTACJI</span>
              </button>
            )}

            {isRecording && (
              <button
                type="button"
                onClick={stopRecording}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-100 hover:bg-white text-stone-950 font-black text-xs shadow-xl animate-pulse"
              >
                <Square size={16} className="fill-current" />
                <span>ZAKOŃCZ NAGRANIE</span>
              </button>
            )}

            {recordedAudioUrl && !isRecording && (
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={togglePlayPreview}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isPlayingPreview
                      ? 'bg-amber-500 text-stone-950 shadow-md'
                      : 'bg-[#1e2736] hover:bg-[#2b374c] text-white border border-[#334259]'
                  }`}
                >
                  {isPlayingPreview ? (
                    <>
                      <Square size={14} className="fill-current" />
                      <span>ZATZYMAJ ODSŁUCH</span>
                    </>
                  ) : (
                    <>
                      <Play size={14} className="fill-current" />
                      <span>ODSŁUCHAJ PRÓBKĘ</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={startRecording}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#161d27] hover:bg-[#202937] text-stone-300 hover:text-white border border-[#2a3548] text-xs"
                  title="Odrzuć nagranie i spróbuj ponownie"
                >
                  <RotateCcw size={14} />
                  <span>NAGRAJ PONOWNIE</span>
                </button>

                <button
                  type="button"
                  onClick={handleAcceptRecording}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 transition-all hover:scale-102"
                >
                  <CheckCircle2 size={16} />
                  <span>ZATWIERDŹ I UŻYJ ŚCIEŻKI</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-[11px] text-stone-400 border-t border-[#1d2636] pt-3">
          <span className="flex items-center gap-1">
            <Volume2 size={13} className="text-amber-400" />
            Format: PCM / Opus wysokiej wierności (HI-FI)
          </span>
          <span>CC Studio DAW Master Engine</span>
        </div>
      </div>
    </div>
  );
};
