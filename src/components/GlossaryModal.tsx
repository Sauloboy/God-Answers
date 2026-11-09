import React from 'react';
import type { GlossaryWord } from '../types/god-answers';
import { X, ArrowRight } from 'lucide-react';

interface Props {
  word: GlossaryWord;
  bookName: string;
  chapterNumber: number;
  verseNumber: number;
  engine: any;
  onClose: () => void;
  onOpenLinkedPassage: (target: number[]) => void;
}

export const GlossaryModal: React.FC<Props> = ({
  word,
  bookName,
  chapterNumber,
  verseNumber,
  engine,
  onClose,
  onOpenLinkedPassage,
}) => {
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="glossary-sheet-title"
    >
      <section className="sheet word-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2 id="glossary-sheet-title">{word.label}</h2>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Chiudi spiegazione termine"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="word-location">
          {bookName} {chapterNumber}:{verseNumber}
        </p>

        <p className="word-meaning">{word.meaning}</p>

        {word.attention && <p className="word-attention mt-3">{word.attention}</p>}

        {word.references && word.references.length > 0 && (
          <details className="word-read-more" open>
            <summary>Riferimenti per approfondire</summary>
            <div className="word-references">
              {word.references.map(([rb, rc, rs, re], idx) => {
                const refBook = engine?.bible?.books[rb] || '';
                const refLabel = `${refBook} ${rc}:${rs}${rs !== re ? '–' + re : ''}`;
                return (
                  <button
                    key={idx}
                    type="button"
                    className="text-button flex items-center gap-1"
                    onClick={() => onOpenLinkedPassage([rb, rc, rs, rb, rc, re])}
                  >
                    <span>{refLabel}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                );
              })}
            </div>
          </details>
        )}

        <p className="word-credit">
          Glossario di God Answers · spiegazione editoriale distinta dal testo biblico.
        </p>
      </section>
    </div>
  );
};
