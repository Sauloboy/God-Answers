import fs from 'fs';
import path from 'path';
import vm from 'vm';
import type { SelahBible, SelahContent, DocItem, SearchResult, SavedState } from '../types/god-answers';

export const STORAGE_KEY = 'selah.private.v1';

export const DEFAULT_SAVED_STATE: SavedState = {
  favorites: [],
  notes: {},
  history: [],
  theme: 'light',
  size: 'normal',
  ai: true,
};

let cachedEngine: any = null;

export function ensureEngine(): any {
  if (cachedEngine) return cachedEngine;

  if (typeof window !== 'undefined' && window.SelahSearch && window.SELAH_BIBLE && window.SELAH_CONTENT) {
    cachedEngine = window.SelahSearch.create(window.SELAH_BIBLE, window.SELAH_CONTENT);
    window.__selahEngine = cachedEngine;
    return cachedEngine;
  }

  // Node.js test environment support
  if (typeof process !== 'undefined' && process.versions?.node) {
    const context: any = { window: {}, console };
    context.global = context.window;
    context.globalThis = context.window;
    vm.createContext(context);

    const publicDir = path.resolve(process.cwd(), 'public');
    const files = [
      'bible.js',
      'content.js',
      'passage-intents.js',
      'intent.js',
      'reflection-themes.js',
      'reflection-books.js',
      'study-meta.js',
      'crossrefs.js',
      'glossary-data.js',
      'glossary.js',
      'scripture.js',
      'search-language.js',
      'retrieval-data.js',
      'retrieval.js',
      'study.js',
      'study-search.js',
      'search.js',
      'reading-position.js'
    ];

    for (const f of files) {
      const p = path.join(publicDir, f);
      if (fs.existsSync(p)) {
        const code = fs.readFileSync(p, 'utf8');
        vm.runInContext(code, context);
      }
    }

    if (context.window.SelahSearch && context.window.SELAH_BIBLE && context.window.SELAH_CONTENT) {
      cachedEngine = context.window.SelahSearch.create(context.window.SELAH_BIBLE, context.window.SELAH_CONTENT);
      return cachedEngine;
    }
  }

  return null;
}

export function loadSavedState(): SavedState {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_SAVED_STATE };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SAVED_STATE };
    const parsed = JSON.parse(raw);
    return {
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites.filter((x: any) => typeof x === 'string') : [],
      history: Array.isArray(parsed.history) ? parsed.history.filter((x: any) => typeof x === 'string').slice(0, 15) : [],
      notes: parsed.notes && typeof parsed.notes === 'object' && !Array.isArray(parsed.notes) ? parsed.notes : {},
      theme: parsed.theme === 'dark' ? 'dark' : 'light',
      size: ['large', 'very-large'].includes(parsed.size) ? parsed.size : 'normal',
      ai: parsed.ai !== false,
      readingPosition: parsed.readingPosition,
      randomDeck: parsed.randomDeck,
      randomPoolVersion: parsed.randomPoolVersion,
      lastRandom: parsed.lastRandom,
    };
  } catch {
    return { ...DEFAULT_SAVED_STATE };
  }
}

export function saveState(state: SavedState): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function validateAndMergeBackup(
  current: SavedState,
  jsonString: string,
  engine: any
): { success: boolean; state?: SavedState; error?: string } {
  try {
    const backup = JSON.parse(jsonString);
    if (backup.app !== 'selah' || backup.version !== 1 || !backup.data) {
      return { success: false, error: 'Il testo non è un backup valido di God Answers.' };
    }
    const data = backup.data;
    if (!Array.isArray(data.favorites) || !data.notes || typeof data.notes !== 'object' || Array.isArray(data.notes)) {
      return { success: false, error: 'Struttura dati non valida nel file di backup.' };
    }

    const mergedFavorites = [...new Set([
      ...current.favorites,
      ...data.favorites.filter((id: any) => typeof id === 'string' && (!engine || !!engine.get(id)))
    ])];

    const mergedNotes = { ...current.notes };
    for (const [k, v] of Object.entries(data.notes)) {
      if (typeof v === 'string' && (!engine || !!engine.get(k))) {
        mergedNotes[k] = v.slice(0, 10000);
      }
    }

    const newState: SavedState = {
      ...current,
      favorites: mergedFavorites,
      notes: mergedNotes,
      readingPosition: data.readingPosition || current.readingPosition,
    };

    return { success: true, state: newState };
  } catch {
    return { success: false, error: 'Errore durante la lettura del file JSON.' };
  }
}

export function exportBackup(state: SavedState): string {
  return JSON.stringify({
    app: 'selah',
    version: 1,
    data: state,
    exportedAt: new Date().toISOString()
  }, null, 2);
}

