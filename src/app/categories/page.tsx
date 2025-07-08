'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CocktailCategory, COCKTAIL_TAGS } from '@/types/cocktail';
import { getCocktailsByCategory, getCocktailsByTag, getAllCocktails } from '@/utils/cocktailUtils';
import CocktailCard from '@/components/CocktailCard';

export default function CategoriesPage() {
  const [selectedCategory, setSelectedCategory] = useState<CocktailCategory | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const allCocktails = getAllCocktails();
  
  // Get cocktails based on selection
  const displayedCocktails = selectedCategory 
    ? getCocktailsByCategory(selectedCategory)
    : selectedTag
    ? getCocktailsByTag(selectedTag)
    : allCocktails;

  // Get category stats
  const categoryStats = Object.values(CocktailCategory).map(category => ({
    category,
    count: getCocktailsByCategory(category).length,
    emoji: getCategoryEmoji(category)
  }));

  // Get tag stats (top 12 most used tags)
  const tagStats = COCKTAIL_TAGS.map(tag => ({
    tag,
    count: getCocktailsByTag(tag).length
  })).filter(stat => stat.count > 0).slice(0, 12);

  function getCategoryEmoji(category: CocktailCategory): string {
    switch (category) {
      case CocktailCategory.CLASSIC: return '🏛️';
      case CocktailCategory.MODERN: return '✨';
      case CocktailCategory.TROPICAL: return '🌴';
      case CocktailCategory.SOUR: return '🍋';
      case CocktailCategory.SWEET: return '🍯';
      case CocktailCategory.BITTER: return '🌿';
      case CocktailCategory.STRONG: return '💪';
      case CocktailCategory.REFRESHING: return '❄️';
      case CocktailCategory.CREAMY: return '🥛';
      case CocktailCategory.HOT: return '🔥';
      case CocktailCategory.FROZEN: return '🧊';
      default: return '🍸';
    }
  }

  const handleCategoryClick = (category: CocktailCategory) => {
    setSelectedCategory(category === selectedCategory ? null : category);
    setSelectedTag(null);
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag === selectedTag ? null : tag);
    setSelectedCategory(null);
  };

  const clearSelection = () => {
    setSelectedCategory(null);
    setSelectedTag(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Browse by Categories & Tags</h1>
        <p className="text-xl text-gray-600">
          Explore cocktails organized by style, occasion, and characteristics
        </p>
      </div>

      {/* Categories Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categoryStats.map(({ category, count, emoji }) => (
            <button
              key={category}
              onClick={() => handleCategoryClick(category)}
              className={`p-6 rounded-lg border-2 transition-all duration-200 text-center ${
                selectedCategory === category
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="text-4xl mb-3">{emoji}</div>
              <div className="font-semibold text-lg mb-1 capitalize">
                {category.replace('_', ' ')}
              </div>
              <div className="text-sm text-gray-500">
                {count} cocktail{count !== 1 ? 's' : ''}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tags Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Tags</h2>
        <div className="flex flex-wrap gap-3">
          {tagStats.map(({ tag, count }) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={`px-4 py-2 rounded-full border transition-all duration-200 ${
                selectedTag === tag
                  ? 'border-blue-500 bg-blue-500 text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              {tag} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {selectedCategory || selectedTag ? (
              <>
                {displayedCocktails.length} cocktail{displayedCocktails.length !== 1 ? 's' : ''} in{' '}
                <span className="text-blue-600">
                  {selectedCategory ? selectedCategory.replace('_', ' ') : selectedTag}
                </span>
              </>
            ) : (
              `All ${displayedCocktails.length} Cocktails`
            )}
          </h2>
          
          {(selectedCategory || selectedTag) && (
            <button
              onClick={clearSelection}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Show All
            </button>
          )}
        </div>

        {displayedCocktails.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedCocktails.map((cocktail) => (
              <CocktailCard key={cocktail.id} cocktail={cocktail} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍸</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No cocktails found</h3>
            <p className="text-gray-600 mb-4">
              No cocktails match the selected {selectedCategory ? 'category' : 'tag'}.
            </p>
            <button
              onClick={clearSelection}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse All Cocktails
            </button>
          </div>
        )}
      </div>

      {/* Quick Navigation */}
      <div className="mt-12 bg-blue-50 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Looking for something specific?</h3>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/browse"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Advanced Search
          </Link>
          <Link
            href="/what-can-i-make"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            What Can I Make?
          </Link>
          <Link
            href="/favorites"
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            My Favorites
          </Link>
        </div>
      </div>
    </div>
  );
}
