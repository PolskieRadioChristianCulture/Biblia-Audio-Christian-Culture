import fs from 'fs';
import path from 'path';
// @ts-ignore
import { PDFParse } from 'pdf-parse';
import { UBG_BOOKS, UBG_BIBLE_INFO, findUbgBook, UbgBookMeta } from '../data/ubgBooks';

export interface ExtractedChapterResult {
  book: string;
  bookAbbr: string;
  testament: 'ST' | 'NT';
  chapter: number;
  totalChapters: number;
  text: string;
  charCount: number;
  estimatedMinutes: number;
  source: string;
  pdfPageApprox: number;
}

let cachedFullText: string | null = null;
const chapterCache = new Map<string, ExtractedChapterResult>();

export function getUbgPdfPath(): string {
  const localPublic = path.resolve('public/bible/Pismo_Swiete_UBG.pdf');
  if (fs.existsSync(localPublic)) return localPublic;
  const downloads = 'C:/Users/czark/Downloads/Pismo_Swiete_UBG.pdf';
  if (fs.existsSync(downloads)) return downloads;
  return localPublic;
}

export async function loadUbgFullText(): Promise<string> {
  if (cachedFullText) return cachedFullText;

  const pdfPath = getUbgPdfPath();
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`Plik Pisma Świętego UBG nie został znaleziony pod ścieżką: ${pdfPath}`);
  }

  const buf = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data: buf });
  const parsed = await parser.getText();
  cachedFullText = parsed.text;
  return cachedFullText;
}

function isFootnoteLine(line: string): boolean {
  if (/^ROZDZIAŁ(\s|$)/i.test(line)) return false;
  // Footnote starts: e.g. "a Rdz 7,14." or "q Wj 20,11." or "1 BG mężatką"
  if (/^[a-z]\s+([1-3]?[A-ZĄĆĘŁŃÓŚŹŻ0-9]|w\.)/i.test(line)) return true;
  if (/^\d+\s+BG\s+/i.test(line)) return true;
  if (/^w\.\s*\d+/i.test(line)) return true;
  if (/^[a-z]\s*$/i.test(line)) return true;

  // Continuation of references: e.g. "31,17;", "Hbr 4,4.", "1J 5,7.", "2Kor 4,4.", "Kol 1,15-16."
  if (/^[\d,;.\s\-]+$/.test(line)) return true;
  if (/^[1-3]?[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]*\s+[\d,;.\s\-]+$/i.test(line)) return true;
  if (/^[1-3]?[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]*\s+\d+.*[;\.]$/i.test(line) && line.length < 40) return true;

  return false;
}

export function cleanPageScripture(pageText: string): string {
  const lines = pageText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  let passedFootnotes = false;
  const scriptureLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip page indicator like "-- 8 of 1360 --"
    if (/^--\s*\d+\s*of\s*\d+\s*--$/i.test(line)) continue;
    // Skip standalone page number
    if (/^\d+$/.test(line)) continue;
    // Skip header line with book and chapter e.g. "Księga Rodzaju 1. 2."
    if (/^(Księga|Ew\.|Ewangelia|List|Dzieje|Objawienie|I\s|II\s|III\s).*?\d+/i.test(line)) continue;

    if (!passedFootnotes) {
      if (isFootnoteLine(line)) {
        continue;
      } else {
        passedFootnotes = true;
      }
    }

    scriptureLines.push(line);
  }

  let text = scriptureLines.join('\n');

  // Fix hyphenated line breaks: "nie- \n czystych" -> "nieczystych"
  text = text.replace(/([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ])-[\r\n\s]+([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ])/g, '$1$2');

  // Clean uppercase word footnote markers e.g. "OBJAWIENIEa" -> "OBJAWIENIE"
  text = text.replace(/([A-ZĄĆĘŁŃÓŚŹŻ]{3,})[a-z]\b/g, '$1');

  // Clean single footnote letters after distinct Polish endings:
  // e.g. "ziemięc." -> "ziemię.", "stworzyłb" -> "stworzył", "światłośćh." -> "światłość."
  text = text.replace(/([ąćęśźż]|ył)[b-hj-np-tv-z]([\s,\.;:?!]|$)/gi, '$1$2');
  // letters after 'y': e.g. "pierwszyj." -> "pierwszy."
  text = text.replace(/([a-zA-Ząćęłńóśźż]{3,}y)[j-np-tv-z]([\s,\.;:?!]|$)/gi, '$1$2');
  // 's' after 'ą': e.g. "jednąs" -> "jedną"
  text = text.replace(/([a-zA-Ząćęłńóśźż]{2,}ą)[s]([\s,\.;:?!]|$)/gi, '$1$2');
  // 'o' after 'icy'/'scy': e.g. "grzesznicyo" -> "grzesznicy"
  text = text.replace(/([a-zA-Ząćęłńóśźż]{3,}[ic]y)[o]([\s,\.;:?!]|$)/gi, '$1$2');
  // 'q, v, x' anywhere at word end
  text = text.replace(/([a-zA-Ząćęłńóśźż]{2,})[qvx]([\s,\.;:?!]|$)/gi, '$1$2');

  return text;
}

