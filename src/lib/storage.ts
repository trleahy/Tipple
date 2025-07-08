'use client';

import { supabase } from './supabase';
import { Cocktail, Ingredient, GlassType, IngredientCategory, Difficulty, CocktailId } from '@/types/cocktail';
import { ShoppingListItem } from '@/utils/shoppingListUtils';
import {
  withSupabaseFallback,
  saveWithSupabaseFallback,
  getCurrentUserId,
  isSupabaseAvailable,
  ExpiringCache
} from '@/utils/storageUtils';
import { logger } from '@/utils/errorUtils';

// Enhanced cache with expiration
const cache = new ExpiringCache<string[] | ShoppingListItem[]>(30000); // 30 seconds

// Storage keys for localStorage fallback
const STORAGE_KEYS = {
  FAVORITES: 'cocktailflow-favorites',
  SHOPPING_LIST: 'cocktailflow-shopping-list',
  COCKTAILS: 'cocktailflow-admin-cocktails',
  INGREDIENTS: 'cocktailflow-admin-ingredients',
  GLASS_TYPES: 'cocktailflow-admin-glass-types',
  USER_SESSION: 'cocktailflow-user-session',
} as const;

// Cache keys
const CACHE_KEYS = {
  FAVORITES: 'favorites',
  SHOPPING_LIST: 'shopping_list',
} as const;

// User session interface moved to storageUtils

// User session management is now handled in storageUtils

// getCurrentUserId is now imported from storageUtils

// isSupabaseAvailable is now imported from storageUtils

/**
 * Storage service for favorites
 */
export const favoritesStorage = {
  async getFavorites(): Promise<CocktailId[]> {
    // Check cache first
    const cached = cache.get(CACHE_KEYS.FAVORITES) as CocktailId[] | undefined;
    if (cached) {
      return cached;
    }

    const result = await withSupabaseFallback(
      async () => {
        const userId = await getCurrentUserId();
        const { data, error } = await supabase
          .from('user_favorites')
          .select('cocktail_id')
          .eq('user_id', userId);

        if (error) {
          throw error;
        }

        return data?.map(item => item.cocktail_id) || [];
      },
      STORAGE_KEYS.FAVORITES,
      [] as CocktailId[]
    );

    // Update cache
    cache.set(CACHE_KEYS.FAVORITES, result);
    return result;
  },

  async addFavorite(cocktailId: CocktailId): Promise<void> {
    logger.info('Adding favorite', { cocktailId });

    // Get current favorites and add new one
    const currentFavorites = await this.getFavorites();
    if (currentFavorites.includes(cocktailId)) {
      logger.debug('Cocktail already in favorites', { cocktailId });
      return;
    }

    const updatedFavorites = [...currentFavorites, cocktailId];

    await saveWithSupabaseFallback(
      async () => {
        const userId = await getCurrentUserId();
        const { error } = await supabase
          .from('user_favorites')
          .upsert({ user_id: userId, cocktail_id: cocktailId });

        if (error) {
          throw error;
        }
      },
      STORAGE_KEYS.FAVORITES,
      updatedFavorites
    );

    // Invalidate cache to force refresh
    cache.delete(CACHE_KEYS.FAVORITES);
    logger.info('Favorite added successfully', { cocktailId });
  },

  async removeFavorite(cocktailId: CocktailId): Promise<void> {
    logger.info('Removing favorite', { cocktailId });

    // Get current favorites and remove the specified one
    const currentFavorites = await this.getFavorites();
    const updatedFavorites = currentFavorites.filter(id => id !== cocktailId);

    if (currentFavorites.length === updatedFavorites.length) {
      logger.debug('Cocktail not in favorites', { cocktailId });
      return;
    }

    await saveWithSupabaseFallback(
      async () => {
        const userId = await getCurrentUserId();
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('cocktail_id', cocktailId);

        if (error) {
          throw error;
        }
      },
      STORAGE_KEYS.FAVORITES,
      updatedFavorites
    );

    // Invalidate cache to force refresh
    cache.delete(CACHE_KEYS.FAVORITES);
    logger.info('Favorite removed successfully', { cocktailId });
  }
};

/**
 * Storage service for shopping list
 */
