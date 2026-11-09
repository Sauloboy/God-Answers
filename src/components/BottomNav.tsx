import React from 'react';
import { Search, Compass, Bookmark } from 'lucide-react';

interface Props {
  currentTab: 'search' | 'explore' | 'saved' | 'reader';
  onTabChange: (tab: 'search' | 'explore' | 'saved') => void;
}

export const BottomNav: React.FC<Props> = ({ currentTab, onTabChange }) => {
  return (
    <nav className="bottom-nav" aria-label="Navigazione principale">
      <button
        onClick={() => onTabChange('search')}
        className={currentTab === 'search' ? 'active' : ''}
        aria-label="Cerca nella Scrittura"
      >
        <Search className="w-5 h-5" />
        <span>Cerca</span>
      </button>

      <button
        onClick={() => onTabChange('explore')}
        className={currentTab === 'explore' || currentTab === 'reader' ? 'active' : ''}
        aria-label="Esplora libri e temi"
      >
        <Compass className="w-5 h-5" />
        <span>Esplora</span>
      </button>

      <button
        onClick={() => onTabChange('saved')}
        className={currentTab === 'saved' ? 'active' : ''}
        aria-label="Passi e appunti salvati"
      >
        <Bookmark className="w-5 h-5" />
        <span>Salvati</span>
      </button>
    </nav>
  );
};
