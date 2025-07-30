import { Category, CocktailCategory } from '@/types/cocktail';

/**
 * Initial categories data migrated from CocktailCategory enum
 * These will be used to populate the Supabase categories table
 */
export const initialCategories: Category[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional cocktails with historical significance and timeless appeal',
    color: '#8B4513',
    iconEmoji: '🏛️'
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary cocktails and innovative new creations',
    color: '#4A90E2',
    iconEmoji: '✨'
  },
  {
    id: 'tropical',
    name: 'Tropical',
    description: 'Exotic cocktails with tropical flavors and island vibes',
    color: '#FF6B35',
    iconEmoji: '🌺'
  },
  {
    id: 'sour',
    name: 'Sour',
    description: 'Cocktails with citrus and tart flavors that pucker the palate',
    color: '#F7DC6F',
    iconEmoji: '🍋'
  },
  {
    id: 'sweet',
    name: 'Sweet',
    description: 'Cocktails with sweet and dessert-like flavors',
    color: '#E91E63',
    iconEmoji: '🍯'
  },
  {
    id: 'bitter',
    name: 'Bitter',
    description: 'Cocktails with bitter and herbal notes for sophisticated palates',
    color: '#795548',
    iconEmoji: '🌿'
  },
  {
    id: 'strong',
    name: 'Strong',
    description: 'High-alcohol content cocktails for those who like it potent',
    color: '#D32F2F',
    iconEmoji: '💪'
  },
  {
    id: 'refreshing',
    name: 'Refreshing',
    description: 'Light and refreshing cocktails perfect for hot days',
    color: '#00BCD4',
    iconEmoji: '💧'
  },
  {
    id: 'creamy',
    name: 'Creamy',
    description: 'Cocktails with cream, milk, or other dairy-based ingredients',
    color: '#FFF8E1',
    iconEmoji: '🥛'
  },
  {
    id: 'hot',
    name: 'Hot',
    description: 'Warm cocktails perfect for cold weather and cozy evenings',
    color: '#FF5722',
    iconEmoji: '☕'
  },
  {
    id: 'frozen',
    name: 'Frozen',
    description: 'Blended and frozen cocktails for a cool, slushy texture',
    color: '#81C784',
    iconEmoji: '🧊'
  }
];

/**
 * Map old enum values to new category IDs for migration
 */
export const categoryEnumToIdMap: Record<CocktailCategory, string> = {
  [CocktailCategory.CLASSIC]: 'classic',
  [CocktailCategory.MODERN]: 'modern',
  [CocktailCategory.TROPICAL]: 'tropical',
  [CocktailCategory.SOUR]: 'sour',
  [CocktailCategory.SWEET]: 'sweet',
  [CocktailCategory.BITTER]: 'bitter',
  [CocktailCategory.STRONG]: 'strong',
  [CocktailCategory.REFRESHING]: 'refreshing',
  [CocktailCategory.CREAMY]: 'creamy',
  [CocktailCategory.HOT]: 'hot',
  [CocktailCategory.FROZEN]: 'frozen'
};

/**
 * Map category IDs back to enum values for backward compatibility
 */
export const categoryIdToEnumMap: Record<string, CocktailCategory> = {
  'classic': CocktailCategory.CLASSIC,
  'modern': CocktailCategory.MODERN,
  'tropical': CocktailCategory.TROPICAL,
  'sour': CocktailCategory.SOUR,
  'sweet': CocktailCategory.SWEET,
  'bitter': CocktailCategory.BITTER,
  'strong': CocktailCategory.STRONG,
  'refreshing': CocktailCategory.REFRESHING,
  'creamy': CocktailCategory.CREAMY,
  'hot': CocktailCategory.HOT,
  'frozen': CocktailCategory.FROZEN
};

/**
 * Helper function to get category by ID
 */
export function getCategoryById(id: string): Category | undefined {
  return initialCategories.find(cat => cat.id === id);
}

/**
 * Helper function to get category by enum value
 */
export function getCategoryByEnum(enumValue: CocktailCategory): Category | undefined {
  const id = categoryEnumToIdMap[enumValue];
  return getCategoryById(id);
}

/**
 * Helper function to convert category to enum for backward compatibility
 */
export function categoryToEnum(category: Category | CocktailCategory): CocktailCategory {
  if (typeof category === 'string') {
    return category as CocktailCategory;
  }
  return categoryIdToEnumMap[category.id] || CocktailCategory.MODERN;
}

/**
 * Helper function to get category display name
 */
export function getCategoryDisplayName(category: Category | CocktailCategory | string): string {
  if (typeof category === 'string') {
    // Could be enum value or category ID
    const categoryObj = getCategoryById(category) || getCategoryByEnum(category as CocktailCategory);
    return categoryObj?.name || category;
  }
  if ('name' in category) {
    return category.name;
  }
  return category;
}
