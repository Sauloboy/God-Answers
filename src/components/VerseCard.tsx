import React, { useState, useEffect } from 'react';
import type { DocItem, StudyData } from '../types/god-answers';
import { Bookmark, ArrowRight, Edit3, Copy, Check } from 'lucide-react';
import { getBookSummary } from '../utils/bible-engine';
import { buildUnifiedNotesHtml } from '../utils/unified-notes';

interface Props {
  doc: DocItem;
  isSaved: boolean;
  note?: string;
  onToggleSave: (id: string) => void;
  onOpenReader: (doc: DocItem) => void;
  onOpenNote: (doc: DocItem) => void;
  onOpenWord: (term: string, b: number, c: number, v: number, wordText?: string) => void;
  onOpenLinkedPassage: (target: number[]) => void;
  onCopyPassage: (text: string) => void;
  topicTitles?: string[];
}

export const VerseCard: React.FC<Props> = ({
  doc,
  isSaved,
  note,
  onToggleSave,
  onOpenReader,
  onOpenNote,
  onOpenWord,
  onOpenLinkedPassage,
  onCopyPassage,
  topicTitles = [],
}) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [studyData, setStudyData] = useState<StudyData | null>(null);
  const [loadingStudy, setLoadingStudy] = useState(false);
  const [activeStudyTab, setActiveStudyTab] = useState<'notes' | 'related'>('notes');
  const [copied, setCopied] = useState(false);

  // Fix bug: reset study data and close accordion when doc changes (e.g. random verse draw)
  useEffect(() => {
    setDetailsOpen(false);
    setStudyData(null);
    setLoadingStudy(false);
    setActiveStudyTab('notes');
  }, [doc.id]);

  useEffect(() => {
    if (!detailsOpen || studyData || loadingStudy) return;

    if (typeof window !== 'undefined' && window.GodStudy && window.SELAH_BIBLE) {
      setLoadingStudy(true);
      const bookName = window.SELAH_BIBLE.books[doc.b];
      const bookContext = getBookSummary(doc.b, bookName);

      window.GodStudy.get({
        b: doc.b,
        c: doc.c,
        start: doc.start,
        end: doc.end,
        verses: doc.verses,
        bookName,
        curated: doc.curated ? doc : null,
        bookContext,
      })
        .then((data) => {
          setStudyData(data);
        })
        .catch((err) => {
          console.error('Error loading study data:', err);
        })
        .finally(() => {
          setLoadingStudy(false);
        });
    }
  }, [detailsOpen, studyData, loadingStudy, doc]);

  const handleCopy = () => {
    if (typeof window === 'undefined') return;
    const plainVerses = doc.verses
      .map((v) => `${v[2]} ${window.GodScripture?.plain ? window.GodScripture.plain(v[3]) : v[3]}`)
      .join('\n');
    const fullText = `${doc.ref} — Bibbia Aperta, OTB 2026\n\n${plainVerses}\n\nOpen Translation Bible · CC BY-SA 4.0\nhttps://www.openbible.uk/it-IT/`;
    onCopyPassage(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStudyContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
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
    <article className="verse-card" data-doc={doc.id}>
      <div className="card-head">
        <span className="reference">{doc.ref}</span>
        <button
          className={`save-button ${isSaved ? 'saved' : ''}`}
          onClick={() => onToggleSave(doc.id)}
          aria-label={isSaved ? 'Rimuovi dai salvati' : 'Salva il passo'}
          aria-pressed={isSaved}
        >
          <Bookmark className="w-5 h-5" fill={isSaved ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="verse-text" onClick={handleStudyContentClick}>
        {doc.verses.map((v) => {
          const rawHtml =
            typeof window !== 'undefined' && window.GodScripture
              ? window.GodScripture.html(v[3], { b: v[0], c: v[1], v: v[2] })
              : v[3];
          return (
            <p key={v[2]}>
              <sup>{v[2]}</sup>
              <span dangerouslySetInnerHTML={{ __html: rawHtml }} />
            </p>
          );
        })}
      </div>

      <div className="edition">Bibbia Aperta · OTB 2026</div>
      <h3 className="card-title">{doc.title}</h3>
      <p className="card-short">
        {topicTitles.length
          ? `Collegato a: ${topicTitles.join(' · ')}`
          : doc.curated && doc.context
          ? doc.context
          : 'Risultato della ricerca nel testo biblico.'}
      </p>

      <details
        className="card-details"
        open={detailsOpen}
        onToggle={(e) => setDetailsOpen((e.target as HTMLDetailsElement).open)}
      >
        <summary>Note e passi collegati</summary>
        <div className="study-view" onClick={handleStudyContentClick}>
          {loadingStudy && (
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
                  aria-selected={activeStudyTab === 'notes'}
                  onClick={() => setActiveStudyTab('notes')}
                >
                  Note
                </button>
                <button
                  type="button"
                  role="tab"
                  data-study-tab="related"
                  aria-selected={activeStudyTab === 'related'}
                  onClick={() => setActiveStudyTab('related')}
                >
                  Passi collegati
                </button>
              </div>

              {/* Scheda Note unificata: Contesto storico, Analisi esegetica e Note senza ridondanze */}
              <section
                className="study-tab-panel"
                hidden={activeStudyTab !== 'notes'}
                dangerouslySetInnerHTML={{ __html: buildUnifiedNotesHtml(studyData) }}
              />

              <section
                className="study-tab-panel"
                hidden={activeStudyTab !== 'related'}
                dangerouslySetInnerHTML={{ __html: studyData.related }}
              />

              <div
                className="study-attribution"
                dangerouslySetInnerHTML={{ __html: studyData.attribution }}
              />
            </div>
          )}
        </div>
        <p className="tiny">Note di God Answers: un aiuto alla lettura, distinto dal testo biblico.</p>
      </details>

      {note && <div className="saved-note">{note}</div>}

      <div className="card-foot">
        <button
          onClick={() => onOpenReader(doc)}
          className="flex items-center gap-1.5"
          aria-label={`Leggi il capitolo completo di ${doc.ref}`}
        >
          <span>Leggi il capitolo</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <div className="foot-actions">
          <button
            onClick={() => onOpenNote(doc)}
            className="flex items-center gap-1"
            aria-label={note ? 'Modifica appunto' : 'Aggiungi appunto'}
          >
            <Edit3 className="w-3 h-3" />
            <span>{note ? 'Appunto' : 'Annota'}</span>
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1"
            aria-label="Copia testo del passo"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copiato' : 'Copia'}</span>
          </button>
        </div>
      </div>
    </article>
  );
};
