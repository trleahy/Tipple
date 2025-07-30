'use client';

import { useState, useEffect } from 'react';
import { smartCache } from '@/lib/smartCache';

interface CacheStats {
  [key: string]: {
    count: number;
    lastUpdated: number | null;
  };
}

export default function CacheManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<CacheStats>({});
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Load cache stats
  const loadStats = async () => {
    try {
      const cacheStats = await smartCache.getCacheStats();
      setStats(cacheStats);
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen]);

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      await smartCache.forceRefreshAll();
      setLastRefresh(new Date());
      await loadStats();
      
      // Show success message
      const event = new CustomEvent('show-toast', {
        detail: {
          message: 'Data refreshed successfully!',
          type: 'success'
        }
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Failed to refresh data:', error);
      
      // Show error message
      const event = new CustomEvent('show-toast', {
        detail: {
          message: 'Failed to refresh data. Please try again.',
          type: 'error'
        }
      });
      window.dispatchEvent(event);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClearCache = async () => {
    if (!confirm('Are you sure you want to clear all cached data? This will require re-downloading all data from the server.')) {
      return;
    }

    try {
      await smartCache.clearCache();
      await loadStats();
      
      // Show success message
      const event = new CustomEvent('show-toast', {
        detail: {
          message: 'Cache cleared successfully!',
          type: 'success'
        }
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Failed to clear cache:', error);
      
      // Show error message
      const event = new CustomEvent('show-toast', {
        detail: {
          message: 'Failed to clear cache. Please try again.',
          type: 'error'
        }
      });
      window.dispatchEvent(event);
    }
  };

  const formatLastUpdated = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getStoreDisplayName = (storeName: string) => {
    const names: { [key: string]: string } = {
      'cocktails': 'Cocktails',
      'ingredients': 'Ingredients',
      'glass_types': 'Glass Types',
      'categories': 'Categories'
    };
    return names[storeName] || storeName;
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        title="Data Cache Manager"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Data Cache Manager</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Cache Statistics */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Cache Status</h3>
            <div className="space-y-3">
              {Object.entries(stats).map(([storeName, stat]) => (
                <div key={storeName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{getStoreDisplayName(storeName)}</div>
                    <div className="text-sm text-gray-600">{stat.count} items</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Last updated</div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatLastUpdated(stat.lastUpdated)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Last Manual Refresh */}
          {lastRefresh && (
            <div className="mb-6 p-3 bg-green-50 rounded-lg">
              <div className="text-sm text-green-800">
                Last manual refresh: {lastRefresh.toLocaleTimeString()}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleRefreshData}
              disabled={isRefreshing}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isRefreshing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Data
                </>
              )}
            </button>

            <button
              onClick={handleClearCache}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear Cache
            </button>
          </div>

          {/* Info */}
          <div className="mt-6 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>Smart Caching:</strong> Data is automatically cached locally and refreshed every 10 minutes. 
              Use "Refresh Data" to manually update all data from the server.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
