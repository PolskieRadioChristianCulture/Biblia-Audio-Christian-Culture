import React, { useState, useEffect, useRef } from 'react';
import {
  Film,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Download,
  Image as ImageIcon,
  Upload,
  Settings,
  Subtitles,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Eye,
  Layers,
  Radio,
  Share2,
  Video,
  Monitor,
  Smartphone,
  Maximize2,
  FileText,
  ShieldCheck,
  UserCheck,
  Zap,
} from 'lucide-react';
import { CURATED_BIBLICAL_ARTWORKS, DEFAULT_CHARACTER_PROFILES } from '../data/videoPresets';
import {
  CharacterProfile,
  ProductionProject,
  SubtitleCue,
  VideoMode,
  VideoMotionEffect,
  VideoResolution,
  VideoScene,
  VideoSettings,
  VideoVisualizerType,
} from '../types';
import {
  calculateSubtitleCues,
  formatYouTubeTime,
  generateSrt,
  generateVtt,
} from '../lib/videoUtils';
import { ThumbnailGeneratorModal } from './ThumbnailGeneratorModal';

interface Step7VideoStudioProps {
  project: ProductionProject;
  onUpdateProject: (updated: Partial<ProductionProject>) => void;
  onProceedToStep8?: () => void;
  onProceedToExport?: () => void;
  onRenderVideo: (settings: VideoSettings) => Promise<void>;
  isRenderingVideo?: boolean;
  isRendering?: boolean;
  renderingProgress?: { stage: string; percent: number };
  renderProgress?: { stage: string; percent: number };
}

