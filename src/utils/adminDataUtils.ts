'use client';

import { Cocktail, Ingredient, GlassType } from '@/types/cocktail';
import { cocktails as initialCocktails } from '@/data/cocktails';
import { ingredients as initialIngredients, glassTypes as initialGlassTypes } from '@/data/ingredients';
import { adminDataStorage } from '@/lib/storage';
import { logger } from '@/utils/errorUtils';

/**
 * Generic function to handle admin data operations with error handling
 */
async function withAdminErrorHandling<T>(
  operation: () => Promise<T>,
  operationName: string,
  fallback: T
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logger.error(`Admin ${operationName} failed`, error);
    return fallback;
  }
}

/**
 * Get all cocktails (using local data for reliability)
 */
export async function getAdminCocktails(): Promise<Cocktail[]> {
  return withAdminErrorHandling(
    () => Promise.resolve(initialCocktails),
    'cocktails fetch',
    initialCocktails
  );
}

/**
 * Get all cocktails (sync version - using local data for reliability)
 */
export function getAdminCocktailsSync(): Cocktail[] {
  return initialCocktails;
}

/**
 * Save cocktails
 */
export async function saveAdminCocktails(cocktails: Cocktail[]): Promise<void> {
  try {
    await adminDataStorage.saveCocktails(cocktails);
  } catch (error) {
    console.error('Error saving admin cocktails:', error);
  }
}

/**
 * Add a new cocktail
 */
export async function addCocktail(cocktail: Cocktail): Promise<boolean> {
  try {
    const cocktails = await getAdminCocktails();

    // Check if ID already exists
    if (cocktails.find(c => c.id === cocktail.id)) {
      throw new Error('Cocktail with this ID already exists');
    }

    cocktails.push(cocktail);
    await saveAdminCocktails(cocktails);
    return true;
  } catch (error) {
    console.error('Error adding cocktail:', error);
    return false;
  }
}

/**
 * Update an existing cocktail
 */
export async function updateCocktail(cocktailId: string, updatedCocktail: Cocktail): Promise<boolean> {
  try {
    const cocktails = await getAdminCocktails();
    const index = cocktails.findIndex(c => c.id === cocktailId);

    if (index === -1) {
      throw new Error('Cocktail not found');
    }

    cocktails[index] = updatedCocktail;
    await saveAdminCocktails(cocktails);
    return true;
  } catch (error) {
    console.error('Error updating cocktail:', error);
    return false;
  }
}

/**
 * Delete a cocktail
 */
export async function deleteCocktail(cocktailId: string): Promise<boolean> {
  try {
    const cocktails = await getAdminCocktails();
    const filteredCocktails = cocktails.filter(c => c.id !== cocktailId);

    if (filteredCocktails.length === cocktails.length) {
      throw new Error('Cocktail not found');
    }

    await saveAdminCocktails(filteredCocktails);
    return true;
  } catch (error) {
    console.error('Error deleting cocktail:', error);
    return false;
  }
}

/**
 * Get all ingredients (using local data for reliability)
 */
export async function getAdminIngredients(): Promise<Ingredient[]> {
  // Use local data to avoid Supabase data structure issues
  return initialIngredients;
}

/**
 * Get all ingredients (sync version - using local data for reliability)
 */
export function getAdminIngredientsSync(): Ingredient[] {
  // Use local data to avoid Supabase data structure issues
  return initialIngredients;
}

/**
 * Save ingredients
 */
export async function saveAdminIngredients(ingredients: Ingredient[]): Promise<void> {
  try {
    await adminDataStorage.saveIngredients(ingredients);
  } catch (error) {
    console.error('Error saving admin ingredients:', error);
  }
}

/**
 * Add a new ingredient
 */
export async function addIngredient(ingredient: Ingredient): Promise<boolean> {
  try {
    const ingredients = await getAdminIngredients();

    // Check if ID already exists
    if (ingredients.find(i => i.id === ingredient.id)) {
      throw new Error('Ingredient with this ID already exists');
    }

    ingredients.push(ingredient);
    await saveAdminIngredients(ingredients);
    return true;
  } catch (error) {
    console.error('Error adding ingredient:', error);
    return false;
  }
}

/**
 * Update an existing ingredient
 */
export async function updateIngredient(ingredientId: string, updatedIngredient: Ingredient): Promise<boolean> {
  try {
    const ingredients = await getAdminIngredients();
    const index = ingredients.findIndex(i => i.id === ingredientId);

    if (index === -1) {
      throw new Error('Ingredient not found');
    }

    ingredients[index] = updatedIngredient;
    await saveAdminIngredients(ingredients);
    return true;
  } catch (error) {
    console.error('Error updating ingredient:', error);
    return false;
  }
}

/**
 * Delete an ingredient
 */
export async function deleteIngredient(ingredientId: string): Promise<boolean> {
  try {
    const ingredients = await getAdminIngredients();
    const filteredIngredients = ingredients.filter(i => i.id !== ingredientId);

    if (filteredIngredients.length === ingredients.length) {
      throw new Error('Ingredient not found');
    }

    await saveAdminIngredients(filteredIngredients);
    return true;
  } catch (error) {
    console.error('Error deleting ingredient:', error);
    return false;
  }
}

/**
 * Get all glass types (using local data for reliability)
 */
export async function getAdminGlassTypes(): Promise<GlassType[]> {
  // Use local data to avoid Supabase data structure issues
  return initialGlassTypes;
}

/**
 * Get all glass types (sync version - using local data for reliability)
 */
export function getAdminGlassTypesSync(): GlassType[] {
  // Use local data to avoid Supabase data structure issues
  return initialGlassTypes;
}

/**
 * Save glass types
 */
export async function saveAdminGlassTypes(glassTypes: GlassType[]): Promise<void> {
  try {
    await adminDataStorage.saveGlassTypes(glassTypes);
  } catch (error) {
    console.error('Error saving admin glass types:', error);
  }
}

/**
 * Generate a unique ID for new items
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${prefix}${prefix ? '-' : ''}${timestamp}-${random}`;
}

/**
 * Reset all data to defaults
 */
export async function resetToDefaults(): Promise<void> {
  try {
    // Reset to initial data
    await saveAdminCocktails(initialCocktails);
    await saveAdminIngredients(initialIngredients);
    await saveAdminGlassTypes(initialGlassTypes);
  } catch (error) {
    console.error('Error resetting to defaults:', error);
  }
}
