'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getShoppingList, removeFromShoppingList, clearShoppingList, ShoppingListItem } from '@/utils/shoppingListUtils';

export default function ShoppingListPage() {
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadShoppingList = async () => {
      try {
        const list = await getShoppingList();
        setShoppingList(list);
      } catch (error) {
        console.error('Error loading shopping list:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadShoppingList();

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cocktailflow-shopping-list') {
        loadShoppingList();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleRemoveItem = async (ingredientId: string) => {
    try {
      await removeFromShoppingList(ingredientId);
      setShoppingList(prev => prev.filter(item => item.ingredient.id !== ingredientId));
    } catch (error) {
      console.error('Error removing item from shopping list:', error);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear your entire shopping list?')) {
      try {
        await clearShoppingList();
        setShoppingList([]);
      } catch (error) {
        console.error('Error clearing shopping list:', error);
      }
    }
  };

  const groupedByCategory = shoppingList.reduce((acc, item) => {
    const category = item.ingredient.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, ShoppingListItem[]>);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-xl font-semibold text-gray-900">Loading your shopping list...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Shopping List</h1>
        <p className="text-xl text-gray-600">
          Your cocktail ingredients shopping list
        </p>
      </div>

      {shoppingList.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12">
          <div className="text-6xl mb-6">🛒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your shopping list is empty</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Browse cocktails and add ingredients to your shopping list to get started!
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
          {/* Actions */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  {shoppingList.length} Ingredient{shoppingList.length !== 1 ? 's' : ''} to Buy
                </h2>
                <p className="text-gray-600">
                  Organized by category for easy shopping
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Print List
                </button>
              </div>
            </div>
          </div>

          {/* Shopping List by Category */}
          <div className="space-y-6">
            {Object.entries(groupedByCategory).map(([category, items]) => (
              <div key={category} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 capitalize">
                    {category.replace('_', ' ')}s ({items.length})
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.ingredient.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">
                              {item.ingredient.category === 'spirit' ? '🥃' :
                               item.ingredient.category === 'liqueur' ? '🍷' :
                               item.ingredient.category === 'mixer' ? '🥤' :
                               item.ingredient.category === 'juice' ? '🍊' :
                               item.ingredient.category === 'syrup' ? '🍯' :
                               item.ingredient.category === 'bitters' ? '🌿' : '🧪'}
                            </span>
                            <div>
                              <h4 className="font-medium text-gray-900">{item.ingredient.name}</h4>
                              <p className="text-sm text-gray-500">
                                For: {item.cocktails.join(', ')}
                              </p>
                              {item.ingredient.description && (
                                <p className="text-xs text-gray-400 mt-1">{item.ingredient.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium text-gray-600">{item.amount}</span>
                          <button
                            onClick={() => handleRemoveItem(item.ingredient.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Shopping Tips</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Check your local liquor store for spirits and liqueurs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Fresh juices are always better than bottled when possible</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Simple syrup can be made at home with equal parts sugar and water</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Buy quality ice or make clear ice cubes for the best presentation</span>
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
