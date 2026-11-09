import React, { useState, useEffect } from 'react';
import type { StudyData } from '../types/god-answers';
import { getBookSummary } from '../utils/bible-engine';
import { buildUnifiedNotesHtml } from '../utils/unified-notes';
import { X } from 'lucide-react';

interface Props {
  bookIndex: number;
  chapterNumber: number;
  verseNumber: number;
  engine: any;
  onClose: () => void;
  onOpenWord: (term: string, b: number, c: number, v: number, wordText?: string) => void;
  onOpenLinkedPassage: (target: number[]) => void;
}

export const StudyModal: React.FC<Props> = ({
  bookIndex,
  chapterNumber,
  verseNumber,
  engine,
  onClose,
  onOpenWord,
  onOpenLinkedPassage,
}) => {
  const [studyData, setStudyData] = useState<StudyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'notes' | 'related'>('notes');

  const bookName = engine?.bible?.books[bookIndex] || '';
  const title = `${bookName} ${chapterNumber}:${verseNumber}`;

  useEffect(() => {
    if (!engine || typeof window === 'undefined' || !window.GodStudy) return;

    setLoading(true);
    const verses = engine.getChapter(bookIndex, chapterNumber).filter((x: any) => x[2] === verseNumber);
    const bookContext = getBookSummary(bookIndex, bookName);
    const curated = engine.curated.find(
      (x: any) => x.b === bookIndex && x.c === chapterNumber && verseNumber >= x.start && verseNumber <= x.end
    ) || null;

    window.GodStudy.get({
      b: bookIndex,
      c: chapterNumber,
      start: verseNumber,
      end: verseNumber,
      verses,
      bookName,
      curated,
      bookContext,
    })
      .then((data) => {
        setStudyData(data);
      })
      .catch((err) => {
        console.error('Failed to load verse study:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [bookIndex, chapterNumber, verseNumber, engine, bookName]);

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const wordBtn = target.closest('[data-action="word"]') as HTMLElement | null;
    if (wordBtn) {
      e.preventDefault();
      const term = wordBtn.dataset.term;
      const b = Number(wordBtn.dataset.book);
      const c = Number(wordBtn.dataset.chapter);
      const v = Number(wordBtn.dataset.verse);
      if (term && !isNaN(b) && !isNaN(c) && !isNaN(v)) {
        onOpenWord(term, b, c, v, wordBtn.textContent || '');
      }
      return;
    }

    const linkedBtn = target.closest('[data-action="linked-passage"]') as HTMLElement | null;
    if (linkedBtn && linkedBtn.dataset.target) {
      e.preventDefault();
      const targetCoords = linkedBtn.dataset.target.split('_').map(Number);
      onOpenLinkedPassage(targetCoords);
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
      aria-labelledby="study-sheet-title"
    >
      <section className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2 id="study-sheet-title">{title}</h2>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Chiudi finestra approfondimenti"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="study-view" onClick={handleContentClick}>
          {loading && (
            <p className="study-loading" role="status">
              Apertura degli approfondimenti…
            </p>
          )}

          {studyData && (
            <div>
              <div className="study-tabs" role="tablist" aria-label="Approfondimenti">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'notes'}
                  onClick={() => setActiveTab('notes')}
                >
                  Note
                </button>
                <button
                  type="button"
                  role="tab"
                  data-study-tab="related"
                  aria-selected={activeTab === 'related'}
                  onClick={() => setActiveTab('related')}
                >
                  Passi collegati
                </button>
              </div>

              {/* Scheda Note unificata: Contesto storico, Analisi e Note senza ridondanze */}
              <section
                className="study-tab-panel"
                hidden={activeTab !== 'notes'}
                dangerouslySetInnerHTML={{ __html: buildUnifiedNotesHtml(studyData) }}
              />

              <section
                className="study-tab-panel"
                hidden={activeTab !== 'related'}
                dangerouslySetInnerHTML={{ __html: studyData.related }}
              />

              <div
                className="study-attribution"
                dangerouslySetInnerHTML={{ __html: studyData.attribution }}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
