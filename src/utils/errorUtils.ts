/**
 * Centralized error handling utilities
 */

export enum ErrorType {
  STORAGE = 'STORAGE',
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTH = 'AUTH',
  UNKNOWN = 'UNKNOWN'
}

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: unknown;
  context?: Record<string, unknown>;
}

/**
 * Create a standardized error object
 */
export function createError(
  type: ErrorType,
  message: string,
  originalError?: unknown,
  context?: Record<string, unknown>
): AppError {
  return {
    type,
    message,
    originalError,
    context
  };
}

/**
 * Safe localStorage operations with error handling
 */
export const safeLocalStorage = {
  getItem<T>(key: string, defaultValue: T): T {
    try {
      if (typeof window === 'undefined') {
        return defaultValue;
      }
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return defaultValue;
    }
  },

  setItem<T>(key: string, value: T): boolean {
    try {
      if (typeof window === 'undefined') {
        return false;
      }
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
      return false;
    }
  },

  removeItem(key: string): boolean {
    try {
      if (typeof window === 'undefined') {
        return false;
      }
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error);
      return false;
    }
  }
};

/**
 * Standardized logging utility
 */
export const logger = {
  info: (message: string, context?: Record<string, unknown>) => {
    console.log(`[INFO] ${message}`, context || '');
  },

  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn(`[WARN] ${message}`, context || '');
  },

  error: (message: string, error?: unknown, context?: Record<string, unknown>) => {
    console.error(`[ERROR] ${message}`, error || '', context || '');
  },

  debug: (message: string, context?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, context || '');
    }
  }
};

/**
 * Retry utility for async operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      logger.warn(`Operation failed (attempt ${attempt}/${maxRetries})`, { error });

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }

  throw createError(
    ErrorType.UNKNOWN,
    `Operation failed after ${maxRetries} attempts`,
    lastError
  );
}

/**
 * Type guard for checking if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return typeof error === 'object' && 
         error !== null && 
         'type' in error && 
         'message' in error;
}

/**
 * Extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unknown error occurred';
}
