import { Cocktail, SearchFilters, UserIngredients, CocktailMatch, Ingredient } from '@/types/cocktail';
import { adminDataStorage } from '@/lib/storage';
import { smartCache } from '@/lib/smartCache';
import { cocktails } from '@/data/cocktails';
import { ingredients } from '@/data/ingredients';

// Cache for improved performance with invalidation support
let cocktailCache: Cocktail[] | null = null;
let ingredientCache: Ingredient[] | null = null;
let cocktailMap: Map<string, Cocktail> | null = null;
let ingredientMap: Map<string, Ingredient> | null = null;
let cocktailCacheTimestamp: number = 0;
let ingredientCacheTimestamp: number = 0;

// Cache invalidation functions
export function invalidateCocktailCache(): void {
  cocktailCache = null;
  cocktailMap = null;
  cocktailCacheTimestamp = 0;
}

export function invalidateIngredientCache(): void {
  ingredientCache = null;
  ingredientMap = null;
  ingredientCacheTimestamp = 0;
}

export function invalidateAllCaches(): void {
  invalidateCocktailCache();
  invalidateIngredientCache();
}

/**
 * Get cocktails - async version (uses hybrid storage)
 */
export async function getCocktailDataAsync(): Promise<Cocktail[]> {
  try {
    const storedCocktails = await adminDataStorage.getCocktails();
    // If we have stored cocktails, use them; otherwise fall back to default data
    return storedCocktails.length > 0 ? storedCocktails : cocktails;
  } catch (error) {
    console.warn('Failed to get cocktails from storage, using default data:', error);
    return cocktails;
  }
}

/**
 * Get cocktails - enhanced sync version with async data integration
 */
