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
} from 'lucide-react';
import { ProductionProject } from '../types';
import {
  calculateSubtitleCues,
  downloadPublicationZipBundle,
  generateSrt,
  generateVtt,
  generateYouTubeDescription,
  generateYouTubeTimestamps,
} from '../lib/videoUtils';
import { ThumbnailGeneratorModal } from './ThumbnailGeneratorModal';

interface Step8ExportPublishProps {
  project: ProductionProject;
}

export const Step8ExportPublish: React.FC<Step8ExportPublishProps> = ({ project }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [zipProgressText, setZipProgressText] = useState<string>('');
  const [isThumbnailModalOpen, setIsThumbnailModalOpen] = useState<boolean>(false);


  const script = project.script;
  const videoSettings = project.videoSettings;

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
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-100 text-xs font-semibold border border-stone-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Pobierz WAV</span>
                </a>
              ) : (
                <span className="text-[11px] text-stone-500 italic">Do pobrania po montażu</span>
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
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-100 text-xs font-semibold border border-stone-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Pobierz MP3</span>
                </a>
              ) : (
                <span className="text-[11px] text-stone-500 italic">Do pobrania po montażu</span>
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

        {/* Right Col: YouTube Publishing Staging Area (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-sm font-bold text-stone-200 font-serif flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-amber-400" />
            <span>Panel Publikacji YouTube</span>
          </h2>

          <div className="p-5 bg-stone-900 border border-stone-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between p-3 bg-stone-950 rounded-xl border border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center font-bold text-white text-xs">
                  CC
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-200">Christian Culture TV</div>
                  <div className="text-[10px] text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>Publikacja API nie jest jeszcze połączona</span>
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-stone-400">polskieradio.cc</span>
            </div>

            {/* Title check */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-stone-300">Tytuł filmu:</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(ytTitle, 'title')}
                  className="text-amber-400 hover:text-amber-300 text-[11px] flex items-center gap-1"
                >
                  {copiedField === 'title' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedField === 'title' ? 'Skopiowano' : 'Kopiuj'}</span>
                </button>
              </div>
              <div className="p-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 font-mono break-words">
                {ytTitle}
              </div>
            </div>

            {/* Timestamps */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-stone-300">Znaczniki czasu (Timestamps):</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(ytTimestamps, 'timestamps')}
                  className="text-amber-400 hover:text-amber-300 text-[11px] flex items-center gap-1"
                >
                  {copiedField === 'timestamps' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedField === 'timestamps' ? 'Skopiowano' : 'Kopiuj'}</span>
                </button>
              </div>
              <pre className="p-2.5 bg-stone-950 border border-stone-800 rounded-xl text-[11px] text-stone-300 font-mono whitespace-pre-wrap max-h-24 overflow-y-auto">
                {ytTimestamps}
              </pre>
            </div>

            <div className="p-3 rounded-xl border border-amber-500/25 bg-amber-500/5 text-[11px] leading-relaxed text-stone-300">
              Bezpośrednia publikacja pozostaje wyłączona do czasu wdrożenia prawdziwego OAuth i YouTube Data API. Pobierz gotowy pakiet, sprawdź materiał i opublikuj go ręcznie w YouTube Studio.
            </div>

            <button
              type="button"
              disabled
              className="w-full py-3 rounded-xl bg-stone-800 text-stone-500 font-bold text-xs border border-stone-700 flex items-center justify-center gap-2 cursor-not-allowed"
              title="Funkcja zostanie aktywowana dopiero po bezpiecznym połączeniu YouTube API"
            >
              <UploadCloud className="w-4 h-4" />
              <span>PUBLIKACJA API — PLANOWANE</span>
            </button>
          </div>
        </div>
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
