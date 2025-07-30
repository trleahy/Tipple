/**
 * Data refresh utilities for synchronizing public views with admin changes
 */

import { useCallback, useMemo } from 'react';
import { invalidateAllCaches, getAllCocktailsAsync, getAllIngredientsAsync } from '@/utils/cocktailUtils';

// Event system for data refresh notifications
type DataRefreshListener = () => void;

class DataRefreshManager {
  private cocktailListeners: DataRefreshListener[] = [];
  private ingredientListeners: DataRefreshListener[] = [];

  // Subscribe to cocktail data changes
  onCocktailDataChange(listener: DataRefreshListener): () => void {
    this.cocktailListeners.push(listener);
    // Return unsubscribe function
    return () => {
      const index = this.cocktailListeners.indexOf(listener);
      if (index > -1) {
        this.cocktailListeners.splice(index, 1);
      }
    };
  }

  // Subscribe to ingredient data changes
  onIngredientDataChange(listener: DataRefreshListener): () => void {
    this.ingredientListeners.push(listener);
    // Return unsubscribe function
    return () => {
      const index = this.ingredientListeners.indexOf(listener);
      if (index > -1) {
        this.ingredientListeners.splice(index, 1);
      }
    };
  }

  // Notify all cocktail listeners
  notifyCocktailDataChange(): void {
    console.log('Notifying cocktail data change to', this.cocktailListeners.length, 'listeners');
    this.cocktailListeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in cocktail data change listener:', error);
      }
    });
  }

  // Notify all ingredient listeners
  notifyIngredientDataChange(): void {
    console.log('Notifying ingredient data change to', this.ingredientListeners.length, 'listeners');
    this.ingredientListeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in ingredient data change listener:', error);
      }
    });
  }

  // Refresh all data and notify listeners
  async refreshAllData(): Promise<void> {
    console.log('Refreshing all data and notifying listeners');
    
    try {
      // Invalidate caches first
      invalidateAllCaches();
      
      // Preload fresh data
      await Promise.all([
        getAllCocktailsAsync(),
        getAllIngredientsAsync()
      ]);
      
      // Notify all listeners
      this.notifyCocktailDataChange();
      this.notifyIngredientDataChange();
      
      console.log('All data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing all data:', error);
    }
  }

  // Refresh cocktail data specifically
  async refreshCocktailData(): Promise<void> {
    console.log('Refreshing cocktail data');
    
    try {
      await getAllCocktailsAsync();
      this.notifyCocktailDataChange();
      console.log('Cocktail data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing cocktail data:', error);
    }
  }

  // Refresh ingredient data specifically
  async refreshIngredientData(): Promise<void> {
    console.log('Refreshing ingredient data');
    
    try {
      await getAllIngredientsAsync();
      this.notifyIngredientDataChange();
      console.log('Ingredient data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing ingredient data:', error);
    }
  }
}

// Global instance
export const dataRefreshManager = new DataRefreshManager();

// Convenience hooks for React components
export function useDataRefresh() {
  const refreshAllData = useCallback(() => dataRefreshManager.refreshAllData(), []);
  const refreshCocktailData = useCallback(() => dataRefreshManager.refreshCocktailData(), []);
  const refreshIngredientData = useCallback(() => dataRefreshManager.refreshIngredientData(), []);
  const onCocktailDataChange = useCallback((listener: DataRefreshListener) => dataRefreshManager.onCocktailDataChange(listener), []);
  const onIngredientDataChange = useCallback((listener: DataRefreshListener) => dataRefreshManager.onIngredientDataChange(listener), []);

  return useMemo(() => ({
    refreshAllData,
    refreshCocktailData,
    refreshIngredientData,
    onCocktailDataChange,
    onIngredientDataChange,
  }), [refreshAllData, refreshCocktailData, refreshIngredientData, onCocktailDataChange, onIngredientDataChange]);
}

// Auto-refresh when returning from admin pages (DISABLED to prevent excessive API calls)
export function setupAutoRefresh(): void {
  if (typeof window === 'undefined') return;

  console.log('Auto-refresh system disabled to prevent excessive API calls');

  // TODO: Re-enable with smart caching and rate limiting
  // The smart cache system now handles data freshness automatically

  // // Listen for focus events (when user returns to tab)
  // window.addEventListener('focus', () => {
  //   // Check if we're on a public page (not admin)
  //   if (!window.location.pathname.startsWith('/admin')) {
  //     console.log('Page focused on public route, refreshing data');
  //     dataRefreshManager.refreshAllData();
  //   }
  // });

  // // Listen for visibility change events
  // document.addEventListener('visibilitychange', () => {
  //   if (!document.hidden && !window.location.pathname.startsWith('/admin')) {
  //     console.log('Page became visible on public route, refreshing data');
  //     dataRefreshManager.refreshAllData();
  //   }
  // });
}
