'use client';

import { favoritesStorage } from '@/lib/storage';
import { CocktailId } from '@/types/cocktail';
import { logger, safeLocalStorage, getErrorMessage } from '@/utils/errorUtils';

/**
 * Utilities for managing favorite cocktails using Supabase with localStorage fallback
 */

/**
 * Get all favorite cocktail IDs
 */
export async function getFavoriteIds(): Promise<CocktailId[]> {
  try {
    return await favoritesStorage.getFavorites();
  } catch (error) {
    logger.error('Failed to get favorite IDs', error);
    return [];
  }
}

/**
 * Get all favorite cocktail IDs (synchronous version for backward compatibility)
 * This will return cached data from localStorage
 */
export function getFavoriteIdsSync(): CocktailId[] {
  return safeLocalStorage.getItem('cocktailflow-favorites', [] as CocktailId[]);
}

/**
 * Check if a cocktail is favorited (synchronous version using cached data)
 */
export function isFavorite(cocktailId: CocktailId): boolean {
  const favorites = getFavoriteIdsSync();
  return favorites.includes(cocktailId);
}

/**
 * Check if a cocktail is favorited (async version)
 */
export async function isFavoriteAsync(cocktailId: CocktailId): Promise<boolean> {
  try {
    const favorites = await getFavoriteIds();
    return favorites.includes(cocktailId);
  } catch (error) {
    logger.error('Failed to check favorite status', error, { cocktailId });
    return false;
  }
}

/**
 * Add a cocktail to favorites
 */
export async function addToFavorites(cocktailId: CocktailId): Promise<void> {
  try {
    await favoritesStorage.addFavorite(cocktailId);
    logger.info('Cocktail added to favorites', { cocktailId });
  } catch (error) {
    logger.error('Failed to add cocktail to favorites', error, { cocktailId });
    throw new Error(`Failed to add cocktail to favorites: ${getErrorMessage(error)}`);
  }
}

/**
 * Remove a cocktail from favorites
 */
export async function removeFromFavorites(cocktailId: CocktailId): Promise<void> {
  try {
    await favoritesStorage.removeFavorite(cocktailId);
    logger.info('Cocktail removed from favorites', { cocktailId });
  } catch (error) {
    logger.error('Failed to remove cocktail from favorites', error, { cocktailId });
    throw new Error(`Failed to remove cocktail from favorites: ${getErrorMessage(error)}`);
  }
}

/**
 * Toggle favorite status of a cocktail
 */
export async function toggleFavorite(cocktailId: CocktailId): Promise<boolean> {
  try {
    const isCurrentlyFavorite = await isFavoriteAsync(cocktailId);
    logger.debug('Toggling favorite status', { cocktailId, isCurrentlyFavorite });

    if (isCurrentlyFavorite) {
      await removeFromFavorites(cocktailId);
      return false;
    } else {
      await addToFavorites(cocktailId);
      return true;
    }
  } catch (error) {
    logger.error('Failed to toggle favorite status', error, { cocktailId });
    throw new Error(`Failed to toggle favorite status: ${getErrorMessage(error)}`);
  }
}

/**
 * Toggle favorite status of a cocktail (synchronous version for backward compatibility)
 */
export function toggleFavoriteSync(cocktailId: string): boolean {
  const isCurrentlyFavorite = isFavorite(cocktailId);

  // Use async functions but don't wait for them
  if (isCurrentlyFavorite) {
    removeFromFavorites(cocktailId);
    return false;
  } else {
    addToFavorites(cocktailId);
    return true;
  }
}

/**
 * Clear all favorites
 */
export async function clearAllFavorites(): Promise<void> {
  try {
    const favorites = await getFavoriteIds();
    for (const cocktailId of favorites) {
      await removeFromFavorites(cocktailId);
    }
  } catch (error) {
    console.error('Error clearing all favorites:', error);
  }
}

/**
 * Get count of favorite cocktails
 */
export async function getFavoritesCount(): Promise<number> {
  try {
    const favorites = await getFavoriteIds();
    return favorites.length;
  } catch (error) {
    console.error('Error getting favorites count:', error);
    return 0;
  }
}

/**
 * Get count of favorite cocktails (synchronous version)
 */
export function getFavoritesCountSync(): number {
  return getFavoriteIdsSync().length;
}
