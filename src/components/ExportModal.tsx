import React, { useState } from 'react';
import {
  Download,
  FileAudio,
  Radio,
  Podcast,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { AudioMixerSettings, RadioDramaScript } from '../types';
import { renderDramaToWav } from '../lib/audioEngine';

interface ExportModalProps {
  script: RadioDramaScript;
  settings: AudioMixerSettings;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  script,
  settings,
  isOpen,
  onClose,
}) => {
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStatus, setRenderStatus] = useState('');
  const [wavBlobUrl, setWavBlobUrl] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartRender = async () => {
    setIsRendering(true);
    setRenderProgress(0);
    setRenderStatus('Rozpoczynanie sesji mikserskiej...');

    try {
      const blob = await renderDramaToWav(script, settings, (percent, status) => {
        setRenderProgress(percent);
        setRenderStatus(status);
      });

      const url = URL.createObjectURL(blob);
      setWavBlobUrl(url);

      // Auto-trigger download
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = script.title.replace(/[^a-zA-Z0-9_\u00C0-\u017F]/g, '_');
      a.download = `ChristianCulture_BibliaAudio_${safeTitle}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Błąd renderowania:', err);
      alert('Wystąpił błąd podczas generowania pliku audio.');
    } finally {
      setIsRendering(false);
    }
  };

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => {
      setCopiedSection(null);
    }, 2000);
  };

  const podcastNotesText = `${script.podcastMetadata.episodeTitle}
Cykl: Biblia Audio Christian Culture (www.polskieradio.cc)

${script.podcastMetadata.description}

ROZDZIAŁ BIBLIJNY:
${script.bibleReference}

OBSADA SŁUCHOWISKA:
${script.characters.map((c) => `• ${c.name} - ${c.voiceProfile}`).join('\n')}

OPRAWA RADIOWA:
Stacja: Polskie Radio Christian Culture
Portal: https://www.polskieradio.cc
Tło muzyczne: ${script.atmosphereMood}

Tagi: #${(script.podcastMetadata.tags || script.podcastMetadata.keywords || []).join(' #')}
`;

  const radioCueSheetText = `METRYCZKA EMISYJNA AUDYCJI RADIOWEJ
===========================================
STACJA: Christian Culture - Polskie Radio (www.polskieradio.cc)
PASMO: Biblia Audio Christian Culture
TYTUŁ ODCINKA: ${script.title}
SIGLUM BIBLIJNE: ${script.bibleReference}
CZAS TRWANIA: ok. ${script.estimatedDurationMinutes}:00 min
FORMAT EMISYJNY: Broadcast WAV (44.1 kHz, 16-bit PCM Stereo)
DŻINGIEL STACJI: ${settings.includeStationJingle ? 'TAK (wstęp i zakończenie)' : 'NIE'}
OPRAWA MUZYCZNA: ${settings.backgroundMusic}

ZAPOWIEDŹ LEKTORSKA (INTRO):
"${script.stationIntro}"

ZAKOŃCZENIE AUDYCJI (OUTRO):
"${script.stationOutro}"

SUGEROWANA PORA EMISJI: ${script.podcastMetadata.suggestedBroadcastSlot || 'Poranek niedzielny / Wieczór biblijny'}
===========================================
`;

  return (
    <div
      id="modal-export-broadcast"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="w-full max-w-3xl bg-stone-900 border border-amber-900/60 rounded-2xl shadow-2xl overflow-hidden text-stone-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-stone-950/70 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-900/60 border border-amber-700/60 flex items-center justify-center text-amber-300">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-amber-300">
                Eksport Emisyjny • Radio & Podcast
              </h2>
              <p className="text-xs text-stone-400">
                Christian Culture • Polskie Radio www.polskieradio.cc
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-200 text-sm px-2.5 py-1 rounded-md bg-stone-800 hover:bg-stone-700 transition-colors"
          >
            Zamknij
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Main Download Card */}
          <div className="bg-stone-950/80 border border-amber-800/40 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/50">
                  Standard Emisyjny Radia & Podcastu
                </span>
                <h3 className="font-serif font-bold text-lg text-stone-100 mt-2">
                  Pobierz Master Audio (Plik WAV)
                </h3>
                <p className="text-xs text-stone-400 mt-1 max-w-md">
                  Generuje zmasterowany plik audio o bezstratnej jakości (44.1 kHz, 16-bit PCM), gotowy do wgrania do systemów emisyjnych radia oraz platform podcastowych (Spotify, Apple Podcasts, Spreaker).
                </p>
              </div>

              <div className="shrink-0">
                <button
                  id="btn-render-wav-file"
                  onClick={handleStartRender}
                  disabled={isRendering}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-stone-950 font-bold text-sm shadow-xl flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isRendering ? (
                    <>
                      <span className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                      <span>Renderowanie ({renderProgress}%)...</span>
                    </>
                  ) : (
                    <>
                      <FileAudio className="w-4 h-4 text-stone-950" />
                      <span>Zapisz Plik WAV (Master)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Rendering Progress Bar */}
            {isRendering && (
              <div className="mt-4 pt-3 border-t border-stone-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-amber-300">
                  <span>{renderStatus}</span>
                  <span className="font-mono font-semibold">{renderProgress}%</span>
                </div>
                <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-300"
                    style={{ width: `${renderProgress}%` }}
                  />
                </div>
              </div>
            )}

            {wavBlobUrl && !isRendering && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center justify-between">
                <span>Plik WAV został wyrenderowany i pobrany na Twoje urządzenie.</span>
                <a
                  href={wavBlobUrl}
                  download={`ChristianCulture_${script.title}.wav`}
                  className="underline font-semibold hover:text-emerald-200 ml-2"
                >
                  Pobierz ponownie
                </a>
              </div>
            )}
          </div>

          {/* Quick Publishing Guides */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Podcast Metadata Box */}
            <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Podcast className="w-4 h-4 text-amber-400" />
                    <h4 className="font-bold text-xs text-stone-200 uppercase tracking-wide">
                      Opis i Tagi do Podcastu
                    </h4>
                  </div>
                  <button
                    onClick={() => copyToClipboard(podcastNotesText, 'podcast')}
                    className="flex items-center gap-1 text-[11px] text-amber-300 hover:text-amber-200 bg-stone-850 px-2 py-1 rounded border border-stone-700"
                  >
                    {copiedSection === 'podcast' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Skopiowano!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Kopiuj</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="text-[11px] font-mono text-stone-400 bg-stone-900 p-3 rounded-lg overflow-x-auto max-h-40 whitespace-pre-wrap leading-relaxed">
                  {podcastNotesText}
                </pre>
              </div>
            </div>

            {/* Radio Cue Sheet Box */}
            <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-amber-400" />
                    <h4 className="font-bold text-xs text-stone-200 uppercase tracking-wide">
                      Metryczka do Emisji w Radiu
                    </h4>
                  </div>
                  <button
                    onClick={() => copyToClipboard(radioCueSheetText, 'radio')}
                    className="flex items-center gap-1 text-[11px] text-amber-300 hover:text-amber-200 bg-stone-850 px-2 py-1 rounded border border-stone-700"
                  >
                    {copiedSection === 'radio' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Skopiowano!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Kopiuj</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="text-[11px] font-mono text-stone-400 bg-stone-900 p-3 rounded-lg overflow-x-auto max-h-40 whitespace-pre-wrap leading-relaxed">
                  {radioCueSheetText}
                </pre>
              </div>
            </div>
          </div>

          {/* Radio Mission Notice */}
          <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Misja Christian Culture • Polskie Radio Online:</span>
              <a
                href="https://www.polskieradio.cc"
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 font-semibold underline inline-flex items-center gap-1 hover:text-amber-300"
              >
                www.polskieradio.cc
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <span className="text-[11px] font-mono text-stone-500">Biblia Audio CC</span>
          </div>
        </div>
      </div>
    </div>
  );
};
