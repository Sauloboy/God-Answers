import React from 'react';
import { ArrowRight, BookOpen } from 'lucide-react';
import type { SavedState } from '../types/god-answers';

interface Props {
  engine: any;
  savedState: SavedState;
  onSelectTopicQuestion: (question: string) => void;
  onOpenReader: () => void;
}

export const ExploreTab: React.FC<Props> = ({
  engine,
  savedState,
  onSelectTopicQuestion,
  onOpenReader,
}) => {
  if (!engine) {
    return <div className="p-8 text-center text-[var(--muted)]">Caricamento in corso…</div>;
  }

  const topics: { id: string; title: string; question: string }[] = engine.topics || [];
  const position = savedState.readingPosition;
  const positionBookName = position ? engine.bible.books[position.b] : null;

  return (
    <div>
      <div className="page-head">
        <span className="eyebrow">TEMI E TESTI</span>
        <h1>
          Vai più
          <br />
          in profondità.
        </h1>
        <p>Segui ciò che ti sta a cuore. Oppure apri un libro e lascia che sia il testo a guidarti.</p>
      </div>

      <section className="daily">
        <h3>Ogni passo ha una storia.</h3>
        <p className="tiny">66 libri · 1.189 capitoli · testo completo offline</p>
        <button
          type="button"
          className="primary mt-3"
          onClick={onOpenReader}
        >
          <BookOpen className="w-4 h-4" />
          <span>{position ? 'Riprendi la lettura' : 'Apri la Bibbia'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        {position && positionBookName && (
          <p className="tiny resume-location mt-2">
            Da {positionBookName} {position.c}:{position.v}
          </p>
        )}
      </section>

      <div className="section-label">SCEGLI UN TEMA TRA I 37 PERCORSI</div>
      <div className="topic-grid">
        {topics.map((t, i) => (
          <button
            key={t.id}
            type="button"
            className="topic-tile"
            onClick={() => onSelectTopicQuestion(t.question)}
          >
            <span className="number">{String(i + 1).padStart(2, '0')} / ESPLORA</span>
            <strong>{t.title}</strong>
          </button>
        ))}
      </div>
    </div>
  );
};
