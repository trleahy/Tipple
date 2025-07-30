'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCocktailStats } from '@/utils/cocktailUtils';
import { getFavoriteIdsSync } from '@/utils/favoritesUtils';
import { getShoppingListCountSync } from '@/utils/shoppingListUtils';
import { getAdminCocktails, getAdminIngredients } from '@/utils/adminDataUtils';
import { CocktailCategory } from '@/types/cocktail';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalCocktails: 0,
    totalIngredients: 0,
    totalCategories: 0,
    totalFavorites: 0,
    totalShoppingLists: 0,
    recentActivity: [] as string[]
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      try {
        // Get real-time data from Supabase
        const cocktails = await getAdminCocktails();
        const ingredients = await getAdminIngredients();
        const favorites = getFavoriteIdsSync();
        const shoppingListItems = getShoppingListCountSync();
        const categories = Object.values(CocktailCategory).length;

        setStats({
          totalCocktails: cocktails.length,
          totalIngredients: ingredients.length,
          totalCategories: categories,
          totalFavorites: favorites.length,
          totalShoppingLists: shoppingListItems,
          recentActivity: [
            'System initialized',
            `${cocktails.length} cocktails loaded from database`,
            `${ingredients.length} ingredients available`,
            'Admin panel accessed',
            `Last updated: ${new Date().toLocaleTimeString()}`
          ]
        });
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
        // Fallback to sync data
        const cocktailStats = getCocktailStats();
        const favorites = getFavoriteIdsSync();
        const shoppingListItems = getShoppingListCountSync();
        const categories = Object.values(CocktailCategory).length;

        setStats({
          totalCocktails: cocktailStats.totalCocktails,
          totalIngredients: cocktailStats.totalIngredients,
          totalCategories: categories,
          totalFavorites: favorites.length,
          totalShoppingLists: shoppingListItems,
          recentActivity: [
            'System initialized (offline mode)',
            `${cocktailStats.totalCocktails} cocktails loaded from cache`,
            `${cocktailStats.totalIngredients} ingredients available`,
            'Admin panel accessed'
          ]
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  const quickActions = [
    {
      title: 'Add New Cocktail',
      description: 'Create a new cocktail recipe',
      href: '/admin/cocktails/new',
      icon: '🍸',
      color: 'bg-blue-500'
    },
    {
      title: 'Manage Ingredients',
      description: 'Add or edit ingredients',
      href: '/admin/ingredients',
      icon: '🧪',
      color: 'bg-green-500'
    },
    {
      title: 'Import Data',
      description: 'Import cocktail data from JSON',
      href: '/admin/import-export',
      icon: '📁',
      color: 'bg-purple-500'
    },
    {
      title: 'View Analytics',
      description: 'See usage statistics',
      href: '/admin/analytics',
      icon: '📊',
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome to the Tipple admin panel</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">🍸</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {isLoading ? (
                    <div className="animate-pulse bg-gray-200 h-8 w-12 rounded"></div>
                  ) : (
                    stats.totalCocktails
                  )}
                </div>
                <div className="text-sm text-gray-600">Cocktails</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">🧪</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {isLoading ? (
                    <div className="animate-pulse bg-gray-200 h-8 w-12 rounded"></div>
                  ) : (
                    stats.totalIngredients
                  )}
                </div>
                <div className="text-sm text-gray-600">Ingredients</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📂</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalCategories}</div>
                <div className="text-sm text-gray-600">Categories</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">❤️</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalFavorites}</div>
                <div className="text-sm text-gray-600">User Favorites</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">🛒</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalShoppingLists}</div>
                <div className="text-sm text-gray-600">Shopping Items</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center text-white text-2xl mb-4`}>
                  {action.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity & System Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">{activity}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Version</span>
                <span className="text-sm font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Last Updated</span>
                <span className="text-sm font-medium">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Database</span>
                <span className="text-sm font-medium text-green-600">Connected</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Storage</span>
                <span className="text-sm font-medium">LocalStorage</span>
              </div>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Getting Started</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">1. Manage Cocktails</h3>
              <p className="text-sm text-gray-600">Add, edit, or remove cocktail recipes from your database.</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">2. Update Ingredients</h3>
              <p className="text-sm text-gray-600">Maintain your ingredient list and categories.</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">3. Import/Export</h3>
              <p className="text-sm text-gray-600">Backup your data or import new cocktail collections.</p>
            </div>
          </div>
        </div>
      </div>
  );
}
