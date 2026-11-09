import React, { useEffect, useState } from 'react';

interface Props {
  onDismiss: () => void;
}

export const LaunchSplash: React.FC<Props> = ({ onDismiss }) => {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // If ?autostart=1 is present, dismiss immediately (for tests and quick starts)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        onDismiss();
        return;
      }
    }

    const timer = setTimeout(() => {
      setFading(true);
      setTimeout(onDismiss, 400);
    }, 1200);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      id="launch-screen"
      className={`launch-screen transition-opacity duration-400 cursor-pointer ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      role="status"
      aria-label="Apertura di God Answers"
      onClick={() => {
        setFading(true);
        setTimeout(onDismiss, 300);
      }}
    >
      <img
        src="/brand.png"
        alt="God Answers Splash"
        fetchPriority="high"
        className="w-20 h-20 rounded-2xl object-cover shadow-md mb-2"
      />
      <div className="launch-title">
        <span>God Answers</span>
        <p>La Parola, nella vita.</p>
        <span className="launch-line" aria-hidden="true" />
      </div>
    </div>
  );
};
