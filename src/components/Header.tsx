'use client';

import { format } from 'date-fns';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useUIStore } from '@/stores/ui';
import { useEffect, useState } from 'react';

export function Header() {
  const { isConnected, toggleSidebar, sidebarOpen } = useUIStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  return (
    <header className="h-14 bg-bg-secondary border-b border-bg-tertiary flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 hover:bg-bg-tertiary rounded transition-colors"
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent-info/20 rounded flex items-center justify-center">
            <span className="text-accent-info font-bold text-sm">▓▓</span>
          </div>
          <h1 className="font-semibold tracking-tight">
            <span className="text-text-primary">SITUATION</span>
            <span className="text-accent-info ml-1">MONITOR</span>
          </h1>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <StatusBadge variant={isConnected ? 'live' : 'offline'}>
          {isConnected ? 'LIVE' : 'OFFLINE'}
        </StatusBadge>
        
        <div className="mono text-sm text-text-secondary hidden sm:block">
          {format(currentTime, 'HH:mm:ss')}
        </div>
        
        <div className="text-xs text-text-muted hidden md:block">
          {format(currentTime, 'MMM d, yyyy')}
        </div>
      </div>
    </header>
  );
}

