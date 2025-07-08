'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import Link from 'next/link';
import { Cocktail } from '@/types/cocktail';
import { isFavorite, toggleFavorite } from '@/utils/favoritesUtils';
import GlassIcon from './GlassIcon';

interface CocktailCardProps {
  cocktail: Cocktail;
  showMatchPercentage?: number;
  missingIngredients?: string[];
}

const CocktailCard = memo(({ cocktail, showMatchPercentage, missingIngredients }: CocktailCardProps) => {
  const [isFav, setIsFav] = useState(() => isFavorite(cocktail.id));

  useEffect(() => {
    // Update favorite status when cocktail changes
    setIsFav(isFavorite(cocktail.id));
  }, [cocktail.id]);

  const handleFavoriteClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const newFavStatus = await toggleFavorite(cocktail.id);
      setIsFav(newFavStatus);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }, [cocktail.id]);

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

  const getCategoryGradient = (category: string) => {
    switch (category) {
      case 'classic': return 'gradient-classic';
      case 'modern': return 'gradient-modern';
      case 'tropical': return 'gradient-tropical';
      case 'sour': return 'from-yellow-400 to-orange-500';
      case 'sweet': return 'from-pink-400 to-red-500';
      case 'bitter': return 'from-green-400 to-teal-500';
      case 'strong': return 'from-gray-700 to-gray-900';
      case 'refreshing': return 'from-blue-400 to-cyan-500';
      case 'creamy': return 'from-amber-200 to-yellow-400';
      case 'hot': return 'from-red-500 to-orange-600';
      case 'frozen': return 'from-blue-200 to-blue-400';
      default: return 'gradient-cocktail';
    }
  };

  return (
    <Link href={`/cocktail/${cocktail.id}`}>
      <div className="cocktail-card bg-white rounded-lg shadow-md overflow-hidden cursor-pointer glass-shimmer">
        {/* Image/Icon Section */}
        <div className={`relative h-48 bg-gradient-to-br ${getCategoryGradient(cocktail.category)} flex items-center justify-center`}>
          <span className="text-6xl float-animation">{getCategoryEmoji(cocktail.category)}</span>
          
          {/* Favorite Button */}
          <button
            onClick={handleFavoriteClick}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-200 hover:scale-110"
          >
            <span className={`text-xl ${isFav ? 'text-red-500 pulse-heart' : 'text-white'}`}>
              {isFav ? '❤️' : '🤍'}
            </span>
          </button>

          {/* Match Percentage (for "What Can I Make" feature) */}
          {showMatchPercentage !== undefined && (
            <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 rounded-full text-sm font-semibold">
              {Math.round(showMatchPercentage)}% match
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
            {cocktail.name}
          </h3>
          
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {cocktail.description}
          </p>

          {/* Cocktail Info */}
          <div className="flex items-center justify-between mb-3 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <GlassIcon glassType={cocktail.glassType.id} className="w-4 h-4" />
              <span>{cocktail.glassType.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>⏱️</span>
              <span>{cocktail.prepTime}min</span>
            </div>
          </div>

          {/* Difficulty Badge */}
          <div className="flex items-center justify-between mb-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(cocktail.difficulty)}`}>
              {cocktail.difficulty.charAt(0).toUpperCase() + cocktail.difficulty.slice(1)}
            </span>
            <div className="text-sm text-gray-500">
              {cocktail.ingredients?.filter(i => !i.garnish).length || 0} ingredients
            </div>
          </div>

          {/* Missing Ingredients (for "What Can I Make" feature) */}
          {missingIngredients && missingIngredients.length > 0 && (
            <div className="mb-3">
              <div className="text-xs text-red-600 font-medium mb-1">Missing:</div>
              <div className="text-xs text-red-500">
                {missingIngredients.slice(0, 2).join(', ')}
                {missingIngredients.length > 2 && ` +${missingIngredients.length - 2} more`}
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {(cocktail.tags || []).slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {(cocktail.tags || []).length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{(cocktail.tags || []).length - 3}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
});

CocktailCard.displayName = 'CocktailCard';

export default CocktailCard;
