/**
 * Smart caching layer that manages data between local cache and Supabase
 * Reduces API calls while maintaining data freshness
 */

import { localDatabase } from './localDatabase';
import { adminDataStorage } from './storage';
import { Cocktail, Ingredient, GlassType } from '@/types/cocktail';

interface Category {
  id: string;
  name: string;
  color: string;
  emoji: string;
  description: string;
}

class SmartCache {
  private isRefreshing = false;
  private refreshPromises: Map<string, Promise<any>> = new Map();

  /**
   * Get cocktails with smart caching
   */
  async getCocktails(): Promise<Cocktail[]> {
    try {
      // First, try to get from local cache
      const { data: cachedCocktails, isFresh } = await localDatabase.getCocktails();
      
      // If we have fresh cached data, return it immediately
      if (isFresh && cachedCocktails.length > 0) {
        console.log(`Using fresh cached cocktails: ${cachedCocktails.length} items`);
        return cachedCocktails;
      }
      
      // If we have stale cached data, return it but refresh in background
      if (cachedCocktails.length > 0) {
        console.log(`Using stale cached cocktails: ${cachedCocktails.length} items, refreshing in background`);
        this.refreshCocktailsInBackground();
        return cachedCocktails;
      }
      
      // No cached data, fetch from Supabase
      console.log('No cached cocktails found, fetching from Supabase');
      return await this.fetchAndCacheCocktails();
      
    } catch (error) {
      console.error('Error in smart cache getCocktails:', error);
      
      // Fallback to any cached data we might have
      try {
        const { data: fallbackData } = await localDatabase.getCocktails();
        if (fallbackData.length > 0) {
          console.log('Using fallback cached data');
          return fallbackData;
        }
      } catch (fallbackError) {
        console.error('Fallback cache also failed:', fallbackError);
      }
      
      return [];
    }
  }

  /**
   * Get ingredients with smart caching
   */
  async getIngredients(): Promise<Ingredient[]> {
    try {
      // First, try to get from local cache
      const { data: cachedIngredients, isFresh } = await localDatabase.getIngredients();
      
      // If we have fresh cached data, return it immediately
      if (isFresh && cachedIngredients.length > 0) {
        console.log(`Using fresh cached ingredients: ${cachedIngredients.length} items`);
        return cachedIngredients;
      }
      
      // If we have stale cached data, return it but refresh in background
      if (cachedIngredients.length > 0) {
        console.log(`Using stale cached ingredients: ${cachedIngredients.length} items, refreshing in background`);
        this.refreshIngredientsInBackground();
        return cachedIngredients;
      }
      
      // No cached data, fetch from Supabase
      console.log('No cached ingredients found, fetching from Supabase');
      return await this.fetchAndCacheIngredients();
      
    } catch (error) {
      console.error('Error in smart cache getIngredients:', error);
      
      // Fallback to any cached data we might have
      try {
        const { data: fallbackData } = await localDatabase.getIngredients();
        if (fallbackData.length > 0) {
          console.log('Using fallback cached ingredients');
          return fallbackData;
        }
      } catch (fallbackError) {
        console.error('Fallback cache also failed:', fallbackError);
      }
      
      return [];
    }
  }

  /**
   * Get glass types with smart caching
   */
  async getGlassTypes(): Promise<GlassType[]> {
    try {
      const { data: cachedGlassTypes, isFresh } = await localDatabase.getGlassTypes();
      
      if (isFresh && cachedGlassTypes.length > 0) {
        console.log(`Using fresh cached glass types: ${cachedGlassTypes.length} items`);
        return cachedGlassTypes;
      }
      
      if (cachedGlassTypes.length > 0) {
        console.log(`Using stale cached glass types: ${cachedGlassTypes.length} items, refreshing in background`);
        this.refreshGlassTypesInBackground();
        return cachedGlassTypes;
      }
      
      console.log('No cached glass types found, fetching from Supabase');
      return await this.fetchAndCacheGlassTypes();
      
    } catch (error) {
      console.error('Error in smart cache getGlassTypes:', error);
      return [];
    }
  }

  /**
   * Get categories with smart caching
   */
  async getCategories(): Promise<Category[]> {
    try {
      const { data: cachedCategories, isFresh } = await localDatabase.getCategories();
      
      if (isFresh && cachedCategories.length > 0) {
        console.log(`Using fresh cached categories: ${cachedCategories.length} items`);
        return cachedCategories;
      }
      
      if (cachedCategories.length > 0) {
        console.log(`Using stale cached categories: ${cachedCategories.length} items, refreshing in background`);
        this.refreshCategoriesInBackground();
        return cachedCategories;
      }
      
      console.log('No cached categories found, fetching from Supabase');
      return await this.fetchAndCacheCategories();
      
    } catch (error) {
      console.error('Error in smart cache getCategories:', error);
      return [];
    }
  }

