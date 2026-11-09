import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

interface Props {
  variant?: 'header' | 'settings' | 'banner';
}

export const PWAInstallButton: React.FC<Props> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    if (variant === 'settings') {
      return (
        <button
          onClick={install}
          className="flex items-center gap-2 rounded-xl bg-[#254f3e] dark:bg-[#bcd2b5] px-4 py-2.5 text-xs font-semibold text-[#fff9ec] dark:text-[#142a27] shadow-sm hover:opacity-90 transition w-full justify-center"
        >
          <Download className="w-4 h-4" />
          Aggiungi God Answers alla schermata Home (PWA)
        </button>
      );
    }

    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-[#f2ebdb] hover:bg-white/20 transition"
        title="Installa God Answers come app"
        aria-label="Installa app"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Installa App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        {variant === 'settings' ? (
          <button
            onClick={() => setShowIOSGuide(true)}
            className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--soft)] px-4 py-2.5 text-xs font-semibold text-[var(--ink)] hover:border-[var(--accent)] transition w-full justify-center"
          >
            <Smartphone className="w-4 h-4 text-[var(--accent)]" />
            Come installare su iPhone / iPad
          </button>
        ) : (
          <button
            onClick={() => setShowIOSGuide(true)}
            className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-[#f2ebdb] hover:bg-white/20 transition"
            aria-label="Installa su iOS"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Installa su iOS</span>
          </button>
        )}

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[var(--card)] border border-[var(--line)] p-6 shadow-2xl text-[var(--ink)]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-serif font-medium">Installa su iPhone e iPad</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-full p-1 text-[var(--muted)] hover:text-[var(--ink)]"
                  aria-label="Chiudi"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-[var(--muted)] leading-relaxed mb-4">
                Per usare God Answers come una vera app a schermo intero e offline sul tuo dispositivo Apple:
              </p>
              <ol className="text-xs text-[var(--ink)] space-y-2.5 list-decimal pl-4 mb-5">
                <li>Tocca l'icona <strong>Condividi</strong> (quadrato con freccia in alto) nella barra inferiore di Safari.</li>
                <li>Scorri le opzioni verso il basso e seleziona <strong>Aggiungi alla schermata Home</strong>.</li>
                <li>Conferma toccando <strong>Aggiungi</strong> in alto a destra.</li>
              </ol>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-[#254f3e] dark:bg-[#bcd2b5] text-[#fff9ec] dark:text-[#142a27] py-2.5 text-xs font-semibold transition"
              >
                Ho capito
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
