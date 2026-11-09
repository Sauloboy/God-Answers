import React, { useState } from 'react';
import type { DocItem, SearchResult, IntentClarification, SavedState } from '../types/god-answers';
import { VerseCard } from './VerseCard';
import { ArrowRight, Compass, RotateCcw } from 'lucide-react';
import { getBiblicalReasoningRefs, fetchSmartExpansion } from '../utils/ai-expansion';

interface Props {
  savedState: SavedState;
  engine: any;
  onToggleSave: (id: string) => void;
  onOpenReader: (doc?: DocItem | { b: number; c: number; start?: number; end?: number }) => void;
  onOpenNote: (doc: DocItem) => void;
  onOpenWord: (term: string, b: number, c: number, v: number, wordText?: string) => void;
  onOpenLinkedPassage: (target: number[]) => void;
  onCopyPassage: (text: string) => void;
  onToast: (msg: string) => void;
  onUpdateHistory: (query: string) => void;
  initialQuery?: string;
}

export const SearchTab: React.FC<Props> = ({
  savedState,
  engine,
  onToggleSave,
  onOpenReader,
  onOpenNote,
  onOpenWord,
  onOpenLinkedPassage,
  onCopyPassage,
  onToast,
  onUpdateHistory,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [scope, setScope] = useState<'all' | 'gospels' | 'nt' | 'at'>('all');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [limit, setLimit] = useState(5);
  const [clarification, setClarification] = useState<IntentClarification | null>(null);
  const [selectedMeaning, setSelectedMeaning] = useState<string | null>(null);
  const [randomDoc, setRandomDoc] = useState<DocItem | null>(null);
  const [randomKey, setRandomKey] = useState<number>(Date.now());
  const [searching, setSearching] = useState(false);

  React.useEffect(() => {
    if (initialQuery && initialQuery !== query) {
      setQuery(initialQuery);
      performSearch(initialQuery, 'all');
    }
  }, [initialQuery]);

  const performSearch = (
    textToSearch: string,
    searchScope: 'all' | 'gospels' | 'nt' | 'at' = scope,
    options: { meaning?: string | null; skipClarify?: boolean } = {}
  ) => {
    const cleanText = textToSearch.trim().slice(0, 500);
    if (!cleanText) {
      onToast('Scrivi un tema, una frase o un riferimento.');
      return;
    }

    if (!engine) {
      onToast('Caricamento del motore di ricerca in corso…');
      return;
    }

    let meaningToUse = options.meaning !== undefined ? options.meaning : selectedMeaning;
    if (options.skipClarify) {
      meaningToUse = null;
      setClarification(null);
    } else if (!meaningToUse && typeof window !== 'undefined' && window.GodIntent) {
      const ambiguous = window.GodIntent.ambiguity(cleanText);
      if (ambiguous) {
        setClarification(ambiguous);
        setResults(null);
        return;
      }
    }

    setClarification(null);
    setSearching(true);

    try {
      const interpreted =
        typeof window !== 'undefined' && window.GodIntent
          ? window.GodIntent.interpret(cleanText, meaningToUse)
          : null;

      const res: SearchResult = engine.search(cleanText, searchScope, interpreted);

      // Deep Biblical Reasoning: inject target scriptures (e.g. Proverbi 12:10 for animal questions) immediately
      if (savedState.ai !== false) {
        const reasoningRefs = getBiblicalReasoningRefs(cleanText);
        if (reasoningRefs && reasoningRefs.length > 0) {
          const matchedDocs: DocItem[] = [];
          for (const ref of reasoningRefs) {
            try {
              const refRes = engine.search(ref, searchScope);
              if (refRes?.items?.length) {
                for (const item of refRes.items) {
                  if (!matchedDocs.some((d) => d.id === item.doc.id)) {
                    matchedDocs.push(item.doc);
                  }
                }
              }
            } catch {
              // ignore
            }
          }
          if (matchedDocs.length > 0) {
            const existingIds = new Set<string>();
            const topItems: any[] = [];
            for (const doc of matchedDocs) {
              existingIds.add(doc.id);
              topItems.push({ doc, score: 9999, reasons: ['ai-reasoning'] });
            }
            for (const it of res.items) {
              if (!existingIds.has(it.doc.id)) {
                existingIds.add(it.doc.id);
                topItems.push(it);
              }
            }
            res.items = topItems;
          }
        }
      }

      setResults(res);
      setLimit(5);
      onUpdateHistory(cleanText);

      // Asynchronous Cloudflare Workers AI neural reasoning
      if (savedState.ai !== false) {
        fetchSmartExpansion(cleanText, engine).then((aiData) => {
          if (!aiData?.suggestedRefs?.length) return;
          const aiDocs: DocItem[] = [];
          for (const ref of aiData.suggestedRefs) {
            try {
              const refRes = engine.search(ref, searchScope);
              if (refRes?.items?.length) {
                for (const it of refRes.items) {
                  if (!aiDocs.some((d) => d.id === it.doc.id)) {
                    aiDocs.push(it.doc);
                  }
                }
              }
            } catch {
              // ignore
            }
          }
          if (aiDocs.length > 0) {
            setResults((prev) => {
              if (!prev) return prev;
              const existingIds = new Set(prev.items.map((i) => i.doc.id));
              const newPrepend: any[] = [];
              for (const doc of aiDocs) {
                if (!existingIds.has(doc.id)) {
                  existingIds.add(doc.id);
                  newPrepend.push({ doc, score: 9999, reasons: ['ai-reasoning'] });
                }
              }
              if (newPrepend.length === 0) return prev;
              return {
                ...prev,
                items: [...newPrepend, ...prev.items],
              };
            });
          }
        }).catch(() => {
          // Fallback locale già mostrato a schermo
        });
      }
    } catch (e) {
      console.error('Search error:', e);
      onToast('Errore durante la ricerca locale.');
    } finally {
      setSearching(false);
    }
  };

  const handleDrawRandom = () => {
    if (!engine) return;
    const pool: string[] = engine.readingUnits;
    if (!pool || !pool.length) return;

    const randomIndex = Math.floor(Math.random() * pool.length);
    const id = pool[randomIndex];
    const rawDoc = engine.get(id);
    if (rawDoc && rawDoc.verses && rawDoc.verses.length) {
      // Garantisce che il passo sia sempre completo e non si interrompa a metà discorso
      const chapterVerses = engine.getChapter(rawDoc.b, rawDoc.c);
      let verses = [...rawDoc.verses];

      // Se l'ultimo versetto finisce con : , ; - o senza punto finale, include i versetti successivi necessari
      while (verses.length < chapterVerses.length) {
        const lastText = verses[verses.length - 1][3].trim();
        const isIncomplete = /[:;,–—\-]$/.test(lastText) || !/[.!?”"]$/.test(lastText);
        if (!isIncomplete) break;
        const nextNum = verses[verses.length - 1][2] + 1;
        const nextVerse = chapterVerses.find((v: any) => v[2] === nextNum);
        if (!nextVerse) break;
        verses.push(nextVerse);
      }

      const start = verses[0][2];
      const end = verses[verses.length - 1][2];
      const ref = `${engine.bible.books[rawDoc.b]} ${rawDoc.c}:${start}${end !== start ? '–' + end : ''}`;
      const doc = { ...rawDoc, verses, start, end, ref };

      setRandomKey(Date.now());
      setRandomDoc(doc);
      setResults(null);
      setQuery('');
      setTimeout(() => {
        document.getElementById('random-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  };

  const handleReset = () => {
    setQuery('');
    setResults(null);
    setSearching(false);
    setClarification(null);
    setSelectedMeaning(null);
    setScope('all');
  };

  const resume = savedState.readingPosition;
  const resumeBookName = resume && engine ? engine.bible.books[resume.b] : null;

  const popularTopics = [
    { id: 'paura', label: 'Paura e ansia', q: 'Come affrontare la paura del futuro?' },
    { id: 'perdono', label: 'Perdono', q: 'Come riuscire a perdonare chi ti ha ferito?' },
    { id: 'sofferenza', label: 'Dolore e sofferenza', q: 'Perché Dio permette la sofferenza?' },
    { id: 'dubbio', label: 'Fede e dubbio', q: 'Come vivere con i propri dubbi senza perdere la fede?' },
    { id: 'preghiera', label: 'Preghiera', q: 'Come pregare quando non si trovano le parole?' },
    { id: 'amore', label: 'Amore del prossimo', q: 'Cosa significa amare davvero il prossimo?' },
  ];

  return (
    <div>
      {results ? (
        <div className="hero">
          <span className="eyebrow">CERCA NELLA SCRITTURA</span>
          <h2>
            Adesso,
            <br />
            entra nel testo.
          </h2>
        </div>
      ) : (
        <section className="hero">
          <span className="eyebrow">LA PAROLA, NELLA VITA</span>
          <h1>
            Porta qui
            <br />
            quello che vivi.
          </h1>
          <p>
            Pensieri che tornano, scelte difficili, voglia di capire. Cerca nelle Scritture un punto da cui ripartire.
          </p>
        </section>
      )}

      {/* Search Input Box */}
      <form
        id="search-form"
        className="search-box"
        onSubmit={(e) => {
          e.preventDefault();
          performSearch(query, scope);
        }}
      >
        <label htmlFor="question">DA COSA VUOI PARTIRE?</label>
        <textarea
          id="question"
          maxLength={500}
          rows={2}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Scrivi ciò che hai in mente… (es. paura del futuro, perdonare, Giovanni 3:16)"
          aria-describedby="search-help"
        />
        <div className="search-bottom">
          <span id="search-help" className="tiny flex items-center">
            <span className="online-dot" />
            <span id="ai-label">
              {results?.direct
                ? 'Riferimento biblico'
                : 'Ricerca semantica offline'}
            </span>
          </span>
          <button
            className="primary"
            id="search-button"
            type="submit"
            disabled={searching}
            aria-busy={searching}
          >
            <span>{searching ? 'Cerco…' : 'Cerca nella Bibbia'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Clarification prompt if query has multiple theological meanings */}
      {clarification && (
        <section className="clarification" id="clarification" aria-labelledby="clarify-title">
          <span className="eyebrow">UN DETTAGLIO PRIMA DI CERCARE</span>
          <h2 id="clarify-title">{clarification.title}</h2>
          <p>{clarification.description}</p>
          <div className="clarification-choices">
            {clarification.choices.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setSelectedMeaning(m.id);
                  performSearch(query, scope, { meaning: m.id });
                }}
              >
                <strong>{m.label}</strong>
                <span>{m.hint}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="text-button"
            onClick={() => performSearch(query, scope, { skipClarify: true })}
          >
            Cerca comunque, senza precisare →
          </button>
        </section>
      )}

      {/* Search Results Display */}
      {results && !clarification && (
        <section id="results" className="mt-6">
          {selectedMeaning && typeof window !== 'undefined' && window.GodIntent?.meanings[selectedMeaning] && (
            <p className="meaning-selection">
              Hai scelto: <strong>{window.GodIntent.meanings[selectedMeaning].label}</strong> ·{' '}
              <button
                type="button"
                className="text-button inline p-0"
                onClick={() => {
                  setSelectedMeaning(null);
                  performSearch(query, scope);
                }}
              >
                Cambia
              </button>
            </p>
          )}

          <div className="section-label">Dove cercare</div>
          <div className="chips">
            {[
              ['all', 'Tutta la Bibbia'],
              ['gospels', 'Vangeli'],
              ['nt', 'Nuovo Testamento'],
              ['at', 'Antico Testamento'],
            ].map(([id, title]) => (
              <button
                key={id}
                type="button"
                className={`chip ${scope === id ? 'active' : ''}`}
                onClick={() => {
                  const newScope = id as any;
                  setScope(newScope);
                  performSearch(query, newScope);
                }}
                aria-pressed={scope === id}
              >
                {title}
              </button>
            ))}
          </div>

          <div className="results-top">
            <h2>Da leggere, da capire</h2>
            <span className="tiny">
              {results.items.length} {results.items.length === 60 ? '+' : ''} risultati
            </span>
          </div>

          {results.topics && results.topics.length > 0 && (
            <div className="topic-pills">
              {results.topics.map((t) => (
                <span key={t.id} className="topic-pill">
                  {t.title}
                </span>
              ))}
            </div>
          )}

          <p className="result-intro">
            {results.direct
              ? 'Ecco il passo che cercavi, nel testo della Bibbia Aperta.'
              : results.topics.length
              ? 'Passi ordinati per affinità con i temi della tua ricerca. Apri le note per comprenderne il contesto.'
              : 'Riscontri per parole nel testo: leggi il contesto per valutarne la pertinenza.'}
          </p>

          {results.items.length > 0 ? (
            results.items.slice(0, limit).map((r) => (
              <VerseCard
                key={r.doc.id}
                doc={r.doc}
                isSaved={savedState.favorites.includes(r.doc.id)}
                note={savedState.notes[r.doc.id]}
                onToggleSave={onToggleSave}
                onOpenReader={(d) => onOpenReader(d)}
                onOpenNote={onOpenNote}
                onOpenWord={onOpenWord}
                onOpenLinkedPassage={onOpenLinkedPassage}
                onCopyPassage={onCopyPassage}
                topicTitles={results.topics.filter((t) => r.doc.topics?.includes(t.id)).map((t) => t.title)}
              />
            ))
          ) : (
            <div className="empty">
              <h3>Prova a dirmi qualcosa in più.</h3>
              <p>
                Nessun passo pertinente trovato{scope !== 'all' ? ' in questa sezione' : ''}. Puoi cercare “paura del futuro”, “perdonare”, “libero arbitrio” oppure un riferimento come “Giovanni 14:27”.
              </p>
            </div>
          )}

          {results.items.length > limit && (
            <button
              type="button"
              className="primary load-more"
              onClick={() => setLimit((prev) => prev + 5)}
            >
              Mostra altri 5 passi
            </button>
          )}

          <button
            type="button"
            className="text-button flex items-center gap-1.5"
            onClick={handleReset}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Ricomincia da qui</span>
          </button>
        </section>
      )}

      {/* Default Homepage when no active results */}
      {!results && !clarification && (
        <>
          {resume && resumeBookName && (
            <div className="my-4">
              <button
                type="button"
                className="text-button reading-resume"
                onClick={() => onOpenReader(resume)}
              >
                Riprendi la lettura · {resumeBookName} {resume.c}:{resume.v} →
              </button>
            </div>
          )}

          <div className="section-label">A VOLTE BASTA UN INIZIO</div>
          <div className="chips">
            {popularTopics.map((item) => (
              <button
                key={item.id}
                type="button"
                className="chip"
                onClick={() => {
                  setQuery(item.q);
                  setScope('all');
                  performSearch(item.q, 'all');
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Random verse invite */}
          <section className="daily random-invite">
            <span className="eyebrow">LASCIA SPAZIO ALL’INATTESO</span>
            <h2>
              Un passo che
              <br />
              non hai cercato.
            </h2>
            <p>
              Esci per un momento dalle tue ricerche. Scopri un brano e fermati a leggerlo.
            </p>
            <button
              type="button"
              className="primary"
              onClick={handleDrawRandom}
            >
              <span>{randomDoc ? 'Scopri un altro passo' : 'Sorprendimi con un passo'}</span>
              <Compass className="w-4 h-4" />
            </button>
            <p className="tiny random-caption">
              Scelto a caso tra tutti i 66 libri, con approfondimenti completi sempre disponibili.
            </p>
          </section>

          {randomDoc && (
            <section id="random-result" aria-label="Il passo casuale" className="mt-5">
              <p className="random-announcement" role="status">
                Il tuo passo · {randomDoc.ref}
              </p>
              <VerseCard
                key={`${randomDoc.id}-${randomKey}`}
                doc={randomDoc}
                isSaved={savedState.favorites.includes(randomDoc.id)}
                note={savedState.notes[randomDoc.id]}
                onToggleSave={onToggleSave}
                onOpenReader={(d) => onOpenReader(d)}
                onOpenNote={onOpenNote}
                onOpenWord={onOpenWord}
                onOpenLinkedPassage={onOpenLinkedPassage}
                onCopyPassage={onCopyPassage}
              />
            </section>
          )}

          {savedState.history.length > 0 && (
            <>
              <div className="section-label">RIPRENDI IL FILO</div>
              <div className="history">
                {savedState.history.slice(0, 4).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => {
                      setQuery(q);
                      performSearch(q, 'all');
                    }}
                  >
                    <span>{q}</span>
                    <span>↗</span>
                  </button>
                ))}
              </div>
            </>
          )}

          <p className="microcopy">
            31.103 versetti · 124 percorsi tematici · 66 libri
            <br />
            Testo moderno: Bibbia Aperta, italiano 2026. Tutto consultabile offline sul tuo dispositivo.
          </p>
        </>
      )}
    </div>
  );
};
