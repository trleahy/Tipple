/**
 * Performance monitoring and optimization utilities
 */

import { logger } from './errorUtils';

// Performance metrics interface
interface PerformanceMetrics {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

// Performance monitor class
class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'development' || 
                     typeof window !== 'undefined' && window.location.search.includes('debug=true');
  }

  /**
   * Start measuring performance for a given operation
   */
  start(name: string, metadata?: Record<string, unknown>): void {
    if (!this.isEnabled) return;

    const startTime = performance.now();
    this.metrics.set(name, {
      name,
      startTime,
      metadata
    });

    logger.debug(`Performance: Started measuring "${name}"`, metadata);
  }

  /**
   * End measuring performance for a given operation
   */
  end(name: string): number | undefined {
    if (!this.isEnabled) return;

    const metric = this.metrics.get(name);
    if (!metric) {
      logger.warn(`Performance: No start time found for "${name}"`);
      return;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    logger.debug(`Performance: "${name}" took ${duration.toFixed(2)}ms`, metric.metadata);

    // Log slow operations
    if (duration > 1000) {
      logger.warn(`Performance: Slow operation detected - "${name}" took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  /**
   * Measure a function execution time
   */
  async measure<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, unknown>): Promise<T> {
    this.start(name, metadata);
    try {
      const result = await fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  /**
   * Measure a synchronous function execution time
   */
  measureSync<T>(name: string, fn: () => T, metadata?: Record<string, unknown>): T {
    this.start(name, metadata);
    try {
      const result = fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Get performance summary
   */
  getSummary(): Record<string, { count: number; totalTime: number; avgTime: number }> {
    const summary: Record<string, { count: number; totalTime: number; avgTime: number }> = {};

    for (const metric of this.metrics.values()) {
      if (metric.duration !== undefined) {
        if (!summary[metric.name]) {
          summary[metric.name] = { count: 0, totalTime: 0, avgTime: 0 };
        }
        summary[metric.name].count++;
        summary[metric.name].totalTime += metric.duration;
        summary[metric.name].avgTime = summary[metric.name].totalTime / summary[metric.name].count;
      }
    }

    return summary;
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator for measuring method performance
 */
export function measurePerformance(name?: string) {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const measureName = name || `${target?.constructor?.name || 'Unknown'}.${propertyKey}`;

    descriptor.value = async function (...args: unknown[]) {
      return performanceMonitor.measure(measureName, () => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}

/**
 * Web Vitals monitoring (basic implementation)
 */
export function initWebVitals(): void {
  if (typeof window === 'undefined') return;

  // Basic performance monitoring without external dependencies
  logger.info('Performance monitoring initialized');

  // Monitor navigation timing
  if (window.performance) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          logger.info('Navigation Timing', {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            totalTime: navigation.loadEventEnd - navigation.fetchStart
          });
        }
      }, 0);
    });
  }
}

/**
 * Throttle function to limit execution frequency
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Debounce function to delay execution
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null;
  return function (this: unknown, ...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };
    const callNow = immediate && !timeout;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(this, args);
  };
}

/**
 * Lazy load a component or module
 */
export function lazyLoad<T>(
  importFn: () => Promise<{ default: T }>,
  fallback?: T
): () => Promise<T> {
  let cached: T | null = null;
  let loading: Promise<T> | null = null;

  return async (): Promise<T> => {
    if (cached) return cached;
    if (loading) return loading;

    loading = performanceMonitor.measure('lazyLoad', async () => {
      try {
        const moduleResult = await importFn();
        cached = moduleResult.default;
        return cached;
      } catch (error) {
        logger.error('Failed to lazy load module', error);
        if (fallback) {
          cached = fallback;
          return cached;
        }
        throw error;
      } finally {
        loading = null;
      }
    });

    return loading;
  };
}
