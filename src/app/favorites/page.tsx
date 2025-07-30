'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getFavoriteIds, clearAllFavorites } from '@/utils/favoritesUtils';
import { getCocktailById } from '@/utils/cocktailUtils';
import { Cocktail } from '@/types/cocktail';
import CocktailCard from '@/components/CocktailCard';

export default function FavoritesPage() {
  const [favoriteCocktails, setFavoriteCocktails] = useState<Cocktail[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    try {
      const favoriteIds = await getFavoriteIds();
      const cocktails = favoriteIds
        .map(id => getCocktailById(id))
        .filter((cocktail): cocktail is Cocktail => cocktail !== undefined);

      setFavoriteCocktails(cocktails);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
    // Note: Removed localStorage storage change listener since we're using Supabase only
  }, [loadFavorites]);

  const handleClearAll = useCallback(async () => {
    if (window.confirm('Are you sure you want to remove all favorites? This action cannot be undone.')) {
      try {
        await clearAllFavorites();
        setFavoriteCocktails([]);
      } catch (error) {
        console.error('Error clearing favorites:', error);
      }
    }
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-xl font-semibold text-gray-900">Loading your favorites...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">My Favorite Cocktails</h1>
        <p className="text-xl text-gray-600">
          Your personal collection of saved cocktail recipes
        </p>
      </div>

      {favoriteCocktails.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12">
          <div className="text-6xl mb-6">❤️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No favorites yet</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Start exploring cocktails and click the heart icon to save your favorites. 
            They&apos;ll appear here for easy access later!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/browse"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Cocktails
            </Link>
            <Link
              href="/what-can-i-make"
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              What Can I Make?
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Stats and Actions */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  {favoriteCocktails.length} Favorite Cocktail{favoriteCocktails.length !== 1 ? 's' : ''}
                </h2>
                <p className="text-gray-600">
                  Keep discovering and adding more to your collection!
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Clear All
                </button>
                <Link
                  href="/browse"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Find More
                </Link>
              </div>
            </div>
          </div>

          {/* Favorites Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {favoriteCocktails.map((cocktail) => (
              <CocktailCard key={cocktail.id} cocktail={cocktail} />
            ))}
          </div>

          {/* Quick Stats */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Favorites Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {favoriteCocktails.length}
                </div>
                <div className="text-sm text-gray-600">Total Favorites</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {favoriteCocktails.filter(c => c.difficulty === 'easy').length}
                </div>
                <div className="text-sm text-gray-600">Easy Recipes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {[...new Set(favoriteCocktails.map(c => c.category))].length}
                </div>
                <div className="text-sm text-gray-600">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {Math.round(favoriteCocktails.reduce((sum, c) => sum + c.prepTime, 0) / favoriteCocktails.length)}
                </div>
                <div className="text-sm text-gray-600">Avg. Prep Time</div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Love these cocktails? You might also enjoy...
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/categories"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse by Category
              </Link>
              <Link
                href="/what-can-i-make"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Find Similar Recipes
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
