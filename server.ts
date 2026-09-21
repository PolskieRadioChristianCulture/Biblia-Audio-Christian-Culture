import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import https from 'https';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { initializeApp as initAdminApp, cert as adminCert } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { createServer as createViteServer } from 'vite';
import { extractUbgChapter, getUbgPdfPath } from './src/lib/ubgService';
import { UBG_BOOKS, UBG_BIBLE_INFO } from './src/data/ubgBooks';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3005;

// Persistent storage setup
const STORAGE_DIR = process.env.STORAGE_DIR || path.resolve(process.cwd(), 'storage');
const TTS_CACHE_DIR = path.join(STORAGE_DIR, 'tts_cache');
const PRODUCTIONS_DIR = path.join(STORAGE_DIR, 'productions');
const VIDEOS_DIR = path.join(STORAGE_DIR, 'videos');

[STORAGE_DIR, TTS_CACHE_DIR, PRODUCTIONS_DIR, VIDEOS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Firebase Admin Initialization for LUMINA authentication
const serviceAccountPath =
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  path.resolve(process.cwd(), 'lumina-cc-service-account.json');

let firebaseAdminReady = false;
if (fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    initAdminApp({
      credential: adminCert(serviceAccount),
      projectId: 'lumina-cc',
    });
    firebaseAdminReady = true;
    console.log('[Firebase Admin] Zalogowano z kontem usługi lumina-cc.');
  } catch (err: any) {
    console.warn('[Firebase Admin] Błąd inicjalizacji z pliku JSON:', err.message);
  }
}

interface StudioUser {
  uid: string;
  email?: string;
  name?: string;
  isAdmin: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: StudioUser | null;
    }
  }
}

