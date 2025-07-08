import { Cocktail, CocktailCategory, Difficulty } from '@/types/cocktail';
import { ingredients, glassTypes } from './ingredients';

// Helper function to find ingredient by id
const findIngredient = (id: string) => ingredients.find(ing => ing.id === id)!;
const findGlass = (id: string) => glassTypes.find(glass => glass.id === id)!;

export const cocktails: Cocktail[] = [
  {
    id: 'gin-tonic',
    name: 'Gin & Tonic',
    description: 'A classic, refreshing highball cocktail with gin and tonic water.',
    instructions: [
      'Fill a highball glass with ice cubes',
      'Add gin',
      'Top with tonic water',
      'Stir gently',
      'Garnish with a lime wheel'
    ],
    ingredients: [
      { ingredient: findIngredient('gin'), amount: '2 oz' },
      { ingredient: findIngredient('tonic-water'), amount: '4-6 oz' },
      { ingredient: findIngredient('lime-wheel'), amount: '1 wheel', garnish: true }
    ],
    glassType: findGlass('highball'),
    category: CocktailCategory.REFRESHING,
    tags: ['Long Drinks', 'Classic', 'Refreshing', 'Low ABV'],
    difficulty: Difficulty.EASY,
    prepTime: 2,
    servings: 1,
    garnish: 'Lime wheel'
  },
  {
    id: 'margarita',
    name: 'Margarita',
    description: 'A classic Mexican cocktail with tequila, lime juice, and orange liqueur.',
    instructions: [
      'Rim glass with salt (optional)',
      'Add all ingredients to a shaker with ice',
      'Shake vigorously for 10-15 seconds',
      'Strain into a rocks glass over fresh ice',
      'Garnish with a lime wheel'
    ],
    ingredients: [
      { ingredient: findIngredient('tequila-blanco'), amount: '2 oz' },
      { ingredient: findIngredient('triple-sec'), amount: '1 oz' },
      { ingredient: findIngredient('lime-juice'), amount: '1 oz' },
      { ingredient: findIngredient('lime-wheel'), amount: '1 wheel', garnish: true }
    ],
    glassType: findGlass('rocks'),
    category: CocktailCategory.SOUR,
    tags: ['Classic', 'Citrusy', 'Party', 'IBA Official'],
    difficulty: Difficulty.EASY,
    prepTime: 3,
    servings: 1,
    garnish: 'Lime wheel, salt rim (optional)'
  },
  {
    id: 'moscow-mule',
    name: 'Moscow Mule',
    description: 'A refreshing cocktail with vodka, ginger beer, and lime juice.',
    instructions: [
      'Fill a copper mug or highball glass with ice',
      'Add vodka and lime juice',
      'Top with ginger beer',
      'Stir gently',
      'Garnish with a lime wheel and mint sprig'
    ],
    ingredients: [
      { ingredient: findIngredient('vodka'), amount: '2 oz' },
      { ingredient: findIngredient('lime-juice'), amount: '0.5 oz' },
      { ingredient: findIngredient('ginger-beer'), amount: '4-6 oz' },
      { ingredient: findIngredient('lime-wheel'), amount: '1 wheel', garnish: true },
      { ingredient: findIngredient('mint-sprig'), amount: '1 sprig', garnish: true }
    ],
    glassType: findGlass('highball'),
    category: CocktailCategory.REFRESHING,
    tags: ['Long Drinks', 'Refreshing', 'Spicy', 'Modern'],
    difficulty: Difficulty.EASY,
    prepTime: 3,
    servings: 1,
    garnish: 'Lime wheel and fresh mint sprig'
  },
  {
    id: 'martini',
    name: 'Classic Martini',
    description: 'The quintessential cocktail with gin and dry vermouth.',
    instructions: [
      'Chill a martini glass',
      'Add gin and dry vermouth to a mixing glass with ice',
      'Stir for 30 seconds',
      'Strain into the chilled martini glass',
      'Garnish with a lemon twist or olive'
    ],
    ingredients: [
      { ingredient: findIngredient('gin'), amount: '2.5 oz' },
      { ingredient: findIngredient('dry-vermouth'), amount: '0.5 oz' },
      { ingredient: findIngredient('lemon-twist'), amount: '1 twist', garnish: true }
    ],
    glassType: findGlass('martini'),
    category: CocktailCategory.CLASSIC,
    tags: ['Classic', 'Elegant', 'Strong', 'IBA Official', 'Aperitif'],
    difficulty: Difficulty.MEDIUM,
    prepTime: 4,
    servings: 1,
    garnish: 'Lemon twist or olive',
    history: 'One of the most iconic cocktails, with origins dating back to the 1860s.'
  },
  {
    id: 'old-fashioned',
    name: 'Old Fashioned',
    description: 'A classic whiskey cocktail with sugar, bitters, and orange.',
    instructions: [
      'Add simple syrup and bitters to a rocks glass',
      'Add a splash of water and stir',
      'Fill glass with ice cubes',
      'Add bourbon and stir gently',
      'Garnish with an orange peel'
    ],
    ingredients: [
      { ingredient: findIngredient('whiskey-bourbon'), amount: '2 oz' },
      { ingredient: findIngredient('simple-syrup'), amount: '0.25 oz' },
      { ingredient: findIngredient('angostura-bitters'), amount: '2-3 dashes' }
    ],
    glassType: findGlass('rocks'),
    category: CocktailCategory.CLASSIC,
    tags: ['Classic', 'Strong', 'Elegant', 'IBA Official', 'Prohibition Era'],
    difficulty: Difficulty.MEDIUM,
    prepTime: 4,
    servings: 1,
    garnish: 'Orange peel',
    history: 'Dating back to the 1880s, this is one of the original cocktails.'
  },
  {
    id: 'daiquiri',
    name: 'Daiquiri',
    description: 'A simple and elegant cocktail with rum, lime juice, and simple syrup.',
    instructions: [
      'Add all ingredients to a shaker with ice',
      'Shake vigorously for 10-15 seconds',
      'Double strain into a chilled coupe glass',
      'Garnish with a lime wheel'
    ],
    ingredients: [
      { ingredient: findIngredient('rum-white'), amount: '2 oz' },
      { ingredient: findIngredient('lime-juice'), amount: '1 oz' },
      { ingredient: findIngredient('simple-syrup'), amount: '0.5 oz' },
      { ingredient: findIngredient('lime-wheel'), amount: '1 wheel', garnish: true }
    ],
    glassType: findGlass('coupe'),
    category: CocktailCategory.SOUR,
    tags: ['Classic', 'Citrusy', 'Elegant', 'IBA Official', 'Summer'],
    difficulty: Difficulty.EASY,
    prepTime: 3,
    servings: 1,
    garnish: 'Lime wheel'
  },
  {
    id: 'whiskey-sour',
    name: 'Whiskey Sour',
    description: 'A classic sour cocktail with bourbon, lemon juice, and simple syrup.',
    instructions: [
      'Add bourbon, lemon juice, and simple syrup to a shaker with ice',
      'Shake vigorously for 10-15 seconds',
      'Strain into a rocks glass over fresh ice',
      'Garnish with a lemon wheel and cherry'
    ],
    ingredients: [
      { ingredient: findIngredient('whiskey-bourbon'), amount: '2 oz' },
      { ingredient: findIngredient('lemon-juice'), amount: '1 oz' },
      { ingredient: findIngredient('simple-syrup'), amount: '0.5 oz' },
      { ingredient: findIngredient('cherry-maraschino'), amount: '1 cherry', garnish: true }
    ],
    glassType: findGlass('rocks'),
    category: CocktailCategory.SOUR,
    tags: ['Classic', 'Citrusy', 'IBA Official', 'Prohibition Era'],
    difficulty: Difficulty.EASY,
    prepTime: 3,
    servings: 1,
    garnish: 'Lemon wheel and maraschino cherry'
  },
  {
    id: 'cosmopolitan',
    name: 'Cosmopolitan',
    description: 'A sophisticated pink cocktail with vodka, cranberry juice, and lime.',
    instructions: [
      'Add all ingredients to a shaker with ice',
      'Shake vigorously for 10-15 seconds',
      'Double strain into a chilled martini glass',
      'Garnish with a lime wheel'
    ],
    ingredients: [
      { ingredient: findIngredient('vodka'), amount: '1.5 oz' },
      { ingredient: findIngredient('triple-sec'), amount: '0.5 oz' },
      { ingredient: findIngredient('lime-juice'), amount: '0.5 oz' },
      { ingredient: findIngredient('cranberry-juice'), amount: '0.5 oz' }
    ],
    glassType: findGlass('martini'),
    category: CocktailCategory.MODERN,
    tags: ['Modern', 'Elegant', 'Party', 'Fruity'],
    difficulty: Difficulty.MEDIUM,
    prepTime: 4,
    servings: 1,
    garnish: 'Lime wheel'
  },
  {
    id: 'mojito',
    name: 'Mojito',
    description: 'A refreshing Cuban cocktail with rum, mint, lime, and soda water.',
    instructions: [
      'Muddle mint leaves gently in the bottom of a glass',
      'Add lime juice and simple syrup',
      'Fill glass with ice',
      'Add rum and stir',
      'Top with soda water',
      'Garnish with fresh mint sprig and lime wheel'
    ],
    ingredients: [
      { ingredient: findIngredient('rum-white'), amount: '2 oz' },
      { ingredient: findIngredient('lime-juice'), amount: '1 oz' },
      { ingredient: findIngredient('simple-syrup'), amount: '0.5 oz' },
      { ingredient: findIngredient('soda-water'), amount: '2-3 oz' },
      { ingredient: findIngredient('mint-sprig'), amount: '8-10 leaves' },
      { ingredient: findIngredient('lime-wheel'), amount: '1 wheel', garnish: true }
    ],
    glassType: findGlass('highball'),
    category: CocktailCategory.REFRESHING,
    tags: ['Long Drinks', 'Refreshing', 'Herbal', 'Summer', 'IBA Official'],
    difficulty: Difficulty.MEDIUM,
    prepTime: 5,
    servings: 1,
    garnish: 'Fresh mint sprig and lime wheel'
  },
  {
    id: 'negroni',
    name: 'Negroni',
    description: 'A bitter Italian cocktail with gin, Campari, and sweet vermouth.',
    instructions: [
      'Add all ingredients to a rocks glass with ice',
      'Stir gently to combine',
      'Garnish with an orange peel'
    ],
    ingredients: [
      { ingredient: findIngredient('gin'), amount: '1 oz' },
      { ingredient: findIngredient('campari'), amount: '1 oz' },
      { ingredient: findIngredient('sweet-vermouth'), amount: '1 oz' }
    ],
    glassType: findGlass('rocks'),
    category: CocktailCategory.BITTER,
    tags: ['Classic', 'Bitter', 'Elegant', 'IBA Official', 'Aperitif'],
    difficulty: Difficulty.EASY,
    prepTime: 2,
    servings: 1,
    garnish: 'Orange peel'
  }
];
