/**
 * Local IndexedDB database for caching Supabase data
 * Reduces API calls and provides offline functionality
 */

import { Cocktail, Ingredient, GlassType } from '@/types/cocktail';

const DB_NAME = 'TippleCache';
const DB_VERSION = 1;

// Store names
const STORES = {
  COCKTAILS: 'cocktails',
  INGREDIENTS: 'ingredients',
  GLASS_TYPES: 'glass_types',
  CATEGORIES: 'categories',
  METADATA: 'metadata'
} as const;

// Cache expiration time (10 minutes)
const CACHE_EXPIRATION_MS = 10 * 60 * 1000;

interface CacheMetadata {
  store: string;
  lastUpdated: number;
  version: number;
}

interface Category {
  id: string;
  name: string;
  color: string;
  emoji: string;
  description: string;
}

class LocalDatabase {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Clean up any old databases that might conflict
   */
  private async cleanupOldDatabases(): Promise<void> {
    try {
      // List of old database names that might exist
      const oldDatabaseNames = ['TippleDB', 'tipple-db', 'cocktail-cache'];

      for (const oldDbName of oldDatabaseNames) {
        try {
          // Try to delete old database
          const deleteRequest = indexedDB.deleteDatabase(oldDbName);
          await new Promise<void>((resolve) => {
            deleteRequest.onsuccess = () => {
              console.log(`Cleaned up old database: ${oldDbName}`);
              resolve();
            };
            deleteRequest.onerror = () => {
              // Ignore errors - database might not exist
              resolve();
            };
            deleteRequest.onblocked = () => {
              console.warn(`Database ${oldDbName} is blocked, skipping cleanup`);
              resolve();
            };
          });
        } catch (error) {
          // Ignore cleanup errors
          console.warn(`Failed to cleanup database ${oldDbName}:`, error);
        }
      }
    } catch (error) {
      console.warn('Database cleanup failed:', error);
    }
  }

