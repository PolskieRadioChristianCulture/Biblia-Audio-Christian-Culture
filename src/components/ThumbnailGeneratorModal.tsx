import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  Image as ImageIcon,
  Sparkles,
  Layers,
  Palette,
  Check,
  Radio,
} from 'lucide-react';
import { CURATED_BIBLICAL_ARTWORKS } from '../data/videoPresets';
import { ProductionProject } from '../types';

interface ThumbnailGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProductionProject;
}

export const ThumbnailGeneratorModal: React.FC<ThumbnailGeneratorModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [selectedTemplate, setSelectedTemplate] = useState<number>(0); // 0: Cinematic Gold, 1: Bold Center, 2: Modern Radio
  const [customTitle, setCustomTitle] = useState(
    project.title || `${project.bookName} ${project.chapterNumber}`
  );
  const [selectedArtworkUrl, setSelectedArtworkUrl] = useState<string>(
    project.videoSettings?.scenes?.[0]?.imageUrl || CURATED_BIBLICAL_ARTWORKS[0].imageUrl
  );
  const [showSubtitle, setShowSubtitle] = useState(true);

  // Redraw canvas whenever props/state change
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1280;
    const height = 720;
    canvas.width = width;
    canvas.height = height;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = selectedArtworkUrl;

    const drawThumbnail = () => {
      // 1. Background image
      try {
        if (img.complete && img.naturalWidth > 0) {
          // Draw cover
          const imgRatio = img.naturalWidth / img.naturalHeight;
          const canvasRatio = width / height;
          let drawW = width;
          let drawH = height;
          let offX = 0;
          let offY = 0;

          if (imgRatio > canvasRatio) {
            drawW = height * imgRatio;
            offX = (width - drawW) / 2;
          } else {
            drawH = width / imgRatio;
            offY = (height - drawH) / 2;
          }
          ctx.drawImage(img, offX, offY, drawW, drawH);
        } else {
          // Fallback deep gradient
          const grad = ctx.createLinearGradient(0, 0, width, height);
          grad.addColorStop(0, '#1c1917');
          grad.addColorStop(1, '#0c0a09');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height);
        }
      } catch (e) {
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Dark contrast overlays and vignettes
      if (selectedTemplate === 0) {
        // Cinematic Gold layout: Left dark gradient for ultra legible typography
        const leftGrad = ctx.createLinearGradient(0, 0, width * 0.75, 0);
        leftGrad.addColorStop(0, 'rgba(12, 10, 9, 0.96)');
        leftGrad.addColorStop(0.5, 'rgba(12, 10, 9, 0.85)');
        leftGrad.addColorStop(1, 'rgba(12, 10, 9, 0.0)');
        ctx.fillStyle = leftGrad;
        ctx.fillRect(0, 0, width, height);

        // Bottom vignette
        const botGrad = ctx.createLinearGradient(0, height * 0.6, 0, height);
        botGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        botGrad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
        ctx.fillStyle = botGrad;
        ctx.fillRect(0, 0, width, height);

        // Accent gold line
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(70, 115, 6, 260);

        // 3. Station pill badge
        ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(100, 110, 310, 46, 8);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 22px Cinzel, serif, "Plus Jakarta Sans"';
        ctx.fillStyle = '#fbbf24';
        ctx.fillText('BIBLIA AUDIO', 130, 142);

        // Book & Chapter Headline
        ctx.font = 'bold 64px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(project.bookName || 'Ewangelia', 100, 240);

        // Chapter Big Highlight
        ctx.font = 'bold 44px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#f59e0b';
        ctx.fillText(`ROZDZIAŁ ${project.chapterNumber || '1'}`, 100, 310);

        // Subtitle / Title
        if (showSubtitle && customTitle) {
          ctx.font = '500 28px serif';
          ctx.fillStyle = '#d6d3d1';
          const truncated = customTitle.length > 42 ? customTitle.substring(0, 40) + '...' : customTitle;
          ctx.fillText(`„${truncated}”`, 100, 375);
        }

        // Bottom station brand bar
        ctx.fillStyle = 'rgba(12, 10, 9, 0.9)';
        ctx.fillRect(0, height - 70, width, 70);
        ctx.fillStyle = '#d97706';
        ctx.fillRect(0, height - 70, width, 3);

        ctx.font = 'bold 24px Cinzel, serif';
        ctx.fillStyle = '#fef3c7';
        ctx.fillText('CHRISTIAN CULTURE  •  polskieradio.cc', 80, height - 26);
      } else if (selectedTemplate === 1) {
        // Bold Center Layout (YouTube mobile punchy)
        const darkOverlay = ctx.createRadialGradient(
          width / 2,
          height / 2,
          100,
          width / 2,
          height / 2,
          width * 0.75
        );
        darkOverlay.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
        darkOverlay.addColorStop(1, 'rgba(0, 0, 0, 0.94)');
        ctx.fillStyle = darkOverlay;
        ctx.fillRect(0, 0, width, height);

        // Center Box
        ctx.fillStyle = 'rgba(28, 25, 23, 0.85)';
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(140, 110, width - 280, height - 220, 20);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';

        // Badge
        ctx.font = 'bold 26px Cinzel, serif';
        ctx.fillStyle = '#f59e0b';
        ctx.fillText('BIBLIA AUDIO CHRISTIAN CULTURE', width / 2, 190);

        // Book
        ctx.font = 'bold 74px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(project.bookName || 'Ewangelia wg św. Łukasza', width / 2, 300);

        // Chapter
        ctx.font = '800 68px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#fbbf24';
        ctx.fillText(`ROZDZIAŁ ${project.chapterNumber}`, width / 2, 400);

        // Custom Title
        if (showSubtitle && customTitle) {
          ctx.font = 'italic 32px serif';
          ctx.fillStyle = '#e7e5e4';
          ctx.fillText(`„${customTitle}”`, width / 2, 480);
        }

        // Web Address
        ctx.font = 'bold 22px monospace';
        ctx.fillStyle = '#a8a29e';
        ctx.fillText('SŁUCHAJ NA: www.polskieradio.cc', width / 2, 560);
        ctx.textAlign = 'left';
      } else {
        // Modern Radio Layout
        const bottomGrad = ctx.createLinearGradient(0, 0, 0, height);
        bottomGrad.addColorStop(0, 'rgba(12, 10, 9, 0.3)');
        bottomGrad.addColorStop(0.4, 'rgba(12, 10, 9, 0.6)');
        bottomGrad.addColorStop(1, 'rgba(12, 10, 9, 0.98)');
        ctx.fillStyle = bottomGrad;
        ctx.fillRect(0, 0, width, height);

        // Top right emblem
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.roundRect(width - 340, 40, 300, 60, 12);
        ctx.fill();
        ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#0c0a09';
        ctx.fillText('🎧 SŁUCHOWISKO', width - 310, 78);

        // Big lower left block
        ctx.font = 'bold 30px Cinzel, serif';
        ctx.fillStyle = '#fbbf24';
        ctx.fillText('BIBLIA AUDIO  |  POLSKIE RADIO CC', 80, height - 240);

        ctx.font = 'bold 72px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${project.bookName} ${project.chapterNumber}`, 80, height - 150);

        if (showSubtitle) {
          ctx.font = '400 32px serif';
          ctx.fillStyle = '#d6d3d1';
          ctx.fillText(`Pełny rozdział • Profesjonalny lektor • polskieradio.cc`, 80, height - 90);
        }
      }
    };

    img.onload = drawThumbnail;
    img.onerror = drawThumbnail;
    drawThumbnail();
  }, [isOpen, selectedTemplate, customTitle, selectedArtworkUrl, showSubtitle, project]);

  if (!isOpen) return null;

  const downloadImage = (format: 'png' | 'jpeg') => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL(`image/${format}`, 0.95);
    const a = document.createElement('a');
    a.href = dataUrl;
    const cleanTitle = (project.bookName + '_' + project.chapterNumber).replace(/\s+/g, '_');
    a.download = `Miniatura_${cleanTitle}_Christian_Culture_1280x720.${format === 'jpeg' ? 'jpg' : 'png'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-700/50 text-amber-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100 font-serif">
                Generator Miniatury YouTube (1280 × 720)
              </h2>
              <p className="text-xs text-stone-400">
                Wysoki kontrast, czytelność na smartfonach, zgodność ze standardem YouTube
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
          {/* Left Canvas Preview (2 cols) */}
          <div className="lg:col-span-2 space-y-3 flex flex-col justify-center">
            <div className="relative aspect-video rounded-xl overflow-hidden border border-stone-700 shadow-2xl bg-black">
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain"
                style={{ imageRendering: 'auto' }}
              />
              <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/80 text-[10px] font-mono text-amber-300 border border-stone-800">
                Podgląd 16:9 (1280 × 720 px)
              </div>
            </div>

            {/* Quick download actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <span className="text-xs text-stone-400">
                Format standardowy YouTube 16:9 • Gotowe do wgrania w YouTube Studio
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadImage('png')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold shadow transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Pobierz PNG</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadImage('jpeg')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Pobierz JPG</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Customization Controls (1 col) */}
          <div className="space-y-4 border-l border-stone-800/80 pl-0 lg:pl-6">
            {/* 3 Layout Templates */}
            <div>
              <label className="text-xs font-bold text-stone-300 mb-2 block">
                1. Wybierz kompozycję:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 0, label: 'Klasyczna Złota', desc: 'Lewy pas' },
                  { id: 1, label: 'Centralna Mocna', desc: 'Duży napis' },
                  { id: 2, label: 'Radiowa Nowoczesna', desc: 'Pasek dolny' },
                ].map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setSelectedTemplate(tmpl.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedTemplate === tmpl.id
                        ? 'bg-amber-950/60 border-amber-500 text-amber-200 ring-1 ring-amber-500'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <div className="font-bold text-xs">{tmpl.label}</div>
                    <div className="text-[10px] text-stone-500">{tmpl.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom title input */}
            <div>
              <label className="text-xs font-bold text-stone-300 mb-1 block">
                2. Tytuł na miniaturze:
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:border-amber-500 focus:outline-none"
                placeholder="Wpisz krótki tytuł..."
              />
            </div>

            {/* Subtitle toggle */}
            <div className="flex items-center gap-2">
              <input
                id="thumb-show-sub"
                type="checkbox"
                checked={showSubtitle}
                onChange={(e) => setShowSubtitle(e.target.checked)}
                className="accent-amber-500 rounded cursor-pointer"
              />
              <label htmlFor="thumb-show-sub" className="text-xs text-stone-300 cursor-pointer">
                Pokazuj podtytuł / przypowieść
              </label>
            </div>

            {/* Background Image Selector */}
            <div>
              <label className="text-xs font-bold text-stone-300 mb-1.5 block">
                3. Motyw wizualny w tle:
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {CURATED_BIBLICAL_ARTWORKS.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => setSelectedArtworkUrl(art.imageUrl)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border cursor-pointer transition-all ${
                      selectedArtworkUrl === art.imageUrl
                        ? 'bg-amber-950/40 border-amber-500 text-amber-200'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <img
                      src={art.imageUrl}
                      alt={art.title}
                      className="w-12 h-8 rounded object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-xs font-semibold truncate text-stone-200">{art.title}</p>
                      <p className="text-[10px] text-stone-500 truncate">{art.author}</p>
                    </div>
                    {selectedArtworkUrl === art.imageUrl && (
                      <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Brand notice */}
            <div className="p-3 bg-stone-950/80 rounded-xl border border-stone-800 text-[11px] text-stone-400 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                <Radio className="w-3.5 h-3.5" />
                <span>Christian Culture • polskieradio.cc</span>
              </div>
              <p>Wszystkie miniatury spełniają zasady YouTube dotyczące praw autorskich i braku wprowadzania w błąd.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
