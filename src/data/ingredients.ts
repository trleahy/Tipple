import { Ingredient, IngredientCategory, GlassType } from '@/types/cocktail';

export const ingredients: Ingredient[] = [
  // Spirits
  {
    id: 'vodka',
    name: 'Vodka',
    category: IngredientCategory.SPIRIT,
    alcoholic: true,
    abv: 40,
    description: 'A clear, neutral spirit distilled from grains or potatoes'
  },
  {
    id: 'gin',
    name: 'Gin',
    category: IngredientCategory.SPIRIT,
    alcoholic: true,
    abv: 40,
    description: 'A juniper-flavored spirit with botanical infusions'
  },
  {
    id: 'rum-white',
    name: 'White Rum',
    category: IngredientCategory.SPIRIT,
    alcoholic: true,
    abv: 40,
    description: 'Light, clear rum with a clean taste'
  },
  {
    id: 'rum-dark',
    name: 'Dark Rum',
    category: IngredientCategory.SPIRIT,
    alcoholic: true,
    abv: 40,
    description: 'Aged rum with rich, complex flavors'
  },
  {
    id: 'whiskey-bourbon',
    name: 'Bourbon Whiskey',
    category: IngredientCategory.SPIRIT,
    alcoholic: true,
    abv: 40,
    description: 'American whiskey with sweet corn-forward flavor'
  },
  {
    id: 'tequila-blanco',
    name: 'Blanco Tequila',
    category: IngredientCategory.SPIRIT,
    alcoholic: true,
    abv: 40,
    description: 'Unaged tequila with pure agave flavor'
  },

  // Liqueurs
  {
    id: 'triple-sec',
    name: 'Triple Sec',
    category: IngredientCategory.LIQUEUR,
    alcoholic: true,
    abv: 20,
    description: 'Orange-flavored liqueur'
  },
  {
    id: 'cointreau',
    name: 'Cointreau',
    category: IngredientCategory.LIQUEUR,
    alcoholic: true,
    abv: 40,
    description: 'Premium orange liqueur'
  },
  {
    id: 'amaretto',
    name: 'Amaretto',
    category: IngredientCategory.LIQUEUR,
    alcoholic: true,
    abv: 24,
    description: 'Sweet almond-flavored liqueur'
  },

  // Mixers
  {
    id: 'tonic-water',
    name: 'Tonic Water',
    category: IngredientCategory.MIXER,
    alcoholic: false,
    description: 'Carbonated water with quinine'
  },
  {
    id: 'soda-water',
    name: 'Soda Water',
    category: IngredientCategory.MIXER,
    alcoholic: false,
    description: 'Plain carbonated water'
  },
  {
    id: 'ginger-beer',
    name: 'Ginger Beer',
    category: IngredientCategory.MIXER,
    alcoholic: false,
    description: 'Spicy, carbonated ginger-flavored beverage'
  },

  // Juices
  {
    id: 'lime-juice',
    name: 'Fresh Lime Juice',
    category: IngredientCategory.JUICE,
    alcoholic: false,
    description: 'Freshly squeezed lime juice'
  },
  {
    id: 'lemon-juice',
    name: 'Fresh Lemon Juice',
    category: IngredientCategory.JUICE,
    alcoholic: false,
    description: 'Freshly squeezed lemon juice'
  },
  {
    id: 'orange-juice',
    name: 'Fresh Orange Juice',
    category: IngredientCategory.JUICE,
    alcoholic: false,
    description: 'Freshly squeezed orange juice'
  },

  // Syrups
  {
    id: 'simple-syrup',
    name: 'Simple Syrup',
    category: IngredientCategory.SYRUP,
    alcoholic: false,
    description: 'Equal parts sugar and water syrup'
  },
  {
    id: 'grenadine',
    name: 'Grenadine',
    category: IngredientCategory.SYRUP,
    alcoholic: false,
    description: 'Sweet pomegranate syrup'
  },
  {
    id: 'cranberry-juice',
    name: 'Cranberry Juice',
    category: IngredientCategory.JUICE,
    alcoholic: false,
    description: 'Tart cranberry juice'
  },
  {
    id: 'dry-vermouth',
    name: 'Dry Vermouth',
    category: IngredientCategory.LIQUEUR,
    alcoholic: true,
    abv: 18,
    description: 'Dry fortified wine with herbs'
  },
  {
    id: 'sweet-vermouth',
    name: 'Sweet Vermouth',
    category: IngredientCategory.LIQUEUR,
    alcoholic: true,
    abv: 18,
    description: 'Sweet fortified wine with herbs'
  },
  {
    id: 'campari',
    name: 'Campari',
    category: IngredientCategory.LIQUEUR,
    alcoholic: true,
    abv: 25,
    description: 'Bitter Italian aperitif'
  },

  // Bitters
  {
    id: 'angostura-bitters',
    name: 'Angostura Bitters',
    category: IngredientCategory.BITTERS,
    alcoholic: true,
    abv: 44.7,
    description: 'Classic aromatic bitters'
  },

  // Garnishes
  {
    id: 'lime-wheel',
    name: 'Lime Wheel',
    category: IngredientCategory.GARNISH,
    alcoholic: false,
    description: 'Fresh lime wheel for garnish'
  },
  {
    id: 'lemon-twist',
    name: 'Lemon Twist',
    category: IngredientCategory.GARNISH,
    alcoholic: false,
    description: 'Lemon peel twist for garnish'
  },
  {
    id: 'cherry-maraschino',
    name: 'Maraschino Cherry',
    category: IngredientCategory.GARNISH,
    alcoholic: false,
    description: 'Sweet preserved cherry'
  },
  {
    id: 'mint-sprig',
    name: 'Fresh Mint Sprig',
    category: IngredientCategory.GARNISH,
    alcoholic: false,
    description: 'Fresh mint for garnish and aroma'
  }
];

export const glassTypes: GlassType[] = [
  {
    id: 'highball',
    name: 'Highball Glass',
    description: 'Tall, straight-sided glass for mixed drinks',
    capacity: '8-12 oz'
  },
  {
    id: 'rocks',
    name: 'Rocks Glass',
    description: 'Short, wide glass for spirits on the rocks',
    capacity: '6-8 oz'
  },
  {
    id: 'martini',
    name: 'Martini Glass',
    description: 'V-shaped glass with long stem',
    capacity: '4-6 oz'
  },
  {
    id: 'coupe',
    name: 'Coupe Glass',
    description: 'Shallow, broad-bowled glass with stem',
    capacity: '4-6 oz'
  },
  {
    id: 'collins',
    name: 'Collins Glass',
    description: 'Tall, narrow glass for long drinks',
    capacity: '10-14 oz'
  },
  {
    id: 'shot',
    name: 'Shot Glass',
    description: 'Small glass for shots and small cocktails',
    capacity: '1-2 oz'
  }
];
