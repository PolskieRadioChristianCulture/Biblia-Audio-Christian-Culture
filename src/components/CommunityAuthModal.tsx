import React, { useState } from 'react';
import {
  Lock,
  UserCheck,
  ShieldCheck,
  X,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Users,
  CheckCircle2,
  KeyRound
} from 'lucide-react';

interface CommunityAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: { name: string; email?: string; role?: string }) => void;
}

export const CommunityAuthModal: React.FC<CommunityAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [nameOrEmail, setNameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameOrEmail.trim()) {
      setErrorMsg('Podaj swój nick lub adres e-mail ze społeczności Christian Culture.');
      return;
    }

    const userData = {
      name: nameOrEmail.trim(),
      email: nameOrEmail.includes('@') ? nameOrEmail.trim() : undefined,
      role: 'Członek Społeczności',
    };

    localStorage.setItem('cc_community_member', JSON.stringify(userData));
    onLoginSuccess(userData);
    onClose();
  };

  const handleQuickCommanderLogin = () => {
    const userData = {
      name: 'Cezary Rogowski',
      email: 'kontakt@polskieradio.cc',
      role: 'Administrator / Założyciel',
    };
    localStorage.setItem('cc_community_member', JSON.stringify(userData));
    onLoginSuccess(userData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#10141e] border border-amber-500/50 rounded-2xl w-full max-w-lg p-6 sm:p-7 shadow-2xl space-y-6 text-stone-100 font-mono relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-[#222c3d] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center text-stone-950 shadow-lg shadow-amber-950/50 shrink-0">
              <Lock size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 uppercase tracking-widest">
                  Strefa Chroniona
                </span>
                <span className="text-stone-500 text-xs">•</span>
                <span className="text-xs text-amber-400 font-serif">Christian Culture</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold font-serif text-white mt-0.5">
                Strefa Członków Społeczności CC
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

        {/* Explanation */}
        <div className="bg-[#0b0e14] border border-[#1f2838] rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
            <ShieldCheck size={16} className="text-amber-400 shrink-0" />
            <span>Pobieranie audycji Master wymaga zalogowania</span>
          </div>
          <p className="text-xs text-stone-300 leading-relaxed">
            Cała usługa eksportu i pobierania gotowych audycji (filmów MP4 4K, masterów audio WAV 48kHz, podcastów MP3 oraz pakietów emisyjnych ZIP) jest dostępna <strong>wyłącznie dla zalogowanych członków społeczności Christian Culture</strong>.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleManualLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-300 block">
              Twój Nick lub E-mail ze Społeczności (LUMINA / CC):
            </label>
            <div className="relative">
              <input
                type="text"
                value={nameOrEmail}
                onChange={(e) => {
                  setNameOrEmail(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="np. Jan Kowalski lub jan@example.com"
                className="w-full bg-[#0d1118] border border-[#273347] focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-300 block">
              Hasło lub Kod Dostępny Członka (opcjonalnie):
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Wpisz hasło lub pozostaw puste dla profilu otwartego"
                className="w-full bg-[#0d1118] border border-[#273347] focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-red-400 bg-red-950/50 border border-red-800/60 p-2.5 rounded-lg">
              {errorMsg}
            </p>
          )}

          <div className="space-y-2.5 pt-1">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs shadow-lg shadow-amber-950/40 transition-all hover:scale-[1.01]"
            >
              <UserCheck size={16} />
              <span>ZALOGUJ SIĘ I ODBLOKUJ POBIERANIE AUDYCJI</span>
            </button>

            {/* Quick Login for Founder / Staff */}
            <button
              type="button"
              onClick={handleQuickCommanderLogin}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#141b25] hover:bg-[#1f2a3a] text-amber-300 hover:text-amber-200 border border-amber-600/30 text-xs font-mono transition-colors"
            >
              <KeyRound size={14} />
              <span>Szybki dostęp: Cezary Rogowski (Zaloguj jako Dowódca)</span>
            </button>
          </div>
        </form>

        {/* Register / Join Link */}
        <div className="border-t border-[#1f2838] pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-stone-400">
          <span>Nie masz jeszcze darmowego konta?</span>
          <a
            href="https://polskieradio.cc/lumina"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-bold underline transition-colors"
          >
            <span>Dołącz do Społeczności na portalu LUMINA</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
};
