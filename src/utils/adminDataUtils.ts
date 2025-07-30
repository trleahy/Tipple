'use client';

import { Cocktail, Ingredient, GlassType, Category } from '@/types/cocktail';
import { cocktails as initialCocktails } from '@/data/cocktails';
import { ingredients as initialIngredients, glassTypes as initialGlassTypes } from '@/data/ingredients';
import { initialCategories } from '@/data/categories';
import { adminDataStorage } from '@/lib/storage';
import { logger } from '@/utils/errorUtils';
import { invalidateCocktailCache, invalidateIngredientCache, invalidateAllCaches } from '@/utils/cocktailUtils';
import { dataRefreshManager } from '@/utils/dataRefreshUtils';

/**
 * Generic function to handle admin data operations with error handling
 */
async function withAdminErrorHandling<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logger.error(`Admin ${operationName} failed`, error);
    throw error;
  }
}

/**
 * Get all cocktails from Supabase
 */
export async function getAdminCocktails(): Promise<Cocktail[]> {
  return withAdminErrorHandling(
    async () => {
      const cocktails = await adminDataStorage.getCocktails();
      return cocktails;
    },
    'cocktails fetch'
  );
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
    logger.info('Starting cocktail addition', { cocktailId: cocktail.id, name: cocktail.name });

    const cocktails = await getAdminCocktails();

    // Check if ID already exists
    if (cocktails.find(c => c.id === cocktail.id)) {
      logger.error('Cocktail with this ID already exists', { cocktailId: cocktail.id });
      throw new Error('Cocktail with this ID already exists');
    }

    logger.info('Adding cocktail using targeted approach', { cocktailId: cocktail.id });

    // Use the new targeted approach to add only the single cocktail
    await adminDataStorage.addSingleCocktail(cocktail);

    // Invalidate cache to ensure public views get fresh data
    invalidateCocktailCache();
    logger.info('Cocktail cache invalidated after addition');

    // Notify data refresh manager to update public views
    dataRefreshManager.refreshCocktailData();

    logger.info('Cocktail added successfully', { cocktailId: cocktail.id, name: cocktail.name });
    return true;
  } catch (error) {
    logger.error('Error adding cocktail', error, { cocktailId: cocktail.id });
    console.error('Add cocktail error details:', error);
    return false;
  }
}

/**
 * Update an existing cocktail
 */
export async function updateCocktail(cocktailId: string, updatedCocktail: Cocktail): Promise<boolean> {
  try {
    logger.info('Starting cocktail update', { cocktailId, name: updatedCocktail.name });

    const cocktails = await getAdminCocktails();
    const existingCocktail = cocktails.find(c => c.id === cocktailId);

    if (!existingCocktail) {
      logger.error('Cocktail not found for update', { cocktailId });
      throw new Error('Cocktail not found');
    }

    logger.info('Found cocktail to update', { cocktailId, name: existingCocktail.name });

    // Use the new targeted approach to update only the single cocktail
    await adminDataStorage.updateSingleCocktail(cocktailId, updatedCocktail);

    // Invalidate cache to ensure public views get fresh data
    invalidateCocktailCache();
    logger.info('Cocktail cache invalidated after update');

    // Notify data refresh manager to update public views
    dataRefreshManager.refreshCocktailData();

    logger.info('Cocktail updated successfully', { cocktailId, name: updatedCocktail.name });
    return true;
  } catch (error) {
    logger.error('Error updating cocktail', error, { cocktailId });
    console.error('Update cocktail error details:', error);
    return false;
  }
}

/**
 * Delete a cocktail
 */