  /**
   * Initialize the IndexedDB database
   */
  private async init(): Promise<void> {
    if (this.db) return;

    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    // Clean up any old databases first
    await this.cleanupOldDatabases();

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains(STORES.COCKTAILS)) {
          db.createObjectStore(STORES.COCKTAILS, { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains(STORES.INGREDIENTS)) {
          db.createObjectStore(STORES.INGREDIENTS, { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains(STORES.GLASS_TYPES)) {
          db.createObjectStore(STORES.GLASS_TYPES, { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
          db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains(STORES.METADATA)) {
          db.createObjectStore(STORES.METADATA, { keyPath: 'store' });
        }
        
        console.log('IndexedDB stores created');
      };
    });

    await this.initPromise;
  }

  /**
   * Check if cached data is still fresh
   */
  private async isCacheFresh(store: string): Promise<boolean> {
    try {
      await this.init();
      if (!this.db) return false;

      const transaction = this.db.transaction([STORES.METADATA], 'readonly');
      const metadataStore = transaction.objectStore(STORES.METADATA);
      
      return new Promise((resolve) => {
        const request = metadataStore.get(store);
        
        request.onsuccess = () => {
          const metadata: CacheMetadata = request.result;
          if (!metadata) {
            resolve(false);
            return;
          }
          
          const age = Date.now() - metadata.lastUpdated;
          const isFresh = age < CACHE_EXPIRATION_MS;
          console.log(`Cache for ${store}: ${isFresh ? 'fresh' : 'stale'} (age: ${Math.round(age / 1000)}s)`);
          resolve(isFresh);
        };
        
        request.onerror = () => {
          console.error(`Failed to check cache freshness for ${store}:`, request.error);
          resolve(false);
        };
      });
    } catch (error) {
      console.error(`Error checking cache freshness for ${store}:`, error);
      return false;
    }
  }

  /**
   * Update cache metadata
   */
  private async updateMetadata(store: string): Promise<void> {
    try {
      await this.init();
      if (!this.db) return;

      const transaction = this.db.transaction([STORES.METADATA], 'readwrite');
      const metadataStore = transaction.objectStore(STORES.METADATA);
      
      const metadata: CacheMetadata = {
        store,
        lastUpdated: Date.now(),
        version: 1
      };
      
      metadataStore.put(metadata);
    } catch (error) {
      console.error(`Failed to update metadata for ${store}:`, error);
    }
  }

  /**
   * Generic method to get data from a store
   */
  private async getFromStore<T>(storeName: string): Promise<T[]> {
    try {
      await this.init();
      if (!this.db) return [];

      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        
        request.onsuccess = () => {
          resolve(request.result || []);
        };
        
        request.onerror = () => {
          console.error(`Failed to get data from ${storeName}:`, request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error(`Error getting data from ${storeName}:`, error);
      return [];
    }
  }

  /**
   * Generic method to save data to a store
   */
  private async saveToStore<T extends { id: string }>(storeName: string, data: T[]): Promise<void> {
    try {
      await this.init();
      if (!this.db) return;

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // Clear existing data
      await new Promise<void>((resolve, reject) => {
        const clearRequest = store.clear();
        clearRequest.onsuccess = () => resolve();
        clearRequest.onerror = () => reject(clearRequest.error);
      });
      
      // Add new data
      for (const item of data) {
        await new Promise<void>((resolve, reject) => {
          const addRequest = store.add(item);
          addRequest.onsuccess = () => resolve();
          addRequest.onerror = () => reject(addRequest.error);
        });
      }
      
      // Update metadata
      await this.updateMetadata(storeName);
      
      console.log(`Saved ${data.length} items to ${storeName}`);
    } catch (error) {
      console.error(`Failed to save data to ${storeName}:`, error);
    }
  }

  /**
   * Get cocktails from cache
   */
  async getCocktails(): Promise<{ data: Cocktail[]; isFresh: boolean }> {
    const isFresh = await this.isCacheFresh(STORES.COCKTAILS);
    const data = await this.getFromStore<Cocktail>(STORES.COCKTAILS);
    return { data, isFresh };
  }

  /**
   * Save cocktails to cache
   */
  async saveCocktails(cocktails: Cocktail[]): Promise<void> {
    await this.saveToStore(STORES.COCKTAILS, cocktails);
  }

  /**
   * Get ingredients from cache
   */
  async getIngredients(): Promise<{ data: Ingredient[]; isFresh: boolean }> {
    const isFresh = await this.isCacheFresh(STORES.INGREDIENTS);
    const data = await this.getFromStore<Ingredient>(STORES.INGREDIENTS);
    return { data, isFresh };
  }

  /**
   * Save ingredients to cache
   */
  async saveIngredients(ingredients: Ingredient[]): Promise<void> {
    await this.saveToStore(STORES.INGREDIENTS, ingredients);
  }

  /**
   * Get glass types from cache
   */
  async getGlassTypes(): Promise<{ data: GlassType[]; isFresh: boolean }> {
    const isFresh = await this.isCacheFresh(STORES.GLASS_TYPES);
    const data = await this.getFromStore<GlassType>(STORES.GLASS_TYPES);
    return { data, isFresh };
  }

  /**
   * Save glass types to cache
   */
  async saveGlassTypes(glassTypes: GlassType[]): Promise<void> {
    await this.saveToStore(STORES.GLASS_TYPES, glassTypes);
  }

  /**
   * Get categories from cache
   */
  async getCategories(): Promise<{ data: Category[]; isFresh: boolean }> {
    const isFresh = await this.isCacheFresh(STORES.CATEGORIES);
    const data = await this.getFromStore<Category>(STORES.CATEGORIES);
    return { data, isFresh };
  }

  /**
   * Save categories to cache
   */
  async saveCategories(categories: Category[]): Promise<void> {
    await this.saveToStore(STORES.CATEGORIES, categories);
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    try {
      await this.init();
      if (!this.db) return;

      const storeNames = [STORES.COCKTAILS, STORES.INGREDIENTS, STORES.GLASS_TYPES, STORES.CATEGORIES, STORES.METADATA];
      const transaction = this.db.transaction(storeNames, 'readwrite');
      
      for (const storeName of storeNames) {
        const store = transaction.objectStore(storeName);
        store.clear();
      }
      
      console.log('All cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{ [key: string]: { count: number; lastUpdated: number | null } }> {
    const stats: { [key: string]: { count: number; lastUpdated: number | null } } = {};
    
    try {
      await this.init();
      if (!this.db) return stats;

      const dataStores = [STORES.COCKTAILS, STORES.INGREDIENTS, STORES.GLASS_TYPES, STORES.CATEGORIES];
      
      for (const storeName of dataStores) {
        const data = await this.getFromStore(storeName);
        const isFresh = await this.isCacheFresh(storeName);
        
        // Get metadata for last updated time
        const transaction = this.db.transaction([STORES.METADATA], 'readonly');
        const metadataStore = transaction.objectStore(STORES.METADATA);
        const metadata = await new Promise<CacheMetadata | null>((resolve) => {
          const request = metadataStore.get(storeName);
          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => resolve(null);
        });
        
        stats[storeName] = {
          count: data.length,
          lastUpdated: metadata?.lastUpdated || null,
          isFresh
        };
      }
    } catch (error) {
      console.error('Failed to get cache stats:', error);
    }
    
    return stats;
  }
}

// Export singleton instance
export const localDatabase = new LocalDatabase();