export function getBookSummary(bookIndex: number, bookName?: string): string {
  const summaries: Record<string, string> = {
    Genesi: 'Racconti delle origini, dei patriarchi e delle promesse. Ogni episodio va letto nel suo arco narrativo, distinguendo voce del narratore e parole dei personaggi.',
    Esodo: 'Racconto della liberazione dall’Egitto, dell’alleanza e del cammino nel deserto. Le leggi e i racconti sono collegati alla formazione d’Israele.',
    Giobbe: 'Dialogo poetico sul dolore e sulla giustizia. Le opinioni degli amici di Giobbe non coincidono automaticamente con la conclusione del libro.',
    Salmi: 'Raccolta di preghiere e poesie: lamento, ringraziamento, protesta e fiducia. Le immagini non sono sempre affermazioni letterali o promesse individuali.',
    Proverbi: 'Raccolta di insegnamenti sapienziali. Le massime indicano orientamenti di vita e osservazioni generali, non garanzie meccaniche per ogni situazione.',
    Ecclesiaste: 'Riflessione sapienziale su tempo, lavoro, gioia, limite e morte. Le tensioni interne fanno parte del percorso del libro.',
    Isaia: 'Raccolta profetica che attraversa giudizio, esilio e restaurazione. Identificare gli interlocutori e la situazione storica è essenziale per interpretare le promesse.',
    Geremia: 'Profezie e racconti legati alla crisi di Giuda, alla caduta di Gerusalemme e all’esilio. Le promesse hanno anzitutto una dimensione comunitaria.',
    Lamentazioni: 'Poemi di lutto legati alla distruzione di Gerusalemme. Lamento e fiducia sono intrecciati senza annullare la gravità della perdita.',
    Matteo: 'Vangelo che presenta parole e azioni di Gesù in continuo dialogo con le Scritture d’Israele. Individua chi ascolta ogni discorso e il suo contesto.',
    Marco: 'Vangelo dal racconto concentrato sull’azione e sull’identità di Gesù. Le parole sul discepolato si comprendono lungo il cammino verso la passione.',
    Luca: 'Vangelo attento a misericordia, preghiera, poveri ed esclusi. Parabole e incontri fanno parte del viaggio narrativo di Gesù.',
    Giovanni: 'Vangelo costruito attorno a segni, dialoghi e discorsi sull’identità di Gesù. Molte immagini e parole hanno più livelli di significato.',
    Atti: 'Racconto della prima espansione delle comunità cristiane. Gli episodi descrivono anche decisioni, conflitti e trasformazioni: non ogni dettaglio è un comando universale.',
    Romani: 'Lettera che affronta peccato, grazia, fede, Israele e vita comunitaria. Segui lo sviluppo dell’argomentazione prima di isolare una frase.',
    '1 Corinzi': 'Lettera a una comunità segnata da divisioni e domande pratiche. Paolo risponde a situazioni specifiche su relazioni, culto, doni e risurrezione.',
    '2 Corinzi': 'Lettera sul ministero, sulla debolezza e sulla riconciliazione, legata a un rapporto difficile fra Paolo e la comunità.',
    Galati: 'Lettera sul rapporto fra fede, Legge e inclusione dei non giudei. La libertà cristiana viene collegata al servizio nell’amore.',
    Efesini: 'Lettera sulla vita in Cristo e sull’unità della comunità, seguita da indicazioni sulla condotta e sulle relazioni nel mondo antico.',
    Filippesi: 'Lettera di gratitudine e incoraggiamento scritta in una situazione di prigionia. Gioia e speranza convivono con difficoltà reali.',
    Colossesi: 'Lettera che mette al centro Cristo e le conseguenze della vita nuova per la condotta e le relazioni.',
    '1 Timoteo': 'Lettera con indicazioni sull’insegnamento e sulla vita comunitaria. Le situazioni sociali antiche richiedono attenzione nel passaggio al presente.',
    Ebrei: 'Discorso di esortazione che interpreta Gesù attraverso le Scritture e le immagini del sacerdozio, del sacrificio e dell’alleanza.',
    Giacomo: 'Lettera sapienziale su fede e azione, parole, ricchezza e relazioni. Gli esempi pratici sono centrali nell’argomentazione.',
    '1 Pietro': 'Lettera che incoraggia comunità in difficoltà a vivere la speranza e a perseverare. Le esortazioni sono inserite in quella condizione concreta.',
    '1 Giovanni': 'Lettera su verità, amore, peccato e comunione. Le affermazioni sulla conoscenza di Dio vengono verificate nella vita e nelle relazioni.',
    Apocalisse: 'Visione profetica indirizzata a comunità concrete. Simboli, richiami all’Antico Testamento e scene di giudizio convergono nella speranza di una nuova creazione.'
  };

  if (bookName && summaries[bookName]) return summaries[bookName];
  if (bookIndex <= 4) return 'Libro della Torah: racconti, leggi e alleanza appartengono alla storia d’Israele. Individua chi parla, a chi si rivolge e in quale situazione.';
  if (bookIndex < 17) return 'Racconto della storia d’Israele. Le azioni dei personaggi vengono narrate e non per questo sono tutte proposte come un modello da seguire.';
  if (bookIndex < 22) return 'Testo poetico o sapienziale: genere, immagini e sviluppo del discorso aiutano a non ridurre una frase a una regola assoluta.';
  if (bookIndex < 39) return 'Libro profetico rivolto anzitutto a interlocutori e situazioni storiche precise. Giudizio e promessa vanno letti dentro quel contesto.';
  return 'Testo del Nuovo Testamento indirizzato a una comunità o a interlocutori concreti. Segui il ragionamento e leggi i versetti prima e dopo il passo.';
}
