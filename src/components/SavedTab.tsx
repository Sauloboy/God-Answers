import React from 'react';
import type { DocItem, SavedState } from '../types/god-answers';
import { VerseCard } from './VerseCard';
import { Bookmark } from 'lucide-react';

interface Props {
  savedState: SavedState;
  engine: any;
  onToggleSave: (id: string) => void;
  onOpenReader: (doc: DocItem) => void;
  onOpenNote: (doc: DocItem) => void;
  onOpenWord: (term: string, b: number, c: number, v: number, wordText?: string) => void;
  onOpenLinkedPassage: (target: number[]) => void;
  onCopyPassage: (text: string) => void;
}

export const SavedTab: React.FC<Props> = ({
  savedState,
  engine,
  onToggleSave,
  onOpenReader,
  onOpenNote,
  onOpenWord,
  onOpenLinkedPassage,
  onCopyPassage,
}) => {
  if (!engine) {
    return <div className="p-8 text-center text-[var(--muted)]">Caricamento in corso…</div>;
  }

  const savedDocs: DocItem[] = savedState.favorites
    .map((id) => engine.get(id))
    .filter(Boolean);

  return (
    <div>
      <div className="page-head">
        <span className="eyebrow">IL TUO SPAZIO</span>
        <h1>
          Tieni vicino
          <br />
          ciò che conta.
        </h1>
        <p>I passi che vuoi rileggere. Le riflessioni che non vuoi perdere.</p>
      </div>

      <p className="library-count flex items-center gap-1.5 font-medium mb-4">
        <Bookmark className="w-3.5 h-3.5 text-[var(--accent)]" />
        <span>{savedDocs.length} passi salvati</span>
      </p>

      {savedDocs.length > 0 ? (
        <div className="space-y-4">
          {savedDocs.map((doc) => (
            <VerseCard
              key={doc.id}
              doc={doc}
              isSaved={true}
              note={savedState.notes[doc.id]}
              onToggleSave={onToggleSave}
              onOpenReader={onOpenReader}
              onOpenNote={onOpenNote}
              onOpenWord={onOpenWord}
              onOpenLinkedPassage={onOpenLinkedPassage}
              onCopyPassage={onCopyPassage}
            />
          ))}
        </div>
      ) : (
        <div className="empty">
          <h3>Non lasciare andare ciò che ti colpisce.</h3>
          <p>
            Tocca il segnalibro su un risultato per ritrovarlo qui. Con “Annota” puoi aggiungere una riflessione personale conservata nel tuo dispositivo.
          </p>
        </div>
      )}
    </div>
  );
};