export async function deleteCocktail(cocktailId: string): Promise<boolean> {
  try {
    logger.info('Starting cocktail deletion', { cocktailId });

    const cocktails = await getAdminCocktails();
    const existingCocktail = cocktails.find(c => c.id === cocktailId);

    if (!existingCocktail) {
      logger.error('Cocktail not found for deletion', { cocktailId });
      throw new Error('Cocktail not found');
    }

    logger.info('Found cocktail to delete', { cocktailId, name: existingCocktail.name });

    // Use the new targeted approach to delete only the single cocktail
    await adminDataStorage.deleteSingleCocktail(cocktailId);

    // Invalidate cache to ensure public views get fresh data
    invalidateCocktailCache();
    logger.info('Cocktail cache invalidated after deletion');

    // Notify data refresh manager to update public views
    dataRefreshManager.refreshCocktailData();

    logger.info('Cocktail deleted successfully', { cocktailId });
    return true;
  } catch (error) {
    logger.error('Error deleting cocktail', error, { cocktailId });
    console.error('Delete cocktail error details:', error);
    return false;
  }
}

/**
 * Get all ingredients from Supabase
 */
export async function getAdminIngredients(): Promise<Ingredient[]> {
  return withAdminErrorHandling(
    async () => {
      const ingredients = await adminDataStorage.getIngredients();
      return ingredients;
    },
    'ingredients fetch'
  );
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

    // Use the new targeted approach to add only the single ingredient
    await adminDataStorage.addSingleIngredient(ingredient);

    // Invalidate cache to ensure public views get fresh data
    invalidateIngredientCache();
    logger.info('Ingredient cache invalidated after addition');

    // Notify data refresh manager to update public views
    dataRefreshManager.refreshIngredientData();

    logger.info('Ingredient added successfully', { ingredientId: ingredient.id, name: ingredient.name });
    return true;
  } catch (error) {
    logger.error('Error adding ingredient', error, { ingredientId: ingredient.id });
    return false;
  }
}

/**
 * Update an existing ingredient
 */
export async function updateIngredient(ingredientId: string, updatedIngredient: Ingredient): Promise<boolean> {
  try {
    const ingredients = await getAdminIngredients();
    const existingIngredient = ingredients.find(i => i.id === ingredientId);

    if (!existingIngredient) {
      throw new Error('Ingredient not found');
    }

    // Use the new targeted approach to update only the single ingredient
    await adminDataStorage.updateSingleIngredient(ingredientId, updatedIngredient);

    // Invalidate cache to ensure public views get fresh data
    invalidateIngredientCache();
    logger.info('Ingredient cache invalidated after update');

    // Notify data refresh manager to update public views
    dataRefreshManager.refreshIngredientData();

    logger.info('Ingredient updated successfully', { ingredientId, name: updatedIngredient.name });
    return true;
  } catch (error) {
    logger.error('Error updating ingredient', error, { ingredientId });
    return false;
  }
}

/**
 * Delete an ingredient
 */
export async function deleteIngredient(ingredientId: string): Promise<boolean> {
  try {
    logger.info('Starting ingredient deletion', { ingredientId });

    const ingredients = await getAdminIngredients();
    const existingIngredient = ingredients.find(i => i.id === ingredientId);

    if (!existingIngredient) {
      logger.error('Ingredient not found for deletion', { ingredientId });
      throw new Error('Ingredient not found');
    }

    logger.info('Found ingredient to delete', { ingredientId, name: existingIngredient.name });

    // Use the new targeted approach to delete only the single ingredient
    await adminDataStorage.deleteSingleIngredient(ingredientId);

    // Invalidate cache to ensure public views get fresh data
    invalidateIngredientCache();
    logger.info('Ingredient cache invalidated after deletion');

    // Notify data refresh manager to update public views
    dataRefreshManager.refreshIngredientData();

    logger.info('Ingredient deleted successfully', { ingredientId });
    return true;
  } catch (error) {
    logger.error('Error deleting ingredient', error, { ingredientId });
    console.error('Delete ingredient error details:', error);
    return false;
  }
}

/**
 * Get all glass types from Supabase
 */
export async function getAdminGlassTypes(): Promise<GlassType[]> {
  try {
    logger.info('Loading admin glass types');

    // Add timeout to prevent indefinite loading
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Glass types loading timeout')), 10000);
    });

    const glassTypesPromise = adminDataStorage.getGlassTypes();
    const glassTypes = await Promise.race([glassTypesPromise, timeoutPromise]);

    logger.info('Admin glass types loaded successfully', { count: glassTypes.length });
    return glassTypes;
  } catch (error) {
    logger.error('Error loading admin glass types', error);
    throw error;
  }
}