  /**
   * Fetch cocktails from Supabase and cache them
   */
  private async fetchAndCacheCocktails(): Promise<Cocktail[]> {
    const cacheKey = 'cocktails';
    
    // Prevent multiple simultaneous requests
    if (this.refreshPromises.has(cacheKey)) {
      return await this.refreshPromises.get(cacheKey)!;
    }
    
    const promise = this.doFetchAndCacheCocktails();
    this.refreshPromises.set(cacheKey, promise);
    
    try {
      const result = await promise;
      return result;
    } finally {
      this.refreshPromises.delete(cacheKey);
    }
  }

  private async doFetchAndCacheCocktails(): Promise<Cocktail[]> {
    try {
      const cocktails = await adminDataStorage.getCocktails();
      await localDatabase.saveCocktails(cocktails);
      console.log(`Fetched and cached ${cocktails.length} cocktails from Supabase`);
      return cocktails;
    } catch (error) {
      console.error('Failed to fetch cocktails from Supabase:', error);
      throw error;
    }
  }

  /**
   * Fetch ingredients from Supabase and cache them
   */
  private async fetchAndCacheIngredients(): Promise<Ingredient[]> {
    const cacheKey = 'ingredients';
    
    if (this.refreshPromises.has(cacheKey)) {
      return await this.refreshPromises.get(cacheKey)!;
    }
    
    const promise = this.doFetchAndCacheIngredients();
    this.refreshPromises.set(cacheKey, promise);
    
    try {
      const result = await promise;
      return result;
    } finally {
      this.refreshPromises.delete(cacheKey);
    }
  }

  private async doFetchAndCacheIngredients(): Promise<Ingredient[]> {
    try {
      const ingredients = await adminDataStorage.getIngredients();
      await localDatabase.saveIngredients(ingredients);
      console.log(`Fetched and cached ${ingredients.length} ingredients from Supabase`);
      return ingredients;
    } catch (error) {
      console.error('Failed to fetch ingredients from Supabase:', error);
      throw error;
    }
  }

  /**
   * Fetch glass types from Supabase and cache them
   */
  private async fetchAndCacheGlassTypes(): Promise<GlassType[]> {
    try {
      const glassTypes = await adminDataStorage.getGlassTypes();
      await localDatabase.saveGlassTypes(glassTypes);
      console.log(`Fetched and cached ${glassTypes.length} glass types from Supabase`);
      return glassTypes;
    } catch (error) {
      console.error('Failed to fetch glass types from Supabase:', error);
      throw error;
    }
  }

  /**
   * Fetch categories from Supabase and cache them
   */
  private async fetchAndCacheCategories(): Promise<Category[]> {
    try {
      const categories = await adminDataStorage.getCategories();
      await localDatabase.saveCategories(categories);
      console.log(`Fetched and cached ${categories.length} categories from Supabase`);
      return categories;
    } catch (error) {
      console.error('Failed to fetch categories from Supabase:', error);
      throw error;
    }
  }

  /**
   * Background refresh methods (don't block UI)
   */
  private refreshCocktailsInBackground(): void {
    if (this.isRefreshing) return;
    
    setTimeout(async () => {
      try {
        await this.fetchAndCacheCocktails();
      } catch (error) {
        console.error('Background cocktail refresh failed:', error);
      }
    }, 100); // Small delay to not block UI
  }

  private refreshIngredientsInBackground(): void {
    if (this.isRefreshing) return;
    
    setTimeout(async () => {
      try {
        await this.fetchAndCacheIngredients();
      } catch (error) {
        console.error('Background ingredient refresh failed:', error);
      }
    }, 100);
  }

  private refreshGlassTypesInBackground(): void {
    if (this.isRefreshing) return;
    
    setTimeout(async () => {
      try {
        await this.fetchAndCacheGlassTypes();
      } catch (error) {
        console.error('Background glass types refresh failed:', error);
      }
    }, 100);
  }

  private refreshCategoriesInBackground(): void {
    if (this.isRefreshing) return;
    
    setTimeout(async () => {
      try {
        await this.fetchAndCacheCategories();
      } catch (error) {
        console.error('Background categories refresh failed:', error);
      }
    }, 100);
  }

  /**
   * Force refresh all data from Supabase
   */
  async forceRefreshAll(): Promise<void> {
    console.log('Force refreshing all data from Supabase');
    this.isRefreshing = true;
    
    try {
      await Promise.all([
        this.fetchAndCacheCocktails(),
        this.fetchAndCacheIngredients(),
        this.fetchAndCacheGlassTypes(),
        this.fetchAndCacheCategories()
      ]);
      console.log('Force refresh completed successfully');
    } catch (error) {
      console.error('Force refresh failed:', error);
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    await localDatabase.clearCache();
    console.log('All cache cleared');
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    return await localDatabase.getCacheStats();
  }
}

// Export singleton instance
export const smartCache = new SmartCache();