function getCocktailData(): Cocktail[] {
  if (!cocktailCache) {
    // Try to get fresh data from storage first, fall back to static data
    try {
      // Check if we have fresh data in localStorage cache
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('cocktailflow-admin-cocktails');
        if (stored) {
          const storedCocktails = JSON.parse(stored);
          if (storedCocktails.length > 0) {
            cocktailCache = storedCocktails;
            cocktailMap = new Map(storedCocktails.map((cocktail: Cocktail) => [cocktail.id, cocktail]));
            cocktailCacheTimestamp = Date.now();
            return cocktailCache;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load cocktails from localStorage cache:', error);
    }

    // Fall back to static data
    cocktailCache = cocktails;
    cocktailMap = new Map(cocktails.map(cocktail => [cocktail.id, cocktail]));
    cocktailCacheTimestamp = Date.now();
  }
  return cocktailCache;
}

/**
 * Get cocktail map for efficient lookups
 */
function getCocktailMap(): Map<string, Cocktail> {
  if (!cocktailMap) {
    getCocktailData(); // This will initialize the map
  }
  return cocktailMap!;
}

/**
 * Get ingredients - async version (uses hybrid storage)
 */
export async function getIngredientDataAsync(): Promise<Ingredient[]> {
  try {
    const storedIngredients = await adminDataStorage.getIngredients();
    // If we have stored ingredients, use them; otherwise fall back to default data
    return storedIngredients.length > 0 ? storedIngredients : ingredients;
  } catch (error) {
    console.warn('Failed to get ingredients from storage, using default data:', error);
    return ingredients;
  }
}

/**
 * Get ingredients - enhanced sync version with async data integration
 */
function getIngredientData(): Ingredient[] {
  if (!ingredientCache) {
    // Try to get fresh data from storage first, fall back to static data
    try {
      // Check if we have fresh data in localStorage cache
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('cocktailflow-admin-ingredients');
        if (stored) {
          const storedIngredients = JSON.parse(stored);
          if (storedIngredients.length > 0) {
            ingredientCache = storedIngredients;
            ingredientMap = new Map(storedIngredients.map((ingredient: Ingredient) => [ingredient.id, ingredient]));
            ingredientCacheTimestamp = Date.now();
            return ingredientCache;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load ingredients from localStorage cache:', error);
    }

    // Fall back to static data
    ingredientCache = ingredients;
    ingredientMap = new Map(ingredients.map(ingredient => [ingredient.id, ingredient]));
    ingredientCacheTimestamp = Date.now();
  }
  return ingredientCache;
}

/**
 * Get ingredient map for efficient lookups
 */
function getIngredientMap(): Map<string, Ingredient> {
  if (!ingredientMap) {
    getIngredientData(); // This will initialize the map
  }
  return ingredientMap!;
}

/**
 * Get all cocktails (sync version with cache integration)
 */
export function getAllCocktails(): Cocktail[] {
  return getCocktailData();
}

/**
 * Get all cocktails (async version with smart caching)
 */
export async function getAllCocktailsAsync(): Promise<Cocktail[]> {
  try {
    const cocktails = await smartCache.getCocktails();
    // Update local cache for backward compatibility
    cocktailCache = cocktails;
    cocktailMap = new Map(cocktails.map(cocktail => [cocktail.id, cocktail]));
    cocktailCacheTimestamp = Date.now();
    return cocktails;
  } catch (error) {
    console.warn('Failed to get cocktails from smart cache, using fallback:', error);
    return getCocktailData();
  }
}

/**
 * Refresh cocktail data and invalidate cache
 */
export async function refreshCocktailData(): Promise<Cocktail[]> {
  invalidateCocktailCache();
  return await getAllCocktailsAsync();
}

/**
 * Get a cocktail by ID (optimized with Map lookup)
 */
export function getCocktailById(id: string): Cocktail | undefined {
  return getCocktailMap().get(id);
}

/**
 * Search cocktails based on filters
 */
export function searchCocktails(filters: SearchFilters): Cocktail[] {
  let filteredCocktails = getCocktailData();

  // Filter by search query (name or description)
  if (filters.query) {
    const query = filters.query.toLowerCase();
    filteredCocktails = filteredCocktails.filter(cocktail =>
      cocktail.name.toLowerCase().includes(query) ||
      cocktail.description.toLowerCase().includes(query) ||
      cocktail.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }

  // Filter by categories
  if (filters.categories && filters.categories.length > 0) {
    filteredCocktails = filteredCocktails.filter(cocktail =>
      filters.categories!.includes(cocktail.category)
    );
  }

  // Filter by tags
  if (filters.tags && filters.tags.length > 0) {
    filteredCocktails = filteredCocktails.filter(cocktail =>
      filters.tags!.some(tag => cocktail.tags.includes(tag))
    );
  }

  // Filter by ingredients
  if (filters.ingredients && filters.ingredients.length > 0) {
    filteredCocktails = filteredCocktails.filter(cocktail =>
      filters.ingredients!.some(ingredientId =>
        (cocktail.ingredients || []).some(ci => ci.ingredient.id === ingredientId)
      )
    );
  }

  // Filter by glass types
  if (filters.glassTypes && filters.glassTypes.length > 0) {
    filteredCocktails = filteredCocktails.filter(cocktail =>
      filters.glassTypes!.includes(cocktail.glassType.id)
    );
  }

  // Filter by difficulty
  if (filters.difficulty && filters.difficulty.length > 0) {
    filteredCocktails = filteredCocktails.filter(cocktail =>
      filters.difficulty!.includes(cocktail.difficulty)
    );
  }

  // Filter by max prep time
  if (filters.maxPrepTime) {
    filteredCocktails = filteredCocktails.filter(cocktail =>
      cocktail.prepTime <= filters.maxPrepTime!
    );
  }

  // Filter by alcoholic/non-alcoholic
  if (filters.alcoholic !== undefined) {
    filteredCocktails = filteredCocktails.filter(cocktail => {
      const hasAlcohol = (cocktail.ingredients || []).some(ci => ci.ingredient.alcoholic);
      return filters.alcoholic ? hasAlcohol : !hasAlcohol;
    });
  }

  return filteredCocktails;
}

/**
 * Find cocktails that can be made with available ingredients
 */
export function findCocktailsWithIngredients(userIngredients: UserIngredients): CocktailMatch[] {
  const allUserIngredients = [
    ...userIngredients.spirits,
    ...userIngredients.mixers,
    ...userIngredients.others
  ];

  const matches: CocktailMatch[] = getCocktailData().map(cocktail => {
    const requiredIngredients = (cocktail.ingredients || []).filter(ci => !ci.garnish && !ci.optional);
    const availableIngredients = requiredIngredients.filter(ci =>
      allUserIngredients.includes(ci.ingredient.id)
    );

    const missingIngredients = requiredIngredients
      .filter(ci => !allUserIngredients.includes(ci.ingredient.id))
      .map(ci => ci.ingredient);

    const matchPercentage = requiredIngredients.length > 0
      ? (availableIngredients.length / requiredIngredients.length) * 100
      : 0;

    const canMake = missingIngredients.length === 0;

    return {
      cocktail,
      matchPercentage,
      missingIngredients,
      canMake
    };
  });

  // Sort by match percentage (highest first), then by name
  return matches.sort((a, b) => {
    if (a.matchPercentage !== b.matchPercentage) {
      return b.matchPercentage - a.matchPercentage;
    }
    return a.cocktail.name.localeCompare(b.cocktail.name);
  });
}

/**
 * Get all unique ingredients used in cocktails (sync version with cache integration)
 */
export function getAllIngredients(): Ingredient[] {
  return getIngredientData();
}

/**
 * Get all ingredients (async version with smart caching)
 */
export async function getAllIngredientsAsync(): Promise<Ingredient[]> {
  try {
    const ingredients = await smartCache.getIngredients();
    // Update local cache for backward compatibility
    ingredientCache = ingredients;
    ingredientMap = new Map(ingredients.map(ingredient => [ingredient.id, ingredient]));
    ingredientCacheTimestamp = Date.now();
    return ingredients;
  } catch (error) {
    console.warn('Failed to get ingredients from smart cache, using fallback:', error);
    return getIngredientData();
  }
}

/**
 * Refresh ingredient data and invalidate cache
 */
export async function refreshIngredientData(): Promise<Ingredient[]> {
  invalidateIngredientCache();
  return await getAllIngredientsAsync();
}

/**
 * Get ingredient by ID (optimized with Map lookup)
 */
export function getIngredientById(id: string): Ingredient | undefined {
  return getIngredientMap().get(id);
}

/**
 * Get ingredients by category
 */
export function getIngredientsByCategory(category: string): Ingredient[] {
  return getIngredientData().filter(ingredient => ingredient.category === category);
}

/**
 * Get cocktails by category
 */
export function getCocktailsByCategory(category: string): Cocktail[] {
  return getCocktailData().filter(cocktail => cocktail.category === category);
}

/**
 * Get cocktails by tag
 */
export function getCocktailsByTag(tag: string): Cocktail[] {
  return getCocktailData().filter(cocktail => cocktail.tags.includes(tag));
}

/**
 * Get random cocktails
 */
export function getRandomCocktails(count: number): Cocktail[] {
  const shuffled = [...getCocktailData()].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Get featured cocktails (for homepage)
 */
export function getFeaturedCocktails(): Cocktail[] {
  // Return a mix of classic and popular cocktails
  const cocktailData = getCocktailData();
  const featured = cocktailData.filter(cocktail =>
    cocktail.tags.includes('Classic') ||
    cocktail.tags.includes('IBA Official') ||
    cocktail.difficulty === 'easy'
  );
  return featured.slice(0, 6);
}

/**
 * Get cocktail statistics
 */
export function getCocktailStats() {
  const cocktailData = getCocktailData();
  const ingredientData = getIngredientData();
  const totalCocktails = cocktailData.length;
  const totalIngredients = ingredientData.length;
  const categories = [...new Set(cocktailData.map(c => c.category))].length;
  const avgPrepTime = Math.round(
    cocktailData.reduce((sum, c) => sum + c.prepTime, 0) / cocktailData.length
  );

  return {
    totalCocktails,
    totalIngredients,
    categories,
    avgPrepTime
  };
}
