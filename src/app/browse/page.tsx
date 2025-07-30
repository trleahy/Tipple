'use client';

import { useState, useMemo, useEffect } from 'react';
import { getAllCocktailsAsync } from '@/utils/cocktailUtils';
import { SearchFilters, Cocktail } from '@/types/cocktail';
import CocktailCard from '@/components/CocktailCard';
import SearchBar from '@/components/SearchBar';
import FilterPanel from '@/components/FilterPanel';
import { BrowsePageSkeleton } from '@/components/SkeletonLoaders';
import { useSmoothLoading } from '@/hooks/useMinimumLoadingTime';
import { useDataRefresh } from '@/utils/dataRefreshUtils';

export default function BrowsePage() {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [allCocktails, setAllCocktails] = useState<Cocktail[]>([]);
  const [isLoadingCocktails, setIsLoadingCocktails] = useState(true);
  const { onCocktailDataChange } = useDataRefresh();

  // Use smooth loading to prevent flickering
  const { shouldShowLoading } = useSmoothLoading(isLoadingCocktails, {
    minimumDuration: 600,
    delayBeforeShowing: 300
  });

  // Load fresh cocktails on component mount
  useEffect(() => {
    const loadCocktails = async () => {
      setIsLoadingCocktails(true);
      try {
        // Get fresh cocktails from Supabase only
        const freshCocktails = await getAllCocktailsAsync();
        setAllCocktails(freshCocktails);
        console.log('Loaded fresh cocktails for browse:', freshCocktails.length);
      } catch (error) {
        console.error('Failed to load cocktails:', error);
        // Set empty array on error instead of using cached data
        setAllCocktails([]);
      } finally {
        setIsLoadingCocktails(false);
      }
    };

    loadCocktails();

    // Listen for cocktail data changes from admin operations
    const unsubscribe = onCocktailDataChange(() => {
      console.log('Cocktail data changed, reloading...');
      loadCocktails();
    });

    return unsubscribe;
  }, [onCocktailDataChange]);

  const filteredCocktails = useMemo(() => {
    if (allCocktails.length === 0) return [];

    // Apply filters to the loaded cocktails
    let filtered = allCocktails;

    // Filter by search query (name or description)
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(cocktail =>
        cocktail.name.toLowerCase().includes(query) ||
        cocktail.description.toLowerCase().includes(query) ||
        cocktail.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Filter by categories
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter(cocktail =>
        filters.categories!.includes(cocktail.category)
      );
    }

    // Filter by difficulty
    if (filters.difficulty && filters.difficulty.length > 0) {
      filtered = filtered.filter(cocktail =>
        filters.difficulty!.includes(cocktail.difficulty)
      );
    }

    // Filter by prep time
    if (filters.maxPrepTime) {
      filtered = filtered.filter(cocktail => cocktail.prepTime <= filters.maxPrepTime!);
    }

    // Filter by alcoholic/non-alcoholic
    if (filters.alcoholic !== undefined) {
      filtered = filtered.filter(cocktail => {
        const hasAlcohol = (cocktail.ingredients || []).some(ci => ci.ingredient.alcoholic);
        return filters.alcoholic ? hasAlcohol : !hasAlcohol;
      });
    }

    return filtered;
  }, [allCocktails, filters]);

  const handleSearchChange = (query: string) => {
    setFilters(prev => ({ ...prev, query }));
  };

  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  // Show skeleton loader to prevent flickering
  if (shouldShowLoading) {
    return <BrowsePageSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Browse Cocktails</h1>
        <p className="text-gray-600">
          Discover amazing cocktail recipes from our collection of {allCocktails.length} drinks.
          {filteredCocktails.length !== allCocktails.length && (
            <span> ({filteredCocktails.length} matching your filters)</span>
          )}
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
