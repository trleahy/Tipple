'use client';

import { Cocktail, Ingredient } from '@/types/cocktail';
import { shoppingListStorage } from '@/lib/storage';
import { getIngredientById } from './cocktailUtils';

export interface ShoppingListItem {
  ingredient: Ingredient;
  amount: string;
  cocktails: string[]; // cocktail names that use this ingredient
}

/**
 * Get shopping list
 */
export async function getShoppingList(): Promise<ShoppingListItem[]> {
  try {
    const items = await shoppingListStorage.getShoppingList();

    // Populate ingredient details for items that might only have IDs
    const populatedItems = items.map(item => {
      if (!item.ingredient.name) {
        const fullIngredient = getIngredientById(item.ingredient.id);
        if (fullIngredient) {
          return { ...item, ingredient: fullIngredient };
        }
      }
      return item;
    });

    return populatedItems;
  } catch (error) {
    console.error('Error getting shopping list:', error);
    return [];
  }
}

/**
 * Get shopping list (synchronous version for backward compatibility)
 * Note: This returns empty array as sync version is not available with hybrid storage
 * Use getShoppingList() async version instead
 */
export function getShoppingListSync(): ShoppingListItem[] {
  console.warn('getShoppingListSync is deprecated. Use getShoppingList() async version instead.');
  return [];
}

/**
 * Save shopping list
 */
export async function saveShoppingList(items: ShoppingListItem[]): Promise<void> {
  try {
    await shoppingListStorage.saveShoppingList(items);
  } catch (error) {
    console.error('Error saving shopping list:', error);
  }
}

/**
 * Add cocktail ingredients to shopping list
 */
export async function addCocktailToShoppingList(cocktail: Cocktail): Promise<void> {
  try {
    const currentList = await getShoppingList();

    (cocktail.ingredients || []).forEach(({ ingredient, amount }) => {
      // Skip garnishes for shopping list
      if (ingredient.category === 'garnish') return;

      const existingItem = currentList.find(item => item.ingredient.id === ingredient.id);

      if (existingItem) {
        // Add cocktail name if not already included
        if (!existingItem.cocktails.includes(cocktail.name)) {
          existingItem.cocktails.push(cocktail.name);
        }
      } else {
        // Add new item
        currentList.push({
          ingredient,
          amount,
          cocktails: [cocktail.name]
        });
      }
    });

    await saveShoppingList(currentList);
  } catch (error) {
    console.error('Error adding cocktail to shopping list:', error);
  }
}

/**
 * Remove ingredient from shopping list
 */
export async function removeFromShoppingList(ingredientId: string): Promise<void> {
  try {
    const currentList = await getShoppingList();
    const updatedList = currentList.filter(item => item.ingredient.id !== ingredientId);
    await saveShoppingList(updatedList);
  } catch (error) {
    console.error('Error removing from shopping list:', error);
  }
}

/**
 * Clear entire shopping list
 */
export async function clearShoppingList(): Promise<void> {
  try {
    await saveShoppingList([]);
  } catch (error) {
    console.error('Error clearing shopping list:', error);
  }
}

/**
 * Generate shopping list from multiple cocktails
 */
export function generateShoppingListFromCocktails(cocktails: Cocktail[]): ShoppingListItem[] {
  const ingredientMap = new Map<string, ShoppingListItem>();
  
  cocktails.forEach(cocktail => {
    (cocktail.ingredients || []).forEach(({ ingredient, amount }) => {
      // Skip garnishes for shopping list
      if (ingredient.category === 'garnish') return;

      const existing = ingredientMap.get(ingredient.id);

      if (existing) {
        // Add cocktail name if not already included
        if (!existing.cocktails.includes(cocktail.name)) {
          existing.cocktails.push(cocktail.name);
        }
      } else {
        // Add new ingredient
        ingredientMap.set(ingredient.id, {
          ingredient,
          amount,
          cocktails: [cocktail.name]
        });
      }
    });
  });
  
  return Array.from(ingredientMap.values());
}

/**
 * Get shopping list count
 */
export async function getShoppingListCount(): Promise<number> {
  try {
    const list = await getShoppingList();
    return list.length;
  } catch (error) {
    console.error('Error getting shopping list count:', error);
    return 0;
  }
}

/**
 * Get shopping list count (synchronous version for backward compatibility)
 */
export function getShoppingListCountSync(): number {
  return getShoppingListSync().length;
}
