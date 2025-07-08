'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { getAdminCocktailsSync } from '@/utils/adminDataUtils';
import { CocktailCategory, IngredientCategory, COCKTAIL_TAGS, Cocktail } from '@/types/cocktail';

export default function AdminCategoriesPage() {
  const [cocktails, setCocktails] = useState<Cocktail[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      const allCocktails = getAdminCocktailsSync();
      setCocktails(allCocktails);
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Calculate category statistics
  const cocktailCategoryStats = Object.values(CocktailCategory).map(category => ({
    category,
    count: cocktails.filter((c: Cocktail) => c.category === category).length,
    description: getCategoryDescription(category)
  }));

  const ingredientCategoryStats = Object.values(IngredientCategory).map(category => ({
    category,
    count: 0, // Would need to calculate from ingredients
    description: getIngredientCategoryDescription(category)
  }));

  const tagStats = COCKTAIL_TAGS.map(tag => ({
    tag,
    count: cocktails.filter((c: Cocktail) => c.tags.includes(tag)).length
  })).filter(stat => stat.count > 0).sort((a, b) => b.count - a.count);

  function getCategoryDescription(category: CocktailCategory): string {
    switch (category) {
      case CocktailCategory.CLASSIC: return 'Traditional cocktails with historical significance';
      case CocktailCategory.MODERN: return 'Contemporary cocktails and new creations';
      case CocktailCategory.TROPICAL: return 'Exotic cocktails with tropical flavors';
      case CocktailCategory.SOUR: return 'Cocktails with citrus and tart flavors';
      case CocktailCategory.SWEET: return 'Cocktails with sweet and dessert-like flavors';
      case CocktailCategory.BITTER: return 'Cocktails with bitter and herbal notes';
      case CocktailCategory.STRONG: return 'High-alcohol content cocktails';
      case CocktailCategory.REFRESHING: return 'Light and refreshing cocktails';
      case CocktailCategory.CREAMY: return 'Cocktails with cream or milk-based ingredients';
      case CocktailCategory.HOT: return 'Warm cocktails for cold weather';
      case CocktailCategory.FROZEN: return 'Blended and frozen cocktails';
      default: return 'Cocktail category';
    }
  }

  function getIngredientCategoryDescription(category: IngredientCategory): string {
    switch (category) {
      case IngredientCategory.SPIRIT: return 'Base spirits like vodka, gin, rum, whiskey';
      case IngredientCategory.LIQUEUR: return 'Flavored alcoholic beverages';
      case IngredientCategory.MIXER: return 'Non-alcoholic mixing ingredients';
      case IngredientCategory.JUICE: return 'Fresh and bottled juices';
      case IngredientCategory.SYRUP: return 'Sweet syrups and sweeteners';
      case IngredientCategory.BITTERS: return 'Concentrated flavoring agents';
      case IngredientCategory.GARNISH: return 'Decorative and aromatic garnishes';
      case IngredientCategory.OTHER: return 'Other miscellaneous ingredients';
      default: return 'Ingredient category';
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⏳</div>
          <div className="text-xl font-semibold text-gray-900">Loading categories...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories & Tags</h1>
          <p className="text-gray-600">Overview of cocktail categories, ingredient types, and popular tags</p>
        </div>

        {/* Cocktail Categories */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cocktail Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cocktailCategoryStats.map(({ category, count, description }) => (
              <div key={category} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 capitalize">
                    {category.replace('_', ' ')}
                  </h3>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    {count}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Ingredient Categories */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ingredient Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {ingredientCategoryStats.map(({ category, description }) => (
              <div key={category} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 capitalize mb-2">
                  {category.replace('_', ' ')}
                </h3>
                <p className="text-sm text-gray-600">{description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Tags */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Popular Tags</h2>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {tagStats.slice(0, 20).map(({ tag, count }) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm flex items-center gap-2"
                >
                  {tag}
                  <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                    {count}
                  </span>
                </span>
              ))}
            </div>
            
            {tagStats.length > 20 && (
              <div className="text-sm text-gray-500">
                And {tagStats.length - 20} more tags...
              </div>
            )}
          </div>
        </div>

        {/* Category Management Info */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Management</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Cocktail Categories</h3>
              <p className="text-sm text-gray-600 mb-2">
                Categories are predefined types that help organize cocktails by their characteristics and style.
                These are set in the application code and cannot be modified through the admin interface.
              </p>
              <p className="text-sm text-gray-600">
                To add new categories, you would need to update the <code className="bg-gray-200 px-1 rounded">CocktailCategory</code> enum in the codebase.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Tags</h3>
              <p className="text-sm text-gray-600 mb-2">
                Tags are flexible labels that can be added to cocktails when creating or editing them.
                Popular tags are automatically tracked and displayed here.
              </p>
              <p className="text-sm text-gray-600">
                You can add custom tags when creating cocktails - just separate them with commas in the tags field.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Ingredient Categories</h3>
              <p className="text-sm text-gray-600">
                Ingredient categories help organize ingredients by their type and use in cocktails.
                These can be selected when adding or editing ingredients.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/admin/cocktails"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-2xl mb-2">🍸</div>
              <h3 className="font-medium text-gray-900 mb-1">Manage Cocktails</h3>
              <p className="text-sm text-gray-600">Add, edit, or organize cocktail recipes</p>
            </a>
            
            <a
              href="/admin/ingredients"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-2xl mb-2">🧪</div>
              <h3 className="font-medium text-gray-900 mb-1">Manage Ingredients</h3>
              <p className="text-sm text-gray-600">Add or edit ingredient categories</p>
            </a>
            
            <a
              href="/categories"
              target="_blank"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-2xl mb-2">👁️</div>
              <h3 className="font-medium text-gray-900 mb-1">View Public Categories</h3>
              <p className="text-sm text-gray-600">See how categories appear to users</p>
            </a>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
