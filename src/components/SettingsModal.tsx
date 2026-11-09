import React, { useState } from 'react';
import type { SavedState } from '../types/god-answers';
import { exportBackup, validateAndMergeBackup } from '../utils/bible-engine';
import { PWAInstallButton } from './PWAInstallButton';
import {
  X,
  Copy,
  Upload,
  ExternalLink,
  Check,
  Sun,
  Moon,
  Type,
  Sparkles,
  Smartphone,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';

interface Props {
  savedState: SavedState;
  engine: any;
  onClose: () => void;
  onUpdateState: (updater: (prev: SavedState) => SavedState) => void;
  onToast: (msg: string) => void;
}

export const SettingsModal: React.FC<Props> = ({
  savedState,
  engine,
  onClose,
  onUpdateState,
  onToast,
}) => {
  const [showRestoreSheet, setShowRestoreSheet] = useState(false);
  const [backupInput, setBackupInput] = useState('');
  const [copiedBackup, setCopiedBackup] = useState(false);

  const handleCopyBackup = async () => {
    const jsonStr = exportBackup(savedState);
    try {
      await navigator.clipboard.writeText(jsonStr);
      setCopiedBackup(true);
      onToast('Backup copiato negli appunti');
      setTimeout(() => setCopiedBackup(false), 2500);
    } catch {
      onToast('Impossibile copiare negli appunti');
    }
  };

  const handleRestoreBackup = () => {
    if (!backupInput.trim()) {
      onToast('Incolla prima il testo del backup JSON');
      return;
    }

    const res = validateAndMergeBackup(savedState, backupInput, engine);
    if (res.success && res.state) {
      onUpdateState(() => res.state!);
      setShowRestoreSheet(false);
      setBackupInput('');
      onToast('Backup importato con successo!');
    } else {
      onToast(res.error || 'Il testo non è un backup valido di God Answers.');
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <section className="sheet max-w-xl w-full" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sheet-head pb-3 border-b border-[var(--line)]">
          <div>
            <h2 id="settings-title" className="text-lg font-serif font-bold text-[var(--foreground)]">
              {showRestoreSheet ? 'Ripristina i tuoi appunti' : 'Impostazioni & Personalizzazione'}
            </h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              {showRestoreSheet
                ? 'Importa i dati salvati in precedenza'
                : 'Configura l’esperienza di lettura, ricerca e aspetto visivo'}
            </p>
          </div>
          <button
            className="close-button"
            onClick={showRestoreSheet ? () => setShowRestoreSheet(false) : onClose}
            aria-label="Chiudi finestra impostazioni"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {showRestoreSheet ? (
          <div className="py-4">
            <p className="text-xs text-[var(--muted)] leading-relaxed mb-3">
              Incolla qui il codice JSON del tuo backup. I passi salvati e le note personali verranno integrati con quelli attuali; in caso di conflitto, prevarrà la versione del backup.
            </p>
            <textarea
              className="note-input font-mono text-xs leading-relaxed"
              rows={8}
              value={backupInput}
              onChange={(e) => setBackupInput(e.target.value)}
              placeholder='{ "app": "god-answers", "version": 1, ... }'
            />
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                className="primary flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold"
                onClick={handleRestoreBackup}
              >
                <Upload className="w-4 h-4" />
                <span>Conferma e importa backup</span>
              </button>
              <button
                type="button"
                className="px-4 py-2 text-xs text-[var(--muted)] border border-[var(--line)] rounded-xl hover:bg-[var(--soft)]"
                onClick={() => setShowRestoreSheet(false)}
              >
                Annulla
              </button>
            </div>
          </div>
        ) : (
          <div className="py-2 divide-y divide-[var(--line)]">
            {/* Sezione 1: Lettura & Aspetto */}
            <div className="py-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                <Type className="w-4 h-4" />
                <span>Lettura &amp; Aspetto</span>
              </div>

              {/* Tema */}
              <div className="setting-row border-none py-1">
                <div>
                  <label htmlFor="theme-select" className="font-medium text-xs block text-[var(--foreground)]">
                    Tema interfaccia
                  </label>
                  <span className="text-[11px] text-[var(--muted)]">
                    Modalità per il giorno o per la lettura notturna
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-[var(--soft)] p-1 rounded-xl border border-[var(--line)]">
                  <button
                    type="button"
                    onClick={() => onUpdateState((prev) => ({ ...prev, theme: 'light' }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      savedState.theme === 'light'
                        ? 'bg-[var(--card)] text-[var(--foreground)] shadow-xs font-semibold'
                        : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>Chiaro</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateState((prev) => ({ ...prev, theme: 'dark' }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      savedState.theme === 'dark'
                        ? 'bg-[var(--card)] text-[var(--foreground)] shadow-xs font-semibold'
                        : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Scuro</span>
                  </button>
                </div>
              </div>

              {/* Dimensione testo */}
              <div className="setting-row border-none py-1">
                <div>
                  <label htmlFor="size-select" className="font-medium text-xs block text-[var(--foreground)]">
                    Dimensione carattere
                  </label>
                  <span className="text-[11px] text-[var(--muted)]">
                    Grandezza dei versetti e delle note
                  </span>
                </div>
                <select
                  id="size-select"
                  value={savedState.size}
                  onChange={(e) => {
                    const size = e.target.value as 'normal' | 'large' | 'very-large';
                    onUpdateState((prev) => ({ ...prev, size }));
                  }}
                  className="text-xs bg-[var(--card)] text-[var(--foreground)] border border-[var(--line)] rounded-xl px-3 py-1.5 outline-none cursor-pointer"
                >
                  <option value="normal">Normale (15px)</option>
                  <option value="large">Grande (17px)</option>
                  <option value="very-large">Molto grande (19px)</option>
                </select>
              </div>
            </div>

            {/* Sezione 2: Ricerca Intelligente & Ragionamento Biblico */}
            <div className="py-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                <Sparkles className="w-4 h-4" />
                <span>Ricerca &amp; Ragionamento Biblico</span>
              </div>

              <div className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--card)]">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div>
                    <span className="font-semibold text-xs text-[var(--foreground)] block">
                      Ragionamento Tematico &amp; Etico Locale
                    </span>
                    <span className="text-[11px] text-[var(--muted)] block mt-0.5">
                      Trova risposte a domande morali ed etiche (es. cura degli animali, debiti, perdono familiare)
                    </span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={savedState.ai !== false}
                    onClick={() =>
                      onUpdateState((prev) => ({ ...prev, ai: prev.ai === false ? true : false }))
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      savedState.ai !== false ? 'bg-[var(--accent)]' : 'bg-[var(--line)]'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        savedState.ai !== false ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                  Il motore ragiona sui concetti profondi della Scrittura e inserisce direttamente i passi più attinenti in cima ai risultati. Funziona al 100% in locale nel tuo browser, garantendo riservatezza totale.
                </p>
              </div>
            </div>

            {/* Sezione 3: PWA & Accesso Offline */}
            <div className="py-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                <Smartphone className="w-4 h-4" />
                <span>Applicazione &amp; Accesso Offline</span>
              </div>

              <div className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--soft)]">
                <p className="font-semibold text-xs text-[var(--foreground)] mb-1">
                  Installazione PWA su Smartphone e Computer
                </p>
                <p className="text-xs text-[var(--muted)] mb-3 leading-relaxed">
                  Installa God Answers sul tuo dispositivo per avviarlo all'istante anche in assenza di segnale o Wi-Fi. Tutti i 66 libri e l'intero motore di ricerca sono già integrati offline.
                </p>
                <PWAInstallButton variant="settings" />
              </div>
            </div>

            {/* Sezione 4: Dati Personali & Salvataggi */}
            <div className="py-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                <ShieldCheck className="w-4 h-4" />
                <span>Salvataggi &amp; Privacy Personale</span>
              </div>

              <p className="text-xs text-[var(--muted)] leading-relaxed">
                I tuoi versetti preferiti, gli appunti di studio e la cronologia rimangono conservati esclusivamente nella memoria locale del tuo browser. Nessun dato personale viene mai inviato o salvato su server remoti.
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyBackup}
                  className="px-3.5 py-2 text-xs font-medium rounded-xl border border-[var(--line)] bg-[var(--card)] hover:bg-[var(--soft)] text-[var(--foreground)] flex items-center gap-2 transition-all shadow-2xs"
                >
                  {copiedBackup ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-[var(--muted)]" />
                  )}
                  <span>{copiedBackup ? 'Backup copiato!' : 'Copia backup (JSON)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowRestoreSheet(true)}
                  className="px-3.5 py-2 text-xs font-medium rounded-xl border border-[var(--line)] bg-[var(--card)] hover:bg-[var(--soft)] text-[var(--foreground)] flex items-center gap-2 transition-all shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5 text-[var(--muted)]" />
                  <span>Ripristina backup</span>
                </button>
              </div>
            </div>

            {/* Sezione 5: Fonti del Testo & Licenze */}
            <div className="py-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                <BookOpen className="w-4 h-4" />
                <span>Fonti del Testo &amp; Licenze</span>
              </div>

              <div className="space-y-2 text-xs text-[var(--muted)] leading-relaxed">
                <p>
                  <strong className="text-[var(--foreground)] font-medium">Testo Biblico:</strong>{' '}
                  Bibbia Aperta — Open Translation Bible (OTB), italiano 2026. Comprende i 66 libri del canone biblico, 1.189 capitoli e 31.103 versetti. Progetto aperto e moderno, distinto da altre versioni storiche.
                </p>
                <p>
                  <strong className="text-[var(--foreground)] font-medium">Note Esegetiche:</strong>{' '}
                  Approfondimenti armonizzati e revisionati da Tyndale Open Study Notes (CC BY-SA 4.0), arricchiti con percorsi tematici e chiavi di lettura contemporanee create per God Answers.
                </p>
                <p>
                  <strong className="text-[var(--foreground)] font-medium">Riferimenti Incrociati:</strong>{' '}
                  Oltre 340.000 collegamenti scritturali curati da OpenBible.info e dal Treasury of Scripture Knowledge.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <a
                  href="https://www.openbible.uk/it-IT/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-[11px] rounded-lg border border-[var(--line)] bg-[var(--card)] hover:bg-[var(--soft)] text-[var(--foreground)] flex items-center gap-1.5 transition-all"
                >
                  <span>Fonte del testo</span>
                  <ExternalLink className="w-3 h-3 text-[var(--muted)]" />
                </a>

                <a
                  href="https://tyndaleopenresources.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-[11px] rounded-lg border border-[var(--line)] bg-[var(--card)] hover:bg-[var(--soft)] text-[var(--foreground)] flex items-center gap-1.5 transition-all"
                >
                  <span>Fonte delle note</span>
                  <ExternalLink className="w-3 h-3 text-[var(--muted)]" />
                </a>

                <a
                  href="https://www.openbible.info/labs/cross-references/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-[11px] rounded-lg border border-[var(--line)] bg-[var(--card)] hover:bg-[var(--soft)] text-[var(--foreground)] flex items-center gap-1.5 transition-all"
                >
                  <span>Collegamenti</span>
                  <ExternalLink className="w-3 h-3 text-[var(--muted)]" />
                </a>

                <a
                  href="https://creativecommons.org/licenses/by-sa/4.0/deed.it"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-[11px] rounded-lg border border-[var(--line)] bg-[var(--card)] hover:bg-[var(--soft)] text-[var(--foreground)] flex items-center gap-1.5 transition-all"
                >
                  <span>Licenza CC BY-SA 4.0</span>
                  <ExternalLink className="w-3 h-3 text-[var(--muted)]" />
                </a>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 text-center">
              <p className="text-[11px] text-[var(--muted)]">
                <strong className="text-[var(--foreground)]">God Answers 0.7.0</strong> · Ragionamento Biblico &amp; Studio Unificato
              </p>
              <p className="text-[10px] text-[var(--muted)]/80 mt-1">
                La Parola nella vita quotidiana · Funziona interamente offline
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
