'use client';

import { useEffect } from 'react';
import { setupAutoRefresh } from '@/utils/dataRefreshUtils';

/**
 * Provider component that sets up automatic data refresh when users return from admin pages
 */
export default function DataRefreshProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Set up auto-refresh listeners
    setupAutoRefresh();
    
    console.log('Data refresh system initialized');
  }, []);

  return <>{children}</>;
}
