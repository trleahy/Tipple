/**
 * Lazy-loaded admin components to reduce initial bundle size
 * This file provides examples of how to implement lazy loading for admin components
 */

import dynamic from 'next/dynamic';

// Example of how to lazy load admin components when they exist
// Uncomment and modify these when you have actual admin components

/*
export const LazyAdminCocktailForm = dynamic(
  () => import('./AdminCocktailForm'),
  {
    loading: () => (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="h-32 bg-gray-200 rounded mb-4"></div>
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="h-8 bg-gray-200 rounded"></div>
      </div>
    ),
    ssr: false
  }
);
*/

// Placeholder component for demonstration
export const LazyPlaceholder = dynamic(
  () => Promise.resolve({ default: () => <div>Lazy loaded component placeholder</div> }),
  {
    loading: () => (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded"></div>
      </div>
    ),
    ssr: false
  }
);
