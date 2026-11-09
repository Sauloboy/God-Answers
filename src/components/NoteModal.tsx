import React, { useState } from 'react';
import type { DocItem } from '../types/god-answers';
import { X, Save } from 'lucide-react';

interface Props {
  doc: DocItem;
  initialNote: string;
  onClose: () => void;
  onSaveNote: (docId: string, text: string) => void;
}

export const NoteModal: React.FC<Props> = ({
  doc,
  initialNote,
  onClose,
  onSaveNote,
}) => {
  const [text, setText] = useState(initialNote);

  const handleSave = () => {
    onSaveNote(doc.id, text);
    onClose();
  };

  const plainExcerpt = doc.verses
    .map((v) => (typeof window !== 'undefined' && window.GodScripture ? window.GodScripture.plain(v[3]) : v[3]))
    .join(' ');

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="note-sheet-title"
    >
      <section className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2 id="note-sheet-title">Il tuo appunto</h2>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Chiudi editor appunto"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="reference">{doc.ref}</p>
        <p className="text-xs text-[var(--muted)] my-2 italic line-clamp-3">
          "{plainExcerpt.slice(0, 280)}{plainExcerpt.length > 280 ? '…' : ''}"
        </p>

        <label htmlFor="personal-note" className="tiny font-semibold block mt-4 mb-1">
          Che cosa ti lascia questo passo?
        </label>
        <textarea
          id="personal-note"
          className="note-input"
          maxLength={10000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Scrivi liberamente riflessioni, pensieri o collegamenti personali…"
          rows={5}
        />

        <button
          type="button"
          className="primary w-full flex items-center justify-center gap-2 mt-2"
          onClick={handleSave}
        >
          <Save className="w-4 h-4" />
          <span>Salva appunto</span>
        </button>

        <p className="setting-description text-[11px] text-[var(--muted)] mt-4">
          L’appunto viene conservato localmente nella memoria del tuo browser/PWA, senza essere inviato in rete.
        </p>
      </section>
    </div>
  );
};
