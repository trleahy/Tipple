// Core types for the Tipple application

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  alcoholic: boolean;
  description?: string;
  abv?: number; // Alcohol by volume percentage
}

export interface CocktailIngredient {
  ingredient: Ingredient;
  amount: string; // e.g., "2 oz", "1 dash", "to taste"
  optional?: boolean;
  garnish?: boolean;
}

export interface Cocktail {
  id: string;
  name: string;
  description: string;
  instructions: string[];
  ingredients: CocktailIngredient[];
  glassType: GlassType;
  category: CocktailCategory;
  tags: string[];
  difficulty: Difficulty;
  prepTime: number; // in minutes
  servings: number;
  imageUrl?: string;
  garnish?: string;
  history?: string;
  variations?: string[];
  isFavorite?: boolean;
}

export interface GlassType {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  capacity?: string; // e.g., "8-10 oz"
}

export enum IngredientCategory {
  SPIRIT = 'spirit',
  LIQUEUR = 'liqueur',
  MIXER = 'mixer',
  JUICE = 'juice',
  SYRUP = 'syrup',
  BITTERS = 'bitters',
  GARNISH = 'garnish',
  OTHER = 'other'
}

export enum CocktailCategory {
  CLASSIC = 'classic',
  MODERN = 'modern',
  TROPICAL = 'tropical',
  SOUR = 'sour',
  SWEET = 'sweet',
  BITTER = 'bitter',
  STRONG = 'strong',
  REFRESHING = 'refreshing',
  CREAMY = 'creamy',
  HOT = 'hot',
  FROZEN = 'frozen'
}

export enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

export interface SearchFilters {
  query?: string;
  categories?: CocktailCategory[];
  tags?: string[];
  ingredients?: string[];
  glassTypes?: string[];
  difficulty?: Difficulty[];
  maxPrepTime?: number;
  alcoholic?: boolean;
}

// More specific types for better type safety
export type CocktailId = string;
export type IngredientId = string;
export type UserId = string;

export interface FavoriteRecord {
  id: string;
  user_id: UserId;
  cocktail_id: CocktailId;
  created_at: string;
}

export interface ShoppingListRecord {
  id: string;
  user_id: UserId;
  ingredient_id: IngredientId;
  amount: string;
  cocktails: string[];
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface UserIngredients {
  spirits: string[];
  mixers: string[];
  others: string[];
}

export interface CocktailMatch {
  cocktail: Cocktail;
  matchPercentage: number;
  missingIngredients: Ingredient[];
  canMake: boolean;
}

// Common cocktail tags
export const COCKTAIL_TAGS = [
  'Long Drinks',
  'Party',
  'Creamy',
  'Citrusy',
  'Fruity',
  'Herbal',
  'Spicy',
  'Smoky',
  'Elegant',
  'Casual',
  'Summer',
  'Winter',
  'Brunch',
  'Nightcap',
  'Aperitif',
  'Digestif',
  'IBA Official',
  'Tiki',
  'Prohibition Era',
  'Low ABV',
  'High ABV'
] as const;

export type CocktailTag = typeof COCKTAIL_TAGS[number];
