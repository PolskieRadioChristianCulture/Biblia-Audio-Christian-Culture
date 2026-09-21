import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Sparkles,
  ShieldCheck,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Volume2,
  ExternalLink,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  getUserGeminiKey,
  setUserGeminiKey,
  getUserElevenLabsKey,
  setUserElevenLabsKey,
  shouldPersistKeys,
  setPersistKeys,
  clearUserKeys,
  maskApiKey,
} from '../lib/userKeys';
import { getCurrentIdToken } from '../lib/firebaseClient';

interface ApiKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  onVoicesUpdated?: (voices: Array<{ id: string; name: string; category?: string }>) => void;
}

export const ApiKeysModal: React.FC<ApiKeysModalProps> = ({
  isOpen,
  onClose,
  isAdmin = false,
  onVoicesUpdated,
}) => {
  const [geminiKey, setGeminiKey] = useState('');
  const [elevenLabsKey, setElevenLabsKey] = useState('');
  const [persistPref, setPersistPref] = useState(false);

  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showElevenKey, setShowElevenKey] = useState(false);

  const [testingGemini, setTestingGemini] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  const [testingEleven, setTestingEleven] = useState(false);
  const [elevenStatus, setElevenStatus] = useState<{ ok: boolean; msg: string; voiceCount?: number } | null>(null);
  const [elevenVoices, setElevenVoices] = useState<Array<{ id: string; name: string; category?: string }>>([]);

  useEffect(() => {
    if (isOpen) {
      setGeminiKey(getUserGeminiKey());
      setElevenLabsKey(getUserElevenLabsKey());
      setPersistPref(shouldPersistKeys());
      setGeminiStatus(null);
      setElevenStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setPersistKeys(persistPref);
    setUserGeminiKey(geminiKey, persistPref);
    setUserElevenLabsKey(elevenLabsKey, persistPref);
    onClose();
  };

  const handleClearAll = () => {
    clearUserKeys();
    setGeminiKey('');
    setElevenLabsKey('');
    setGeminiStatus(null);
    setElevenStatus(null);
    setElevenVoices([]);
    if (onVoicesUpdated) onVoicesUpdated([]);
  };

  const handleTestGemini = async () => {
    const keyToTest = geminiKey.trim();
    if (!keyToTest) {
      setGeminiStatus({ ok: false, msg: 'Wprowadź swój klucz Gemini API.' });
      return;
    }
    setTestingGemini(true);
    setGeminiStatus(null);

    try {
      const idToken = await getCurrentIdToken();
      const res = await fetch('/api/keys/validate-gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
          'X-User-Gemini-Key': keyToTest,
        },
        body: JSON.stringify({ userApiKey: keyToTest }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGeminiStatus({ ok: true, msg: `Klucz Gemini aktywny i zweryfikowany (${data.model || 'gotowy do pracy'}).` });
        setUserGeminiKey(keyToTest, persistPref);
      } else {
        setGeminiStatus({ ok: false, msg: data.error || 'Nieprawidłowy klucz Gemini API.' });
      }
    } catch (err: any) {
      setGeminiStatus({ ok: false, msg: err.message || 'Błąd połączenia z serwerem.' });
    } finally {
      setTestingGemini(false);
    }
  };

  const handleTestElevenLabs = async () => {
    const keyToTest = elevenLabsKey.trim();
    if (!keyToTest) {
      setElevenStatus({ ok: false, msg: 'Wprowadź swój klucz ElevenLabs API.' });
      return;
    }
    setTestingEleven(true);
    setElevenStatus(null);

    try {
      const idToken = await getCurrentIdToken();
      const res = await fetch('/api/elevenlabs/voices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
          'X-User-ElevenLabs-Key': keyToTest,
        },
        body: JSON.stringify({ userApiKey: keyToTest }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.voices)) {
        const voices = data.voices.map((v: any) => ({
          id: v.voice_id || v.id,
          name: v.name,
          category: v.category || 'custom',
        }));
        setElevenVoices(voices);
        setElevenStatus({
          ok: true,
          msg: `Połączono z ElevenLabs! Załadowano ${voices.length} głosów z Twojego konta.`,
          voiceCount: voices.length,
        });
        setUserElevenLabsKey(keyToTest, persistPref);
        if (onVoicesUpdated) onVoicesUpdated(voices);
      } else {
        setElevenStatus({ ok: false, msg: data.error || 'Nieprawidłowy klucz ElevenLabs API.' });
      }
    } catch (err: any) {
      setElevenStatus({ ok: false, msg: err.message || 'Błąd połączenia z serwerem.' });
    } finally {
      setTestingEleven(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#10141e] border border-amber-500/50 rounded-2xl w-full max-w-xl p-6 sm:p-7 shadow-2xl space-y-6 text-stone-100 font-mono relative overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Glow Accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-[#212c3f] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center text-stone-950 shadow-lg shadow-amber-950/50 shrink-0">
              <KeyRound size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 uppercase tracking-widest">
                  Panel BYOK (Klucze Własne)
                </span>
                <span className="text-stone-500 text-xs">•</span>
                <span className="text-xs text-amber-400 font-serif">Christian Culture</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold font-serif text-white mt-0.5">
                Silniki Mowy i Klucze API
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#18212e] hover:bg-[#253247] text-stone-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Security / Cost Banner */}
        <div className="bg-[#0b0f16] border border-[#1e2738] rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
            <ShieldCheck size={16} className="text-amber-400 shrink-0" />
            <span>Żelazna Zasada: Zero Kosztów Misji & Pełna Prywatność</span>
          </div>
          <p className="text-xs text-stone-300 leading-relaxed font-sans">
            Wszystkie klucze API są przechowywane wyłącznie w Twojej przeglądarce i przekazywane przez bezpieczne połączenie TLS bez zapisu w bazie danych stacji. 
            {isAdmin ? (
              <span className="text-emerald-400 font-semibold block mt-1">
                Jesteś zalogowany jako Główny Administrator — posiadasz nieograniczony dostęp do misyjnego klucza Gemini.
              </span>
            ) : (
              <span className="text-stone-400 block mt-1">
                Zwykli użytkownicy korzystają z własnych kluczy (BYOK) lub 100% bezpłatnego trybu mikrofonowego i własnych plików audio.
              </span>
            )}
          </p>
        </div>

        {/* Gemini API Section */}
        <div className="bg-[#121824] border border-[#222d3e] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400" />
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                Google Gemini API Key (Analiza i Synteza TTS)
              </label>
            </div>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 underline font-sans"
            >
              Pobierz darmowy klucz Google <ExternalLink size={12} />
            </a>
          </div>

          <div className="relative">
            <input
              type={showGeminiKey ? 'text' : 'password'}
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="Wklej klucz: AIzaSy..."
              className="w-full bg-[#0b0e14] border border-[#253245] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 pr-20"
            />
            <button
              type="button"
              onClick={() => setShowGeminiKey(!showGeminiKey)}
              className="absolute right-2 top-2.5 p-1 text-stone-400 hover:text-stone-200 transition-colors"
            >
              {showGeminiKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleTestGemini}
              disabled={testingGemini || !geminiKey.trim()}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {testingGemini ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              <span>Testuj klucz Gemini</span>
            </button>
            {geminiKey && (
              <span className="text-[11px] text-stone-400 font-mono">
                {maskApiKey(geminiKey)}
              </span>
            )}
          </div>

          {geminiStatus && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                geminiStatus.ok
                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/50'
                  : 'bg-rose-950/40 text-rose-300 border border-rose-800/50'
              }`}
            >
              {geminiStatus.ok ? <CheckCircle2 size={16} className="shrink-0" /> : <AlertCircle size={16} className="shrink-0" />}
              <span>{geminiStatus.msg}</span>
            </div>
          )}
        </div>

        {/* ElevenLabs API Section */}
        <div className="bg-[#121824] border border-[#222d3e] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 size={16} className="text-amber-400" />
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                ElevenLabs API Key (Głosy Aktorskie Premium)
              </label>
            </div>
            <a
              href="https://elevenlabs.io/app/voice-library"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 underline font-sans"
            >
              Konto ElevenLabs <ExternalLink size={12} />
            </a>
          </div>

          <div className="relative">
            <input
              type={showElevenKey ? 'text' : 'password'}
              value={elevenLabsKey}
              onChange={(e) => setElevenLabsKey(e.target.value)}
              placeholder="Wklej klucz: xi-..."
              className="w-full bg-[#0b0e14] border border-[#253245] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 pr-20"
            />
            <button
              type="button"
              onClick={() => setShowElevenKey(!showElevenKey)}
              className="absolute right-2 top-2.5 p-1 text-stone-400 hover:text-stone-200 transition-colors"
            >
              {showElevenKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleTestElevenLabs}
              disabled={testingEleven || !elevenLabsKey.trim()}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {testingEleven ? <Loader2 size={14} className="animate-spin" /> : <Volume2 size={14} />}
              <span>Sprawdź klucz i pobierz głosy</span>
            </button>
            {elevenLabsKey && (
              <span className="text-[11px] text-stone-400 font-mono">
                {maskApiKey(elevenLabsKey)}
              </span>
            )}
          </div>

          {elevenStatus && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                elevenStatus.ok
                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/50'
                  : 'bg-rose-950/40 text-rose-300 border border-rose-800/50'
              }`}
            >
              {elevenStatus.ok ? <CheckCircle2 size={16} className="shrink-0" /> : <AlertCircle size={16} className="shrink-0" />}
              <span>{elevenStatus.msg}</span>
            </div>
          )}

          {elevenVoices.length > 0 && (
            <div className="mt-2 bg-[#090d13] border border-[#1f2838] rounded-lg p-2.5 max-h-36 overflow-y-auto space-y-1">
              <span className="text-[11px] text-stone-400 block font-semibold mb-1">
                Dostępne głosy z Twojego konta ElevenLabs:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {elevenVoices.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between px-2 py-1 rounded bg-[#131a24] text-[11px] text-stone-200 border border-[#222c3c]"
                  >
                    <span className="truncate">{v.name}</span>
                    <span className="text-[9px] text-amber-400 uppercase tracking-wider">{v.category}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Persistence Preference Checkbox */}
        <div className="flex items-center gap-3 bg-[#0c1017] p-3 rounded-xl border border-[#1b2332]">
          <input
            id="persistKeysCheck"
            type="checkbox"
            checked={persistPref}
            onChange={(e) => setPersistPref(e.target.checked)}
            className="w-4 h-4 rounded text-amber-500 bg-[#161f2c] border-[#29374c] focus:ring-amber-500 focus:ring-offset-0 cursor-pointer"
          />
          <label htmlFor="persistKeysCheck" className="text-xs text-stone-300 font-sans cursor-pointer select-none">
            Pamiętaj klucze na tym urządzeniu (localStorage). Jeśli odznaczone, klucze zostaną skasowane po zamknięciu karty (sessionStorage).
          </label>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between border-t border-[#212c3f] pt-4">
          <button
            type="button"
            onClick={handleClearAll}
            className="px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-xs flex items-center gap-1.5 transition-colors"
          >
            <Trash2 size={14} />
            <span>Wyczyść klucze</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#18212e] hover:bg-[#253247] text-stone-300 text-xs transition-colors"
            >
              Anuluj
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors shadow-lg shadow-amber-950/50"
            >
              Zapisz i Zamknij
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
