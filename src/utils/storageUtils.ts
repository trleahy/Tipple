/**
 * Centralized storage utilities to reduce duplicate code
 */

import { supabase } from '@/lib/supabase';
import { safeLocalStorage, logger, ErrorType, createError, withRetry } from './errorUtils';

/**
 * Check if Supabase is available and user is authenticated
 */
export async function isSupabaseAvailable(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    logger.warn('Supabase availability check failed', { error });
    return false;
  }
}

/**
 * Get current user ID (authenticated or anonymous)
 */
export async function getCurrentUserId(): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user?.id) {
      return session.user.id;
    }
    
    // Fall back to anonymous user ID
    let anonymousId = safeLocalStorage.getItem('tipple-anonymous-user-id', '');
    
    if (!anonymousId) {
      anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      safeLocalStorage.setItem('tipple-anonymous-user-id', anonymousId);
    }
    
    return anonymousId;
  } catch (error) {
    logger.error('Failed to get user ID', error);
    throw createError(ErrorType.AUTH, 'Failed to get user ID', error);
  }
}

/**
 * Generic function for Supabase operations with localStorage fallback
 */
export async function withSupabaseFallback<T>(
  supabaseOperation: () => Promise<T>,
  localStorageKey: string,
  fallbackValue: T,
  options: {
    useCache?: boolean;
    retries?: number;
  } = {}
): Promise<T> {
  const { useCache = true, retries = 1 } = options;

  try {
    if (await isSupabaseAvailable()) {
      const result = await withRetry(supabaseOperation, retries);
      
      // Cache successful result in localStorage
      if (useCache) {
        safeLocalStorage.setItem(localStorageKey, result);
      }
      
      return result;
    }
  } catch (error) {
    logger.warn('Supabase operation failed, falling back to localStorage', { 
      error, 
      localStorageKey 
    });
  }

  // Fallback to localStorage
  return safeLocalStorage.getItem(localStorageKey, fallbackValue);
}

/**
 * Generic function for saving data to Supabase with localStorage backup
 */
export async function saveWithSupabaseFallback<T>(
  supabaseOperation: () => Promise<void>,
  localStorageKey: string,
  data: T,
  options: {
    retries?: number;
  } = {}
): Promise<void> {
  const { retries = 1 } = options;

  try {
    if (await isSupabaseAvailable()) {
      await withRetry(supabaseOperation, retries);
      logger.info('Data saved to Supabase successfully', { localStorageKey });
    } else {
      logger.info('Supabase not available, saving to localStorage only', { localStorageKey });
    }
  } catch (error) {
    logger.warn('Supabase save failed, falling back to localStorage', { 
      error, 
      localStorageKey 
    });
  }

  // Always save to localStorage as backup/cache
  safeLocalStorage.setItem(localStorageKey, data);
}

/**
 * Validate required fields in an object
 */
export function validateRequired<T extends Record<string, unknown>>(
  obj: T,
  requiredFields: (keyof T)[]
): void {
  const missingFields = requiredFields.filter(field => 
    obj[field] === undefined || obj[field] === null || obj[field] === ''
  );

  if (missingFields.length > 0) {
    throw createError(
      ErrorType.VALIDATION,
      `Missing required fields: ${missingFields.join(', ')}`,
      undefined,
      { missingFields, object: obj }
    );
  }
}

/**
 * Debounce utility for reducing API calls
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Cache utility with expiration
 */
export class ExpiringCache<T> {
  private cache = new Map<string, { value: T; expiry: number }>();
  private defaultTTL: number;

  constructor(defaultTTL: number = 300000) { // 5 minutes default
    this.defaultTTL = defaultTTL;
  }

  set(key: string, value: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expiry });
  }

  get(key: string): T | undefined {
    const item = this.cache.get(key);
    
    if (!item) {
      return undefined;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }

    return item.value;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    // Clean expired items first
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
    return this.cache.size;
  }
}
