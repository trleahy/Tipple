'use client';

import { useState, useMemo } from 'react';
import { searchCocktails } from '@/utils/cocktailUtils';
import { SearchFilters } from '@/types/cocktail';
import CocktailCard from '@/components/CocktailCard';
import SearchBar from '@/components/SearchBar';
import FilterPanel from '@/components/FilterPanel';

export default function BrowsePage() {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const filteredCocktails = useMemo(() => {
    return searchCocktails(filters);
  }, [filters]);

  const handleSearchChange = (query: string) => {
    setFilters(prev => ({ ...prev, query }));
  };

  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Browse Cocktails</h1>
        <p className="text-gray-600">
          Discover amazing cocktail recipes from our collection of {filteredCocktails.length} drinks.
        </p>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <div className="flex-1">
            <SearchBar
              value={filters.query || ''}
              onChange={handleSearchChange}
              placeholder="Search cocktails by name, description, or tags..."
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <span>🔍</span>
              Filters
              {Object.keys(filters).length > 1 && (
                <span className="bg-blue-800 text-xs px-2 py-1 rounded-full">
                  {Object.keys(filters).length - 1}
                </span>
              )}
            </button>
            {Object.keys(filters).length > 0 && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <FilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            onClose={() => setShowFilters(false)}
          />
        )}
      </div>

      {/* Results */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {filteredCocktails.length} Cocktail{filteredCocktails.length !== 1 ? 's' : ''} Found
          </h2>
          <div className="text-sm text-gray-500">
            Sorted by relevance
          </div>
        </div>
      </div>

      {/* Cocktail Grid */}
      {filteredCocktails.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCocktails.map((cocktail) => (
            <CocktailCard key={cocktail.id} cocktail={cocktail} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🍸</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No cocktails found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search terms or filters to find more cocktails.
          </p>
          <button
            onClick={clearFilters}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