/**
 * Save glass types (bulk operation)
 */
export async function saveAdminGlassTypes(glassTypes: GlassType[]): Promise<void> {
  try {
    await adminDataStorage.saveGlassTypes(glassTypes);
  } catch (error) {
    console.error('Error saving admin glass types:', error);
  }
}

/**
 * Add a single glass type
 */
export async function addGlassType(glassType: GlassType): Promise<boolean> {
  try {
    logger.info('Starting glass type addition', { glassTypeId: glassType.id, name: glassType.name });

    // Check if glass type already exists
    const glassTypes = await getAdminGlassTypes();
    const existingGlassType = glassTypes.find(g => g.id === glassType.id || g.name.toLowerCase() === glassType.name.toLowerCase());

    if (existingGlassType) {
      logger.warn('Glass type already exists', { glassTypeId: glassType.id, name: glassType.name });
      throw new Error('A glass type with this name already exists');
    }

    logger.info('Adding glass type using targeted approach', { glassTypeId: glassType.id });
    await adminDataStorage.addSingleGlassType(glassType);

    logger.info('Glass type added successfully', { glassTypeId: glassType.id, name: glassType.name });
    return true;
  } catch (error) {
    logger.error('Error adding glass type', error, { glassTypeId: glassType.id, name: glassType.name });
    return false;
  }
}

/**
 * Update a single glass type
 */
export async function updateGlassType(glassTypeId: string, updatedGlassType: GlassType): Promise<boolean> {
  try {
    logger.info('Starting glass type update', { glassTypeId, name: updatedGlassType.name });

    // Check if glass type exists
    const glassTypes = await getAdminGlassTypes();
    const existingGlassType = glassTypes.find(g => g.id === glassTypeId);

    if (!existingGlassType) {
      logger.warn('Glass type not found for update', { glassTypeId });
      throw new Error('Glass type not found');
    }

    // Check if name conflicts with another glass type
    const nameConflict = glassTypes.find(g => g.id !== glassTypeId && g.name.toLowerCase() === updatedGlassType.name.toLowerCase());
    if (nameConflict) {
      logger.warn('Glass type name already exists', { glassTypeId, name: updatedGlassType.name });
      throw new Error('A glass type with this name already exists');
    }

    logger.info('Updating glass type using targeted approach', { glassTypeId });
    await adminDataStorage.updateSingleGlassType(glassTypeId, updatedGlassType);

    logger.info('Glass type updated successfully', { glassTypeId, name: updatedGlassType.name });
    return true;
  } catch (error) {
    logger.error('Error updating glass type', error, { glassTypeId, name: updatedGlassType.name });
    return false;
  }
}

/**
 * Delete a single glass type
 */
export async function deleteGlassType(glassTypeId: string): Promise<boolean> {
  try {
    logger.info('Starting glass type deletion', { glassTypeId });

    // Check if glass type exists
    const glassTypes = await getAdminGlassTypes();
    const existingGlassType = glassTypes.find(g => g.id === glassTypeId);

    if (!existingGlassType) {
      logger.warn('Glass type not found for deletion', { glassTypeId });
      throw new Error('Glass type not found');
    }

    logger.info('Deleting glass type using targeted approach', { glassTypeId });
    await adminDataStorage.deleteSingleGlassType(glassTypeId);

    logger.info('Glass type deleted successfully', { glassTypeId });
    return true;
  } catch (error) {
    logger.error('Error deleting glass type', error, { glassTypeId });
    return false;
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

// ============================================================================
// CATEGORY MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Get all categories from Supabase
 */
export async function getAdminCategories(): Promise<Category[]> {
  try {
    logger.info('Loading admin categories');

    // Add timeout to prevent indefinite loading
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Categories loading timeout')), 10000);
    });

    const categoriesPromise = adminDataStorage.getCategories();
    const categories = await Promise.race([categoriesPromise, timeoutPromise]);

    logger.info('Admin categories loaded successfully', { count: categories.length });
    return categories;
  } catch (error) {
    logger.error('Error loading admin categories', error);
    throw error;
  }
}



