import { Cocktail } from '@/types/cocktail';
import { getAllCocktails } from './cocktailUtils';
import { getFavoriteIdsSync } from './favoritesUtils';

/**
 * Get cocktail recommendations based on user's favorites and preferences
 */
export function getRecommendations(limit: number = 6): Cocktail[] {
  const allCocktails = getAllCocktails();
  const favoriteIds = getFavoriteIdsSync();
  
  if (favoriteIds.length === 0) {
    // If no favorites, return popular/easy cocktails
    return allCocktails
      .filter(cocktail => 
        cocktail.tags.includes('Classic') || 
        cocktail.difficulty === 'easy'
      )
      .slice(0, limit);
  }
  
  // Get favorite cocktails
  const favoriteCocktails = allCocktails.filter(cocktail => 
    favoriteIds.includes(cocktail.id)
  );
  
  // Analyze favorite patterns
  const favoriteCategories = [...new Set(favoriteCocktails.map(c => c.category))];
  const favoriteTags = favoriteCocktails.flatMap(c => c.tags);
  const favoriteTagCounts = favoriteTags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Score cocktails based on similarity to favorites
  const scoredCocktails = allCocktails
    .filter(cocktail => !favoriteIds.includes(cocktail.id)) // Exclude already favorited
    .map(cocktail => {
      let score = 0;
      
      // Category match
      if (favoriteCategories.includes(cocktail.category)) {
        score += 3;
      }
      
      // Tag matches
      cocktail.tags.forEach(tag => {
        if (favoriteTagCounts[tag]) {
          score += favoriteTagCounts[tag];
        }
      });
      
      // Difficulty preference (favor similar difficulty)
      const favoriteDifficulties = favoriteCocktails.map(c => c.difficulty);
      if (favoriteDifficulties.includes(cocktail.difficulty)) {
        score += 2;
      }
      
      return { cocktail, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.cocktail);
  
  return scoredCocktails;
}

/**
 * Get similar cocktails based on a specific cocktail
 */
export function getSimilarCocktails(cocktail: Cocktail, limit: number = 4): Cocktail[] {
  const allCocktails = getAllCocktails();
  
  const scoredCocktails = allCocktails
    .filter(c => c.id !== cocktail.id) // Exclude the current cocktail
    .map(otherCocktail => {
      let score = 0;
      
      // Same category
      if (otherCocktail.category === cocktail.category) {
        score += 5;
      }
      
      // Shared tags
      const sharedTags = otherCocktail.tags.filter(tag => cocktail.tags.includes(tag));
      score += sharedTags.length * 2;
      
      // Same difficulty
      if (otherCocktail.difficulty === cocktail.difficulty) {
        score += 2;
      }
      
      // Same glass type
      if (otherCocktail.glassType.id === cocktail.glassType.id) {
        score += 1;
      }
      
      // Shared ingredients
      const cocktailIngredientIds = cocktail.ingredients.map(ci => ci.ingredient.id);
      const otherIngredientIds = otherCocktail.ingredients.map(ci => ci.ingredient.id);
      const sharedIngredients = cocktailIngredientIds.filter(id => otherIngredientIds.includes(id));
      score += sharedIngredients.length * 3;
      
      return { cocktail: otherCocktail, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.cocktail);
  
  return scoredCocktails;
}

/**
 * Get trending cocktails (based on tags and categories)
 */
export function getTrendingCocktails(limit: number = 6): Cocktail[] {
  const allCocktails = getAllCocktails();
  
  // Define trending criteria
  const trendingTags = ['Modern', 'Party', 'Summer', 'Refreshing'];
  const trendingCategories = ['modern', 'refreshing', 'tropical'];
  
  const scoredCocktails = allCocktails
    .map(cocktail => {
      let score = 0;
      
      // Trending tags
      cocktail.tags.forEach(tag => {
        if (trendingTags.includes(tag)) {
          score += 3;
        }
      });
      
      // Trending categories
      if (trendingCategories.includes(cocktail.category)) {
        score += 2;
      }
      
      // Easy to make gets bonus
      if (cocktail.difficulty === 'easy') {
        score += 1;
      }
      
      return { cocktail, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.cocktail);
  
  return scoredCocktails;
}

/**
 * Get cocktails by season
 */
export function getSeasonalCocktails(season: 'spring' | 'summer' | 'fall' | 'winter', limit: number = 6): Cocktail[] {
  const allCocktails = getAllCocktails();
  
  const seasonalTags: Record<string, string[]> = {
    spring: ['Refreshing', 'Citrusy', 'Herbal'],
    summer: ['Tropical', 'Refreshing', 'Fruity', 'Summer'],
    fall: ['Spicy', 'Herbal', 'Strong'],
    winter: ['Hot', 'Strong', 'Creamy', 'Winter']
  };
  
  const seasonalCategories: Record<string, string[]> = {
    spring: ['refreshing', 'sour'],
    summer: ['tropical', 'refreshing', 'frozen'],
    fall: ['bitter', 'strong'],
    winter: ['hot', 'creamy', 'strong']
  };
  
  const relevantTags = seasonalTags[season] || [];
  const relevantCategories = seasonalCategories[season] || [];
  
  const scoredCocktails = allCocktails
    .map(cocktail => {
      let score = 0;
      
      // Seasonal tags
      cocktail.tags.forEach(tag => {
        if (relevantTags.includes(tag)) {
          score += 2;
        }
      });
      
      // Seasonal categories
      if (relevantCategories.includes(cocktail.category)) {
        score += 3;
      }
      
      return { cocktail, score };
    })
    .filter(item => item.score > 0) // Only include cocktails with some seasonal relevance
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.cocktail);
  
  return scoredCocktails;
}
