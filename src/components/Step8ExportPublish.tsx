import React, { useState } from 'react';
import {
  Download,
  FileAudio,
  FileText,
  Copy,
  Check,
  Globe,
  Radio,
  Share2,
  Film,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Video,
  Archive,
  UploadCloud,
  Layers,
  Image as ImageIcon,
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Music,
  Mic,
  Sliders,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { ProductionProject, DramaLine } from '../types';
import {
  calculateSubtitleCues,
  downloadPublicationZipBundle,
  generateSrt,
  generateVtt,
  generateYouTubeDescription,
  generateYouTubeTimestamps,
} from '../lib/videoUtils';
import { ThumbnailGeneratorModal } from './ThumbnailGeneratorModal';
import { useStudioPlayback } from '../lib/useStudioPlayback';
import { formatDuration } from '../lib/customAudioUtils';

interface Step8ExportPublishProps {
  project: ProductionProject;
  onRenderMaster?: () => void;
  isRenderingMaster?: boolean;
}

export const Step8ExportPublish: React.FC<Step8ExportPublishProps> = ({
  project,
  onRenderMaster,
  isRenderingMaster,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [zipProgressText, setZipProgressText] = useState<string>('');
  const [isThumbnailModalOpen, setIsThumbnailModalOpen] = useState<boolean>(false);

  // Unified Central Playback Engine
  const playback = useStudioPlayback(project);

  const script = project.script;
  const videoSettings = project.videoSettings;
  const lines = script?.lines || [];

  const ytTitle = `${project.bookName} — Rozdział ${project.chapterNumber} | Biblia Audio Christian Culture`;
  const ytDescription = generateYouTubeDescription(project);
  const ytTimestamps = generateYouTubeTimestamps(
    videoSettings?.scenes || [],
    videoSettings?.includeIntro,
    videoSettings?.introDurationSec
  );

  const copyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Download complete ZIP
  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      await downloadPublicationZipBundle(project, undefined, (msg) => setZipProgressText(msg));
    } catch (e) {
      console.error('ZIP creation error:', e);
    } finally {
      setIsZipping(false);
      setZipProgressText('');
    }
  };

  const customVoiceLinesCount = lines.filter((l) => Boolean(l.customAudioFile)).length;
  const hasCustomMusic = Boolean(project.mixerSettings?.customMusicTrack);
  const hasCustomIntro = Boolean(project.mixerSettings?.customIntroTrack);
  const hasCustomOutro = Boolean(project.mixerSettings?.customOutroTrack);

  return (
    <div id="step-8-export-publish" className="max-w-6xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-900 to-amber-950/40 border border-amber-800/40 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[11px] font-bold uppercase tracking-wider border border-amber-500/30">
              Krok 8 z 8
            </span>
            <span className="text-stone-500">•</span>
            <span className="text-xs text-amber-400 font-serif font-bold">Christian Culture</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-100">
            Eksport i Publikacja: Wideo MP4, Audio i YouTube
          </h1>
          <p className="text-xs text-stone-300">
            Pobierz gotowy film MP4 na YouTube, master audio WAV/MP3, miniaturę, napisy oraz kompletny pakiet ZIP.
          </p>
        </div>

        {/* Big ZIP Download Button */}
        <button
          type="button"
          onClick={handleDownloadZip}
          disabled={isZipping}
          className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs shadow-lg transition-all hover:scale-102 shrink-0"
        >
          <Archive className="w-4 h-4" />
          <span>{isZipping ? zipProgressText || 'Pobieranie ZIP...' : 'POBIERZ CAŁY PAKIET ZIP'}</span>
        </button>
      </div>

      {/* FULLY FUNCTIONAL STUDIO AUDIO MONITOR & STEM PLAYER */}
      <div className="bg-[#10141d] border border-[#273244] rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#212938] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-stone-950 font-black shadow-md shrink-0">
              <Radio size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white font-serif">
                  Pulpit Odsłuchu Emisyjnego i Monitoringu Ścieżek
                </h2>
                <span
                  className={`w-2 h-2 rounded-full ${
                    playback.isPlaying && !playback.isPaused
                      ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-pulse'
                      : 'bg-emerald-400 shadow-[0_0_6px_#10b981]'
                  }`}
                />
              </div>
              <p className="text-[11px] text-stone-400 font-mono">
                Referencyjny odsłuch mastera audio i odizolowanych stemów (WAV 48 kHz / -16 LUFS)
              </p>
            </div>
          </div>

          {/* Stem Selector Tabs */}
          <div className="flex items-center gap-1 bg-[#0b0e14] p-1 rounded-xl border border-[#212b3a] self-stretch sm:self-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => playback.setStemMode('master')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                playback.stemMode === 'master'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              PEŁNY MASTER
            </button>
            <button
              type="button"
              onClick={() => playback.setStemMode('voice')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                playback.stemMode === 'voice'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              ŚCIEŻKA GŁOSÓW
            </button>
            <button
              type="button"
              onClick={() => playback.setStemMode('music')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                playback.stemMode === 'music'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              PODKŁAD MUZYCZNY
            </button>
          </div>
        </div>

        {/* Master Transport & Controls Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#0a0d13] p-3.5 rounded-xl border border-[#1e2533]">
          {/* Playback Transport Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={playback.prev}
              className="p-2 rounded-lg bg-[#181f2c] hover:bg-[#253043] text-stone-300 hover:text-white border border-[#2d3a4e] transition-colors"
              title="Poprzednia kwestia"
            >
              <SkipBack size={16} />
            </button>

            <button
              type="button"
              onClick={playback.togglePlay}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono font-black text-xs transition-all shadow-lg ${
                playback.isPlaying && !playback.isPaused
                  ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-[0_0_16px_rgba(245,158,11,0.5)]'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_14px_rgba(16,185,129,0.4)]'
              }`}
            >
              {playback.isPlaying && !playback.isPaused ? (
                <>
                  <Pause size={16} className="fill-current" />
                  <span>PAUZA AUDYCJI</span>
                </>
              ) : (
                <>
                  <Play size={16} className="fill-current" />
                  <span>ODTWÓRZ MASTER</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={playback.stop}
              className="p-2 rounded-lg bg-[#181f2c] hover:bg-[#253043] text-stone-400 hover:text-red-400 border border-[#2d3a4e] transition-colors"
              title="Zatrzymaj i przewiń na początek"
            >
              <Square size={15} className="fill-current" />
            </button>

            <button
              type="button"
              onClick={playback.next}
              className="p-2 rounded-lg bg-[#181f2c] hover:bg-[#253043] text-stone-300 hover:text-white border border-[#2d3a4e] transition-colors"
              title="Następna kwestia"
            >
              <SkipForward size={16} />
            </button>

            {/* Time Display */}
            <div className="ml-2 px-3 py-1.5 rounded-lg bg-[#121620] border border-[#232b3a] font-mono text-xs">
              <span className="text-white font-bold">{formatDuration(playback.currentTimeSec)}</span>
              <span className="text-stone-500"> / </span>
              <span className="text-stone-400">{formatDuration(playback.totalDurationSec)}</span>
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              type="button"
              onClick={() => playback.toggleMute('voice')}
              className="text-stone-400 hover:text-white"
              title={playback.mutedTracks.voice ? 'Wyłącz wyciszenie' : 'Wycisz'}
            >
              {playback.masterVolume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} className="text-amber-400" />}
            </button>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={playback.masterVolume}
                onChange={(e) => playback.setMasterVolume(parseFloat(e.target.value))}
                className="w-24 sm:w-32 accent-amber-500 cursor-pointer"
                title="Głośność odsłuchu"
              />
              <span className="text-xs font-mono text-stone-300 w-9 text-right font-bold">
                {Math.round(playback.masterVolume * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Currently Playing Card & Verse Status */}
        <div className="bg-[#0b0e14] border border-[#1e2533] p-3.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[11px] font-mono mb-1">
              <span className="text-amber-400 font-bold uppercase">
                {playback.currentLineRef} • {playback.currentSpeaker}
              </span>
              {lines[playback.currentLineIndex]?.customAudioFile ? (
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                  <Mic size={10} /> WŁASNE NAGRANIE
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold border border-purple-500/30 flex items-center gap-1">
                  <Sparkles size={10} /> GEMINI NEURAL TTS
                </span>
              )}
            </div>
            <p className="text-xs text-stone-200 line-clamp-2 italic">
              "{playback.currentText || 'Brak tekstu kwestii'}"
            </p>
          </div>

          {/* Render Master Trigger if not yet baked */}
          {onRenderMaster && (
            <div className="shrink-0 flex items-center gap-2">
              <button
                type="button"
                disabled={isRenderingMaster}
                onClick={onRenderMaster}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold shadow transition-all hover:scale-102"
              >
                {isRenderingMaster ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>MONTAŻ MASTERA W TOKU...</span>
                  </>
                ) : (
                  <>
                    <Sliders size={14} />
                    <span>ZMONTUJ MASTER RADIOWY (-16 LUFS)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Audio Tracks Synchronization Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-[#0e1219] border border-[#1d2533] space-y-1">
            <span className="text-[10px] text-stone-400 uppercase block">Kwestie lektorskie</span>
            <div className="text-stone-200 font-bold flex items-center gap-1.5">
              <Mic size={13} className="text-amber-400" />
              <span>{lines.length} kwestii</span>
            </div>
            <span className="text-[10px] text-emerald-400 block">
              {customVoiceLinesCount > 0 ? `${customVoiceLinesCount} z własnym nagraniem` : '100% zsynchronizowane'}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#0e1219] border border-[#1d2533] space-y-1">
            <span className="text-[10px] text-stone-400 uppercase block">Podkład muzyczny</span>
            <div className="text-stone-200 font-bold flex items-center gap-1.5 truncate">
              <Music size={13} className="text-amber-400 shrink-0" />
              <span className="truncate">
                {project.mixerSettings?.customMusicTrack?.fileName || 'Harfa i chóry świątynne'}
              </span>
            </div>
            <span className="text-[10px] text-stone-400 block">
              {hasCustomMusic ? 'Własny plik audio' : 'Generowane tło ambient'}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#0e1219] border border-[#1d2533] space-y-1">
            <span className="text-[10px] text-stone-400 uppercase block">Czołówka / Intro</span>
            <div className="text-stone-200 font-bold flex items-center gap-1.5 truncate">
              <Radio size={13} className="text-amber-400 shrink-0" />
              <span className="truncate">
                {project.mixerSettings?.customIntroTrack?.fileName || 'Oficjalna Christian Culture'}
              </span>
            </div>
            <span className="text-[10px] text-stone-400 block">
              {hasCustomIntro ? 'Własne intro' : 'Sygnatura stacji'}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#0e1219] border border-[#1d2533] space-y-1">
            <span className="text-[10px] text-stone-400 uppercase block">Tyłówka / Outro</span>
            <div className="text-stone-200 font-bold flex items-center gap-1.5 truncate">
              <Radio size={13} className="text-amber-400 shrink-0" />
              <span className="truncate">
                {project.mixerSettings?.customOutroTrack?.fileName || 'Oficjalna Christian Culture'}
              </span>
            </div>
            <span className="text-[10px] text-stone-400 block">
              {hasCustomOutro ? 'Własne outro' : 'Sygnatura stacji'}
            </span>
          </div>
        </div>

        {/* Quick Line Jump Grid */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono text-stone-400 uppercase font-bold block">
            Przejdź bezpośrednio do kwestii:
          </span>
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-[#090b0e] rounded-lg border border-[#1b212c]">
            {lines.map((line, idx) => {
              const isCurrent = playback.currentLineIndex === idx;
              const hasCustom = Boolean(line.customAudioFile);
              return (
                <button
                  key={line.id}
                  type="button"
                  onClick={() => playback.seekToLine(idx)}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                    isCurrent
                      ? 'bg-amber-500 text-stone-950 shadow-[0_0_8px_rgba(245,158,11,0.5)] scale-105 z-10'
                      : hasCustom
                        ? 'bg-[#18281e] text-emerald-400 border border-emerald-800/40 hover:bg-[#203628]'
                        : 'bg-[#141820] text-stone-300 border border-[#252f3f] hover:bg-[#1d2432]'
                  }`}
                  title={`${line.characterName}: ${line.text}`}
                >
                  #{idx + 1} {hasCustom ? '★' : ''}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Download Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-sm font-bold text-stone-200 font-serif flex items-center gap-2">
            <Download className="w-4 h-4 text-amber-400" />
            <span>Centrum Pobierania Plików</span>
          </h2>

          {/* 1. Video MP4 YouTube Card */}
          <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-700/50 text-amber-400">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-100">Film MP4 na YouTube (16:9 Full HD)</h3>
                  <p className="text-[11px] text-stone-400">
                    Format H.264 / AAC 48kHz z wypalonymi napisami, planszą i oprawą stacji
                  </p>
                </div>
              </div>

              {project.renderedVideoMp4Url ? (
                <a
                  href={project.renderedVideoMp4Url}
                  download={`${project.bookName}_Rozdzial_${project.chapterNumber}_Christian_Culture.mp4`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Pobierz MP4</span>
                </a>
              ) : (
                <span className="text-[11px] text-stone-500 italic bg-stone-950 px-2.5 py-1 rounded-lg border border-stone-800">
                  Wymaga wyrenderowania w Kroku 7
                </span>
              )}
            </div>
          </div>

          {/* 2. Master Audio WAV Card */}
          <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-950/60 border border-blue-700/50 text-blue-400">
                  <FileAudio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-100">Master Audio WAV (48 kHz / -16 LUFS)</h3>
                  <p className="text-[11px] text-stone-400">
                    Referencyjna jakość emisyjna dla rozgłośni radiowych i archiwum
                  </p>
                </div>
              </div>

              {project.masterAudioWavUrl ? (
                <a
                  href={project.masterAudioWavUrl}
                  download={`${project.title.replace(/\s+/g, '_')}_Master_48kHz.wav`}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Pobierz WAV</span>
                </a>
              ) : (
                <button
                  type="button"
                  disabled={isRenderingMaster}
                  onClick={onRenderMaster}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-400 text-xs font-mono font-bold border border-amber-500/30"
                >
                  <span>{isRenderingMaster ? 'Montowanie...' : 'Zmontuj WAV teraz'}</span>
                </button>
              )}
            </div>
          </div>

          {/* 3. Podcast MP3 Card */}
          <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-700/50 text-purple-400">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-100">Audycja Podcastowa MP3 (192 kbps)</h3>
                  <p className="text-[11px] text-stone-400">
                    Z metadanymi ID3v2, okładką i opisem dla Apple Podcasts & Spotify
                  </p>
                </div>
              </div>

              {project.masterAudioMp3Url ? (
                <a
                  href={project.masterAudioMp3Url}
                  download={`${project.title.replace(/\s+/g, '_')}_Podcast_192k.mp3`}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Pobierz MP3</span>
                </a>
              ) : (
                <button
                  type="button"
                  disabled={isRenderingMaster}
                  onClick={onRenderMaster}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-purple-300 text-xs font-mono font-bold border border-purple-500/30"
                >
                  <span>{isRenderingMaster ? 'Montowanie...' : 'Zmontuj MP3 teraz'}</span>
                </button>
              )}
            </div>
          </div>

          {/* 4. Miniatura YouTube & Subtitles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-200">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>Miniatura YouTube (1280×720)</span>
              </div>
              <p className="text-[11px] text-stone-400">
                Pobierz miniatury PNG lub JPG w wysokim kontraście.
              </p>
              <button
                type="button"
                onClick={() => setIsThumbnailModalOpen(true)}
                className="w-full mt-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-semibold border border-stone-700"
              >
                <span>Otwórz generator miniatury</span>
              </button>
            </div>

            <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-200">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Napisy SRT & VTT</span>
              </div>
              <p className="text-[11px] text-stone-400">
                Pliki zsynchronizowane z czasem każdej kwestii.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const cues = calculateSubtitleCues(project);
                    const srt = generateSrt(cues, videoSettings?.showVerseNumbers);
                    const blob = new Blob([srt], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Napisy_${project.bookName}_Rozdzial_${project.chapterNumber}.srt`;
                    a.click();
                  }}
                  className="flex-1 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700"
                >
                  .SRT
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const cues = calculateSubtitleCues(project);
                    const vtt = generateVtt(cues, videoSettings?.showVerseNumbers);
                    const blob = new Blob([vtt], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Napisy_${project.bookName}_Rozdzial_${project.chapterNumber}.vtt`;
                    a.click();
                  }}
                  className="flex-1 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700"
                >
                  .VTT
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: YouTube Metadata & Info (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-sm font-bold text-stone-200 font-serif flex items-center gap-2">
            <Share2 className="w-4 h-4 text-amber-400" />
            <span>Gotowe Metadane dla YouTube Studio</span>
          </h2>

          <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-300">Tytuł filmu na YouTube</label>
                <button
                  type="button"
                  onClick={() => copyToClipboard(ytTitle, 'title')}
                  className="text-stone-400 hover:text-amber-400 text-xs flex items-center gap-1"
                >
                  {copiedField === 'title' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedField === 'title' ? 'Skopiowano!' : 'Kopiuj'}</span>
                </button>
              </div>
              <div className="p-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 font-mono select-all">
                {ytTitle}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-300">Opis filmu (ze znacznikami czasowymi)</label>
                <button
                  type="button"
                  onClick={() => copyToClipboard(ytDescription, 'desc')}
                  className="text-stone-400 hover:text-amber-400 text-xs flex items-center gap-1"
                >
                  {copiedField === 'desc' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedField === 'desc' ? 'Skopiowano!' : 'Kopiuj opis'}</span>
                </button>
              </div>
              <textarea
                readOnly
                rows={7}
                value={ytDescription}
                className="w-full p-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-300 font-mono resize-none focus:outline-none"
              />
            </div>

            {/* Timestamps */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-300">Znaczniki czasowe (Rozdziały YouTube)</label>
                <button
                  type="button"
                  onClick={() => copyToClipboard(ytTimestamps, 'timestamps')}
                  className="text-stone-400 hover:text-amber-400 text-xs flex items-center gap-1"
                >
                  {copiedField === 'timestamps' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedField === 'timestamps' ? 'Skopiowano!' : 'Kopiuj'}</span>
                </button>
              </div>
              <div className="p-2 bg-stone-950 border border-stone-800 rounded-xl text-xs font-mono text-stone-400 whitespace-pre-line max-h-28 overflow-y-auto">
                {ytTimestamps}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Thumbnail Generator Modal */}
      {isThumbnailModalOpen && (
        <ThumbnailGeneratorModal
          isOpen={isThumbnailModalOpen}
          project={project}
          onClose={() => setIsThumbnailModalOpen(false)}
        />
      )}
    </div>
  );
};
