'use client';

import { SearchFilters, CocktailCategory, Difficulty, COCKTAIL_TAGS } from '@/types/cocktail';
import { glassTypes } from '@/data/ingredients';

interface FilterPanelProps {
  filters: SearchFilters;
  onFilterChange: (filters: Partial<SearchFilters>) => void;
  onClose: () => void;
}

const FilterPanel = ({ filters, onFilterChange, onClose }: FilterPanelProps) => {

  const handleCategoryChange = (category: CocktailCategory, checked: boolean) => {
    const currentCategories = filters.categories || [];
    const newCategories = checked
      ? [...currentCategories, category]
      : currentCategories.filter(c => c !== category);
    
    onFilterChange({ categories: newCategories.length > 0 ? newCategories : undefined });
  };

  const handleTagChange = (tag: string, checked: boolean) => {
    const currentTags = filters.tags || [];
    const newTags = checked
      ? [...currentTags, tag]
      : currentTags.filter(t => t !== tag);
    
    onFilterChange({ tags: newTags.length > 0 ? newTags : undefined });
  };

  // Ingredient filtering functionality would go here if needed

  const handleDifficultyChange = (difficulty: Difficulty, checked: boolean) => {
    const currentDifficulties = filters.difficulty || [];
    const newDifficulties = checked
      ? [...currentDifficulties, difficulty]
      : currentDifficulties.filter(d => d !== difficulty);
    
    onFilterChange({ difficulty: newDifficulties.length > 0 ? newDifficulties : undefined });
  };

  const handleGlassTypeChange = (glassId: string, checked: boolean) => {
    const currentGlassTypes = filters.glassTypes || [];
    const newGlassTypes = checked
      ? [...currentGlassTypes, glassId]
      : currentGlassTypes.filter(g => g !== glassId);
    
    onFilterChange({ glassTypes: newGlassTypes.length > 0 ? newGlassTypes : undefined });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Categories */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Categories</h4>
          <div className="space-y-2">
            {Object.values(CocktailCategory).map((category) => (
              <label key={category} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.categories?.includes(category) || false}
                  onChange={(e) => handleCategoryChange(category, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 capitalize">
                  {category.replace('_', ' ')}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Difficulty</h4>
          <div className="space-y-2">
            {Object.values(Difficulty).map((difficulty) => (
              <label key={difficulty} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.difficulty?.includes(difficulty) || false}
                  onChange={(e) => handleDifficultyChange(difficulty, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 capitalize">
                  {difficulty}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Glass Types */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Glass Type</h4>
          <div className="space-y-2">
            {glassTypes.map((glass) => (
              <label key={glass.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.glassTypes?.includes(glass.id) || false}
                  onChange={(e) => handleGlassTypeChange(glass.id, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {glass.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Popular Tags */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Tags</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {COCKTAIL_TAGS.slice(0, 10).map((tag) => (
              <label key={tag} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.tags?.includes(tag) || false}
                  onChange={(e) => handleTagChange(tag, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {tag}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Filters */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Max Prep Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Prep Time: {filters.maxPrepTime || 30} minutes
            </label>
            <input
              type="range"
              min="1"
              max="30"
              value={filters.maxPrepTime || 30}
              onChange={(e) => onFilterChange({ maxPrepTime: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Alcoholic/Non-alcoholic */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Alcohol Content</h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="alcoholic"
                  checked={filters.alcoholic === undefined}
                  onChange={() => onFilterChange({ alcoholic: undefined })}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">All</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="alcoholic"
                  checked={filters.alcoholic === true}
                  onChange={() => onFilterChange({ alcoholic: true })}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Alcoholic</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="alcoholic"
                  checked={filters.alcoholic === false}
                  onChange={() => onFilterChange({ alcoholic: false })}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Non-alcoholic</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