export const shoppingListStorage = {
  async getShoppingList(): Promise<ShoppingListItem[]> {
    try {
      if (await isSupabaseAvailable()) {
        const userId = await getCurrentUserId();
        const { data, error } = await supabase
          .from('user_shopping_list')
          .select('*')
          .eq('user_id', userId);

        if (!error && data) {
          const items: ShoppingListItem[] = data.map(item => ({
            ingredient: {
              id: item.ingredient_id,
              name: '',
              category: IngredientCategory.OTHER,
              alcoholic: false
            }, // Will be populated by the calling code
            amount: item.amount,
            cocktails: item.cocktails
          }));
          
          // Cache in localStorage
          localStorage.setItem(STORAGE_KEYS.SHOPPING_LIST, JSON.stringify(items));
          return items;
        }
      }
    } catch (error) {
      console.warn('Supabase shopping list fetch failed, using localStorage:', error);
    }

    // Fallback to localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SHOPPING_LIST);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading shopping list from localStorage:', error);
      return [];
    }
  },

  async saveShoppingList(items: ShoppingListItem[]): Promise<void> {
    try {
      if (await isSupabaseAvailable()) {
        const userId = await getCurrentUserId();
        
        // Delete existing items
        await supabase
          .from('user_shopping_list')
          .delete()
          .eq('user_id', userId);

        // Insert new items
        if (items.length > 0) {
          const supabaseItems = items.map(item => ({
            user_id: userId,
            ingredient_id: item.ingredient.id,
            amount: item.amount,
            cocktails: item.cocktails
          }));

          const { error } = await supabase
            .from('user_shopping_list')
            .insert(supabaseItems);

          if (!error) {
            // Update localStorage cache
            localStorage.setItem(STORAGE_KEYS.SHOPPING_LIST, JSON.stringify(items));
            return;
          }
        } else {
          // Just clear localStorage cache
          localStorage.setItem(STORAGE_KEYS.SHOPPING_LIST, JSON.stringify([]));
          return;
        }
      }
    } catch (error) {
      console.warn('Supabase shopping list save failed, using localStorage:', error);
    }

    // Fallback to localStorage
    try {
      localStorage.setItem(STORAGE_KEYS.SHOPPING_LIST, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving shopping list to localStorage:', error);
    }
  }
};

/**
 * Storage service for admin data (cocktails, ingredients, glass types)
 */
