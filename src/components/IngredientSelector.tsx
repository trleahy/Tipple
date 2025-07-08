'use client';

import { useState } from 'react';
import { Ingredient, IngredientCategory, UserIngredients } from '@/types/cocktail';

interface IngredientSelectorProps {
  allIngredients: Ingredient[];
  selectedIngredients: UserIngredients;
  onIngredientToggle: (ingredientId: string, category: IngredientCategory) => void;
}

const IngredientSelector = ({ 
  allIngredients, 
  selectedIngredients, 
  onIngredientToggle 
}: IngredientSelectorProps) => {
  const [activeTab, setActiveTab] = useState<'spirits' | 'mixers' | 'others'>('spirits');

  // Group ingredients by category
  const spirits = allIngredients.filter(ing => ing.category === IngredientCategory.SPIRIT);
  const mixers = allIngredients.filter(ing => 
    ing.category === IngredientCategory.MIXER || 
    ing.category === IngredientCategory.JUICE
  );
  const others = allIngredients.filter(ing => 
    ing.category === IngredientCategory.LIQUEUR ||
    ing.category === IngredientCategory.SYRUP ||
    ing.category === IngredientCategory.BITTERS ||
    ing.category === IngredientCategory.OTHER
  );

  const isSelected = (ingredientId: string, category: IngredientCategory) => {
    if (category === IngredientCategory.SPIRIT) {
      return selectedIngredients.spirits.includes(ingredientId);
    } else if (category === IngredientCategory.MIXER || category === IngredientCategory.JUICE) {
      return selectedIngredients.mixers.includes(ingredientId);
    } else {
      return selectedIngredients.others.includes(ingredientId);
    }
  };

  const getIngredientEmoji = (category: IngredientCategory) => {
    switch (category) {
      case IngredientCategory.SPIRIT: return '🥃';
      case IngredientCategory.LIQUEUR: return '🍷';
      case IngredientCategory.MIXER: return '🥤';
      case IngredientCategory.JUICE: return '🍊';
      case IngredientCategory.SYRUP: return '🍯';
      case IngredientCategory.BITTERS: return '🌿';
      default: return '🧪';
    }
  };

  const tabs = [
    { 
      id: 'spirits' as const, 
      label: 'Spirits', 
      icon: '🥃', 
      ingredients: spirits,
      count: selectedIngredients.spirits.length
    },
    { 
      id: 'mixers' as const, 
      label: 'Mixers & Juices', 
      icon: '🥤', 
      ingredients: mixers,
      count: selectedIngredients.mixers.length
    },
    { 
      id: 'others' as const, 
      label: 'Liqueurs & Others', 
      icon: '🍷', 
      ingredients: others,
      count: selectedIngredients.others.length
    }
  ];

  const currentIngredients = tabs.find(tab => tab.id === activeTab)?.ingredients || [];

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-4 text-sm font-medium text-center border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {tab.count}
                  </span>
                )}
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Ingredient Grid */}
      <div className="p-6">
        {currentIngredients.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No ingredients available in this category
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {currentIngredients.map((ingredient) => {
              const selected = isSelected(ingredient.id, ingredient.category);
              
              return (
                <button
                  key={ingredient.id}
                  onClick={() => onIngredientToggle(ingredient.id, ingredient.category)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    selected
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <span className="text-2xl mb-2">
                      {getIngredientEmoji(ingredient.category)}
                    </span>
                    <span className="text-sm font-medium mb-1">
                      {ingredient.name}
                    </span>
                    {ingredient.abv && (
                      <span className="text-xs text-gray-500">
                        {ingredient.abv}% ABV
                      </span>
                    )}
                    {selected && (
                      <div className="mt-2">
                        <span className="text-blue-600 text-lg">✓</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {currentIngredients.filter(ing => isSelected(ing.id, ing.category)).length} of {currentIngredients.length} selected
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                currentIngredients.forEach(ing => {
                  if (!isSelected(ing.id, ing.category)) {
                    onIngredientToggle(ing.id, ing.category);
                  }
                });
              }}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Select All
            </button>
            <button
              onClick={() => {
                currentIngredients.forEach(ing => {
                  if (isSelected(ing.id, ing.category)) {
                    onIngredientToggle(ing.id, ing.category);
                  }
                });
              }}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IngredientSelector;
