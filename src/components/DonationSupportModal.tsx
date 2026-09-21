import React, { useState } from 'react';
import {
  Heart,
  Sparkles,
  X,
  CreditCard,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Radio,
  Tv,
  Coins
} from 'lucide-react';

interface DonationSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedAnyway?: () => void;
}

export const DonationSupportModal: React.FC<DonationSupportModalProps> = ({
  isOpen,
  onClose,
  onProceedAnyway,
}) => {
  const [selectedAmount, setSelectedAmount] = useState<number | 'custom'>(50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [copiedBank, setCopiedBank] = useState<boolean>(false);
  const [copiedBlik, setCopiedBlik] = useState<boolean>(false);

  if (!isOpen) return null;

  const amounts = [20, 50, 100, 200];

  const handleCopyAccount = () => {
    navigator.clipboard.writeText('48291000060000000005272629');
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2500);
  };

  const handleCopyBlik = () => {
    navigator.clipboard.writeText('537137043');
    setCopiedBlik(true);
    setTimeout(() => setCopiedBlik(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#111622] border border-amber-500/50 rounded-2xl w-full max-w-xl p-6 sm:p-7 shadow-2xl space-y-6 text-stone-100 font-mono relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-52 h-52 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-[#212c3f] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 via-amber-500 to-amber-600 flex items-center justify-center text-stone-950 shadow-lg shadow-amber-950/40 shrink-0">
              <Heart size={22} className="fill-current text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 uppercase tracking-widest">
                  Mecenat Misyjny
                </span>
                <span className="text-stone-500 text-xs">•</span>
                <span className="text-xs text-amber-400 font-serif">CC STUDIO DAW</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold font-serif text-white mt-0.5">
                Wesprzyj Projekt CC STUDIO Dobrowolnym Darem
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

        {/* Vision & Mission Explanation */}
        <div className="bg-[#0b0f16] border border-[#1e2738] rounded-xl p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
            <Sparkles size={16} className="text-amber-400 shrink-0" />
            <span>Słowo Boże za Darmo — Infrastruktura Wymaga Wsparcia</span>
          </div>
          <p className="text-xs text-stone-300 leading-relaxed">
            Projekt <strong>CC STUDIO DAW</strong> powstał, aby bezpłatnie i na najwyższym światowym poziomie niosło Słowo Boże do tysięcy domów, zborów i parafii. Utrzymanie serwerów renderujących wideo 4K, syntezy mowy Gemini AI, masteringu emisyjnego oraz bibliotek audio jest możliwe <strong>wyłącznie dzięki dobrowolnym darom finansowym naszych słuchaczy i użytkowników</strong>.
          </p>
        </div>

        {/* Amount Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-stone-300 block flex items-center justify-between">
            <span>Wybierz kwotę dobrowolnego daru:</span>
            <span className="text-[11px] text-amber-400">100% kwoty wspiera rozwój studia</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {amounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setSelectedAmount(amt)}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold font-mono transition-all border ${
                  selectedAmount === amt
                    ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md shadow-amber-950/50 scale-[1.03]'
                    : 'bg-[#151c27] text-stone-300 border-[#263345] hover:bg-[#1d2737]'
                }`}
              >
                {amt} PLN
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setSelectedAmount('custom')}
            className={`w-full py-2 px-3 rounded-xl text-xs font-mono border transition-all ${
              selectedAmount === 'custom'
                ? 'bg-amber-500 text-stone-950 font-bold border-amber-400'
                : 'bg-[#121822] text-stone-400 border-[#212b3a] hover:bg-[#18202d]'
            }`}
          >
            Inna dowolna kwota daru
          </button>

          {selectedAmount === 'custom' && (
            <div className="pt-1">
              <input
                type="number"
                min="5"
                step="5"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Wpisz kwotę w PLN (np. 150)"
                className="w-full bg-[#0d121a] border border-amber-500/60 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Action Donation Channels */}
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <a
              href="https://patronite.pl/osobowoscplus"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#c2410c] hover:bg-[#ea580c] text-white font-bold text-xs shadow-md transition-all hover:scale-[1.01]"
            >
              <span>PATRONITE</span>
              <ExternalLink size={13} />
            </a>

            <a
              href="https://revolut.me/christianculture"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#0075eb] hover:bg-[#1a88ff] text-white font-bold text-xs shadow-md transition-all hover:scale-[1.01]"
            >
              <span>REVOLUT PAY</span>
              <ExternalLink size={13} />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <a
              href="https://zrzutka.pl/rs4g4v"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs shadow-md transition-all hover:scale-[1.01]"
            >
              <span>ZRZUTKA 1 (rs4g4v)</span>
              <ExternalLink size={13} />
            </a>

            <a
              href="https://zrzutka.pl/3bbxzn"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-md transition-all hover:scale-[1.01]"
            >
              <span>ZRZUTKA 2 (3bbxzn)</span>
              <ExternalLink size={13} />
            </a>
          </div>

          {/* Bank Transfer Info Box */}
          <div className="bg-[#0b0e15] border border-[#1e2738] rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs">
            <div className="min-w-0">
              <span className="text-[10px] text-stone-400 uppercase block">Oficjalne Konto Bankowe CC:</span>
              <span className="text-amber-300 font-mono text-[11px] truncate block">
                48 2910 0006 0000 0000 0527 2629
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyAccount}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1a2331] hover:bg-[#253245] text-stone-300 hover:text-white border border-[#2b394e] text-[11px] shrink-0 transition-colors"
            >
              {copiedBank ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copiedBank ? 'Skopiowano' : 'Kopiuj'}</span>
            </button>
          </div>

          {/* BLIK Info Box */}
          <div className="bg-[#0b0e15] border border-[#1e2738] rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs">
            <div className="min-w-0">
              <span className="text-[10px] text-stone-400 uppercase block">Przelew na Telefon / BLIK:</span>
              <span className="text-amber-300 font-mono text-[11px] truncate block">
                537 137 043
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyBlik}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1a2331] hover:bg-[#253245] text-stone-300 hover:text-white border border-[#2b394e] text-[11px] shrink-0 transition-colors"
            >
              {copiedBlik ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copiedBlik ? 'Skopiowano' : 'Kopiuj'}</span>
            </button>
          </div>
        </div>

        {/* Close & Continue Options */}
        <div className="border-t border-[#1f2838] pt-3 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => {
              if (onProceedAnyway) onProceedAnyway();
              onClose();
            }}
            className="text-stone-400 hover:text-stone-200 transition-colors underline text-[11px]"
          >
            Wspieram modlitwą • Pobierz bezpłatnie
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#18212e] hover:bg-[#253247] text-stone-200 text-xs font-bold"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
};
