import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileAudio,
  Play,
  Square,
  Trash2,
  CheckCircle2,
  Music,
  Mic,
  Radio,
  Clock,
  Volume2,
} from 'lucide-react';
import { CustomAudioTrack } from '../types';
import { readAudioFile, formatDuration, formatBytes } from '../lib/customAudioUtils';

interface CustomAudioUploaderProps {
  label: string;
  description?: string;
  trackType: 'voice' | 'music' | 'jingle' | 'intro' | 'outro';
  currentTrack?: CustomAudioTrack;
  onTrackUploaded: (track: CustomAudioTrack) => void;
  onTrackRemoved: () => void;
  compact?: boolean;
}

export const CustomAudioUploader: React.FC<CustomAudioUploaderProps> = ({
  label,
  description,
  trackType,
  currentTrack,
  onTrackUploaded,
  onTrackRemoved,
  compact = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleFile = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('audio/') && !/\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(file.name)) {
      alert('Proszę wybrać plik dźwiękowy (MP3, WAV, M4A, OGG lub AAC).');
      return;
    }

    setIsProcessing(true);
    try {
      const track = await readAudioFile(file);
      onTrackUploaded(track);
    } catch (err) {
      console.error('Błąd wczytywania pliku audio:', err);
      alert('Nie udało się załadować pliku audio. Upewnij się, że plik nie jest uszkodzony.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleTogglePlay = () => {
    if (!currentTrack) return;

    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(currentTrack.audioUrl);
        audioRef.current.ontimeupdate = () => {
          setCurrentTime(audioRef.current?.currentTime || 0);
        };
        audioRef.current.onended = () => {
          setIsPlaying(false);
          setCurrentTime(0);
        };
      } else {
        audioRef.current.src = currentTrack.audioUrl;
      }
      audioRef.current.play().catch((e) => console.error('Błąd odtwarzania:', e));
      setIsPlaying(true);
    }
  };

  const getIcon = () => {
    switch (trackType) {
      case 'voice':
        return <Mic className="w-4 h-4 text-[#ff8c1a]" />;
      case 'music':
        return <Music className="w-4 h-4 text-[#a55eea]" />;
      case 'jingle':
        return <Radio className="w-4 h-4 text-[#00d2d3]" />;
      case 'intro':
      case 'outro':
        return <Volume2 className="w-4 h-4 text-[#2ecc71]" />;
      default:
        return <FileAudio className="w-4 h-4 text-[#ff8c1a]" />;
    }
  };

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {currentTrack ? (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#141b24] border border-[#2b3a4f] text-xs font-mono">
            <button
              type="button"
              onClick={handleTogglePlay}
              className={`p-1 rounded transition-colors ${
                isPlaying
                  ? 'bg-amber-500 text-black'
                  : 'bg-[#222c3d] hover:bg-[#2d3a50] text-amber-300'
              }`}
              title={isPlaying ? 'Zatrzymaj odsłuch' : 'Odsłuchaj wgrane nagranie'}
            >
              {isPlaying ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
            </button>
            <span className="text-stone-200 truncate max-w-[130px] sm:max-w-[180px]" title={currentTrack.fileName}>
              {currentTrack.fileName}
            </span>
            <span className="text-stone-400 text-[10px]">
              {formatDuration(currentTrack.durationSec)}
            </span>
            <button
              type="button"
              onClick={() => {
                if (audioRef.current) audioRef.current.pause();
                setIsPlaying(false);
                onTrackRemoved();
              }}
              className="p-1 text-stone-400 hover:text-red-400 transition-colors"
              title="Usuń własny plik audio (przywróć syntezę)"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1b222e] hover:bg-[#263142] text-stone-300 hover:text-white border border-[#2d3a4c] text-xs font-mono transition-colors"
            title="Wgraj własny plik audio dla tej kwestii (MP3, WAV)"
          >
            <UploadCloud className="w-3.5 h-3.5 text-[#ff8c1a]" />
            <span>{isProcessing ? 'Wczytywanie...' : 'Wgraj audio (MP3/WAV)'}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#12161f] border border-[#273142] rounded-xl p-4 space-y-3 font-mono">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[#1a212c] border border-[#313e53]">
            {getIcon()}
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              {label}
              {currentTrack && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-600/70 text-emerald-300 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  WŁASNY PLIK AKTYWNY
                </span>
              )}
            </h4>
            {description && <p className="text-xs text-stone-400 mt-0.5">{description}</p>}
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {currentTrack ? (
        <div className="p-3 bg-[#0a0d13] border border-[#263244] rounded-lg space-y-2.5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={handleTogglePlay}
                className={`p-2.5 rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                  isPlaying
                    ? 'bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                    : 'bg-[#242f40] hover:bg-[#324056] text-amber-300'
                }`}
                title={isPlaying ? 'Zatrzymaj odsłuch' : 'Odsłuchaj plik'}
              >
                {isPlaying ? (
                  <>
                    <Square className="w-4 h-4 fill-current" />
                    <span className="text-xs">Zatrzymaj</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span className="text-xs">Odsłuchaj</span>
                  </>
                )}
              </button>

              <div className="min-w-0">
                <strong className="block text-xs sm:text-sm text-white truncate max-w-[260px] sm:max-w-md">
                  {currentTrack.fileName}
                </strong>
                <div className="flex items-center gap-2 text-[11px] text-stone-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#ff8c1a]" />
                    {formatDuration(currentTrack.durationSec)}
                  </span>
                  <span>•</span>
                  <span>{formatBytes(currentTrack.fileSizeBytes)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1.5 rounded bg-[#1c2431] hover:bg-[#283446] text-stone-300 hover:text-white border border-[#334257] text-xs font-medium transition-colors"
                title="Wymień na inny plik audio z dysku"
              >
                Zmień plik
              </button>
              <button
                type="button"
                onClick={() => {
                  if (audioRef.current) audioRef.current.pause();
                  setIsPlaying(false);
                  onTrackRemoved();
                }}
                className="p-1.5 rounded bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/60 text-xs transition-colors"
                title="Usuń ten plik"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Drag-and-Drop + Manual Click Zone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-[#ff8c1a] bg-[#ff8c1a]/10 text-white'
              : 'border-[#2d3a4d] hover:border-[#ff8c1a]/60 bg-[#0d1016] hover:bg-[#141a24] text-stone-400 hover:text-stone-200'
          }`}
        >
          <UploadCloud className="w-7 h-7 mx-auto mb-2 text-[#ff8c1a]" />
          <p className="text-xs sm:text-sm font-bold text-stone-200">
            {isProcessing ? 'Wczytywanie pliku audio...' : 'Przeciągnij i upuść plik audio lub kliknij, aby wybrać'}
          </p>
          <p className="text-[11px] text-stone-500 mt-1">
            Obsługiwane formaty: MP3, WAV, M4A, OGG, AAC (ze studia nagrań lub własnej biblioteki)
          </p>
        </div>
      )}
    </div>
  );
};
