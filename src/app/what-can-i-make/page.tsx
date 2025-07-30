'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { findCocktailsWithIngredients, getAllIngredientsAsync } from '@/utils/cocktailUtils';
import { UserIngredients, IngredientCategory, Ingredient } from '@/types/cocktail';
import { performanceMonitor } from '@/utils/performanceUtils';
import { WhatCanIMakePageSkeleton } from '@/components/SkeletonLoaders';
import { useSmoothLoading } from '@/hooks/useMinimumLoadingTime';
import { useDataRefresh } from '@/utils/dataRefreshUtils';

// Lazy load heavy components
const CocktailCard = dynamic(() => import('@/components/CocktailCard'), {
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-48"></div>
});

const IngredientSelector = dynamic(() => import('@/components/IngredientSelector'), {
  loading: () => <div className="animate-pulse bg-gray-200 rounded h-12"></div>
});

export default function WhatCanIMakePage() {
  const [userIngredients, setUserIngredients] = useState<UserIngredients>({
    spirits: [],
    mixers: [],
    others: []
  });
  const [showOnlyCanMake, setShowOnlyCanMake] = useState(false);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [isLoadingIngredients, setIsLoadingIngredients] = useState(true);
  const { onIngredientDataChange } = useDataRefresh();

  // Use smooth loading to prevent flickering
  const { shouldShowLoading } = useSmoothLoading(isLoadingIngredients, {
    minimumDuration: 600,
    delayBeforeShowing: 300
  });

  // Load fresh ingredients on component mount
  useEffect(() => {
    const loadIngredients = async () => {
      setIsLoadingIngredients(true);
      try {
        // Get fresh ingredients from Supabase only
        const freshIngredients = await getAllIngredientsAsync();
        setAllIngredients(freshIngredients);
        console.log('Loaded fresh ingredients:', freshIngredients.length);
      } catch (error) {
        console.error('Failed to load ingredients:', error);
        // Set empty array on error instead of using cached data
        setAllIngredients([]);
      } finally {
        setIsLoadingIngredients(false);
      }
    };

    loadIngredients();

    // Listen for ingredient data changes from admin operations
    const unsubscribe = onIngredientDataChange(() => {
      console.log('Ingredient data changed, reloading...');
      loadIngredients();
    });

    return unsubscribe;
  }, [onIngredientDataChange]);
  
  const cocktailMatches = useMemo(() => {
    if (userIngredients.spirits.length === 0 &&
        userIngredients.mixers.length === 0 &&
        userIngredients.others.length === 0) {
      return [];
    }

    // Monitor performance of cocktail matching
    return performanceMonitor.measureSync(
      'findCocktailsWithIngredients',
      () => findCocktailsWithIngredients(userIngredients),
      {
        spiritsCount: userIngredients.spirits.length,
        mixersCount: userIngredients.mixers.length,
        othersCount: userIngredients.others.length
      }
    );
  }, [userIngredients]);

  const filteredMatches = useMemo(() => {
    if (showOnlyCanMake) {
      return cocktailMatches.filter(match => match.canMake);
    }
    return cocktailMatches;
  }, [cocktailMatches, showOnlyCanMake]);

  const handleIngredientToggle = useCallback((ingredientId: string, category: IngredientCategory) => {
    setUserIngredients(prev => {
      const categoryKey = category === IngredientCategory.SPIRIT ? 'spirits' :
                         category === IngredientCategory.MIXER ||
                         category === IngredientCategory.JUICE ? 'mixers' : 'others';

      const currentList = prev[categoryKey];
      const isSelected = currentList.includes(ingredientId);

      return {
        ...prev,
        [categoryKey]: isSelected
          ? currentList.filter(id => id !== ingredientId)
          : [...currentList, ingredientId]
      };
    });
  }, []);

  const clearAllIngredients = () => {
    setUserIngredients({
      spirits: [],
      mixers: [],
      others: []
    });
  };

  const totalSelectedIngredients = userIngredients.spirits.length + 
                                  userIngredients.mixers.length + 
                                  userIngredients.others.length;

  const canMakeCount = cocktailMatches.filter(match => match.canMake).length;
  const partialMatchCount = cocktailMatches.filter(match => !match.canMake && match.matchPercentage > 0).length;

  // Show skeleton loader to prevent flickering
  if (shouldShowLoading) {
    return <WhatCanIMakePageSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">What Can I Make?</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Select the ingredients you have available and discover what cocktails you can create!
        </p>
        <p className="text-sm text-gray-500 mt-2">
          {allIngredients.length} ingredients available
        </p>
      </div>

      {/* Ingredient Selection */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Select Your Ingredients ({totalSelectedIngredients} selected)
          </h2>
          {totalSelectedIngredients > 0 && (
            <button
              onClick={clearAllIngredients}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        <IngredientSelector
          allIngredients={allIngredients}
          selectedIngredients={userIngredients}
          onIngredientToggle={handleIngredientToggle}
        />
      </div>

      {/* Results Summary */}
      {totalSelectedIngredients > 0 && (
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{canMakeCount}</div>
                <div className="text-gray-600">Can Make Completely</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600 mb-2">{partialMatchCount}</div>
                <div className="text-gray-600">Partial Matches</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{cocktailMatches.length}</div>
                <div className="text-gray-600">Total Matches</div>
              </div>
            </div>

            {cocktailMatches.length > 0 && (
              <div className="mt-6 flex items-center justify-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showOnlyCanMake}
                    onChange={(e) => setShowOnlyCanMake(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Show only cocktails I can make completely
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {totalSelectedIngredients === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🍹</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Select ingredients to get started
          </h3>
          <p className="text-gray-600">
            Choose from spirits, mixers, and other ingredients you have available.
          </p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">😔</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {showOnlyCanMake ? 'No complete matches found' : 'No matches found'}
          </h3>
          <p className="text-gray-600 mb-4">
            {showOnlyCanMake 
              ? 'Try unchecking "Show only cocktails I can make completely" to see partial matches.'
              : 'Try selecting different ingredients or adding more to your collection.'
            }
          </p>
          {showOnlyCanMake && canMakeCount === 0 && partialMatchCount > 0 && (
            <button
              onClick={() => setShowOnlyCanMake(false)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Show Partial Matches
            </button>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {filteredMatches.length} Cocktail{filteredMatches.length !== 1 ? 's' : ''} Found
            </h2>
            <p className="text-gray-600">
              Sorted by match percentage (highest first)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMatches.map((match) => (
              <CocktailCard
                key={match.cocktail.id}
                cocktail={match.cocktail}
                showMatchPercentage={match.matchPercentage}
                missingIngredients={match.missingIngredients.map(ing => ing.name)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