export const Step7VideoStudio: React.FC<Step7VideoStudioProps> = ({
  project,
  onUpdateProject,
  onProceedToStep8,
  onProceedToExport,
  onRenderVideo,
  isRenderingVideo: propIsRenderingVideo,
  isRendering,
  renderingProgress: propRenderingProgress,
  renderProgress,
}) => {
  const isRenderingVideo = propIsRenderingVideo ?? isRendering ?? false;
  const renderingProgress = propRenderingProgress ?? renderProgress ?? { stage: '', percent: 0 };
  const handleProceed = onProceedToStep8 || onProceedToExport || (() => {});

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [activeTab, setActiveTab] = useState<'preview' | 'scenes' | 'subtitles' | 'characters' | 'branding'>('preview');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [isThumbnailModalOpen, setIsThumbnailModalOpen] = useState<boolean>(false);
  const [activeSceneIndex, setActiveSceneIndex] = useState<number>(0);

  // Local copy of video settings
  const settings = project.videoSettings;
  const scenes = settings?.scenes || [];
  const characterProfiles = project.characterProfiles || DEFAULT_CHARACTER_PROFILES;

  // Subtitle cues calculated from audio timeline
  const subtitleCues = React.useMemo(() => {
    return calculateSubtitleCues(project, settings?.includeIntro ? settings.introDurationSec : 0);
  }, [project, settings?.includeIntro, settings?.introDurationSec]);

  // Total calculated duration
  const totalAudioDurationSec = React.useMemo(() => {
    if (subtitleCues.length === 0) return 60;
    const lastCue = subtitleCues[subtitleCues.length - 1];
    const outroDuration = settings?.includeOutro ? settings.outroDurationSec : 0;
    return lastCue.endSec + outroDuration;
  }, [subtitleCues, settings?.includeOutro, settings?.outroDurationSec]);

  // Update setting helper
  const updateSettings = (partial: Partial<VideoSettings>) => {
    onUpdateProject({
      videoSettings: {
        ...settings,
        ...partial,
      },
    });
  };

  // Switch Video Mode
  const handleModeChange = (mode: VideoMode) => {
    updateSettings({ mode });
  };

  // Switch Resolution
  const handleResolutionChange = (resolution: VideoResolution) => {
    updateSettings({ resolution });
  };

  // Switch Visualizer
  const handleVisualizerChange = (visualizer: VideoVisualizerType) => {
    updateSettings({ visualizer });
  };

  // Handle Custom Background Upload
  const handleCustomBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        // Update current scene or add scene
        const updatedScenes = [...scenes];
        if (updatedScenes.length > 0) {
          updatedScenes[activeSceneIndex] = {
            ...updatedScenes[activeSceneIndex],
            imageUrl: dataUrl,
            imageSource: 'Plik użytkownika',
            author: 'Własny materiał',
            license: 'Licencja użytkownika Christian Culture',
            rightsConfirmed: true,
          };
        }
        updateSettings({
          customBackgroundUrl: dataUrl,
          scenes: updatedScenes,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Playback loop and canvas visualizer rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isShorts = settings.resolution === 'shorts';
    const width = isShorts ? 720 : 1280;
    const height = isShorts ? 1280 : 720;
    canvas.width = width;
    canvas.height = height;

    let startTime = performance.now();
    let currentArtworkImg: HTMLImageElement | null = null;

    // Preload image for current scene
    const currentScene = scenes[activeSceneIndex] || scenes[0];
    if (currentScene?.imageUrl) {
      currentArtworkImg = new Image();
      currentArtworkImg.crossOrigin = 'anonymous';
      currentArtworkImg.src = currentScene.imageUrl;
    }

    const renderFrame = (timestamp: number) => {
      ctx.clearRect(0, 0, width, height);

      // 1. Background image or minimalist fill
      if (settings.mode === 'minimalist') {
        // Elegant deep ebony canvas with subtle royal gold gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#141210');
        bgGrad.addColorStop(0.5, '#0c0a09');
        bgGrad.addColorStop(1, '#171412');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);
      } else if (currentArtworkImg && currentArtworkImg.complete && currentArtworkImg.naturalWidth > 0) {
        // Ken Burns subtle zoom/pan simulation
        const elapsed = (timestamp - startTime) / 1000;
        const zoom = 1.0 + 0.05 * Math.sin(elapsed * 0.15);

        const imgRatio = currentArtworkImg.naturalWidth / currentArtworkImg.naturalHeight;
        const canvasRatio = width / height;
        let dw = width * zoom;
        let dh = height * zoom;
        if (imgRatio > canvasRatio) {
          dw = height * zoom * imgRatio;
        } else {
          dh = (width * zoom) / imgRatio;
        }
        const dx = (width - dw) / 2 + Math.sin(elapsed * 0.1) * 15;
        const dy = (height - dh) / 2;

        ctx.drawImage(currentArtworkImg, dx, dy, dw, dh);

        // Vignette & Contrast Overlay
        const vignette = ctx.createRadialGradient(
          width / 2,
          height / 2,
          width * 0.2,
          width / 2,
          height / 2,
          width * 0.7
        );
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
        vignette.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, width, height);
      } else {
        // Fallback atmospheric gradient
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#292524');
        bgGrad.addColorStop(1, '#0c0a09');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Audio Visualizer (Waveform, bars, glow)
      if (settings.visualizer !== 'none') {
        const timeFactor = timestamp * 0.005;
        const isVoiceActive = isPlaying;

        if (settings.visualizer === 'frequency_bars') {
          // Centered delicate frequency spectrum
          const barCount = isShorts ? 32 : 48;
          const barWidth = isShorts ? 12 : 14;
          const gap = 4;
          const totalW = barCount * (barWidth + gap);
          const startX = (width - totalW) / 2;
          const baseY = isShorts ? height * 0.72 : height * 0.76;

          for (let i = 0; i < barCount; i++) {
            const h = isVoiceActive
              ? Math.abs(Math.sin(timeFactor + i * 0.3) * Math.cos(timeFactor * 0.5 + i * 0.2)) * 60 + 8
              : 6 + Math.sin(timeFactor + i * 0.5) * 3;

            const x = startX + i * (barWidth + gap);
            const barGrad = ctx.createLinearGradient(0, baseY - h, 0, baseY);
            barGrad.addColorStop(0, '#fbbf24');
            barGrad.addColorStop(1, 'rgba(217, 119, 6, 0.3)');
            ctx.fillStyle = barGrad;
            ctx.beginPath();
            ctx.roundRect(x, baseY - h, barWidth, h, 3);
            ctx.fill();
          }
        } else if (settings.visualizer === 'waveform') {
          // Smooth sine oscilloscope
          ctx.beginPath();
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#f59e0b';
          const centerY = isShorts ? height * 0.72 : height * 0.76;

          for (let x = 0; x < width; x += 4) {
            const amp = isVoiceActive ? 28 * Math.sin(timeFactor * 2) : 4;
            const y = centerY + Math.sin(x * 0.02 + timeFactor) * amp;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        } else if (settings.visualizer === 'pulsing_glow') {
          // Pulsing Sacred Aureole
          const glowY = isShorts ? height * 0.45 : height * 0.4;
          const radius = 90 + (isVoiceActive ? Math.sin(timeFactor * 3) * 20 : 5);
          const glowGrad = ctx.createRadialGradient(width / 2, glowY, 10, width / 2, glowY, radius);
          glowGrad.addColorStop(0, 'rgba(245, 158, 11, 0.35)');
          glowGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(width / 2, glowY, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 3. Station Branding & Book Title Header
      if (settings.showLogo) {
        const logoX = settings.logoPosition === 'top_left' ? 40 : width - 260;
        const logoY = 40;

        // Brand Pill
        ctx.fillStyle = 'rgba(12, 10, 9, 0.85)';
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(logoX, logoY, 220, 42, 8);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 13px Cinzel, serif';
        ctx.fillStyle = '#f59e0b';
        ctx.fillText('CHRISTIAN CULTURE', logoX + 16, logoY + 26);
      }

      // Top Book & Chapter Title Bar
      ctx.textAlign = 'center';
      ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${project.bookName} • Rozdział ${project.chapterNumber}`, width / 2, 58);

      ctx.font = '13px serif';
      ctx.fillStyle = '#d6d3d1';
      ctx.fillText('Biblia Audio • polskieradio.cc', width / 2, 82);

      // 4. Synchronized Subtitles (Burn-in preview)
      if (settings.showSubtitles) {
        // Find current cue
        const activeCue = subtitleCues.find(
          (c) => currentTimeSec >= c.startSec && currentTimeSec <= c.endSec
        ) || subtitleCues[0];

        if (activeCue) {
          const subY = settings.subtitlesPosition === 'middle' ? height * 0.55 : height - 85;

          // Background pill for contrast
          ctx.font = settings.subtitlesFontSize === 'large'
            ? 'bold 24px "Plus Jakarta Sans", sans-serif'
            : 'bold 19px "Plus Jakarta Sans", sans-serif';

          const displayText = settings.showVerseNumbers && activeCue.verseRef
            ? `[${activeCue.verseRef}] ${activeCue.characterName}: „${activeCue.text}”`
            : `${activeCue.characterName}: „${activeCue.text}”`;

          const textWidth = ctx.measureText(displayText).width;
          const boxW = Math.min(width - 80, textWidth + 40);
          const boxX = (width - boxW) / 2;

          ctx.fillStyle = 'rgba(12, 10, 9, 0.88)';
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(boxX, subY - 32, boxW, 52, 10);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#fef3c7';
          ctx.fillText(displayText, width / 2, subY);
        }
      }

      ctx.textAlign = 'left';

      animFrameRef.current = requestAnimationFrame(renderFrame);
    };

    animFrameRef.current = requestAnimationFrame(renderFrame);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [settings, activeSceneIndex, isPlaying, currentTimeSec, subtitleCues, project]);

  // Handle Play / Pause
  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    } else {
      setIsPlaying(true);
      // If we have master audio or clip, play it
      if (project.masterAudioMp3Url || project.masterAudioWavUrl) {
        if (!audioRef.current) {
          audioRef.current = new Audio(project.masterAudioMp3Url || project.masterAudioWavUrl);
          audioRef.current.ontimeupdate = () => {
            if (audioRef.current) {
              setCurrentTimeSec(audioRef.current.currentTime);
            }
          };
          audioRef.current.onended = () => {
            setIsPlaying(false);
          };
        }
        audioRef.current.play().catch((e) => console.warn('Audio play error:', e));
      } else {
        // Simulation ticker
        const interval = setInterval(() => {
          setCurrentTimeSec((prev) => {
            if (prev >= totalAudioDurationSec) {
              clearInterval(interval);
              setIsPlaying(false);
              return 0;
            }
            return prev + 0.2;
          });
        }, 200);
      }
    }
  };

  const handleResetPlayback = () => {
    setIsPlaying(false);
    setCurrentTimeSec(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // Download Subtitles directly (.srt or .vtt)
  const downloadSubtitles = (format: 'srt' | 'vtt') => {
    const content = format === 'srt'
      ? generateSrt(subtitleCues, settings.showVerseNumbers)
      : generateVtt(subtitleCues, settings.showVerseNumbers);

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Napisy_${project.bookName}_Rozdzial_${project.chapterNumber}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="step-7-video-studio" className="space-y-6">
      {/* Studio Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-stone-900 via-stone-900 to-amber-950/40 border border-amber-900/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-serif">
                Christian Culture • polskieradio.cc
              </span>
              <span className="text-stone-600">•</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-bold text-amber-300">
                Krok 7 z 8
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-100 font-serif">
              BIBLIA AUDIO VIDEO STUDIO
            </h1>
            <p className="text-xs text-stone-400">
              Generowanie filmu MP4 na YouTube (16:9, 4K i Shorts 9:16) z obrazem, zsynchronizowanymi napisami i oprawą stacji.
            </p>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsThumbnailModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition-colors"
          >
            <ImageIcon className="w-4 h-4 text-amber-400" />
            <span>Miniatura YouTube (1280×720)</span>
          </button>

          <button
            type="button"
            onClick={() => onRenderVideo(settings)}
            disabled={isRenderingVideo}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all ${
              isRenderingVideo
                ? 'bg-amber-600/50 text-stone-900 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 hover:scale-102'
            }`}
          >
            {isRenderingVideo ? (
              <>
                <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                <span>Renderowanie MP4 ({renderingProgress.percent}%)...</span>
              </>
            ) : (
              <>
                <Video className="w-4 h-4" />
                <span>RENDERUJ FILM MP4</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Rendering Progress Modal / Banner if active */}
      {isRenderingVideo && (
        <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-500/50 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 animate-bounce" />
              <span>Etap renderowania FFmpeg: {renderingProgress.stage}</span>
            </span>
            <span className="font-mono text-amber-400 font-bold">{renderingProgress.percent}%</span>
          </div>
          <div className="w-full h-2.5 bg-stone-950 rounded-full overflow-hidden border border-amber-900/50">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300 rounded-full"
              style={{ width: `${renderingProgress.percent}%` }}
            />
          </div>
          <p className="text-[11px] text-stone-400">
            Serwer kompresuje ścieżkę dźwiękową AAC, nakłada plansze wideo i wypala zsynchronizowane napisy.
          </p>
        </div>
      )}

      {/* Main Studio Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Video Player Stage (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 bg-stone-900/90 border border-stone-800 rounded-2xl shadow-xl space-y-3">
            {/* Format & Mode Selector Ribbon */}
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-stone-800">
              {/* Video Modes */}
              <div className="flex items-center gap-1.5 p-1 bg-stone-950 rounded-xl border border-stone-800">
                {[
                  { id: 'radio' as VideoMode, label: 'Tryb Radiowy', icon: Radio },
                  { id: 'cinematic' as VideoMode, label: 'Filmowe Słuchowisko', icon: Film },
                  { id: 'minimalist' as VideoMode, label: 'Minimalistyczny', icon: Layers },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleModeChange(m.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        settings.mode === m.id
                          ? 'bg-amber-500 text-stone-950 font-bold shadow'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Aspect Ratio switcher */}
              <div className="flex items-center gap-1 p-1 bg-stone-950 rounded-xl border border-stone-800">
                <button
                  type="button"
                  onClick={() => handleResolutionChange('1080p')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    settings.resolution === '1080p'
                      ? 'bg-stone-800 text-amber-300 font-bold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                  title="YouTube 16:9 Full HD (1920x1080)"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>16:9 (1080p)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleResolutionChange('shorts')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    settings.resolution === 'shorts'
                      ? 'bg-stone-800 text-amber-300 font-bold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                  title="YouTube Shorts 9:16 (1080x1920)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Shorts (9:16)</span>
                </button>
              </div>
            </div>

            {/* Interactive Canvas Stage */}
            <div
              className={`relative mx-auto rounded-xl overflow-hidden border border-stone-700 bg-black flex items-center justify-center shadow-2xl ${
                settings.resolution === 'shorts' ? 'aspect-[9/16] max-h-[540px]' : 'aspect-video'
              }`}
            >
              <canvas ref={canvasRef} className="w-full h-full object-contain" />

              {/* Live Badge */}
              <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/80 text-[10px] font-mono text-amber-400 border border-stone-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Podgląd na żywo • {settings.resolution === 'shorts' ? 'Shorts 9:16' : '16:9 Full HD'}</span>
              </div>
            </div>

            {/* Player Controls Bar */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center justify-center font-bold shadow transition-transform hover:scale-105"
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleResetPlayback}
                  className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
                  title="Od początku"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <div className="font-mono text-xs text-stone-300 ml-2">
                  <span className="text-amber-400 font-bold">{formatYouTubeTime(currentTimeSec)}</span>
                  <span className="text-stone-500"> / {formatYouTubeTime(totalAudioDurationSec)}</span>
                </div>
              </div>

              {/* Visualizer selector dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-stone-400 hidden sm:inline">Wizualizacja:</span>
                <select
                  value={settings.visualizer}
                  onChange={(e) => handleVisualizerChange(e.target.value as VideoVisualizerType)}
                  className="bg-stone-950 border border-stone-700 rounded-xl px-2.5 py-1.5 text-xs text-stone-200 focus:border-amber-500"
                >
                  <option value="none">Brak wizualizacji (Czysty kadr)</option>
                  <option value="pulsing_glow">Pulsujące światło</option>
                  <option value="frequency_bars">Wskaźnik aktywności głosu</option>
                  <option value="waveform" disabled>Oscyloskop (Fala dźwiękowa — w przygotowaniu)</option>
                </select>
              </div>
            </div>

            {/* Rendered MP4 Preview Player if already rendered */}
            {project.renderedVideoMp4Url && (
              <div className="mt-4 p-4 rounded-xl bg-emerald-950/40 border border-emerald-700/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Plik MP4 został wyrenderowany przez FFmpeg i jest gotowy!</span>
                  </div>
                  <a
                    href={project.renderedVideoMp4Url}
                    download={`${project.bookName}_Rozdzial_${project.chapterNumber}_Christian_Culture.mp4`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-stone-950 text-xs font-bold shadow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Pobierz gotowy MP4</span>
                  </a>
                </div>
                <video
                  controls
                  className="w-full rounded-lg max-h-56 bg-black"
                  src={project.renderedVideoMp4Url}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right: Studio Settings & Asset Configuration Tabs (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-1 p-1 bg-stone-900 rounded-xl border border-stone-800 text-xs overflow-x-auto">
            {[
              { id: 'preview' as const, label: 'Grafika i tło', icon: ImageIcon },
              { id: 'scenes' as const, label: 'Sceny', icon: Layers },
              { id: 'subtitles' as const, label: 'Napisy', icon: Subtitles },
              { id: 'characters' as const, label: 'Postacie', icon: UserCheck },
              { id: 'branding' as const, label: 'Intro/Outro', icon: Radio },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-amber-500 text-stone-950 font-bold shadow'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: Graphics & Background */}
          {activeTab === 'preview' && (
            <div className="p-5 bg-stone-900/90 border border-stone-800 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-stone-100 font-serif flex items-center justify-between">
                <span>Grafika tła i licencja</span>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                  Zweryfikowane prawa
                </span>
              </h3>

              {/* Upload Custom File */}
              <div>
                <label className="text-xs font-semibold text-stone-300 mb-1.5 block">
                  Prześlij własny obraz tła (JPG, PNG):
                </label>
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-stone-700 hover:border-amber-500/60 rounded-xl cursor-pointer bg-stone-950/60 transition-colors">
                  <Upload className="w-6 h-6 text-amber-400 mb-1" />
                  <span className="text-xs font-semibold text-stone-300">
                    Kliknij lub przeciągnij plik tutaj
                  </span>
                  <span className="text-[10px] text-stone-500">
                    Rekomendowana rozdzielczość: 1920×1080 px
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCustomBackgroundUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Curated Public Domain Biblical Artworks */}
              <div>
                <label className="text-xs font-semibold text-stone-300 mb-2 block">
                  Wybierz z biblioteki malarstwa sakralnego (Domena Publiczna):
                </label>
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {CURATED_BIBLICAL_ARTWORKS.map((art) => {
                    const isSelected = scenes[activeSceneIndex]?.imageUrl === art.imageUrl;
                    return (
                      <div
                        key={art.id}
                        onClick={() => {
                          const updatedScenes = [...scenes];
                          if (updatedScenes.length > 0) {
                            updatedScenes[activeSceneIndex] = {
                              ...updatedScenes[activeSceneIndex],
                              imageUrl: art.imageUrl,
                              imageSource: art.source,
                              author: art.author,
                              license: art.license,
                              rightsConfirmed: true,
                            };
                            updateSettings({ scenes: updatedScenes });
                          }
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                          isSelected
                            ? 'bg-amber-950/40 border-amber-500 text-amber-200'
                            : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                        }`}
                      >
                        <img
                          src={art.imageUrl}
                          alt={art.title}
                          className="w-16 h-10 rounded object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-stone-200 truncate">{art.title}</span>
                            <span className="text-[10px] text-amber-400 font-mono">{art.year}</span>
                          </div>
                          <p className="text-[10px] text-stone-400 truncate">{art.author} • {art.source}</p>
                          <div className="flex items-center gap-1 text-[9px] text-emerald-400 mt-0.5">
                            <ShieldCheck className="w-3 h-3" />
                            <span>{art.license}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Multi-Scene Management */}
          {activeTab === 'scenes' && (
            <div className="p-5 bg-stone-900/90 border border-stone-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-100 font-serif">
                  Ujęcia i sceny ({scenes.length})
                </h3>
                <span className="text-xs text-stone-400">
                  Dla trybu Filmowego Słuchowiska
                </span>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {scenes.map((sc, idx) => (
                  <div
                    key={sc.id}
                    onClick={() => setActiveSceneIndex(idx)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      activeSceneIndex === idx
                        ? 'bg-amber-950/40 border-amber-500'
                        : 'bg-stone-950 border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-amber-300">
                        Scena {idx + 1}: {sc.title}
                      </span>
                      <span className="text-[10px] font-mono text-stone-400">
                        {formatYouTubeTime(sc.startSec)} (+{sc.durationSec}s)
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <img
                        src={sc.imageUrl}
                        alt={sc.title}
                        className="w-14 h-9 rounded object-cover border border-stone-800"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-stone-300 italic truncate">
                          "{sc.imagePrompt}"
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-stone-400">
                          <span>Ruch: <strong>{sc.motionType}</strong></span>
                          <span>•</span>
                          <span className="text-emerald-400">{sc.license}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Subtitles Configuration & Export */}
          {activeTab === 'subtitles' && (
            <div className="p-5 bg-stone-900/90 border border-stone-800 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-stone-100 font-serif">
                Konfiguracja napisów i synchronizacja
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-stone-950 rounded-xl border border-stone-800">
                  <div className="text-xs">
                    <span className="font-bold text-stone-200 block">Wypalaj napisy w filmie (Hardsub)</span>
                    <span className="text-[10px] text-stone-400">Napisy zsynchronizowane werset po wersecie</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showSubtitles}
                    onChange={(e) => updateSettings({ showSubtitles: e.target.checked })}
                    className="accent-amber-500 w-4 h-4 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-stone-950 rounded-xl border border-stone-800">
                  <div className="text-xs">
                    <span className="font-bold text-stone-200 block">Pokazuj aktualny numer wersetu</span>
                    <span className="text-[10px] text-stone-400">Np. [Łk 15,11] przed kwestią</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showVerseNumbers}
                    onChange={(e) => updateSettings({ showVerseNumbers: e.target.checked })}
                    className="accent-amber-500 w-4 h-4 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-stone-400 block mb-1">Położenie tekstu:</label>
                    <select
                      value={settings.subtitlesPosition}
                      onChange={(e) => updateSettings({ subtitlesPosition: e.target.value as any })}
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2 text-xs text-stone-200"
                    >
                      <option value="bottom">Dół ekranu (standard)</option>
                      <option value="middle">Środek (dla Shorts)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-stone-400 block mb-1">Rozmiar czcionki:</label>
                    <select
                      value={settings.subtitlesFontSize}
                      onChange={(e) => updateSettings({ subtitlesFontSize: e.target.value as any })}
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2 text-xs text-stone-200"
                    >
                      <option value="normal">Standardowy (czytelny)</option>
                      <option value="large">Powiększony (na smartfon)</option>
                    </select>
                  </div>
                </div>

                {/* Subtitle files direct download */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-stone-400">Pliki napisów do YouTube:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => downloadSubtitles('srt')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-400" />
                      <span>Pobierz .SRT</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadSubtitles('vtt')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-400" />
                      <span>Pobierz .VTT</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Character Visual Consistency */}
          {activeTab === 'characters' && (
            <div className="p-5 bg-stone-900/90 border border-stone-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-100 font-serif">
                  Biblioteka spójności postaci
                </h3>
                <span className="text-[10px] text-amber-400 font-mono">
                  I wiek Judea
                </span>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {characterProfiles.map((char) => (
                  <div
                    key={char.id}
                    className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-amber-300">{char.name}</span>
                      <span className="text-[10px] text-stone-400">{char.approxAge}</span>
                    </div>
                    <p className="text-[11px] text-stone-300">
                      <strong>Ubiór:</strong> {char.attire}
                    </p>
                    <p className="text-[11px] text-stone-400 italic">
                      <strong>Cechy:</strong> {char.distinguishingFeatures}
                    </p>
                    <div className="p-2 bg-stone-900 rounded-lg text-[10px] text-stone-400 border border-stone-800">
                      <strong className="text-amber-400">Zasada wierności:</strong> {char.forbiddenChanges}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: Intro & Outro / End Screen */}
          {activeTab === 'branding' && (
            <div className="p-5 bg-stone-900/90 border border-stone-800 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-stone-100 font-serif">
                Oprawa stacji: Intro i Plansza Końcowa
              </h3>

              {/* Intro Configuration */}
              <div className="p-3.5 bg-stone-950 rounded-xl border border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-stone-200">
                    Intro filmowe (5-8 sek.)
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.includeIntro}
                    onChange={(e) => updateSettings({ includeIntro: e.target.checked })}
                    className="accent-amber-500 w-4 h-4 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-stone-400">
                  Logo Christian Culture, tytuł audycji, hasło „Słowo, które możesz usłyszeć”.
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-stone-500 block">Czas trwania (s):</label>
                    <input
                      type="number"
                      min={3}
                      max={12}
                      value={settings.introDurationSec}
                      onChange={(e) => updateSettings({ introDurationSec: parseInt(e.target.value, 10) || 6 })}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-stone-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-500 block">Hasło stacji:</label>
                    <input
                      type="text"
                      value={settings.introSlogan}
                      onChange={(e) => updateSettings({ introSlogan: e.target.value })}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-stone-200"
                    />
                  </div>
                </div>
              </div>

              {/* Outro Configuration */}
              <div className="p-3.5 bg-stone-950 rounded-xl border border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-stone-200">
                    Plansza końcowa (10-20 sek.)
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.includeOutro}
                    onChange={(e) => updateSettings({ includeOutro: e.target.checked })}
                    className="accent-amber-500 w-4 h-4 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-stone-400">
                  Podziękowanie za słuchanie Słowa Bożego, zaproszenie do całodobowego Radia Christian Culture (polskieradio.cc) oraz bezpieczne strefy dla kart YouTube.
                </p>
                <div className="text-xs space-y-2">
                  <div>
                    <label className="text-[10px] text-stone-500 block">Tekst podziękowania:</label>
                    <input
                      type="text"
                      value={settings.outroTitle}
                      onChange={(e) => updateSettings({ outroTitle: e.target.value })}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-stone-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-500 block">Adres stacji:</label>
                    <input
                      type="text"
                      value={settings.outroStationUrl}
                      onChange={(e) => updateSettings({ outroStationUrl: e.target.value })}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-stone-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation to Step 8 */}
      <div className="pt-4 flex items-center justify-between border-t border-stone-800">
        <div className="text-xs text-stone-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Wszystkie materiały wideo zachowują pełną wierność natchnionemu tekstowi Biblii.</span>
        </div>

        <button
          type="button"
          onClick={handleProceed}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-sm font-bold shadow-lg transition-all hover:scale-102"
        >
          <span>Przejdź do publikacji i pobierania (Krok 8)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 1280x720 Thumbnail Generator Modal */}
      <ThumbnailGeneratorModal
        isOpen={isThumbnailModalOpen}
        onClose={() => setIsThumbnailModalOpen(false)}
        project={project}
      />
    </div>
  );
};
