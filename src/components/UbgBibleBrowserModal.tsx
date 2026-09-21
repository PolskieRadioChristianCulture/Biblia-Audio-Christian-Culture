import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Download,
  ExternalLink,
  Search,
  Check,
  Loader2,
  Sparkles,
  X,
  FileText,
  ShieldCheck,
  BookMarked,
} from 'lucide-react';
import { UBG_BOOKS, UBG_BIBLE_INFO, UbgBookMeta } from '../data/ubgBooks';

interface UbgBibleBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChapter: (book: UbgBookMeta, chapter: number, text: string) => void;
  initialBook?: string;
  initialChapter?: string;
}

export const UbgBibleBrowserModal: React.FC<UbgBibleBrowserModalProps> = ({
  isOpen,
  onClose,
  onSelectChapter,
  initialBook,
  initialChapter,
}) => {
  const [testamentFilter, setTestamentFilter] = useState<'ALL' | 'NT' | 'ST'>('NT');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<UbgBookMeta>(() => {
    if (initialBook) {
      const q = initialBook.toLowerCase();
      const match = UBG_BOOKS.find((b) => b.name.toLowerCase().includes(q) || b.abbr.toLowerCase() === q);
      if (match) return match;
    }
    // Default: Ewangelia Łukasza
    return UBG_BOOKS.find((b) => b.id === 'lk') || UBG_BOOKS[0];
  });
  const [selectedChapter, setSelectedChapter] = useState<number>(() => {
    const num = parseInt(initialChapter || '1', 10);
    return isNaN(num) ? 1 : num;
  });

  const [isLoadingText, setIsLoadingText] = useState(false);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const filteredBooks = useMemo(() => {
    return UBG_BOOKS.filter((b) => {
      if (testamentFilter !== 'ALL' && b.testament !== testamentFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        b.name.toLowerCase().includes(q) ||
        b.abbr.toLowerCase().includes(q) ||
        b.aliases.some((a) => a.toLowerCase().includes(q))
      );
    });
  }, [testamentFilter, searchQuery]);

  if (!isOpen) return null;

  const handleFetchPreview = async (book: UbgBookMeta, chapter: number) => {
    setIsLoadingText(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/bible/ubg/chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book: book.name, chapter }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Nie udało się pobrać tekstu rozdziału');
      setPreviewText(data.text);
    } catch (e: any) {
      setLoadError(e.message || 'Błąd wczytywania rozdziału');
    } finally {
      setIsLoadingText(false);
    }
  };

  const handleBookChange = (book: UbgBookMeta) => {
    setSelectedBook(book);
    setSelectedChapter(1);
    setPreviewText(null);
    handleFetchPreview(book, 1);
  };

  const handleChapterClick = (ch: number) => {
    setSelectedChapter(ch);
    handleFetchPreview(selectedBook, ch);
  };

  const handleApply = () => {
    if (previewText) {
      onSelectChapter(selectedBook, selectedChapter, previewText);
      onClose();
    }
  };

  return (
    <div
      id="modal-ubg-browser"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="w-full max-w-5xl bg-stone-900 border border-amber-800/60 rounded-2xl shadow-2xl overflow-hidden text-stone-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-600/60 flex items-center justify-center text-amber-300 shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-serif font-bold text-amber-300">
                  {UBG_BIBLE_INFO.title}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-900/60 text-amber-200 border border-amber-700/60 uppercase">
                  Wydanie 2024
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Wszystkie 66 ksiąg • {UBG_BIBLE_INFO.publisher} • 1360 stron PDF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={UBG_BIBLE_INFO.pdfPath}
              download="Pismo_Swiete_UBG.pdf"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 transition-colors"
              title="Pobierz pełny plik PDF na dysk (12.9 MB)"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Pobierz PDF</span>
            </a>
            <a
              href={UBG_BIBLE_INFO.pdfPath}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 transition-colors"
              title="Otwórz plik PDF w nowej karcie"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>Otwórz PDF</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Browser Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-stone-800">
          {/* Left Column: Books List (4 cols) */}
          <div className="md:col-span-4 flex flex-col min-h-0 bg-stone-950/50 p-4 space-y-3">
            {/* Search & Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Szukaj księgi (np. Jan, Rdz, Rz)..."
                  className="w-full bg-stone-900 border border-stone-700 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-1 bg-stone-900 p-1 rounded-xl border border-stone-800 text-[11px] font-medium">
                <button
                  onClick={() => setTestamentFilter('ALL')}
                  className={`flex-1 py-1 rounded-lg transition-colors ${
                    testamentFilter === 'ALL'
                      ? 'bg-amber-600 text-stone-950 font-bold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Wszystkie (66)
                </button>
                <button
                  onClick={() => setTestamentFilter('NT')}
                  className={`flex-1 py-1 rounded-lg transition-colors ${
                    testamentFilter === 'NT'
                      ? 'bg-amber-600 text-stone-950 font-bold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Nowy Test. (27)
                </button>
                <button
                  onClick={() => setTestamentFilter('ST')}
                  className={`flex-1 py-1 rounded-lg transition-colors ${
                    testamentFilter === 'ST'
                      ? 'bg-amber-600 text-stone-950 font-bold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Stary Test. (39)
                </button>
              </div>
            </div>

            {/* Books Scrollable List */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {filteredBooks.map((b) => {
                const isSelected = selectedBook.id === b.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => handleBookChange(b)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-700/80 to-amber-900/60 text-white font-bold border border-amber-500/80 shadow-sm'
                        : 'bg-stone-900/40 hover:bg-stone-800/80 text-stone-300 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className={`w-7 text-center font-mono text-[11px] font-black rounded px-1 py-0.5 ${
                          isSelected ? 'bg-amber-950 text-amber-300' : 'bg-stone-800 text-stone-400'
                        }`}
                      >
                        {b.abbr}
                      </span>
                      <span className="truncate">{b.name}</span>
                    </div>
                    <span className="text-[10px] text-stone-400 shrink-0 font-mono">
                      {b.chaptersCount} rdz.
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Chapters Grid + Text Preview (8 cols) */}
          <div className="md:col-span-8 flex flex-col min-h-0 p-5 space-y-4 bg-stone-900/60">
            {/* Selected Book Header & Chapter Grid */}
            <div className="space-y-3 pb-3 border-b border-stone-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-serif font-bold text-amber-300 flex items-center gap-2">
                    <BookMarked className="w-4 h-4 text-amber-400" />
                    {selectedBook.name} ({selectedBook.abbr})
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    {selectedBook.testament === 'NT' ? 'Nowy Testament' : 'Stary Testament'} • Strony PDF: {selectedBook.startPage}–{selectedBook.endPage} • Łącznie rozdziałów: {selectedBook.chaptersCount}
                  </p>
                </div>

                <button
                  onClick={() => handleFetchPreview(selectedBook, selectedChapter)}
                  disabled={isLoadingText}
                  className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {isLoadingText ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Odśwież tekst</span>
                </button>
              </div>

              {/* Chapter Buttons Grid */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-stone-400 font-semibold block">
                  Wybierz rozdział:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {Array.from({ length: selectedBook.chaptersCount }, (_, i) => i + 1).map((ch) => {
                    const isChSelected = selectedChapter === ch;
                    return (
                      <button
                        key={ch}
                        onClick={() => handleChapterClick(ch)}
                        className={`w-9 h-8 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center ${
                          isChSelected
                            ? 'bg-amber-500 text-stone-950 shadow-md scale-105 ring-2 ring-amber-400'
                            : 'bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700/60'
                        }`}
                      >
                        {ch}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Text Preview Area */}
            <div className="flex-1 min-h-0 flex flex-col space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span className="font-semibold text-stone-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  Podgląd rozdziału: {selectedBook.name} {selectedChapter}
                </span>
                {previewText && (
                  <span className="font-mono text-amber-300 text-[11px]">
                    {previewText.length} znaków • ~{Math.max(1, Math.round(previewText.length / 850))} min lektury
                  </span>
                )}
              </div>

              <div className="flex-1 min-h-[220px] bg-stone-950 border border-stone-800 rounded-xl p-4 overflow-y-auto font-sans text-xs leading-relaxed text-stone-200">
                {isLoadingText ? (
                  <div className="h-full flex flex-col items-center justify-center gap-2 text-stone-400 py-10">
                    <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                    <span>Wczytywanie i formatowanie wersetów z pliku Pismo_Swiete_UBG.pdf...</span>
                  </div>
                ) : loadError ? (
                  <div className="text-red-300 bg-red-950/40 p-4 rounded-lg border border-red-800/60">
                    {loadError}
                  </div>
                ) : previewText ? (
                  <div className="whitespace-pre-line select-text">
                    {previewText}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-2 text-stone-500 py-10">
                    <BookOpen className="w-8 h-8 text-stone-600" />
                    <span>Wybierz rozdział powyżej, aby zobaczyć oryginalny tekst UBG.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer / Confirm Action */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-stone-800">
              <div className="flex items-center gap-2 text-[11px] text-stone-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Tekst wierny z Pisma Świętego UBG (Fundacja Wrota Nadziei). Sola Scriptura.</span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-colors w-full sm:w-auto"
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={!previewText || isLoadingText}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-bold shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Załaduj ten rozdział do audycji</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