export async function extractUbgChapter(
  bookQuery: string,
  chapterNum: number = 1
): Promise<ExtractedChapterResult> {
  const book = findUbgBook(bookQuery);
  if (!book) {
    throw new Error(`Nie odnaleziono księgi biblijnej: "${bookQuery}". Dostępne jest 66 ksiąg Pisma Świętego UBG.`);
  }

  const validChapter = Math.max(1, Math.min(chapterNum, book.chaptersCount));
  const cacheKey = `${book.id}_${validChapter}`;
  if (chapterCache.has(cacheKey)) {
    return chapterCache.get(cacheKey)!;
  }

  const fullText = await loadUbgFullText();

  // Extract all pages belonging to this book
  // Pages in PDF start at book.startPage - 1
  const startPdfPage = Math.max(1, book.startPage - 1);
  const endPdfPage = book.endPage + 1;

  const startMarker = `-- ${startPdfPage} of 1360 --`;
  let startIndex = fullText.indexOf(startMarker);
  if (startIndex === -1) {
    startIndex = fullText.indexOf(`-- ${book.startPage} of 1360 --`);
  }
  if (startIndex === -1) startIndex = 0;

  let endIndex = fullText.indexOf(`-- ${endPdfPage} of 1360 --`, startIndex);
  if (endIndex === -1) {
    endIndex = fullText.indexOf(`-- ${endPdfPage + 1} of 1360 --`, startIndex);
  }
  if (endIndex === -1) {
    endIndex = fullText.length;
  }

  const bookRawText = fullText.slice(startIndex, endIndex);

  // Split into pages and clean each page
  const pageParts = bookRawText.split(/--\s*\d+\s*of\s*1360\s*--/gi);
  const cleanedPages: string[] = [];

  for (const pagePart of pageParts) {
    if (!pagePart.trim()) continue;
    const cleaned = cleanPageScripture(pagePart);
    if (cleaned.trim()) {
      cleanedPages.push(cleaned);
    }
  }

  const fullBookScripture = cleanedPages.join('\n\n');

  let chapterScripture = '';

  if (book.chaptersCount === 1) {
    chapterScripture = fullBookScripture;
  } else {
    const chRegex = new RegExp(`(?:^|\\s)ROZDZIAŁ\\s+${validChapter}(?:\\s|$)`, 'i');
    const match = chRegex.exec(fullBookScripture);

    if (match) {
      const chStart = match.index;
      const nextChRegex = new RegExp(`(?:^|\\s)ROZDZIAŁ\\s+${validChapter + 1}(?:\\s|$)`, 'i');
      const nextMatch = nextChRegex.exec(fullBookScripture.slice(chStart + 20));

      if (nextMatch) {
        chapterScripture = fullBookScripture.slice(chStart, chStart + 20 + nextMatch.index);
      } else {
        chapterScripture = fullBookScripture.slice(chStart);
      }
    } else {
      chapterScripture = fullBookScripture;
    }
  }

  // Format into verses/paragraphs nicely
  const lines = chapterScripture.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const paragraphs: string[] = [];
  let currentP = '';

  for (const line of lines) {
    if (/^(ROZDZIAŁ\s+\d+|\d+\s+|[A-ZĄĆĘŁŃÓŚŹŻ\s]{4,})/i.test(line)) {
      if (currentP) {
        paragraphs.push(currentP.trim());
      }
      currentP = line;
    } else {
      if (currentP) {
        currentP += ' ' + line;
      } else {
        currentP = line;
      }
    }
  }
  if (currentP) {
    paragraphs.push(currentP.trim());
  }

  const finalText = paragraphs.join('\n\n');
  const charCount = finalText.length;
  const estimatedMinutes = Math.max(1, Math.round(charCount / 850));

  const result: ExtractedChapterResult = {
    book: book.name,
    bookAbbr: book.abbr,
    testament: book.testament,
    chapter: validChapter,
    totalChapters: book.chaptersCount,
    text: finalText,
    charCount,
    estimatedMinutes,
    source: `${UBG_BIBLE_INFO.edition} (Fundacja Wrota Nadziei ${UBG_BIBLE_INFO.year})`,
    pdfPageApprox: book.startPage + Math.round(((validChapter - 1) / book.chaptersCount) * (book.endPage - book.startPage)),
  };

  chapterCache.set(cacheKey, result);
  return result;
}
