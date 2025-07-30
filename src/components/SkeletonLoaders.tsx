/**
 * Reusable skeleton loader components to prevent UI flickering
 */

export function CocktailCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200"></div>
      <div className="p-4">
        <div className="h-6 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded w-16"></div>
          <div className="h-4 bg-gray-200 rounded w-12"></div>
        </div>
      </div>
    </div>
  );
}

export function CocktailGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <CocktailCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function CategoryButtonSkeleton() {
  return (
    <div className="p-6 rounded-lg border-2 border-gray-200 bg-white animate-pulse">
      <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-3"></div>
      <div className="h-5 bg-gray-200 rounded mb-1"></div>
      <div className="h-4 bg-gray-200 rounded w-12 mx-auto"></div>
    </div>
  );
}

export function CategoryGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <CategoryButtonSkeleton key={index} />
      ))}
    </div>
  );
}

export function IngredientSelectorSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Spirits Section */}
      <div>
        <div className="h-6 bg-gray-200 rounded mb-3 w-24"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-10 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
      
      {/* Mixers Section */}
      <div>
        <div className="h-6 bg-gray-200 rounded mb-3 w-24"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="h-10 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
      
      {/* Others Section */}
      <div>
        <div className="h-6 bg-gray-200 rounded mb-3 w-24"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-10 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SearchBarSkeleton() {
  return (
    <div className="flex gap-4 mb-6 animate-pulse">
      <div className="flex-1 h-12 bg-gray-200 rounded-lg"></div>
      <div className="h-12 w-24 bg-gray-200 rounded-lg"></div>
    </div>
  );
}

export function TagCloudSkeleton() {
  return (
    <div className="flex flex-wrap gap-2 animate-pulse">
      {Array.from({ length: 12 }).map((_, index) => (
        <div 
          key={index} 
          className="h-8 bg-gray-200 rounded-full"
          style={{ width: `${60 + Math.random() * 40}px` }}
        ></div>
      ))}
    </div>
  );
}

export function BrowsePageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="h-10 bg-gray-200 rounded mb-4 w-64 animate-pulse"></div>
        <div className="h-6 bg-gray-200 rounded w-96 animate-pulse"></div>
      </div>
      
      <SearchBarSkeleton />
      <CocktailGridSkeleton />
    </div>
  );
}

export function CategoriesPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="h-10 bg-gray-200 rounded mb-4 w-64 animate-pulse"></div>
        <div className="h-6 bg-gray-200 rounded w-96 animate-pulse"></div>
      </div>
      
      <div className="mb-12">
        <div className="h-8 bg-gray-200 rounded mb-6 w-32 animate-pulse"></div>
        <CategoryGridSkeleton />
      </div>
      
      <div className="mb-8">
        <div className="h-8 bg-gray-200 rounded mb-6 w-32 animate-pulse"></div>
        <TagCloudSkeleton />
      </div>
      
      <CocktailGridSkeleton />
    </div>
  );
}

export function WhatCanIMakePageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="h-10 bg-gray-200 rounded mb-4 w-64 animate-pulse"></div>
        <div className="h-6 bg-gray-200 rounded w-96 animate-pulse"></div>
      </div>
      
      <div className="mb-8">
        <IngredientSelectorSkeleton />
      </div>
      
      <div className="mb-6">
        <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
      </div>
      
      <CocktailGridSkeleton count={4} />
    </div>
  );
}
