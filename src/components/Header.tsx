import React from 'react';
import { Settings } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface Props {
  onHomeClick: () => void;
  onSettingsClick: () => void;
}

export const Header: React.FC<Props> = ({ onHomeClick, onSettingsClick }) => {
  return (
    <header className="topbar">
      <a
        className="brand cursor-pointer"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onHomeClick();
        }}
        aria-label="God Answers, pagina iniziale"
      >
        <img
          className="brand-palace"
          src="/brand.png"
          alt="Logo God Answers"
          width="44"
          height="44"
        />
        <span>
          God Answers
          <span className="brand-small">LA PAROLA, NELLA VITA</span>
        </span>
      </a>

      <div className="flex items-center gap-2">
        <PWAInstallButton variant="header" />
        <button
          id="settings-button"
          className="icon-button"
          onClick={onSettingsClick}
          aria-label="Impostazioni"
        >
          <Settings className="w-5 h-5 text-[#f2ebdb]" />
        </button>
      </div>
    </header>
  );
};
