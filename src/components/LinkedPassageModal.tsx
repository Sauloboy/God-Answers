import React from 'react';
import type { BibleVerse } from '../types/god-answers';
import { X, ArrowRight } from 'lucide-react';

interface Props {
  passage: {
    ref: string;
    b: number;
    c: number;
    start: number;
    end: number;
    verses: BibleVerse[];
    total: number;
  };
  engine: any;
  onClose: () => void;
  onOpenInReader: (b: number, c: number, start: number, end: number) => void;
}

export const LinkedPassageModal: React.FC<Props> = ({
  passage,
  engine,
  onClose,
  onOpenInReader,
}) => {
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="linked-sheet-title"
    >
      <section className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2 id="linked-sheet-title">{passage.ref}</h2>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Chiudi passo collegato"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="verse-text linked-preview">
          {passage.verses.map((v) => {
            const vBook = engine?.bible?.books[v[0]] || '';
            const rawHtml =
              typeof window !== 'undefined' && window.GodScripture
                ? window.GodScripture.html(v[3], { b: v[0], c: v[1], v: v[2] })
                : v[3];
            return (
              <p key={`${v[0]}_${v[1]}_${v[2]}`}>
                <sup>{`${vBook} ${v[1]}:${v[2]}`}</sup>
                <span dangerouslySetInnerHTML={{ __html: rawHtml }} />
              </p>
            );
          })}
        </div>

        {passage.total > passage.verses.length && (
          <p className="tiny mt-2 text-[var(--muted)]">
            Sono mostrati i primi {passage.verses.length} versetti del riferimento. Prosegui nei capitoli per leggere il seguito.
          </p>
        )}

        <div className="edition mt-3">Bibbia Aperta · OTB 2026</div>

        <button
          type="button"
          className="primary w-full mt-4 flex items-center justify-center gap-2"
          onClick={() => {
            onClose();
            onOpenInReader(passage.b, passage.c, passage.start, passage.end);
          }}
        >
          <span>Leggi nel capitolo completo</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </div>
  );
};
