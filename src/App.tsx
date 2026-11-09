/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { DocItem, SavedState, GlossaryWord, BibleVerse } from './types/god-answers';
import { loadSavedState, saveState, ensureEngine } from './utils/bible-engine';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { SearchTab } from './components/SearchTab';
import { ReaderTab } from './components/ReaderTab';
import { ExploreTab } from './components/ExploreTab';
import { SavedTab } from './components/SavedTab';
import { StudyModal } from './components/StudyModal';
import { GlossaryModal } from './components/GlossaryModal';
import { LinkedPassageModal } from './components/LinkedPassageModal';
import { NoteModal } from './components/NoteModal';
import { SettingsModal } from './components/SettingsModal';
import { LaunchSplash } from './components/LaunchSplash';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  const [splashVisible, setSplashVisible] = useState(true);
  const [savedState, setSavedState] = useState<SavedState>(loadSavedState);
  const [engine, setEngine] = useState<any>(null);
  const [currentTab, setCurrentTab] = useState<'search' | 'explore' | 'saved' | 'reader'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Navigation & Reader State
  const [readerState, setReaderState] = useState<{
    b: number;
    c: number;
    start?: number;
    end?: number;
  }>({ b: 0, c: 1, start: 0, end: 0 });

  // Modals
  const [studyModal, setStudyModal] = useState<{ b: number; c: number; v: number } | null>(null);
  const [glossaryModal, setGlossaryModal] = useState<{
    word: GlossaryWord;
    bookName: string;
    chapterNumber: number;
    verseNumber: number;
  } | null>(null);
  const [linkedPassageModal, setLinkedPassageModal] = useState<{
    ref: string;
    b: number;
    c: number;
    start: number;
    end: number;
    verses: BibleVerse[];
    total: number;
  } | null>(null);
  const [noteModalDoc, setNoteModalDoc] = useState<DocItem | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  }, []);

  // Initialize Engine
  useEffect(() => {
    const init = () => {
      const eng = ensureEngine();
      if (eng) {
        setEngine(eng);
      } else {
        // Retry in 150ms if scripts still evaluating
        setTimeout(init, 150);
      }
    };
    init();
  }, []);

  // Apply Theme & Font Size to Body
  useEffect(() => {
    document.body.classList.toggle('dark', savedState.theme === 'dark');
    document.body.classList.toggle('serif-large', savedState.size === 'large');
    document.body.classList.toggle('serif-very-large', savedState.size === 'very-large');
  }, [savedState.theme, savedState.size]);

  // Persist State Changes
  const updateSavedState = useCallback((updater: (prev: SavedState) => SavedState) => {
    setSavedState((prev) => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  // Favorite toggle
  const handleToggleSave = useCallback((docId: string) => {
    updateSavedState((prev) => {
      const exists = prev.favorites.includes(docId);
      const favorites = exists
        ? prev.favorites.filter((id) => id !== docId)
        : [...prev.favorites, docId];
      showToast(exists ? 'Rimosso dai salvati' : 'Passo salvato');
      return { ...prev, favorites };
    });
  }, [updateSavedState, showToast]);

  // Save personal note
  const handleSaveNote = useCallback((docId: string, text: string) => {
    updateSavedState((prev) => {
      const notes = { ...prev.notes };
      const trimmed = text.trim();
      if (trimmed) {
        notes[docId] = trimmed.slice(0, 10000);
      } else {
        delete notes[docId];
      }
      const favorites = trimmed && !prev.favorites.includes(docId)
        ? [...prev.favorites, docId]
        : prev.favorites;
      showToast('Appunto salvato');
      return { ...prev, notes, favorites };
    });
  }, [updateSavedState, showToast]);

  // Update history
  const handleUpdateHistory = useCallback((q: string) => {
    updateSavedState((prev) => {
      const history = [q, ...prev.history.filter((x) => x !== q)].slice(0, 15);
      return { ...prev, history };
    });
  }, [updateSavedState]);

  // Update reading position
  const handleSaveReadingPosition = useCallback((pos: { b: number; c: number; v: number }) => {
    updateSavedState((prev) => ({
      ...prev,
      readingPosition: pos,
    }));
  }, [updateSavedState]);

  // Open Reader
  const handleOpenReader = useCallback(
    (doc?: DocItem | { b: number; c: number; start?: number; end?: number }) => {
      if (doc) {
        setReaderState({
          b: doc.b,
          c: doc.c,
          start: doc.start || 0,
          end: doc.end || 0,
        });
      } else if (savedState.readingPosition) {
        setReaderState({
          b: savedState.readingPosition.b,
          c: savedState.readingPosition.c,
          start: savedState.readingPosition.v,
          end: savedState.readingPosition.v,
        });
      } else {
        setReaderState({ b: 0, c: 1, start: 0, end: 0 });
      }
      setCurrentTab('reader');
      window.scrollTo(0, 0);
    },
    [savedState.readingPosition]
  );

  // Open Glossary Word
  const handleOpenWord = useCallback(
    (term: string, b: number, c: number, v: number, wordText?: string) => {
      if (typeof window === 'undefined' || !window.GodGlossary) return;
      const word = window.GodGlossary.explain(term, { b, c, v, word: wordText });
      if (word && engine) {
        const bookName = engine.bible.books[b];
        setGlossaryModal({ word, bookName, chapterNumber: c, verseNumber: v });
      }
    },
    [engine]
  );

  // Open Linked Cross-reference Passage
  const handleOpenLinkedPassage = useCallback((targetCoords: number[]) => {
    if (typeof window === 'undefined' || !window.GodCrossrefs) return;
    const passage = window.GodCrossrefs.passage(targetCoords);
    if (passage) {
      setLinkedPassageModal(passage);
    }
  }, []);

  // Copy to clipboard
  const handleCopyPassage = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        showToast('Passo copiato negli appunti');
      } catch {
        showToast('Impossibile copiare negli appunti');
      }
    },
    [showToast]
  );

  return (
    <div className="min-h-screen flex flex-col w-full overflow-x-hidden">
      {/* Launch Splash Screen */}
      {splashVisible && <LaunchSplash onDismiss={() => setSplashVisible(false)} />}

      {/* Header with Branding and Settings */}
      <Header
        onHomeClick={() => {
          setCurrentTab('search');
          window.scrollTo(0, 0);
        }}
        onSettingsClick={() => setSettingsOpen(true)}
      />

      {/* Main View Area */}
      <main id="main-content" tabIndex={-1} className="flex-1 w-full min-w-0">
        {currentTab === 'search' && (
          <SearchTab
            savedState={savedState}
            engine={engine}
            initialQuery={searchQuery}
            onToggleSave={handleToggleSave}
            onOpenReader={handleOpenReader}
            onOpenNote={(doc) => setNoteModalDoc(doc)}
            onOpenWord={handleOpenWord}
            onOpenLinkedPassage={handleOpenLinkedPassage}
            onCopyPassage={handleCopyPassage}
            onToast={showToast}
            onUpdateHistory={handleUpdateHistory}
          />
        )}

        {currentTab === 'reader' && (
          <ReaderTab
            bookIndex={readerState.b}
            chapterNumber={readerState.c}
            highlightStart={readerState.start}
            highlightEnd={readerState.end}
            engine={engine}
            onBookChange={(b) => setReaderState((prev) => ({ ...prev, b, start: 0, end: 0 }))}
            onChapterChange={(c) => setReaderState((prev) => ({ ...prev, c, start: 0, end: 0 }))}
            onOpenStudy={(b, c, v) => setStudyModal({ b, c, v })}
            onOpenWord={handleOpenWord}
            onBack={() => setCurrentTab('search')}
            onSaveReadingPosition={handleSaveReadingPosition}
          />
        )}

        {currentTab === 'explore' && (
          <ExploreTab
            engine={engine}
            savedState={savedState}
            onSelectTopicQuestion={(q) => {
              setSearchQuery(q);
              setCurrentTab('search');
            }}
            onOpenReader={() => handleOpenReader()}
          />
        )}

        {currentTab === 'saved' && (
          <SavedTab
            savedState={savedState}
            engine={engine}
            onToggleSave={handleToggleSave}
            onOpenReader={handleOpenReader}
            onOpenNote={(doc) => setNoteModalDoc(doc)}
            onOpenWord={handleOpenWord}
            onOpenLinkedPassage={handleOpenLinkedPassage}
            onCopyPassage={handleCopyPassage}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          window.scrollTo(0, 0);
        }}
      />

      {/* Offline Status Pill */}
      <OfflineIndicator />

      {/* Toast Notification */}
      <div
        id="toast"
        role="status"
        aria-live="polite"
        className={toastMessage ? 'show' : ''}
      >
        {toastMessage}
      </div>

      {/* Verse Study Modal */}
      {studyModal && (
        <StudyModal
          bookIndex={studyModal.b}
          chapterNumber={studyModal.c}
          verseNumber={studyModal.v}
          engine={engine}
          onClose={() => setStudyModal(null)}
          onOpenWord={handleOpenWord}
          onOpenLinkedPassage={handleOpenLinkedPassage}
        />
      )}

      {/* Glossary Term Modal */}
      {glossaryModal && (
        <GlossaryModal
          word={glossaryModal.word}
          bookName={glossaryModal.bookName}
          chapterNumber={glossaryModal.chapterNumber}
          verseNumber={glossaryModal.verseNumber}
          engine={engine}
          onClose={() => setGlossaryModal(null)}
          onOpenLinkedPassage={handleOpenLinkedPassage}
        />
      )}

      {/* Linked Cross-reference Passage Modal */}
      {linkedPassageModal && (
        <LinkedPassageModal
          passage={linkedPassageModal}
          engine={engine}
          onClose={() => setLinkedPassageModal(null)}
          onOpenInReader={(b, c, start, end) => {
            setReaderState({ b, c, start, end });
            setCurrentTab('reader');
            window.scrollTo(0, 0);
          }}
        />
      )}

      {/* Personal Note Editor Modal */}
      {noteModalDoc && (
        <NoteModal
          doc={noteModalDoc}
          initialNote={savedState.notes[noteModalDoc.id] || ''}
          onClose={() => setNoteModalDoc(null)}
          onSaveNote={handleSaveNote}
        />
      )}

      {/* Settings Modal */}
      {settingsOpen && (
        <SettingsModal
          savedState={savedState}
          engine={engine}
          onClose={() => setSettingsOpen(false)}
          onUpdateState={updateSavedState}
          onToast={showToast}
        />
      )}
    </div>
  );
}