function verifyTokenViaGoogle(token: string): Promise<any> {
  return new Promise((resolve) => {
    https
      .get(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`, (res) => {
        if (res.statusCode !== 200) return resolve(null);
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(null);
          }
        });
      })
      .on('error', () => resolve(null));
  });
}

async function verifyAuthMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    req.user = null;
    return next();
  }

  const adminEmail = (process.env.STUDIO_ADMIN_EMAIL || 'nazirczarkes@gmail.com').toLowerCase();

  try {
    if (firebaseAdminReady) {
      const decoded = await getAdminAuth().verifyIdToken(token);
      const email = (decoded.email || '').toLowerCase();
      req.user = {
        uid: decoded.uid,
        email,
        name: decoded.name,
        isAdmin: email === adminEmail,
      };
      return next();
    }

    const tokenInfo = await verifyTokenViaGoogle(token);
    if (tokenInfo && tokenInfo.email) {
      const email = String(tokenInfo.email).toLowerCase();
      req.user = {
        uid: tokenInfo.sub || tokenInfo.user_id,
        email,
        name: tokenInfo.name,
        isAdmin: email === adminEmail,
      };
      return next();
    }

    req.user = null;
    next();
  } catch (err: any) {
    req.user = null;
    next();
  }
}

app.use(express.json({ limit: '50mb' }));
app.use(verifyAuthMiddleware);
app.use('/bible', express.static(path.resolve('public/bible')));

const apiWindows = new Map<string, { startedAt: number; requests: number }>();
app.use('/api', (req, res, next) => {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const window = apiWindows.get(key);
  if (!window || now - window.startedAt > 60_000) {
    apiWindows.set(key, { startedAt: now, requests: 1 });
    return next();
  }
  window.requests += 1;
  if (window.requests > 60) {
    return res.status(429).json({ error: 'Przekroczono limit operacji. Spróbuj ponownie za minutę.' });
  }
  next();
});

const ALLOWED_VOICES = new Set(['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede', 'Zephyr']);

function runBinary(binary: 'ffmpeg' | 'ffprobe', args: string[]): string {
  return execFileSync(binary, args, {
    env: { ...process.env, PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin' },
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function normalizeScripture(value: string): string {
  return value.normalize('NFC').replace(/\s+/g, ' ').trim();
}

function assertSafeText(value: unknown, field: string, maxLength = 240): string {
  if (typeof value !== 'string') throw new Error(`${field}: nieprawidłowy tekst.`);
  const clean = value.normalize('NFC').trim();
  if (!clean || clean.length > maxLength || /[\u0000-\u001f]/.test(clean)) {
    throw new Error(`${field}: niedozwolona lub zbyt długa wartość.`);
  }
  return clean;
}

// Configurable model settings
const SCRIPT_MODEL = process.env.GEMINI_SCRIPT_MODEL || 'gemini-3.8-flash';
const TTS_MODEL = process.env.GEMINI_TTS_MODEL || 'gemini-3.1-flash-tts-preview';

// Helper for AI client with BYOK (Bring Your Own Key) and mission quota protection
function getAiForRequest(req: express.Request, userApiKey?: string): GoogleGenAI {
  const headerKey = req.headers['x-user-gemini-key'];
  const explicitKey =
    typeof userApiKey === 'string' && userApiKey.trim()
      ? userApiKey.trim()
      : typeof headerKey === 'string' && headerKey.trim()
      ? headerKey.trim()
      : '';

  if (explicitKey) {
    return new GoogleGenAI({
      apiKey: explicitKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });
  }

  // Only verified administrator can use the mission server key
  if (req.user?.isAdmin) {
    const adminKey = process.env.GEMINI_API_KEY;
    if (!adminKey) {
      throw new Error('Brak skonfigurowanego klucza GEMINI_API_KEY na serwerze.');
    }
    return new GoogleGenAI({
      apiKey: adminKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });
  }

  throw new Error('BYOK_KEY_REQUIRED');
}

function getAi(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-memory cache for audio clips to prevent quota exhaustion
const ttsCache = new Map<string, string>();

// In-memory storage for rendered production audio files
interface RenderedProduction {
  id: string;
  projectTitle: string;
  wavPath: string;
  mp3Path: string;
  durationSec: number;
  createdAt: number;
}
const renderedProductions = new Map<string, RenderedProduction>();

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Biblia Audio Christian Culture Studio',
    brandUrl: 'https://www.polskieradio.cc',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    firebaseAdminReady,
    adminEmail: process.env.STUDIO_ADMIN_EMAIL || 'nazirczarkes@gmail.com',
    scriptModel: SCRIPT_MODEL,
    ttsModel: TTS_MODEL,
  });
});

// Endpoint: Current user session info
app.get('/api/auth/me', (req, res) => {
  res.json({
    user: req.user || null,
    isAdmin: !!req.user?.isAdmin,
    firebaseAdminReady,
  });
});

// Endpoint: Validate user Gemini API Key
app.post('/api/keys/validate-gemini', async (req, res) => {
  try {
    const key = (req.headers['x-user-gemini-key'] as string) || req.body.userApiKey;
    if (!key || typeof key !== 'string' || !key.trim()) {
      return res.status(400).json({ error: 'Podaj klucz API Gemini.' });
    }

    const testAi = new GoogleGenAI({ apiKey: key.trim() });
    const response = await testAi.models.generateContent({
      model: SCRIPT_MODEL,
      contents: 'Odpowiedz jednym słowem: "OK"',
    });

    return res.json({
      success: true,
      model: SCRIPT_MODEL,
      status: 'valid',
      preview: (response.text || '').trim(),
    });
  } catch (err: any) {
    console.warn('Błąd weryfikacji klucza Gemini:', err.message);
    return res.status(400).json({
      error: err.message || 'Nieprawidłowy lub nieaktywny klucz Gemini API.',
    });
  }
});

// Endpoint: Fetch ElevenLabs Voices using user's key
app.post('/api/elevenlabs/voices', async (req, res) => {
  try {
    const key = (req.headers['x-user-elevenlabs-key'] as string) || req.body.userApiKey;
    if (!key || typeof key !== 'string' || !key.trim()) {
      return res.status(400).json({ error: 'Podaj klucz API ElevenLabs.' });
    }

    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': key.trim(),
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({
        error: `ElevenLabs API zwróciło błąd (${response.status}): ${errText}`,
      });
    }

    const data: any = await response.json();
    return res.json({ success: true, voices: data.voices || [] });
  } catch (err: any) {
    console.warn('Błąd połączenia z ElevenLabs:', err.message);
    return res.status(500).json({ error: err.message || 'Błąd połączenia z API ElevenLabs.' });
  }
});

// Endpoint: Synthesize Speech via ElevenLabs using user's key
app.post('/api/elevenlabs/tts', async (req, res) => {
  try {
    const key = (req.headers['x-user-elevenlabs-key'] as string) || req.body.userApiKey;
    const { voiceId = '21m00Tcm4TlvDq8ikWAM', text } = req.body;

    if (!key || typeof key !== 'string' || !key.trim()) {
      return res.status(400).json({ error: 'Wymagany klucz ElevenLabs API.' });
    }
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Brak tekstu do syntezy.' });
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': key.trim(),
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `ElevenLabs TTS błąd (${response.status}): ${errText}` });
    }

    const audioArrayBuffer = await response.arrayBuffer();
    const audioBuffer = Buffer.from(audioArrayBuffer);

    res.setHeader('Content-Type', 'audio/mpeg');
    return res.send(audioBuffer);
  } catch (err: any) {
    console.warn('Błąd syntezy ElevenLabs:', err.message);
    return res.status(500).json({ error: err.message || 'Błąd syntezy ElevenLabs.' });
  }
});

// Endpoint: UBG Bible Metadata and Books list
app.get('/api/bible/ubg/info', (req, res) => {
  const pdfPath = getUbgPdfPath();
  const exists = fs.existsSync(pdfPath);
  const size = exists ? fs.statSync(pdfPath).size : 0;

  res.json({
    ...UBG_BIBLE_INFO,
    fileExists: exists,
    fileSizeBytes: size,
    books: UBG_BOOKS,
  });
});

// Endpoint: Download UBG Bible PDF
app.get('/api/bible/ubg/download', (req, res) => {
  const pdfPath = getUbgPdfPath();
  if (!fs.existsSync(pdfPath)) {
    return res.status(404).json({ error: 'Plik PDF Pisma Świętego UBG nie został znaleziony.' });
  }

  res.setHeader('Content-Disposition', 'attachment; filename="Pismo_Swiete_UBG.pdf"');
  res.setHeader('Content-Type', 'application/pdf');
  fs.createReadStream(pdfPath).pipe(res);
});

// Endpoint: Extract Chapter from UBG Bible PDF
app.post('/api/bible/ubg/chapter', async (req, res) => {
  try {
    const { book, chapter = 1 } = req.body;
    if (!book) {
      return res.status(400).json({ error: 'Podaj nazwę lub skrót księgi biblijnej.' });
    }

    const result = await extractUbgChapter(String(book), Number(chapter) || 1);
    res.json(result);
  } catch (err: any) {
    console.error('Błąd ekstrakcji UBG:', err);
    res.status(500).json({ error: err.message || 'Błąd podczas ekstrakcji tekstu z Pisma Świętego UBG.' });
  }
});

// Endpoint: Generate Radio Drama Script from Biblical Chapter/Passage
// Respecting the STRICT RULE: Scripture text is paramount and immutable.
app.post('/api/drama/generate-script', async (req, res) => {
  try {
    const {
      passage,
      bookName = 'Ewangelia wg św. Łukasza',
      chapterNumber = '15',
      customText,
      translation = 'Biblia Tysiąclecia / Współczesna',
      language = 'pl',
      dramaPace = 'cinematic',
    } = req.body;

    if (!passage && !customText) {
      return res.status(400).json({ error: 'Podaj fragment biblijny lub wklej tekst rozdziału.' });
    }

    let ai: GoogleGenAI;
    try {
      ai = getAiForRequest(req, req.body.userApiKey);
    } catch (err: any) {
      if (err.message === 'BYOK_KEY_REQUIRED') {
        return res.status(403).json({
          error:
            'Dostęp do analizy i generowania scenariusza AI wymaga własnego darmowego klucza Gemini API (BYOK). Wprowadź klucz w panelu Klucze API lub skorzystaj z gotowego tekstu i nagrywania mikrofonem.',
          code: 'BYOK_KEY_REQUIRED',
        });
      }
      return res.status(500).json({ error: err.message || 'Błąd konfiguracji klucza AI.' });
    }

    const systemInstruction = `Jesteś głównym reżyserem radiowym i biblistą w stacji "Christian Culture - Polskie Radio" (www.polskieradio.cc).
Twoim zadaniem jest przeanalizować podany rozdział Pisma Świętego i przygotować profesjonalny, ustrukturyzowany scenariusz słuchowiska biblijnego dla cyklu "Biblia Audio Christian Culture".

NAJWAŻNIEJSZA ZASADA NIENARUSZALNOŚCI SŁOWA BOŻEGO:
1. Tekst Biblii jest nadrzędny i NIE MOŻE być samowolnie zmieniany.
2. Nie dopisuj żadnych zdań do tekstu biblijnego.
3. Nie usuwaj fragmentów ani wersetów.
4. Nie parafrazuj wersetów ani nie zmieniaj znaczenia słów.
5. Nie wkładaj w usta postaci zdań, których nie ma w dostarczonym tekście źródłowym.
6. Podziel cały dostarczony tekst wiernie, słowo po słowie, na kolejne wypowiedzi aktorskie i narratorskie.
7. Wartość 'originalVerbatimText' i 'text' dla każdej linii MUSI być dokładnym, niezmienionym tekstem Pisma Świętego.

REŻYSERIA RADIOWA CHRISTIAN CULTURE:
- Wyodrębnij Narratora oraz wszystkie wypowiadające się postacie (np. Jezus, Bóg Ojciec, Apostołowie, Prorocy, postacie biblijne, chór/tłum).
- KATEGORYCZNA TARCZA GŁOSÓW ŻEŃSKICH:
  * Każda postać kobieca w Piśmie Świętym (np. Maryja, Marta, Elżbieta, Maria Magdalena, Anna, Rut, Estera, Judyta, Samarytanka, Kananejka, służąca, matka, niewiasta itp.) BEZWZGLĘDNIE MUSI mieć gender: 'female', roleType: 'female' oraz przypisany głos żeński:
    - 'Kore' (dla dojrzałych kobiet, matek, mądrych niewiast)
    - 'Aoede' (dla Matki Bożej / Maryi, modlitw, dziewcząt, aniołów)
  * Kategorycznie zabrania się przypisywania głosów męskich (Fenrir, Puck, Charon, Zephyr) do postaci kobiecych!
- Dla postaci męskich i boskich dobierz:
  * Fenrir: głęboki, majestatyczny bas radiowy (Bóg, Jezus w majestacie, Prorok o potężnym głosie)
  * Puck: szlachetny radiowy baryton (Narrator stacji Christian Culture, lektor główny)
  * Charon: wyrazisty męski tembr (Młody mężczyzna, uczeń, syn, apostoł)
  * Zephyr: wyważony, spokojny głos męski (Mędrzec, faryzeusz, ojciec, starszy syn)

INTELIGENTNY REŻYSER DŹWIĘKU - TEMPO I EMOCJE:
- Do każdej kwestii dobierz:
  * sceneNumber (kolejny numer sceny)
  * verseRef (np. 'Łk 15, 11-12' lub odpowiedni numer wersetu)
  * emotionCue: głęboka wskazówka aktorska w nawiasie oddająca stan ducha postaci i sacrum, np. '(z głębokim wzruszeniem i powagą)', '(ze skruchą i cichym głosem)', '(z majestatycznym pokojem i autorytetem)', '(z matczyną czułością i wiarą)'.
  * tempoMultiplier: precyzyjne tempo wypowiedzi (od 0.85 do 1.15):
    - 0.88-0.92 dla modlitwy, błogosławieństwa, głębokiej skruchy, płaczu i sacrum
    - 0.94-0.98 dla uroczystej narracji biblijnej oraz słów Jezusa
    - 1.00-1.04 dla wyważonych dialogów
    - 1.06-1.12 dla radości zmartwychwstania, zdumienia lub wzburzenia tłumu
  * pauseAfterMs: pauza oddechowa po kwestii w milisekundach (domyślnie 700-1300ms)
  * sfxCue: subtelny efekt tła
- Przygotuj oficjalną zapowiedź radiową (stationIntro) i zakończenie (stationOutro) dla stacji Christian Culture (www.polskieradio.cc).
- Wygeneruj kompletne metadane podcastu (tytuł, opis, tagi, opis na YouTube i post w mediach społecznościowych).`;

    const prompt = `Przygotuj wierny scenariusz słuchowiska biblijnego dla Christian Culture:
Księga: ${bookName}
Rozdział: ${chapterNumber}
Określenie fragmentu: ${passage || ''}
Przekład: ${translation}
Język: ${language}
${customText ? `Pełny tekst źródłowy do wiernego podziału na role (NIE ZMIENIAJ SŁÓW):\n"""\n${customText}\n"""` : ''}`;

    const response = await ai.models.generateContent({
      model: SCRIPT_MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Tytuł słuchowiska' },
            subtitle: { type: Type.STRING, description: 'Podtytuł lub zakres wersetów' },
            bibleReference: { type: Type.STRING, description: 'Oficjalny siglum biblijny' },
            estimatedDurationMinutes: { type: Type.NUMBER },
            stationIntro: {
              type: Type.STRING,
              description: 'Oficjalna zapowiedź lektorska stacji Christian Culture (www.polskieradio.cc)',
            },
            stationOutro: {
              type: Type.STRING,
              description: 'Oficjalne zakończenie audycji z adresem www.polskieradio.cc',
            },
            atmosphereMood: { type: Type.STRING },
            characters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  gender: { type: Type.STRING, description: 'male | female | divine | narrator' },
                  roleType: { type: Type.STRING, description: 'narrator | jesus | god | prophet | male | female | crowd | child' },
                  voiceProfile: { type: Type.STRING },
                  recommendedPitch: { type: Type.NUMBER },
                  recommendedRate: { type: Type.NUMBER },
                  geminiVoice: { type: Type.STRING, description: 'Puck | Charon | Kore | Fenrir | Aoede | Zephyr' },
                  pronunciationNotes: { type: Type.STRING },
                },
                required: ['id', 'name', 'gender', 'roleType', 'voiceProfile', 'recommendedPitch', 'recommendedRate', 'geminiVoice'],
              },
            },
            lines: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  sceneNumber: { type: Type.NUMBER },
                  verseRef: { type: Type.STRING },
                  characterId: { type: Type.STRING },
                  characterName: { type: Type.STRING },
                  text: { type: Type.STRING, description: 'Niezmieniony, dosłowny tekst Pisma Świętego' },
                  originalVerbatimText: { type: Type.STRING, description: 'Identyczny z tekstem źródłowym' },
                  emotionCue: { type: Type.STRING },
                  sfxCue: { type: Type.STRING },
                  tempoMultiplier: { type: Type.NUMBER, description: 'Tempo wypowiedzi od 0.85 do 1.15' },
                  pauseAfterMs: { type: Type.NUMBER },
                  pauseBeforeMs: { type: Type.NUMBER },
                },
                required: ['id', 'sceneNumber', 'characterId', 'characterName', 'text'],
              },
            },
            podcastMetadata: {
              type: Type.OBJECT,
              properties: {
                episodeTitle: { type: Type.STRING },
                seriesName: { type: Type.STRING },
                episodeNumber: { type: Type.NUMBER },
                author: { type: Type.STRING },
                description: { type: Type.STRING },
                summary: { type: Type.STRING },
                bookAndChapter: { type: Type.STRING },
                translationUsed: { type: Type.STRING },
                sourceAttribution: { type: Type.STRING },
                characterList: { type: Type.ARRAY, items: { type: Type.STRING } },
                keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                youtubeDescription: { type: Type.STRING },
                podcastRssDescription: { type: Type.STRING },
                socialPostDraft: { type: Type.STRING },
              },
              required: ['episodeTitle', 'seriesName', 'author', 'description', 'summary', 'bookAndChapter', 'keywords', 'youtubeDescription', 'socialPostDraft'],
            },
          },
          required: ['title', 'bibleReference', 'stationIntro', 'stationOutro', 'characters', 'lines', 'podcastMetadata'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');

    // Strict Female Voice Guard Verification
    const femaleKeywords = [
      'maria', 'maryja', 'marta', 'elżbieta', 'magdalena', 'anna', 'salome', 'joanna', 'zuzanna',
      'rut', 'noemi', 'estera', 'judyta', 'debora', 'ewa', 'sara', 'rebeka', 'lea', 'rachela',
      'miriam', 'samarytanka', 'kananejka', 'służebnica', 'służąca', 'matka', 'córka', 'siostra',
      'wdowa', 'niewiasta', 'kobieta', 'panna', 'dziewica',
    ];

    if (Array.isArray(parsed.characters)) {
      parsed.characters = parsed.characters.map((c: any) => {
        const nameLow = (c.name || '').toLowerCase();
        const isFem = c.gender === 'female' || femaleKeywords.some((k) => nameLow.includes(k));
        if (isFem) {
          const isYoungOrMarian = nameLow.includes('maria') || nameLow.includes('dziewica') || nameLow.includes('córka');
          const targetVoice = (c.geminiVoice === 'Aoede' || c.geminiVoice === 'Kore')
            ? c.geminiVoice
            : (isYoungOrMarian ? 'Aoede' : 'Kore');

          return {
            ...c,
            gender: 'female',
            roleType: c.roleType === 'narrator' ? 'narrator' : 'female',
            geminiVoice: targetVoice,
            recommendedPitch: c.recommendedPitch || 1.05,
            recommendedRate: c.recommendedRate || 0.98,
          };
        }
        return c;
      });
    }

    // Ensure originalVerbatimText, tempo and defaults on all lines
    if (Array.isArray(parsed.lines)) {
      parsed.lines = parsed.lines.map((l: any, idx: number) => ({
        ...l,
        id: l.id || `line_${idx + 1}`,
        sceneNumber: l.sceneNumber || 1,
        originalVerbatimText: l.originalVerbatimText || l.text,
        pauseAfterMs: l.pauseAfterMs || 750,
        pauseBeforeMs: l.pauseBeforeMs || 100,
        tempoMultiplier: l.tempoMultiplier || 1.0,
        emotionCue: l.emotionCue || '(ze spokojem i skupieniem)',
      }));
    }

    if (customText && Array.isArray(parsed.lines)) {
      const sourceNormalized = normalizeScripture(customText);
      const outputNormalized = normalizeScripture(parsed.lines.map((line: any) => line.text || '').join(' '));
      if (sourceNormalized !== outputNormalized) {
        return res.status(422).json({
          error: 'Strażnik Słowa zatrzymał analizę: scenariusz nie jest identyczny z tekstem źródłowym.',
          code: 'SCRIPTURE_INTEGRITY_MISMATCH',
          sourceLength: sourceNormalized.length,
          outputLength: outputNormalized.length,
        });
      }
    }

    return res.json({ success: true, script: parsed });
  } catch (error: any) {
    console.error('Error generating radio script:', error);
    return res.status(500).json({
      error: error.message || 'Błąd podczas generowania scenariusza słuchowiska.',
    });
  }
});

// Endpoint: AI Audio Director - Analyzes and refines tempo, emotions, and guards female casting
app.post('/api/direction/ai-direct', async (req, res) => {
  try {
    const { script, directorStyle = 'balanced' } = req.body;
    if (!script || !Array.isArray(script.lines)) {
      return res.status(400).json({ error: 'Brak scenariusza do reżyserii.' });
    }

    // AI Director logic will be assisted by Gemini if available
    let aiRefinements = null;
    try {
      const ai = getAiForRequest(req, req.body.userApiKey);
      const prompt = `Jesteś Głównym Reżyserem Dźwięku i Biblistą stacji Christian Culture (www.polskieradio.cc).
Dokonaj reżyserii akustycznej dla poniższego scenariusza w stylu: "${directorStyle}".

ZADANIE:
1. ZABEZPIECZ POSTACIE KOBIECE: Upewnij się, że każda postać żeńska ma gender='female' i głos 'Kore' lub 'Aoede'.
2. DOBIERZ DLA KAŻDEJ KWESTII:
   - emotionCue: głęboką wskazówkę aktorską oddającą sacrum i psychologię postaci
   - tempoMultiplier: tempo od 0.85 do 1.15
   - pauseAfterMs: pauzę oddechową (600 - 1400ms)

Tekst kwestii (NIE ZMIENIAJ SŁÓW BIBLII):
${JSON.stringify(script.lines.map((l: any) => ({ id: l.id, characterName: l.characterName, text: l.text })), null, 2)}`;

      const response = await ai.models.generateContent({
        model: SCRIPT_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              lineDirectives: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    emotionCue: { type: Type.STRING },
                    tempoMultiplier: { type: Type.NUMBER },
                    pauseAfterMs: { type: Type.NUMBER },
                  },
                  required: ['id', 'emotionCue', 'tempoMultiplier', 'pauseAfterMs'],
                },
              },
            },
            required: ['lineDirectives'],
          },
        },
      });

      aiRefinements = JSON.parse(response.text || '{}');
    } catch (e) {
      console.warn('Gemini direct query skipped, using local audioDirector engine:', e);
    }

    return res.json({ success: true, aiRefinements });
  } catch (err: any) {
    console.error('Director error:', err);
    return res.status(500).json({ error: err.message || 'Błąd reżysera dźwięku.' });
  }
});

function fetchTtsChunk(text: string, speed = 1): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=pl&client=tw-ob&ttsspeed=${speed}`;
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Google TTS HTTP ${res.statusCode}`));
      }
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function generatePolishNeuralAudio(text: string, voiceName: string): Promise<Buffer> {
  const safeContent = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '').trim();
  const words = safeContent.split(/\s+/);
  const chunks: string[] = [];
  let current = '';
  for (const w of words) {
    if ((current + ' ' + w).length > 150) {
      if (current) chunks.push(current);
      current = w;
    } else {
      current = current ? current + ' ' + w : w;
    }
  }
  if (current) chunks.push(current);

  const buffers: Buffer[] = [];
  for (const ch of chunks) {
    const b = await fetchTtsChunk(ch);
    buffers.push(b);
  }
  const mp3Data = Buffer.concat(buffers);

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'biblia_tts_pl_'));
  const mp3Path = path.join(tempDir, 'in.mp3');
  const rawPath = path.join(tempDir, 'out.raw');
  try {
    fs.writeFileSync(mp3Path, mp3Data);

    let filter = 'aresample=24000,loudnorm=I=-16:TP=-1.0:LRA=11';
    if (voiceName === 'Fenrir') {
      filter = 'asetrate=24000*0.91,aresample=24000,loudnorm=I=-16:TP=-1.0:LRA=11';
    } else if (voiceName === 'Charon') {
      filter = 'asetrate=24000*0.86,aresample=24000,loudnorm=I=-16:TP=-1.0:LRA=11';
    } else if (voiceName === 'Kore') {
      filter = 'asetrate=24000*1.06,aresample=24000,loudnorm=I=-16:TP=-1.0:LRA=11';
    } else if (voiceName === 'Aoede') {
      filter = 'asetrate=24000*1.12,aresample=24000,loudnorm=I=-16:TP=-1.0:LRA=11';
    }

    runBinary('ffmpeg', [
      '-y',
      '-i', mp3Path,
      '-af', filter,
      '-f', 's16le',
      '-ac', '1',
      '-ar', '24000',
      rawPath,
    ]);

    return fs.readFileSync(rawPath);
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }
}

// Endpoint: Check TTS Status
app.get('/api/tts/status', (req, res) => {
  const cachedCount = fs.existsSync(TTS_CACHE_DIR) ? fs.readdirSync(TTS_CACHE_DIR).length : 0;
  res.json({
    geminiModel: TTS_MODEL,
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    cachedFiles: cachedCount,
    fallbackEngine: 'Polish Studio Voice (Google Neural PL)',
  });
});

// Endpoint: Clear TTS Cache
app.post('/api/tts/clear-cache', (req, res) => {
  ttsCache.clear();
  if (fs.existsSync(TTS_CACHE_DIR)) {
    const files = fs.readdirSync(TTS_CACHE_DIR);
    for (const f of files) {
      try {
        fs.unlinkSync(path.join(TTS_CACHE_DIR, f));
      } catch {}
    }
  }
  res.json({ success: true, message: 'Wyczyszczono pamięć podręczną audio.' });
});

// Endpoint: TTS Speech Generation with Disk Caching & Polish Neural Voice
app.post('/api/tts/synthesize', async (req, res) => {
  try {
    const { text, voiceName = 'Kore', engine = 'auto', allowFallback = true } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Brak tekstu do syntezy.' });
    }

    const cleanText = text.trim();
    if (!ALLOWED_VOICES.has(voiceName)) {
      return res.status(400).json({ error: 'Wybrano nieobsługiwany głos TTS.' });
    }
    if (cleanText.length > 5000) {
      return res.status(413).json({ error: 'Pojedyncza kwestia jest zbyt długa.' });
    }

    const cacheHash = crypto.createHash('sha256').update(`${voiceName}:${cleanText}`).digest('hex');
    const diskCachePath = path.join(TTS_CACHE_DIR, `${cacheHash}.raw`);

    // Check disk/memory cache
    if (fs.existsSync(diskCachePath)) {
      const pcmBuf = fs.readFileSync(diskCachePath);
      return res.json({
        success: true,
        audioBase64: pcmBuf.toString('base64'),
        sampleRate: 24000,
        format: 'pcm16',
        cached: true,
        engine: 'cache',
      });
    }

    // Direct Polish Neural Studio voice if requested
    if (engine === 'polish_neural') {
      const pcmBuf = await generatePolishNeuralAudio(cleanText, voiceName);
      fs.writeFileSync(diskCachePath, pcmBuf);
      return res.json({
        success: true,
        audioBase64: pcmBuf.toString('base64'),
        sampleRate: 24000,
        format: 'pcm16',
        cached: false,
        engine: 'polish_neural',
      });
    }

    // Attempt Gemini TTS first if in 'auto' or 'gemini' mode
    try {
      const ai = getAiForRequest(req, req.body.userApiKey);
      const response = await ai.models.generateContent({
        model: TTS_MODEL,
        contents: [{ parts: [{ text: cleanText }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        throw new Error('Pusta odpowiedź audio z Gemini TTS');
      }

      const pcmBuf = Buffer.from(base64Audio, 'base64');
      fs.writeFileSync(diskCachePath, pcmBuf);

      return res.json({
        success: true,
        audioBase64: base64Audio,
        sampleRate: 24000,
        format: 'pcm16',
        cached: false,
        engine: 'gemini',
        fallbackUsed: false,
      });
    } catch (geminiError: any) {
      const isQuotaError =
        geminiError.status === 429 ||
        (geminiError.message &&
          (geminiError.message.includes('429') ||
            geminiError.message.includes('Quota') ||
            geminiError.message.includes('RESOURCE_EXHAUSTED') ||
            geminiError.message.includes('quota')));

      console.warn(
        `[TTS Notice] Gemini TTS niedostępny (status=${geminiError.status || 'unknown'}, quota=${isQuotaError}). Uruchamianie certyfikowanego silnika lektorskiego Radia CC...`
      );

      if (allowFallback) {
        try {
          const fallbackBuf = await generatePolishNeuralAudio(cleanText, voiceName);
          fs.writeFileSync(diskCachePath, fallbackBuf);

          return res.json({
            success: true,
            audioBase64: fallbackBuf.toString('base64'),
            sampleRate: 24000,
            format: 'pcm16',
            cached: false,
            fallbackUsed: true,
            quotaExceeded: isQuotaError,
            engine: 'polish_neural',
            notice: isQuotaError
              ? 'Włączono certyfikowany lektor polski Radia CC (bezpłatny limit Gemini TTS na dziś został wykorzystany).'
              : 'Włączono certyfikowany lektor polski Radia CC.',
          });
        } catch (fallbackError: any) {
          console.error('Fallback Polish synthesis failed:', fallbackError);
        }
      }

      return res.status(isQuotaError ? 429 : 500).json({
        error: isQuotaError
          ? 'Przekroczono limit zapytań Gemini TTS (10 zapytań dziennie). Skorzystaj z certyfikowanego lektora Radia CC.'
          : geminiError.message || 'Błąd syntezy mowy przez Gemini TTS.',
        retryAfterSec: isQuotaError ? 60 : undefined,
      });
    }
  } catch (error: any) {
    console.error('TTS endpoint error:', error);
    return res.status(500).json({
      error: error.message || 'Błąd serwera TTS.',
    });
  }
});

// Endpoint: Master Audio Assembly with FFmpeg
// Stitches PCM clips, applies pauses, normalizes to -16 LUFS, and generates real WAV & MP3
app.post('/api/audio/render-master', async (req, res) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'biblia_audio_'));
  try {
    const { projectTitle = 'Biblia Audio', script, clips = [], mixerSettings = {} } = req.body;

    if (!Array.isArray(clips) || clips.length === 0) {
      return res.status(400).json({ error: 'Brak klipów audio do montażu.' });
    }

    const concatRawPath = path.join(tempDir, 'concatenated_speech.raw');
    const writeStream = fs.createWriteStream(concatRawPath);

    let totalDurationSec = 0;

    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      if (clip.base64) {
        let buffer = Buffer.from(clip.base64, 'base64');

        // Check if buffer is an encoded audio container (WAV, MP3, OGG, FLAC) rather than raw PCM
        const isEncoded =
          (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) || // RIFF / WAV
          (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) || // ID3 / MP3
          (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) || // MP3 sync word
          (buffer[0] === 0x4f && buffer[1] === 0x67 && buffer[2] === 0x67 && buffer[3] === 0x53) || // OggS
          (buffer[0] === 0x66 && buffer[1] === 0x4c && buffer[2] === 0x61 && buffer[3] === 0x43); // fLaC

        if (isEncoded) {
          try {
            const inPath = path.join(tempDir, `encoded_clip_${i}.bin`);
            const outPath = path.join(tempDir, `pcm_clip_${i}.raw`);
            fs.writeFileSync(inPath, buffer);
            runBinary('ffmpeg', [
              '-y', '-i', inPath,
              '-f', 's16le', '-ac', '1', '-ar', '24000',
              outPath,
            ]);
            buffer = fs.readFileSync(outPath);
          } catch (convErr) {
            console.warn(`Could not convert encoded clip ${i} to PCM, using as is:`, convErr);
          }
        }

        writeStream.write(buffer);
        // 24000 samples/sec * 2 bytes/sample = 48000 bytes/sec
        const clipDuration = buffer.length / 48000;
        totalDurationSec += clipDuration;
      }

      // Add silence pause if specified
      const pauseMs = typeof clip.pauseAfterMs === 'number' ? clip.pauseAfterMs : 700;
      if (pauseMs > 0 && i < clips.length - 1) {
        const silenceBytes = Math.floor((pauseMs / 1000) * 48000);
        // Ensure even alignment for 16-bit
        const evenSilenceBytes = silenceBytes - (silenceBytes % 2);
        if (evenSilenceBytes > 0) {
          const silenceBuffer = Buffer.alloc(evenSilenceBytes);
          writeStream.write(silenceBuffer);
          totalDurationSec += pauseMs / 1000;
        }
      }
    }

    await new Promise<void>((resolve, reject) => {
      writeStream.end();
      writeStream.on('finish', () => resolve());
      writeStream.on('error', reject);
    });

    const prodId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const outputWavPath = path.join(PRODUCTIONS_DIR, `${prodId}_radio_master.wav`);
    const outputMp3Path = path.join(PRODUCTIONS_DIR, `${prodId}_podcast.mp3`);
    const voiceWavPath = path.join(tempDir, `${prodId}_voice.wav`);

    const episodeTitle = assertSafeText((script && script.title) || projectTitle, 'Tytuł projektu');
    const author = 'Christian Culture';
    const album = 'Biblia Audio Christian Culture';

    // 1. Process Voice Master: 48kHz, 24/16-bit stereo
    runBinary('ffmpeg', [
      '-y', '-f', 's16le', '-ar', '24000', '-ac', '1', '-i', concatRawPath,
      '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s24le', voiceWavPath,
    ]);

    // 2. Mix with Custom Background Music Bed if provided
    const customMusicBase64 = mixerSettings?.customMusicTrack?.base64;
    if (customMusicBase64) {
      try {
        const musicInPath = path.join(tempDir, `music_bed_in.bin`);
        const musicWavPath = path.join(tempDir, `music_bed_norm.wav`);
        fs.writeFileSync(musicInPath, Buffer.from(customMusicBase64, 'base64'));

        const musicVol = Math.max(0.04, Math.min(0.6, ((mixerSettings.musicVolume ?? 35) / 100) * 0.35));
        runBinary('ffmpeg', [
          '-y', '-stream_loop', '-1', '-i', musicInPath,
          '-t', `${Math.ceil(totalDurationSec + 3)}`,
          '-filter:a', `volume=${musicVol.toFixed(3)}`,
          '-ar', '48000', '-ac', '2', musicWavPath,
        ]);

        // Blend Voice + Music Bed with loudnorm to -16 LUFS
        runBinary('ffmpeg', [
          '-y', '-i', voiceWavPath, '-i', musicWavPath,
          '-filter_complex', `[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=2[mixed];[mixed]loudnorm=I=-16:TP=-1.0:LRA=11`,
          '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s24le', outputWavPath,
        ]);
      } catch (musicErr) {
        console.warn('Music blending failed, falling back to speech only:', musicErr);
        runBinary('ffmpeg', [
          '-y', '-i', voiceWavPath,
          '-af', 'loudnorm=I=-16:TP=-1.0:LRA=11',
          '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s24le', outputWavPath,
        ]);
      }
    } else {
      // Pure speech master normalized to -16 LUFS
      runBinary('ffmpeg', [
        '-y', '-i', voiceWavPath,
        '-af', 'loudnorm=I=-16:TP=-1.0:LRA=11',
        '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s24le', outputWavPath,
      ]);
    }

    // 3. Process MP3 Podcast: 44.1kHz, 192kbps stereo with complete ID3 tags
    runBinary('ffmpeg', [
      '-y', '-i', outputWavPath, '-ar', '44100', '-ac', '2', '-b:a', '192k',
      '-metadata', `title=${episodeTitle}`, '-metadata', `artist=${author}`,
      '-metadata', `album=${album}`,
      '-metadata', 'comment=https://www.polskieradio.cc - Słowo, które możesz usłyszeć',
      '-metadata', `date=${new Date().getFullYear()}`, outputMp3Path,
    ]);

    // Store in memory for download
    renderedProductions.set(prodId, {
      id: prodId,
      projectTitle: episodeTitle,
      wavPath: outputWavPath,
      mp3Path: outputMp3Path,
      durationSec: Math.round(totalDurationSec),
      createdAt: Date.now(),
    });

    const wavStats = fs.statSync(outputWavPath);
    const mp3Stats = fs.statSync(outputMp3Path);

    return res.json({
      success: true,
      productionId: prodId,
      durationSeconds: Math.round(totalDurationSec),
      wavUrl: `/api/audio/download/${prodId}?format=wav`,
      mp3Url: `/api/audio/download/${prodId}?format=mp3`,
      wavSizeBytes: wavStats.size,
      mp3SizeBytes: mp3Stats.size,
      specs: {
        radioMaster: 'WAV PCM 48kHz / 24-bit Stereo (-16 LUFS)',
        podcast: 'MP3 192kbps 44.1kHz Stereo z tagami ID3',
      },
    });
  } catch (err: any) {
    console.error('Mastering error:', err);
    // Cleanup temp dir on error
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {}
    return res.status(500).json({ error: err.message || 'Błąd montażu audio FFmpeg.' });
  }
});

// Endpoint: Download Master Audio Files (WAV or MP3)
app.get('/api/audio/download/:id', (req, res) => {
  const prodId = req.params.id;
  const format = (req.query.format as string) || 'mp3';
  const prod = renderedProductions.get(prodId);

  if (!prod) {
    return res.status(404).send('Nie znaleziono pliku produkcji lub sesja wygasła.');
  }

  const filePath = format === 'wav' ? prod.wavPath : prod.mp3Path;
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Plik audio został usunięty.');
  }

  const cleanTitle = prod.projectTitle.replace(/[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ_\-\s]/g, '').trim() || 'Biblia_Audio';
  const filename = `${cleanTitle}_Christian_Culture_${format.toUpperCase()}.${format}`;

  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
  res.setHeader('Content-Type', format === 'wav' ? 'audio/wav' : 'audio/mpeg');
  fs.createReadStream(filePath).pipe(res);
});

// ---------------------------------------------------------------------------
// BIBLIA AUDIO VIDEO STUDIO ENDPOINTS (FFmpeg MP4 YouTube 16:9 & Shorts)
// ---------------------------------------------------------------------------

interface RenderedVideo {
  id: string;
  projectTitle: string;
  mp4Path: string;
  resolution: string;
  durationSec: number;
  fileSizeBytes: number;
  createdAt: number;
}
const renderedVideos = new Map<string, RenderedVideo>();

// Endpoint: Generate Scene Visual Prompt using Gemini AI
app.post('/api/video/generate-scene-prompt', async (req, res) => {
  try {
    const { bookName = 'Ewangelia wg św. Łukasza', chapterNumber = '15', sceneTitle, sceneText } = req.body;
    const ai = getAi();

    const prompt = `Jesteś kierownikiem artystycznym i biblistą w stacji radiowej "Christian Culture" (www.polskieradio.cc).
Twoim zadaniem jest przygotować głęboki, powściągliwy, historycznie wierny opis ilustracji do sceny biblijnej dla cyklu "Biblia Audio Christian Culture".

Księga: ${bookName}, Rozdział: ${chapterNumber}
Tytuł sceny: ${sceneTitle || 'Scena biblijna'}
Treść sceny: """${sceneText || ''}"""

ŚCIŚŁE WYTYCZNE ARTYSTYCZNE I TEOLOGICZNE:
1. Styl: Klasyczne malarstwo sakralne (w duchu Rembrandta van Rijn, Caravaggia lub Jamesa Tissota). Głębokie światłocienie (chiaroscuro), ciepłe złocisto-ugrowe barwy, szlachetna faktura olejna.
2. Wierność realiom I wieku w Judei/Galilei: autentyczne proste tuniki wełniane i lniane, kamienna architektura, surowy krajobraz Ziemi Świętej.
3. BEZWZGLĘDNY ZAKAZ: żadnych elementów współczesnych, żadnej karykatury, żadnego komiksu ani krzykliwych neonów.
4. Bóg Ojciec i sacrum: nie przedstawiać Boga Ojca jako ludzkiej postaci; sacrum wyrażać przez złociste światło z góry, przestrzeń i majestat.

Odpowiedz jednym precyzyjnym akapitem po polsku opisującym kompozycję, światło, postacie i nastrój.`;

    const response = await ai.models.generateContent({
      model: SCRIPT_MODEL,
      contents: prompt,
    });

    const generatedPrompt = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    return res.json({ success: true, prompt: generatedPrompt });
  } catch (err: any) {
    console.error('Scene prompt error:', err);
    return res.status(500).json({ error: err.message || 'Błąd generowania promptu sceny.' });
  }
});

// Endpoint: Render YouTube MP4 Video using FFmpeg
// Integrates master audio or synthesized clips with visual backgrounds,
// brand watermark and synchronized subtitles.
app.post('/api/video/render-mp4', async (req, res) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'biblia_video_'));
  try {
    const {
      projectTitle = 'Biblia Audio',
      bookName = 'Ewangelia',
      chapterNumber = '1',
      videoSettings = {},
      subtitles = [],
      productionId,
      clips = [],
    } = req.body;

    const isShorts = videoSettings.resolution === 'shorts';
    const width = isShorts ? 1080 : 1920;
    const height = isShorts ? 1920 : 1080;
    const fps = videoSettings.fps || 25;

    // 1. Resolve Audio File (from existing production or generate temporary audio)
    let audioWavPath = '';
    if (productionId && renderedProductions.has(productionId)) {
      audioWavPath = renderedProductions.get(productionId)!.wavPath;
    }

    if (!audioWavPath || !fs.existsSync(audioWavPath)) {
      // Build audio from clips or synthesize fallback silent tone
      const rawPath = path.join(tempDir, 'speech.raw');
      const writeStream = fs.createWriteStream(rawPath);

      if (Array.isArray(clips) && clips.length > 0) {
        for (const clip of clips) {
          if (clip.base64) {
            writeStream.write(Buffer.from(clip.base64, 'base64'));
          }
          const pauseMs = clip.pauseAfterMs || 700;
          if (pauseMs > 0) {
            const silenceBytes = Math.floor((pauseMs / 1000) * 48000);
            const even = silenceBytes - (silenceBytes % 2);
            if (even > 0) writeStream.write(Buffer.alloc(even));
          }
        }
      }

      await new Promise<void>((resolve, reject) => {
        writeStream.end();
        writeStream.on('finish', () => resolve());
        writeStream.on('error', reject);
      });

      audioWavPath = path.join(tempDir, 'audio_master.wav');
      const rawStats = fs.statSync(rawPath);
      if (rawStats.size > 0) {
        runBinary('ffmpeg', ['-y', '-f', 's16le', '-ar', '24000', '-ac', '1', '-i', rawPath, '-af', 'loudnorm=I=-16:TP=-1.0:LRA=11', '-ar', '48000', '-ac', '2', audioWavPath]);
      } else {
        return res.status(400).json({ error: 'Brak gotowej ścieżki audio. Najpierw wyrenderuj master WAV.' });
      }
    }

    // Get exact audio duration
    let durationSec = 10;
    try {
      const probeOutput = runBinary('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', audioWavPath]).trim();
      durationSec = parseFloat(probeOutput) || 10;
    } catch (e) {
      console.warn('ffprobe error, using fallback duration:', e);
    }

    // 2. Prepare Background Image
    const bgImagePath = path.join(tempDir, 'background.png');
    let hasCustomImage = false;

    // Check if custom background was provided in base64 data URL
    if (videoSettings.customBackgroundUrl && videoSettings.customBackgroundUrl.startsWith('data:image')) {
      const base64Data = videoSettings.customBackgroundUrl.split(',')[1];
      if (base64Data) {
        fs.writeFileSync(bgImagePath, Buffer.from(base64Data, 'base64'));
        hasCustomImage = true;
      }
    }

    // If no custom image, render elegant deep biblical canvas
    if (!hasCustomImage) {
      const bgHexColor = videoSettings.mode === 'minimalist' ? '0x100e0c' : '0x1c1917';
      runBinary('ffmpeg', ['-y', '-f', 'lavfi', '-i', `color=c=${bgHexColor}:s=${width}x${height}:d=1`, '-vframes', '1', bgImagePath]);
    }

    // 3. Prepare Subtitles file if enabled
    let srtPath = '';
    const showSubtitles = videoSettings.showSubtitles !== false && Array.isArray(subtitles) && subtitles.length > 0;
    if (showSubtitles) {
      srtPath = path.join(tempDir, 'subtitles.srt');
      let srtContent = '';
      subtitles.forEach((cue: any, idx: number) => {
        const pad = (n: number, z = 2) => String(n).padStart(z, '0');
        const toTime = (sec: number) => {
          const s = Math.max(0, sec);
          const h = Math.floor(s / 3600);
          const m = Math.floor((s % 3600) / 60);
          const sc = Math.floor(s % 60);
          const ms = Math.floor((s % 1) * 1000);
          return `${pad(h)}:${pad(m)}:${pad(sc)},${pad(ms, 3)}`;
        };
        const start = toTime(cue.startSec || 0);
        const end = toTime(cue.endSec || (cue.startSec || 0) + 3);
        const verse = videoSettings.showVerseNumbers && cue.verseRef ? `[${cue.verseRef}] ` : '';
        const name = cue.characterName ? `${cue.characterName}: ` : '';
        srtContent += `${idx + 1}\n${start} --> ${end}\n${verse}${name}${cue.text}\n\n`;
      });
      fs.writeFileSync(srtPath, srtContent, 'utf-8');
    }

    // 4. Output MP4 file path
    const videoId = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const outputMp4Path = path.join(VIDEOS_DIR, `${videoId}_youtube.mp4`);

    // 5. Construct FFmpeg video filter pipeline
    const safeBook = assertSafeText(bookName || 'Ewangelia', 'Nazwa księgi', 100);
    const escapedBook = safeBook.replace(/[':%\\]/g, '');
    const escapedChapter = String(chapterNumber || '1');

    // Title and branding overlay
    let vf = `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`;

    // Top Title
    vf += `,drawtext=fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:text='${escapedBook} • Rozdział ${escapedChapter}':fontcolor=white:fontsize=${isShorts ? 36 : 28}:x=(w-text_w)/2:y=${isShorts ? 100 : 40}:box=1:boxcolor=black@0.7:boxborderw=10`;

    // Christian Culture watermark badge
    vf += `,drawtext=fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:text='CHRISTIAN CULTURE • polskieradio.cc':fontcolor=0xf59e0b:fontsize=${isShorts ? 24 : 18}:x=${isShorts ? '(w-text_w)/2' : 'w-text_w-40'}:y=${isShorts ? 'h-70' : '45'}:box=1:boxcolor=black@0.7:boxborderw=8`;

    // Subtitles burning
    if (showSubtitles && srtPath && fs.existsSync(srtPath)) {
      const fontSize = isShorts ? 24 : (videoSettings.subtitlesFontSize === 'large' ? 24 : 19);
      const marginV = isShorts ? 160 : (videoSettings.subtitlesPosition === 'middle' ? 260 : 45);
      const escapedSrt = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:');
      vf += `,subtitles='${escapedSrt}':force_style='Fontname=Liberation Sans,Fontsize=${fontSize},PrimaryColour=&H00F3FE,OutlineColour=&HDE0A0C,BorderStyle=3,Outline=2,Shadow=0,MarginV=${marginV}'`;
    }

    // Render MP4 with H.264 ultrafast and AAC 48kHz
    runBinary('ffmpeg', [
      '-y', '-loop', '1', '-framerate', String(fps), '-i', bgImagePath, '-i', audioWavPath,
      '-vf', vf, '-c:v', 'libx264', '-preset', 'medium', '-tune', 'stillimage',
      '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2',
      '-t', String(durationSec), '-movflags', '+faststart', outputMp4Path,
    ]);

    const stats = fs.statSync(outputMp4Path);

    // Save to rendered videos repository
    renderedVideos.set(videoId, {
      id: videoId,
      projectTitle: `${bookName} - Rozdział ${chapterNumber}`,
      mp4Path: outputMp4Path,
      resolution: isShorts ? '1080x1920 (9:16 Shorts)' : '1920x1080 (16:9 Full HD)',
      durationSec: Math.round(durationSec),
      fileSizeBytes: stats.size,
      createdAt: Date.now(),
    });

    return res.json({
      success: true,
      videoId,
      durationSeconds: Math.round(durationSec),
      fileSizeBytes: stats.size,
      resolution: isShorts ? '1080x1920' : '1920x1080',
      mp4Url: `/api/video/download/${videoId}`,
    });
  } catch (err: any) {
    console.error('Video rendering error:', err);
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {}
    return res.status(500).json({ error: err.message || 'Błąd renderowania wideo FFmpeg.' });
  }
});

// Endpoint: Download Rendered MP4 Video
app.get('/api/video/download/:id', (req, res) => {
  const vidId = req.params.id;
  const video = renderedVideos.get(vidId);

  if (!video) {
    return res.status(404).send('Nie znaleziono pliku wideo lub sesja wygasła.');
  }

  if (!fs.existsSync(video.mp4Path)) {
    return res.status(404).send('Plik MP4 został usunięty.');
  }

  const cleanTitle = video.projectTitle.replace(/[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ_\-\s]/g, '').trim() || 'Biblia_Audio';
  const filename = `${cleanTitle}_Christian_Culture_YouTube.mp4`;

  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
  res.setHeader('Content-Type', 'video/mp4');
  fs.createReadStream(video.mp4Path).pipe(res);
});

async function startServer() {
  const distPath = path.join(process.cwd(), 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));

  if (process.env.NODE_ENV === 'development' || (!hasDist && process.env.NODE_ENV !== 'production')) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Biblia Audio Studio Christian Culture running on http://localhost:${PORT}`);
  });
}

startServer();
