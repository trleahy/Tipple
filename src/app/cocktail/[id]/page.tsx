'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getCocktailById } from '@/utils/cocktailUtils';
import { isFavorite, toggleFavorite } from '@/utils/favoritesUtils';
import { addCocktailToShoppingList } from '@/utils/shoppingListUtils';
import { getSimilarCocktails } from '@/utils/recommendationUtils';
import { Cocktail } from '@/types/cocktail';

// Dynamically import CocktailCard for better code splitting
const CocktailCard = dynamic(() => import('@/components/CocktailCard'), {
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-48"></div>
});

export default function CocktailDetailPage() {
  const params = useParams();
  const cocktailId = params.id as string;
  
  const [cocktail, setCocktail] = useState<Cocktail | null>(null);
  const [isFav, setIsFav] = useState(false);
  const [servings, setServings] = useState(1);
  const [similarCocktails, setSimilarCocktails] = useState<Cocktail[]>([]);

  useEffect(() => {
    if (cocktailId) {
      const foundCocktail = getCocktailById(cocktailId);
      setCocktail(foundCocktail || null);
      
      if (foundCocktail) {
        setIsFav(isFavorite(foundCocktail.id));
        setServings(foundCocktail.servings);
        setSimilarCocktails(getSimilarCocktails(foundCocktail, 4));
      }
    }
  }, [cocktailId]);

  const handleFavoriteClick = async () => {
    if (cocktail) {
      const newFavStatus = await toggleFavorite(cocktail.id);
      setIsFav(newFavStatus);
    }
  };

  const handleAddToShoppingList = async () => {
    if (cocktail) {
      await addCocktailToShoppingList(cocktail);
      alert('Ingredients added to shopping list!');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'classic': return '🏛️';
      case 'modern': return '✨';
      case 'tropical': return '🌴';
      case 'sour': return '🍋';
      case 'sweet': return '🍯';
      case 'bitter': return '🌿';
      case 'strong': return '💪';
      case 'refreshing': return '❄️';
      case 'creamy': return '🥛';
      case 'hot': return '🔥';
      case 'frozen': return '🧊';
      default: return '🍸';
    }
  };

  const scaleAmount = (amount: string, scale: number): string => {
    // Simple scaling for common measurements
    const match = amount.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
    if (match) {
      const [, num, unit] = match;
      const scaledNum = (parseFloat(num) * scale).toString();
      return `${scaledNum} ${unit}`;
    }
    return amount;
  };

  if (!cocktail) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🍸</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Cocktail Not Found</h1>
          <p className="text-gray-600 mb-6">
            The cocktail you&apos;re looking for doesn&apos;t exist or may have been removed.
          </p>
          <Link
            href="/browse"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse All Cocktails
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          href="/browse"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
        >
          <span className="mr-2">←</span>
          Back to Browse
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
        <div className="relative h-64 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
          <span className="text-8xl">{getCategoryEmoji(typeof cocktail.category === 'string' ? cocktail.category : cocktail.category.id)}</span>
          
          {/* Favorite Button */}
          <button
            onClick={handleFavoriteClick}
            className="absolute top-4 right-4 p-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
          >
            <span className={`text-2xl ${isFav ? 'text-red-500' : 'text-white'}`}>
              {isFav ? '❤️' : '🤍'}
            </span>
          </button>
        </div>

        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{cocktail.name}</h1>
              <p className="text-lg text-gray-600">{cocktail.description}</p>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={handleAddToShoppingList}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <span>🛒</span>
                Add to Shopping List
              </button>
            </div>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-2">🥃</div>
              <div className="text-sm font-medium text-gray-900">{cocktail.glassType.name}</div>
              <div className="text-xs text-gray-500">{cocktail.glassType.capacity}</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-2">⏱️</div>
              <div className="text-sm font-medium text-gray-900">{cocktail.prepTime} minutes</div>
              <div className="text-xs text-gray-500">Prep time</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-2">👥</div>
              <div className="text-sm font-medium text-gray-900">{servings} serving{servings !== 1 ? 's' : ''}</div>
              <div className="text-xs text-gray-500">Serves</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(cocktail.difficulty)}`}>
                {cocktail.difficulty.charAt(0).toUpperCase() + cocktail.difficulty.slice(1)}
              </div>
              <div className="text-xs text-gray-500 mt-1">Difficulty</div>
            </div>
          </div>

          {/* Tags */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {cocktail.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recipe Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ingredients */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Ingredients</h2>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Servings:</label>
              <select
                value={servings}
                onChange={(e) => setServings(parseInt(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                {[1, 2, 4, 6, 8].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
          </div>

          <ul className="space-y-3">
            {(cocktail.ingredients || []).map((ingredient, index) => (
              <li key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                  <span className="text-lg mr-3">
                    {ingredient.garnish ? '🌿' : '🧪'}
                  </span>
                  <div>
                    <span className="font-medium text-gray-900">
                      {ingredient.ingredient.name}
                    </span>
                    {ingredient.optional && (
                      <span className="text-sm text-gray-500 ml-2">(optional)</span>
                    )}
                    {ingredient.garnish && (
                      <span className="text-sm text-gray-500 ml-2">(garnish)</span>
                    )}
                  </div>
                </div>
                <span className="text-gray-600 font-medium">
                  {scaleAmount(ingredient.amount, servings / cocktail.servings)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Instructions</h2>
          <ol className="space-y-4">
            {(cocktail.instructions || []).map((instruction, index) => (
              <li key={index} className="flex">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-4">
                  {index + 1}
                </span>
                <p className="text-gray-700 pt-1">{instruction}</p>
              </li>
            ))}
          </ol>

          {cocktail.garnish && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">Garnish</h3>
              <p className="text-green-700">{cocktail.garnish}</p>
            </div>
          )}
        </div>
      </div>

      {/* Additional Info */}
      {cocktail.history && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">History</h2>
          <p className="text-gray-700">{cocktail.history}</p>
        </div>
      )}

      {/* Similar Cocktails */}
      {similarCocktails.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">You Might Also Like</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarCocktails.map((similarCocktail) => (
              <CocktailCard key={similarCocktail.id} cocktail={similarCocktail} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
