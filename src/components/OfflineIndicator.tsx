import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 left-4 z-40 flex items-center gap-2 rounded-xl bg-[#203831] text-[#fff9ec] border border-[#dedfd5]/30 px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur-sm"
    >
      <WifiOff className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
      <span>Modalità offline attiva · Testo e note salvati in locale</span>
    </div>
  );
};
