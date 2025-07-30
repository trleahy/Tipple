'use client';

import { supabase } from './supabase';
import { Cocktail, Ingredient, GlassType, Category, IngredientCategory, Difficulty, CocktailId } from '@/types/cocktail';
import { ShoppingListItem } from '@/utils/shoppingListUtils';
import { apiCallMonitor } from '@/utils/apiCallMonitor';
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
  CATEGORIES: 'cocktailflow-admin-categories',
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
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.SHOPPING_LIST, JSON.stringify(items));
          }
          return items;
        }
      }
    } catch (error) {
      console.warn('Supabase shopping list fetch failed, using localStorage:', error);
    }

    // Fallback to localStorage
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEYS.SHOPPING_LIST);
        return stored ? JSON.parse(stored) : [];
      }
      return [];
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
            if (typeof window !== 'undefined') {
              localStorage.setItem(STORAGE_KEYS.SHOPPING_LIST, JSON.stringify(items));
            }
            return;
          }
        } else {
          // Just clear localStorage cache
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.SHOPPING_LIST, JSON.stringify([]));
          }
          return;
        }
      }
    } catch (error) {
      console.warn('Supabase shopping list save failed, using localStorage:', error);
    }

    // Fallback to localStorage
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.SHOPPING_LIST, JSON.stringify(items));
      }
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
        apiCallMonitor.logCall('/cocktails', 'GET', 'adminDataStorage.getCocktails');
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
            servings: item.servings || 1,
            glassType: item.glass_type_data || { id: 'unknown', name: 'Unknown', description: '' },
            garnish: item.garnish,
            tags: Array.isArray(item.tags) ? item.tags : [],
            imageUrl: item.image_url,
            history: item.history,
            variations: Array.isArray(item.variations) ? item.variations : undefined
          }));

          return cocktails;
        } else {
          logger.error('Error fetching cocktails from Supabase', error);
          throw new Error(error?.message || 'Failed to fetch cocktails');
        }
      } else {
        throw new Error('Supabase is not available');
      }
    } catch (error) {
      logger.error('Error getting cocktails', error);
      throw error;
    }
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
            logger.info('Admin user saving cocktails to Supabase', { count: cocktails.length });

            // Delete existing cocktails and insert new ones
            const { error: deleteError } = await supabase.from('cocktails').delete().neq('id', '');

            if (deleteError) {
              logger.error('Failed to delete existing cocktails', deleteError);
              throw deleteError;
            }

            if (cocktails.length > 0) {
              const supabaseCocktails = cocktails.map(cocktail => ({
                id: cocktail.id,
                name: cocktail.name,
                description: cocktail.description,
                instructions: cocktail.instructions,
                ingredients: cocktail.ingredients,
                glass_type_data: cocktail.glassType, // Correct field name from schema
                category: cocktail.category,
                difficulty: cocktail.difficulty,
                prep_time: cocktail.prepTime,
                servings: cocktail.servings || 1, // Ensure servings is included
                garnish: cocktail.garnish || null,
                tags: cocktail.tags || [],
                image_url: cocktail.imageUrl || null,
                history: cocktail.history || null,
                variations: cocktail.variations || null
              }));

              const { error } = await supabase
                .from('cocktails')
                .insert(supabaseCocktails);

              if (error) {
                logger.error('Failed to insert cocktails to Supabase', error);
                throw error;
              } else {
                logger.info('Successfully saved cocktails to Supabase');
                // Update localStorage cache
                if (typeof window !== 'undefined') {
                  localStorage.setItem(STORAGE_KEYS.COCKTAILS, JSON.stringify(cocktails));
                }
                return;
              }
            } else {
              // No cocktails to save, just update localStorage
              if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEYS.COCKTAILS, JSON.stringify(cocktails));
              }
              return;
            }
          } else {
            logger.warn('User is not admin, cannot save cocktails to Supabase');
          }
        } else {
          logger.warn('No authenticated user, cannot save cocktails to Supabase');
        }
      }
    } catch (error) {
      logger.error('Supabase cocktails save failed, using localStorage fallback', error);
    }

    // Fallback to localStorage
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.COCKTAILS, JSON.stringify(cocktails));
        logger.info('Cocktails saved to localStorage fallback');
      }
    } catch (error) {
      logger.error('Error saving cocktails to localStorage', error);
      throw error;
    }
  },

  async addSingleCocktail(cocktail: Cocktail): Promise<void> {
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
            logger.info('Admin user adding single cocktail to Supabase', { cocktailId: cocktail.id, name: cocktail.name });

            // Insert only the new cocktail
            const supabaseCocktail = {
              id: cocktail.id,
              name: cocktail.name,
              description: cocktail.description,
              instructions: cocktail.instructions,
              ingredients: cocktail.ingredients,
              glass_type_data: cocktail.glassType, // Correct field name from schema
              category: cocktail.category,
              difficulty: cocktail.difficulty,
              prep_time: cocktail.prepTime,
              servings: cocktail.servings || 1, // Ensure servings is included
              garnish: cocktail.garnish || null,
              tags: cocktail.tags || [],
              image_url: cocktail.imageUrl || null,
              history: cocktail.history || null,
              variations: cocktail.variations || null
            };

            const { data, error } = await supabase
              .from('cocktails')
              .insert([supabaseCocktail])
              .select();

            if (error) {
              logger.error('Failed to insert cocktail to Supabase', error, { cocktail: supabaseCocktail });
              throw error;
            } else {
              logger.info('Successfully added cocktail to Supabase', { cocktailId: cocktail.id, data });

              // Add to localStorage cache without full refresh
              if (typeof window !== 'undefined') {
                const stored = localStorage.getItem(STORAGE_KEYS.COCKTAILS);
                const cocktails = stored ? JSON.parse(stored) : [];
                cocktails.push(cocktail);
                localStorage.setItem(STORAGE_KEYS.COCKTAILS, JSON.stringify(cocktails));
                logger.info('Updated localStorage cache with new cocktail', { cocktailId: cocktail.id, totalCocktails: cocktails.length });
              }
              return;
            }
          } else {
            logger.warn('User is not admin, cannot add cocktail to Supabase');
            throw new Error('Admin access required');
          }
        } else {
          logger.warn('No authenticated user, cannot add cocktail to Supabase');
          throw new Error('Authentication required');
        }
      }
    } catch (error) {
      logger.error('Supabase cocktail add failed, using localStorage fallback', error);
    }

    // Fallback to localStorage
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEYS.COCKTAILS);
        const cocktails = stored ? JSON.parse(stored) : [];
        cocktails.push(cocktail);
        localStorage.setItem(STORAGE_KEYS.COCKTAILS, JSON.stringify(cocktails));
        logger.info('Cocktail added to localStorage fallback');
        return;
      }
      throw new Error('No localStorage available');
    } catch (error) {
      logger.error('Error adding cocktail to localStorage', error);
      throw error;
    }
  },

  async updateSingleCocktail(cocktailId: string, cocktail: Cocktail): Promise<void> {
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
            logger.info('Admin user updating single cocktail in Supabase', { cocktailId, name: cocktail.name });

            // Update only the specific cocktail
            const supabaseCocktail = {
              name: cocktail.name,
              description: cocktail.description,
              instructions: cocktail.instructions,
              ingredients: cocktail.ingredients,
              glass_type_data: cocktail.glassType, // Correct field name from schema
              category: cocktail.category,
              difficulty: cocktail.difficulty,
              prep_time: cocktail.prepTime,
              servings: cocktail.servings || 1, // Ensure servings is included
              garnish: cocktail.garnish || null,
              tags: cocktail.tags || [],
              image_url: cocktail.imageUrl || null,
              history: cocktail.history || null,
              variations: cocktail.variations || null
            };

            const { error } = await supabase
              .from('cocktails')
              .update(supabaseCocktail)
              .eq('id', cocktailId);

            if (error) {
              logger.error('Failed to update cocktail in Supabase', error);
              throw error;
            } else {
              logger.info('Successfully updated cocktail in Supabase');

              // Update localStorage cache without full refresh
              if (typeof window !== 'undefined') {
                const stored = localStorage.getItem(STORAGE_KEYS.COCKTAILS);
                if (stored) {
                  const cocktails = JSON.parse(stored);
                  const index = cocktails.findIndex((c: Cocktail) => c.id === cocktailId);
                  if (index !== -1) {
                    cocktails[index] = cocktail;
                    localStorage.setItem(STORAGE_KEYS.COCKTAILS, JSON.stringify(cocktails));
                    logger.info('Updated localStorage cache with modified cocktail');
                  }
                }
              }
              return;
            }
          } else {
            logger.warn('User is not admin, cannot update cocktail in Supabase');
            throw new Error('Admin access required');
          }
        } else {
          logger.warn('No authenticated user, cannot update cocktail in Supabase');
          throw new Error('Authentication required');
        }
      }
    } catch (error) {
      logger.error('Supabase cocktail update failed, using localStorage fallback', error);
    }

    // Fallback to localStorage
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEYS.COCKTAILS);
        if (stored) {
          const cocktails = JSON.parse(stored);
          const index = cocktails.findIndex((c: Cocktail) => c.id === cocktailId);
          if (index !== -1) {
            cocktails[index] = cocktail;
            localStorage.setItem(STORAGE_KEYS.COCKTAILS, JSON.stringify(cocktails));
            logger.info('Cocktail updated in localStorage fallback');
            return;
          }
        }
      }
      throw new Error('Cocktail not found in localStorage');
    } catch (error) {
      logger.error('Error updating cocktail in localStorage', error);
      throw error;
    }
  },

  async deleteSingleCocktail(cocktailId: string): Promise<void> {
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
            logger.info('Admin user deleting single cocktail from Supabase', { cocktailId });

            // Delete only the specific cocktail
            const { error } = await supabase
              .from('cocktails')
              .delete()
              .eq('id', cocktailId);

            if (error) {
              logger.error('Failed to delete cocktail from Supabase', error);
              throw error;
            } else {
              logger.info('Successfully deleted cocktail from Supabase');

              // Update localStorage cache by removing the deleted cocktail
              if (typeof window !== 'undefined') {
                const stored = localStorage.getItem(STORAGE_KEYS.COCKTAILS);
                if (stored) {
                  const cocktails = JSON.parse(stored);
                  const filteredCocktails = cocktails.filter((c: Cocktail) => c.id !== cocktailId);
                  localStorage.setItem(STORAGE_KEYS.COCKTAILS, JSON.stringify(filteredCocktails));
                  logger.info('Updated localStorage cache with deleted cocktail removed');
                }
              }
              return;
            }
          } else {
            logger.warn('User is not admin, cannot delete cocktail from Supabase');
            throw new Error('Admin access required');
          }
        } else {
          logger.warn('No authenticated user, cannot delete cocktail from Supabase');
          throw new Error('Authentication required');
        }
      }
    } catch (error) {
      logger.error('Supabase cocktail delete failed, using localStorage fallback', error);
    }

    // Fallback to localStorage
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEYS.COCKTAILS);
        if (stored) {
          const cocktails = JSON.parse(stored);
          const filteredCocktails = cocktails.filter((c: Cocktail) => c.id !== cocktailId);
          localStorage.setItem(STORAGE_KEYS.COCKTAILS, JSON.stringify(filteredCocktails));
          logger.info('Cocktail deleted from localStorage fallback');
          return;
        }
      }
      throw new Error('No cocktails found in localStorage');
    } catch (error) {
      logger.error('Error deleting cocktail from localStorage', error);
      throw error;
    }
  },

  async getIngredients(): Promise<Ingredient[]> {
    try {
      if (await isSupabaseAvailable()) {
        apiCallMonitor.logCall('/ingredients', 'GET', 'adminDataStorage.getIngredients');
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
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(ingredients));
          }
          return ingredients;
        }
      }
    } catch (error) {
      console.warn('Supabase ingredients fetch failed, using localStorage:', error);
    }

    // Fallback to localStorage
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEYS.INGREDIENTS);
        if (stored) {
          return JSON.parse(stored);
        }
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
            logger.info('Admin user saving ingredients to Supabase', { count: ingredients.length });

            // Get existing ingredients from database to determine what's new
            const { data: existingData, error: fetchError } = await supabase
              .from('ingredients')
              .select('id');

            if (fetchError) {
              logger.error('Failed to fetch existing ingredients', fetchError);
              throw fetchError;
            }

            const existingIds = new Set(existingData?.map(item => item.id) || []);
            const newIngredients = ingredients.filter(ingredient => !existingIds.has(ingredient.id));
            const existingIngredients = ingredients.filter(ingredient => existingIds.has(ingredient.id));

            // Insert only new ingredients
            if (newIngredients.length > 0) {
              const supabaseNewIngredients = newIngredients.map(ingredient => ({
                id: ingredient.id,
                name: ingredient.name,
                category: ingredient.category,
                description: ingredient.description,
                abv: ingredient.abv
              }));

              const { error: insertError } = await supabase
                .from('ingredients')
                .insert(supabaseNewIngredients);

              if (insertError) {
                logger.error('Failed to insert new ingredients to Supabase', insertError);
                throw insertError;
              } else {
                logger.info('Successfully inserted new ingredients to Supabase', { count: newIngredients.length });
              }
            }

            // Update existing ingredients if any
            if (existingIngredients.length > 0) {
              for (const ingredient of existingIngredients) {
                const { error: updateError } = await supabase
                  .from('ingredients')
                  .update({
                    name: ingredient.name,
                    category: ingredient.category,
                    description: ingredient.description,
                    abv: ingredient.abv
                  })
                  .eq('id', ingredient.id);

                if (updateError) {
                  logger.error('Failed to update ingredient', updateError, { ingredientId: ingredient.id });
                  throw updateError;
                }
              }
              logger.info('Successfully updated existing ingredients', { count: existingIngredients.length });
            }

            // Update localStorage cache
            if (typeof window !== 'undefined') {
              localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(ingredients));
            }
            return;
          } else {
            logger.warn('User is not admin, cannot save ingredients to Supabase');
          }
        } else {
          logger.warn('No authenticated user, cannot save ingredients to Supabase');
        }
      }
    } catch (error) {
      logger.error('Supabase ingredients save failed, using localStorage fallback', error);
    }

    // Fallback to localStorage
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(ingredients));
        logger.info('Ingredients saved to localStorage fallback');
      }
    } catch (error) {
      logger.error('Error saving ingredients to localStorage', error);
      throw error;
    }
  },

  async addSingleIngredient(ingredient: Ingredient): Promise<void> {
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
            logger.info('Admin user adding single ingredient to Supabase', { ingredientId: ingredient.id, name: ingredient.name });

            // Insert only the new ingredient
            const supabaseIngredient = {
              id: ingredient.id,
              name: ingredient.name,
              category: ingredient.category,
              alcoholic: ingredient.alcoholic, // Required field that was missing
              description: ingredient.description || null,
              abv: ingredient.abv || null
            };

            const { data, error } = await supabase
              .from('ingredients')
              .insert([supabaseIngredient])
              .select();

            if (error) {
              logger.error('Failed to insert ingredient to Supabase', error, { ingredient: supabaseIngredient });
              throw error;
            } else {
              logger.info('Successfully added ingredient to Supabase', { ingredientId: ingredient.id, data });

              // Update localStorage cache with all ingredients
              const allIngredients = await this.getIngredients();
              if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(allIngredients));
              }
              return;
            }
          } else {
            logger.warn('User is not admin, cannot add ingredient to Supabase');
            throw new Error('Admin access required');
          }
        } else {
          logger.warn('No authenticated user, cannot add ingredient to Supabase');
          throw new Error('Authentication required');
        }
      } else {
        throw new Error('Supabase not available');
      }
    } catch (error) {
      logger.error('Failed to add ingredient to Supabase', error);
      throw error;
    }
  },

  async updateSingleIngredient(ingredientId: string, ingredient: Ingredient): Promise<void> {
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
            logger.info('Admin user updating single ingredient in Supabase', { ingredientId, name: ingredient.name });

            // Update only the specific ingredient
            const { error } = await supabase
              .from('ingredients')
              .update({
                name: ingredient.name,
                category: ingredient.category,
                description: ingredient.description,
                abv: ingredient.abv
              })
              .eq('id', ingredientId);

            if (error) {
              logger.error('Failed to update ingredient in Supabase', error);
              throw error;
            } else {
              logger.info('Successfully updated ingredient in Supabase');

              // Update localStorage cache with all ingredients
              const allIngredients = await this.getIngredients();
              if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(allIngredients));
              }
              return;
            }
          } else {
            logger.warn('User is not admin, cannot update ingredient in Supabase');
            throw new Error('Admin access required');
          }
        } else {
          logger.warn('No authenticated user, cannot update ingredient in Supabase');
          throw new Error('Authentication required');
        }
      } else {
        throw new Error('Supabase not available');
      }
    } catch (error) {
      logger.error('Failed to update ingredient in Supabase', error);
      throw error;
    }
  },

  async deleteSingleIngredient(ingredientId: string): Promise<void> {
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
            logger.info('Admin user deleting single ingredient from Supabase', { ingredientId });

            // Delete only the specific ingredient
            const { error } = await supabase
              .from('ingredients')
              .delete()
              .eq('id', ingredientId);

            if (error) {
              logger.error('Failed to delete ingredient from Supabase', error);
              throw error;
            } else {
              logger.info('Successfully deleted ingredient from Supabase');
              return;
            }
          } else {
            logger.warn('User is not admin, cannot delete ingredient from Supabase');
            throw new Error('Admin access required');
          }
        } else {
          logger.warn('No authenticated user, cannot delete ingredient from Supabase');
          throw new Error('Authentication required');
        }
      } else {
        throw new Error('Supabase not available');
      }
    } catch (error) {
      logger.error('Failed to delete ingredient from Supabase', error);
      throw error;
    }
  },

  async getGlassTypes(): Promise<GlassType[]> {
    try {
      apiCallMonitor.logCall('/glass_types', 'GET', 'adminDataStorage.getGlassTypes');

      if (await isSupabaseAvailable()) {
        logger.info('Fetching glass types from Supabase');

        const { data, error } = await supabase
          .from('glass_types')
          .select('*')
          .order('name');

        if (!error && data) {
          logger.info('Successfully fetched glass types from Supabase', { count: data.length });

          const glassTypes: GlassType[] = data.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            iconUrl: item.icon_url || undefined,
            capacity: item.capacity || undefined
          }));

          return glassTypes;
        } else {
          logger.error('Error fetching glass types from Supabase', error);
          throw new Error(error?.message || 'Failed to fetch glass types');
        }
      } else {
        throw new Error('Supabase not available');
      }
    } catch (error) {
      logger.error('Failed to fetch glass types', error);
      throw error;
    }
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
                if (typeof window !== 'undefined') {
                  localStorage.setItem(STORAGE_KEYS.GLASS_TYPES, JSON.stringify(glassTypes));
                }
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
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.GLASS_TYPES, JSON.stringify(glassTypes));
      }
    } catch (error) {
      console.error('Error saving glass types to localStorage:', error);
    }
  },

  async addSingleGlassType(glassType: GlassType): Promise<void> {
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
            logger.info('Admin user adding single glass type to Supabase', { glassTypeId: glassType.id, name: glassType.name });

            // Insert only the new glass type
            const supabaseGlassType = {
              id: glassType.id,
              name: glassType.name,
              description: glassType.description || '',
              icon_url: glassType.iconUrl || null,
              capacity: glassType.capacity || null
            };

            const { data, error } = await supabase
              .from('glass_types')
              .insert([supabaseGlassType])
              .select();

            if (error) {
              logger.error('Failed to insert glass type to Supabase', error, { glassType: supabaseGlassType });
              throw error;
            } else {
              logger.info('Successfully added glass type to Supabase', { glassTypeId: glassType.id, data });

              // Add to localStorage cache without full refresh
              if (typeof window !== 'undefined') {
                const stored = localStorage.getItem(STORAGE_KEYS.GLASS_TYPES);
                const glassTypes = stored ? JSON.parse(stored) : [];
                glassTypes.push(glassType);
                localStorage.setItem(STORAGE_KEYS.GLASS_TYPES, JSON.stringify(glassTypes));
                logger.info('Updated localStorage cache with new glass type', { glassTypeId: glassType.id, totalGlassTypes: glassTypes.length });
              }
              return;
            }
          } else {
            logger.warn('User is not admin, cannot add glass type to Supabase');
            throw new Error('Admin access required');
          }
        } else {
          logger.warn('No authenticated user, cannot add glass type to Supabase');
          throw new Error('Authentication required');
        }
      }
    } catch (error) {
      logger.error('Supabase glass type add failed, using localStorage fallback', error);
    }

    // Fallback to localStorage
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEYS.GLASS_TYPES);
        const glassTypes = stored ? JSON.parse(stored) : [];
        glassTypes.push(glassType);
        localStorage.setItem(STORAGE_KEYS.GLASS_TYPES, JSON.stringify(glassTypes));
        logger.info('Glass type added to localStorage fallback');
        return;
      }
      throw new Error('No localStorage available');
    } catch (error) {
      logger.error('Error adding glass type to localStorage', error);
      throw error;
    }
  },

  async updateSingleGlassType(glassTypeId: string, updatedGlassType: GlassType): Promise<void> {
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
            logger.info('Admin user updating single glass type in Supabase', { glassTypeId, name: updatedGlassType.name });

            const supabaseGlassType = {
              name: updatedGlassType.name,
              description: updatedGlassType.description || '',
              icon_url: updatedGlassType.iconUrl || null,
              capacity: updatedGlassType.capacity || null
            };

            const { data, error } = await supabase
              .from('glass_types')
              .update(supabaseGlassType)
              .eq('id', glassTypeId)
              .select();

            if (error) {
              logger.error('Failed to update glass type in Supabase', error, { glassTypeId, glassType: supabaseGlassType });
              throw error;
            } else {
              logger.info('Successfully updated glass type in Supabase', { glassTypeId, data });

              // Update localStorage cache
              if (typeof window !== 'undefined') {
                const stored = localStorage.getItem(STORAGE_KEYS.GLASS_TYPES);
                if (stored) {
                  const glassTypes = JSON.parse(stored);
                  const index = glassTypes.findIndex((g: GlassType) => g.id === glassTypeId);
                  if (index !== -1) {
                    glassTypes[index] = updatedGlassType;
                    localStorage.setItem(STORAGE_KEYS.GLASS_TYPES, JSON.stringify(glassTypes));
                    logger.info('Updated localStorage cache with updated glass type', { glassTypeId });
                  }
                }
              }
              return;
            }
          } else {
            logger.warn('User is not admin, cannot update glass type in Supabase');
            throw new Error('Admin access required');
          }
        } else {
          logger.warn('No authenticated user, cannot update glass type in Supabase');
          throw new Error('Authentication required');
        }
      }
    } catch (error) {
      logger.error('Supabase glass type update failed, using localStorage fallback', error);
    }

    // Fallback to localStorage
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEYS.GLASS_TYPES);
        if (stored) {
          const glassTypes = JSON.parse(stored);
          const index = glassTypes.findIndex((g: GlassType) => g.id === glassTypeId);
          if (index !== -1) {
            glassTypes[index] = updatedGlassType;
            localStorage.setItem(STORAGE_KEYS.GLASS_TYPES, JSON.stringify(glassTypes));
            logger.info('Glass type updated in localStorage fallback');
            return;
          }
        }
      }
      throw new Error('Glass type not found in localStorage');
    } catch (error) {
      logger.error('Error updating glass type in localStorage', error);
      throw error;
    }
  },

  async deleteSingleGlassType(glassTypeId: string): Promise<void> {
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
            logger.info('Admin user deleting single glass type from Supabase', { glassTypeId });

            // Delete only the specific glass type from Supabase
            const { error } = await supabase
              .from('glass_types')
              .delete()
              .eq('id', glassTypeId);

            if (error) {
              logger.error('Failed to delete glass type from Supabase', error, { glassTypeId });
              throw error;
            } else {
              logger.info('Successfully deleted glass type from Supabase', { glassTypeId });

              // Update localStorage cache by removing the deleted glass type
              if (typeof window !== 'undefined') {
                const stored = localStorage.getItem(STORAGE_KEYS.GLASS_TYPES);
                if (stored) {
                  const glassTypes = JSON.parse(stored);
                  const filteredGlassTypes = glassTypes.filter((g: GlassType) => g.id !== glassTypeId);
                  localStorage.setItem(STORAGE_KEYS.GLASS_TYPES, JSON.stringify(filteredGlassTypes));
                  logger.info('Updated localStorage cache after glass type deletion', { glassTypeId, remainingCount: filteredGlassTypes.length });
                }
              }
              return;
            }
          } else {
            logger.warn('User is not admin, cannot delete glass type from Supabase');
            throw new Error('Admin access required');
          }
        } else {
          logger.warn('No authenticated user, cannot delete glass type from Supabase');
          throw new Error('Authentication required');
        }
      }
    } catch (error) {
      logger.error('Supabase glass type delete failed, using localStorage fallback', error);
    }

    // Fallback to localStorage
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEYS.GLASS_TYPES);
        if (stored) {
          const glassTypes = JSON.parse(stored);
          const filteredGlassTypes = glassTypes.filter((g: GlassType) => g.id !== glassTypeId);
          localStorage.setItem(STORAGE_KEYS.GLASS_TYPES, JSON.stringify(filteredGlassTypes));
          logger.info('Glass type deleted from localStorage fallback');
          return;
        }
      }
      throw new Error('Glass type not found in localStorage');
    } catch (error) {
      logger.error('Error deleting glass type from localStorage', error);
      throw error;
    }
  },

  // ============================================================================
  // CATEGORY MANAGEMENT FUNCTIONS
  // ============================================================================

  async getCategories(): Promise<Category[]> {
    try {
      apiCallMonitor.logCall('/categories', 'GET', 'adminDataStorage.getCategories');

      if (await isSupabaseAvailable()) {
        logger.info('Fetching categories from Supabase');

        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name');

        if (!error && data) {
          logger.info('Successfully fetched categories from Supabase', { count: data.length });

          const categories: Category[] = data.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            color: item.color || undefined,
            iconEmoji: item.icon_emoji || undefined
          }));

          return categories;
        } else {
          logger.error('Error fetching categories from Supabase', error);
          throw new Error(error?.message || 'Failed to fetch categories');
        }
      } else {
        throw new Error('Supabase not available');
      }
    } catch (error) {
      logger.error('Failed to fetch categories', error);
      throw error;
    }
  },

  async saveCategories(categories: Category[]): Promise<void> {
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
            // Delete existing categories and insert new ones
            await supabase.from('categories').delete().neq('id', '');

            if (categories.length > 0) {
              const supabaseCategories = categories.map(category => ({
                id: category.id,
                name: category.name,
                description: category.description,
                color: category.color || null,
                icon_emoji: category.iconEmoji || null
              }));

              const { error } = await supabase
                .from('categories')
                .insert(supabaseCategories);

              if (error) {
                logger.error('Error saving categories to Supabase', error);
                throw new Error(error.message || 'Failed to save categories');
              }
            }
          } else {
            throw new Error('User is not an admin');
          }
        } else {
          throw new Error('User not authenticated');
        }
      } else {
        throw new Error('Supabase is not available');
      }
    } catch (error) {
      logger.error('Error saving categories', error);
      throw error;
    }
  },

  async addSingleCategory(category: Category): Promise<void> {
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
            logger.info('Admin user adding single category to Supabase', { categoryId: category.id, name: category.name });

            // Insert only the new category
            const supabaseCategory = {
              id: category.id,
              name: category.name,
              description: category.description || '',
              color: category.color || null,
              icon_emoji: category.iconEmoji || null
            };

            const { data, error } = await supabase
              .from('categories')
              .insert([supabaseCategory])
              .select();

            if (!error && data) {
              logger.info('Category added to Supabase successfully', { categoryId: category.id });
              return;
            } else {
              logger.error('Failed to add category to Supabase', error);
              throw new Error(error?.message || 'Failed to add category to database');
            }
          } else {
            throw new Error('User is not an admin');
          }
        } else {
          throw new Error('User not authenticated');
        }
      } else {
        throw new Error('Supabase is not available');
      }
    } catch (error) {
      logger.error('Error adding category', error);
      throw error;
    }
  },

  async updateSingleCategory(categoryId: string, updatedCategory: Category): Promise<void> {
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
            logger.info('Admin user updating single category in Supabase', { categoryId, name: updatedCategory.name });

            // Update only the specific category in Supabase
            const supabaseCategory = {
              name: updatedCategory.name,
              description: updatedCategory.description || '',
              color: updatedCategory.color || null,
              icon_emoji: updatedCategory.iconEmoji || null
            };

            const { data, error } = await supabase
              .from('categories')
              .update(supabaseCategory)
              .eq('id', categoryId)
              .select();

            if (!error && data) {
              logger.info('Category updated in Supabase successfully', { categoryId });
              return;
            } else {
              logger.error('Failed to update category in Supabase', error);
              throw new Error(error?.message || 'Failed to update category in database');
            }
          } else {
            throw new Error('User is not an admin');
          }
        } else {
          throw new Error('User not authenticated');
        }
      } else {
        throw new Error('Supabase is not available');
      }
    } catch (error) {
      logger.error('Error updating category', error);
      throw error;
    }
  },

  async deleteSingleCategory(categoryId: string): Promise<void> {
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
            logger.info('Admin user deleting single category from Supabase', { categoryId });

            // Delete only the specific category from Supabase
            const { error } = await supabase
              .from('categories')
              .delete()
              .eq('id', categoryId);

            if (!error) {
              logger.info('Category deleted from Supabase successfully', { categoryId });
              return;
            } else {
              logger.error('Failed to delete category from Supabase', error);
              throw new Error(error?.message || 'Failed to delete category from database');
            }
          } else {
            throw new Error('User is not an admin');
          }
        } else {
          throw new Error('User not authenticated');
        }
      } else {
        throw new Error('Supabase is not available');
      }
    } catch (error) {
      logger.error('Error deleting category', error);
      throw error;
    }
  }
};