/**
 * Add a single category
 */
export async function addCategory(category: Category): Promise<boolean> {
  try {
    logger.info('Starting category addition', { categoryId: category.id, name: category.name });

    // Check if category already exists
    const categories = await getAdminCategories();
    const existingCategory = categories.find(c => c.id === category.id || c.name.toLowerCase() === category.name.toLowerCase());

    if (existingCategory) {
      logger.warn('Category already exists', { categoryId: category.id, name: category.name });
      throw new Error('A category with this name already exists');
    }

    logger.info('Adding category using targeted approach', { categoryId: category.id });
    await adminDataStorage.addSingleCategory(category);

    // Invalidate caches and trigger refresh
    invalidateAllCaches();
    dataRefreshManager.refreshCocktailData();

    logger.info('Category added successfully', { categoryId: category.id, name: category.name });
    return true;
  } catch (error) {
    logger.error('Error adding category', error, { categoryId: category.id, name: category.name });
    return false;
  }
}

/**
 * Update a single category
 */
export async function updateCategory(categoryId: string, updatedCategory: Category): Promise<boolean> {
  try {
    logger.info('Starting category update', { categoryId, name: updatedCategory.name });

    // Check if category exists
    const categories = await getAdminCategories();
    const existingCategory = categories.find(c => c.id === categoryId);

    if (!existingCategory) {
      logger.warn('Category not found for update', { categoryId });
      throw new Error('Category not found');
    }

    // Check if name conflicts with another category
    const nameConflict = categories.find(c => c.id !== categoryId && c.name.toLowerCase() === updatedCategory.name.toLowerCase());
    if (nameConflict) {
      logger.warn('Category name already exists', { categoryId, name: updatedCategory.name });
      throw new Error('A category with this name already exists');
    }

    logger.info('Updating category using targeted approach', { categoryId });
    await adminDataStorage.updateSingleCategory(categoryId, updatedCategory);

    // Invalidate caches and trigger refresh
    invalidateAllCaches();
    dataRefreshManager.refreshCocktailData();

    logger.info('Category updated successfully', { categoryId, name: updatedCategory.name });
    return true;
  } catch (error) {
    logger.error('Error updating category', error, { categoryId, name: updatedCategory.name });
    return false;
  }
}

/**
 * Delete a single category
 */
export async function deleteCategory(categoryId: string): Promise<boolean> {
  try {
    logger.info('Starting category deletion', { categoryId });

    // Check if category exists
    const categories = await getAdminCategories();
    const existingCategory = categories.find(c => c.id === categoryId);

    if (!existingCategory) {
      logger.warn('Category not found for deletion', { categoryId });
      throw new Error('Category not found');
    }

    // Check if category is used by any cocktails
    const cocktails = await getAdminCocktails();
    const categoryInUse = cocktails.some(cocktail => {
      if (typeof cocktail.category === 'string') {
        return cocktail.category === categoryId;
      }
      return cocktail.category.id === categoryId;
    });

    if (categoryInUse) {
      logger.warn('Cannot delete category in use', { categoryId });
      throw new Error('Cannot delete category that is used by cocktails');
    }

    logger.info('Deleting category using targeted approach', { categoryId });
    await adminDataStorage.deleteSingleCategory(categoryId);

    // Invalidate caches and trigger refresh
    invalidateAllCaches();
    dataRefreshManager.refreshCocktailData();

    logger.info('Category deleted successfully', { categoryId });
    return true;
  } catch (error) {
    logger.error('Error deleting category', error, { categoryId });
    return false;
  }
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
    await adminDataStorage.saveCategories(initialCategories);
  } catch (error) {
    console.error('Error resetting to defaults:', error);
  }
}
