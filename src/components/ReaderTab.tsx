import React, { useEffect, useRef } from 'react';
import type { BibleVerse } from '../types/god-answers';
import { getBookSummary } from '../utils/bible-engine';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  bookIndex: number;
  chapterNumber: number;
  highlightStart?: number;
  highlightEnd?: number;
  engine: any;
  onBookChange: (bookIndex: number) => void;
  onChapterChange: (chapterNumber: number) => void;
  onOpenStudy: (b: number, c: number, v: number) => void;
  onOpenWord: (term: string, b: number, c: number, v: number, wordText?: string) => void;
  onBack: () => void;
  onSaveReadingPosition: (pos: { b: number; c: number; v: number }) => void;
}

export const ReaderTab: React.FC<Props> = ({
  bookIndex,
  chapterNumber,
  highlightStart = 0,
  highlightEnd = 0,
  engine,
  onBookChange,
  onChapterChange,
  onOpenStudy,
  onOpenWord,
  onBack,
  onSaveReadingPosition,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  if (!engine) {
    return <div className="p-8 text-center text-[var(--muted)]">Caricamento del testo biblico…</div>;
  }

  const books: string[] = engine.bible.books;
  const counts: number[] = engine.bible.counts;
  const currentBookName = books[bookIndex] || 'Genesi';
  const totalChapters = counts[bookIndex] || 1;
  const verses: BibleVerse[] = engine.getChapter(bookIndex, chapterNumber);
  const bookSummary = getBookSummary(bookIndex, currentBookName);

  // Scroll to highlight if present
  useEffect(() => {
    if (highlightStart > 0) {
      setTimeout(() => {
        const el = document.getElementById(`verse-${highlightStart}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [bookIndex, chapterNumber, highlightStart]);

  // Track position when scrolling
  useEffect(() => {
    onSaveReadingPosition({ b: bookIndex, c: chapterNumber, v: highlightStart || 1 });
  }, [bookIndex, chapterNumber, highlightStart, onSaveReadingPosition]);

  const handlePrevChapter = () => {
    if (chapterNumber > 1) {
      onChapterChange(chapterNumber - 1);
    } else if (bookIndex > 0) {
      const prevBook = bookIndex - 1;
      onBookChange(prevBook);
      onChapterChange(counts[prevBook]);
    }
  };

  const handleNextChapter = () => {
    if (chapterNumber < totalChapters) {
      onChapterChange(chapterNumber + 1);
    } else if (bookIndex < books.length - 1) {
      const nextBook = bookIndex + 1;
      onBookChange(nextBook);
      onChapterChange(1);
    }
  };

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

    const studyBtn = target.closest('[data-action="study"]') as HTMLElement | null;
    if (studyBtn) {
      e.preventDefault();
      const b = Number(studyBtn.dataset.book);
      const c = Number(studyBtn.dataset.chapter);
      const v = Number(studyBtn.dataset.verse);
      if (!isNaN(b) && !isNaN(c) && !isNaN(v)) {
        onOpenStudy(b, c, v);
      }
    }
  };

  return (
    <div ref={containerRef}>
      <button
        type="button"
        className="text-button back-link flex items-center gap-1.5"
        onClick={onBack}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Torna indietro</span>
      </button>

      <div className="page-head">
        <span className="eyebrow">BIBBIA APERTA · ITALIANO 2026</span>
        <h1>
          {currentBookName} <span>{chapterNumber}</span>
        </h1>
      </div>

      <div className="reader-picker">
        <select
          id="book-picker"
          aria-label="Scegli libro"
          value={bookIndex}
          onChange={(e) => {
            onBookChange(Number(e.target.value));
            onChapterChange(1);
          }}
        >
          {books.map((name, i) => (
            <option key={name} value={i}>
              {name}
            </option>
          ))}
        </select>

        <select
          id="chapter-picker"
          aria-label="Scegli capitolo"
          value={chapterNumber}
          onChange={(e) => onChapterChange(Number(e.target.value))}
        >
          {Array.from({ length: totalChapters }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>
      </div>

      <p className="book-summary">{bookSummary}</p>

      <p className="reader-help mb-4">
        Gli apici [v] aprono gli approfondimenti per ogni versetto. Le parole blu hanno una spiegazione al tocco.
      </p>

      <div
        className="reader-verses"
        data-book={bookIndex}
        data-chapter={chapterNumber}
        onClick={handleContentClick}
      >
        {verses.map((v) => {
          const vNum = v[2];
          const isHighlighted = vNum >= highlightStart && vNum <= highlightEnd && highlightStart > 0;
          const rawHtml =
            typeof window !== 'undefined' && window.GodScripture
              ? window.GodScripture.html(v[3], { b: v[0], c: v[1], v: v[2] })
              : v[3];

          return (
            <p
              key={vNum}
              id={`verse-${vNum}`}
              className={isHighlighted ? 'highlight' : ''}
            >
              <sup>{vNum}</sup>
              <span dangerouslySetInnerHTML={{ __html: rawHtml }} />
              <sup className="reader-note">
                <button
                  type="button"
                  data-action="study"
                  data-book={bookIndex}
                  data-chapter={chapterNumber}
                  data-verse={vNum}
                  aria-label={`Approfondisci ${currentBookName} ${chapterNumber}:${vNum}`}
                >
                  [{vNum}]
                </button>
              </sup>
            </p>
          );
        })}
      </div>

      <div className="chapter-controls">
        <button
          type="button"
          onClick={handlePrevChapter}
          disabled={bookIndex === 0 && chapterNumber === 1}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Precedente</span>
        </button>

        <button
          type="button"
          onClick={handleNextChapter}
          disabled={bookIndex === books.length - 1 && chapterNumber === totalChapters}
          className="flex items-center gap-1"
        >
          <span>Successivo</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <p className="microcopy mt-8">
        Open Translation Bible, edizione italiana 2026 · CC BY-SA 4.0. Testo biblico distinto dalle note editoriali di God Answers.
      </p>
    </div>
  );
};
