'use client';

import { useEffect, useState } from 'react';
import { getAllCocktailsAsync, getAllIngredientsAsync } from '@/utils/cocktailUtils';
import { initWebVitals } from '@/utils/performanceUtils';
import { Cocktail } from '@/types/cocktail';

export default function Home() {
  const [featuredCocktails, setFeaturedCocktails] = useState<Cocktail[]>([]);
  const [stats, setStats] = useState({ totalCocktails: 0, totalIngredients: 0, categories: 0 });
  const [isLoaded, setIsLoaded] = useState(false);


  // Load data asynchronously from Supabase only
  useEffect(() => {
    const loadData = async () => {
      try {
        const [cocktails, ingredients] = await Promise.all([
          getAllCocktailsAsync(),
          getAllIngredientsAsync()
        ]);

        // Get featured cocktails (classic and easy ones)
        const featured = cocktails.filter(cocktail =>
          cocktail.tags.includes('Classic') ||
          cocktail.tags.includes('IBA Official') ||
          cocktail.difficulty === 'easy'
        ).slice(0, 6);

        // Calculate stats
        const categories = [...new Set(cocktails.map(c => c.category))].length;

        setFeaturedCocktails(featured);
        setStats({
          totalCocktails: cocktails.length,
          totalIngredients: ingredients.length,
          categories
        });
      } catch (error) {
        console.error('Error loading home page data:', error);
        // Set empty states on error instead of using cached data
        setFeaturedCocktails([]);
        setStats({ totalCocktails: 0, totalIngredients: 0, categories: 0 });
      } finally {
        setIsLoaded(true);
      }
    };

    loadData();
    initWebVitals();
  }, []);

  // Show loading state to prevent hydration mismatch
  if (!isLoaded) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⏳</div>
          <div className="text-xl font-semibold text-gray-900 mb-2">Loading Tipple...</div>
          <p className="text-gray-600">Getting everything ready for you</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="float-animation text-6xl mb-6">🍹</div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Welcome to Tipple
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Discover amazing cocktail recipes, find what you can make with your ingredients,
          and explore the world of mixology.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow duration-300">
          <div className="text-4xl mb-3">🍸</div>
          <div className="text-3xl font-bold text-blue-600 mb-2">{stats.totalCocktails}</div>
          <div className="text-gray-600">Cocktail Recipes</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow duration-300">
          <div className="text-4xl mb-3">🧪</div>
          <div className="text-3xl font-bold text-green-600 mb-2">{stats.totalIngredients}</div>
          <div className="text-gray-600">Ingredients</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow duration-300">
          <div className="text-4xl mb-3">📂</div>
          <div className="text-3xl font-bold text-purple-600 mb-2">{stats.categories}</div>
          <div className="text-gray-600">Categories</div>
        </div>
      </div>

      {/* Featured Cocktails */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Featured Cocktails</h2>
          <a
            href="/browse"
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            Browse All
            <span>→</span>
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredCocktails.map((cocktail) => (
            <div key={cocktail.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <span className="text-6xl">🍸</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{cocktail.name}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{cocktail.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">🥃 {cocktail.glassType?.name || 'Glass'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-sm text-gray-500">⏱️ {cocktail.prepTime}min</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-1">
                  {(cocktail.tags || []).slice(0, 2).map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-center text-white shadow-xl">
        <div className="text-4xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold mb-4">Ready to Start Mixing?</h2>
        <p className="text-blue-100 mb-6">
          Tell us what ingredients you have and we&apos;ll show you what cocktails you can make!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/what-can-i-make"
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-200 hover:scale-105 inline-block shadow-lg"
          >
            What Can I Make? 🔍
          </a>
          <button
            onClick={() => {
              // Generate random cocktail from loaded data
              if (featuredCocktails.length > 0) {
                const randomIndex = Math.floor(Math.random() * featuredCocktails.length);
                const randomCocktail = featuredCocktails[randomIndex];
                window.location.href = `/cocktail/${randomCocktail.id}`;
              }
            }}
            className="bg-white/20 text-white border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all duration-200 hover:scale-105 inline-block"
          >
            Surprise Me! 🎲
          </button>
        </div>
      </div>
    </div>
  );
}