export const adminDataStorage = {
  async getCocktails(): Promise<Cocktail[]> {
    try {
      if (await isSupabaseAvailable()) {
        const { data, error } = await supabase
          .from('cocktails')
          .select('*')
          .order('name');

        if (!error && data) {
          const cocktails: Cocktail[] = data.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            instructions: Array.isArray(item.instructions) ? item.instructions : [],
            ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
            category: item.category,
            difficulty: item.difficulty as Difficulty,
            prepTime: item.prep_time || 5,
            servings: 1, // Default value, should be added to database schema
            glassType: { id: item.glass_type, name: item.glass_type, description: '' }, // Simplified, should be populated properly
            garnish: item.garnish,
            tags: Array.isArray(item.tags) ? item.tags : [],
            imageUrl: item.image_url
          }));

          // Cache in localStorage
          localStorage.setItem(STORAGE_KEYS.COCKTAILS, JSON.stringify(cocktails));
          return cocktails;
        }
      }
    } catch (error) {
      console.warn('Supabase cocktails fetch failed, using localStorage:', error);
    }

    // Fallback to localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COCKTAILS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error reading cocktails from localStorage:', error);
    }

    // Return empty array if no data available
    return [];
  },

  async saveCocktails(cocktails: Cocktail[]): Promise<void> {
    try {
      if (await isSupabaseAvailable()) {
        // Check if user is admin
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userData } = await supabase
            .from('users')
            .select('is_admin')
            .eq('id', user.id)
            .single();

          if (userData?.is_admin) {
            // Delete existing cocktails and insert new ones
            await supabase.from('cocktails').delete().neq('id', '');

            if (cocktails.length > 0) {
              const supabaseCocktails = cocktails.map(cocktail => ({
                id: cocktail.id,
                name: cocktail.name,
                description: cocktail.description,
                instructions: cocktail.instructions,
                ingredients: cocktail.ingredients,
                category: cocktail.category,
                difficulty: cocktail.difficulty,
                prep_time: cocktail.prepTime,
                glass_type: cocktail.glassType,
                garnish: cocktail.garnish,
                tags: cocktail.tags,
                image_url: cocktail.imageUrl
              }));

              const { error } = await supabase
                .from('cocktails')
                .insert(supabaseCocktails);

              if (!error) {
                // Update localStorage cache
                localStorage.setItem(STORAGE_KEYS.COCKTAILS, JSON.stringify(cocktails));
                return;
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn('Supabase cocktails save failed, using localStorage:', error);
    }

    // Fallback to localStorage
    try {
      localStorage.setItem(STORAGE_KEYS.COCKTAILS, JSON.stringify(cocktails));
    } catch (error) {
      console.error('Error saving cocktails to localStorage:', error);
    }
  },

  async getIngredients(): Promise<Ingredient[]> {
    try {
      if (await isSupabaseAvailable()) {
        const { data, error } = await supabase
          .from('ingredients')
          .select('*')
          .order('name');

        if (!error && data) {
          const ingredients: Ingredient[] = data.map(item => ({
            id: item.id,
            name: item.name,
            category: item.category,
            description: item.description,
            abv: item.abv,
            alcoholic: item.abv ? item.abv > 0 : false
          }));

          // Cache in localStorage
          localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(ingredients));
          return ingredients;
        }
      }
    } catch (error) {
      console.warn('Supabase ingredients fetch failed, using localStorage:', error);
    }

    // Fallback to localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.INGREDIENTS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error reading ingredients from localStorage:', error);
    }

    // Return empty array if no data available
    return [];
  },

  async saveIngredients(ingredients: Ingredient[]): Promise<void> {
    try {
      if (await isSupabaseAvailable()) {
        // Check if user is admin
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userData } = await supabase
            .from('users')
            .select('is_admin')
            .eq('id', user.id)
            .single();

          if (userData?.is_admin) {
            // Delete existing ingredients and insert new ones
            await supabase.from('ingredients').delete().neq('id', '');

            if (ingredients.length > 0) {
              const supabaseIngredients = ingredients.map(ingredient => ({
                id: ingredient.id,
                name: ingredient.name,
                category: ingredient.category,
                description: ingredient.description,
                abv: ingredient.abv
              }));

              const { error } = await supabase
                .from('ingredients')
                .insert(supabaseIngredients);

              if (!error) {
                // Update localStorage cache
                localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(ingredients));
                return;
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn('Supabase ingredients save failed, using localStorage:', error);
    }

    // Fallback to localStorage
    try {
      localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(ingredients));
    } catch (error) {
      console.error('Error saving ingredients to localStorage:', error);
    }
  },

  async getGlassTypes(): Promise<GlassType[]> {
    try {
      if (await isSupabaseAvailable()) {
        const { data, error } = await supabase
          .from('glass_types')
          .select('*')
          .order('name');

        if (!error && data) {
          const glassTypes: GlassType[] = data.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description
          }));

          // Cache in localStorage
          localStorage.setItem(STORAGE_KEYS.GLASS_TYPES, JSON.stringify(glassTypes));
          return glassTypes;
        }
      }
    } catch (error) {
      console.warn('Supabase glass types fetch failed, using localStorage:', error);
    }

    // Fallback to localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.GLASS_TYPES);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error reading glass types from localStorage:', error);
    }

    // Return empty array if no data available
    return [];
  },

  async saveGlassTypes(glassTypes: GlassType[]): Promise<void> {
    try {
      if (await isSupabaseAvailable()) {
        // Check if user is admin
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userData } = await supabase
            .from('users')
            .select('is_admin')
            .eq('id', user.id)
            .single();

          if (userData?.is_admin) {
            // Delete existing glass types and insert new ones
            await supabase.from('glass_types').delete().neq('id', '');

            if (glassTypes.length > 0) {
              const supabaseGlassTypes = glassTypes.map(glassType => ({
                id: glassType.id,
                name: glassType.name,
                description: glassType.description
              }));

              const { error } = await supabase
                .from('glass_types')
                .insert(supabaseGlassTypes);

              if (!error) {
                // Update localStorage cache
                localStorage.setItem(STORAGE_KEYS.GLASS_TYPES, JSON.stringify(glassTypes));
                return;
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn('Supabase glass types save failed, using localStorage:', error);
    }

    // Fallback to localStorage
    try {
      localStorage.setItem(STORAGE_KEYS.GLASS_TYPES, JSON.stringify(glassTypes));
    } catch (error) {
      console.error('Error saving glass types to localStorage:', error);
    }
  }
};
