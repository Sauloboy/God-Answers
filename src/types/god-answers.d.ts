export type BibleVerse = [b: number, c: number, v: number, text: string];
export type BibleChapter = [b: number, c: number, offset: number, total: number];

export interface SelahBible {
  books: string[];
  counts: number[];
  chapters: BibleChapter[];
  verses: BibleVerse[];
}

export interface SelahContent {
  topics: [id: string, title: string, keywords: string, question: string][];
  passages: [ref: string, title: string, topics: string, context: string, note: string][];
}

export interface TopicItem {
  id: string;
  title: string;
  question: string;
  score?: number;
}

export interface DocItem {
  id: string;
  b: number;
  c: number;
  start: number;
  end: number;
  ref: string;
  title: string;
  topics: string[];
  curated: boolean;
  context?: string;
  note?: string;
  verses: BibleVerse[];
}

export interface SearchResult {
  items: { doc: DocItem; score: number }[];
  topics: TopicItem[];
  direct?: boolean;
  lowConfidence?: boolean;
  semantic?: boolean;
  lexicalOnly?: boolean;
}

export interface IntentClarification {
  title: string;
  description: string;
  choices: { id: string; label: string; hint: string }[];
}

export interface SavedState {
  favorites: string[];
  notes: Record<string, string>;
  history: string[];
  theme: 'light' | 'dark';
  size: 'normal' | 'large' | 'very-large';
  ai: boolean;
  readingPosition?: { b: number; c: number; v: number };
  randomDeck?: string[];
  randomPoolVersion?: number;
  lastRandom?: string;
}

export interface StudyData {
  context: string;
  notes: string;
  analysis: string;
  related: string;
  attribution: string;
  sourceCount: number;
  verseSpecific: boolean;
}

export interface GlossaryWord {
  id: string;
  label: string;
  meaning: string;
  attention: string;
  references: [number, number, number, number][];
}

declare global {
  interface Window {
    SELAH_BIBLE: SelahBible;
    SELAH_CONTENT: SelahContent;
    SELAH_PASSAGE_INTENTS: string[][];
    SelahSearch: {
      create: (bible: SelahBible, content: SelahContent) => any;
      norm: (s: string) => string;
      tokens: (s: string) => string[];
    };
    GodIntent: {
      ambiguity: (query: string) => IntentClarification | null;
      interpret: (query: string, meaning: string | null) => any;
      meanings: Record<string, { label: string; hint: string; focus: string; topics: string[] }>;
      retrievalQuery: (query: string, meaning: string | null) => string;
    };
    GodStudy: {
      register: (b: number, notes: any) => void;
      load: (b: number) => Promise<any>;
      get: (args: any) => Promise<StudyData>;
      tabs: (data: StudyData, active?: string) => string;
      relatedHTML: (args: any, rows: any[], limit?: number) => string;
    };
    GodCrossrefs: {
      register: (book: number, records: any) => void;
      load: (book: number) => Promise<any>;
      get: (args: { b: number; c: number; start: number; end: number }) => Promise<any[]>;
      passage: (target: number[], limit?: number) => { ref: string; b: number; c: number; start: number; end: number; verses: BibleVerse[]; total: number } | null;
    };
    GodGlossary: {
      explain: (term: string, context: { b: number; c: number; v: number; word?: string }) => GlossaryWord | null;
    };
    GodScripture: {
      html: (text: string, location: { b: number; c: number; v: number }) => string;
      plain: (text: string, sep?: string) => string;
    };
    GodReadingPosition: {
      valid: (p: any) => { b: number; c: number; v: number } | null;
      capture: (doc: Document, win: Window) => { b: number; c: number; v: number } | null;
      restore: (p: { b: number; c: number; v: number }, doc: Document, win: Window) => boolean;
    };
    __selahEngine?: any;
  }
}
