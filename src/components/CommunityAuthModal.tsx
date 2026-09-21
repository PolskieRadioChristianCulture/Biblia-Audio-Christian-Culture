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
  KeyRound,
  Loader2
} from 'lucide-react';
import { loginWithGoogle } from '../lib/firebaseClient';

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
  const [isLoggingInGoogle, setIsLoggingInGoogle] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsLoggingInGoogle(true);
    setErrorMsg(null);
    try {
      const user = await loginWithGoogle();
      const isAdmin = user.email === 'nazirczarkes@gmail.com';
      const userData = {
        name: user.displayName || user.email?.split('@')[0] || 'Członek CC',
        email: user.email || undefined,
        role: isAdmin ? 'Administrator / Dowódca' : 'Członek Społeczności LUMINA',
      };
      localStorage.setItem('cc_community_member', JSON.stringify(userData));
      onLoginSuccess(userData);
      onClose();
    } catch (err: any) {
      console.error('Błąd logowania Google:', err);
      setErrorMsg(err.message || 'Błąd logowania przez konto Google.');
    } finally {
      setIsLoggingInGoogle(false);
    }
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameOrEmail.trim()) {
      setErrorMsg('Podaj swój nick lub adres e-mail ze społeczności Christian Culture.');
      return;
    }

    const isAdmin = nameOrEmail.trim() === 'nazirczarkes@gmail.com';
    const userData = {
      name: nameOrEmail.trim(),
      email: nameOrEmail.includes('@') ? nameOrEmail.trim() : undefined,
      role: isAdmin ? 'Administrator / Dowódca' : 'Członek Społeczności',
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
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoggingInGoogle}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-white hover:bg-stone-100 text-stone-900 font-bold text-xs shadow-lg transition-all hover:scale-[1.01] disabled:opacity-50"
            >
              {isLoggingInGoogle ? (
                <Loader2 size={16} className="animate-spin text-stone-900" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              )}
              <span>ZALOGUJ PRZEZ GOOGLE (LUMINA)</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-[#1f2838]"></div>
              <span className="flex-shrink mx-3 text-[10px] text-stone-500 uppercase tracking-widest">lub nick/email</span>
              <div className="flex-grow border-t border-[#1f2838]"></div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs shadow-md transition-all"
            >
              <UserCheck size={15} />
              <span>Zaloguj profilem otwartym</span>
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
