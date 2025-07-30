import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

let _supabase: SupabaseClient | null = null;

// Create a simple storage adapter that handles SSR gracefully
const createStorageAdapter = () => {
  // Return no-op storage for SSR
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    };
  }

  // Return real localStorage implementation for client
  return {
    getItem: (key: string) => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: (key: string, value: string) => {
      try {
        localStorage.setItem(key, value);
      } catch {
        // Silently fail
      }
    },
    removeItem: (key: string) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // Silently fail
      }
    }
  };
};

function createSupabaseClient() {
  const config = {
    auth: {
      persistSession: typeof window !== 'undefined',
      storageKey: 'tipple-auth',
      autoRefreshToken: typeof window !== 'undefined',
      detectSessionInUrl: typeof window !== 'undefined',
      ...(typeof window !== 'undefined' && {
        storage: createStorageAdapter()
      })
    }
  };

  return createClient(supabaseUrl, supabaseAnonKey, config);
}

function getSupabaseClient(): SupabaseClient {
  if (!_supabase) {
    _supabase = createSupabaseClient();
  }
  return _supabase;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    return getSupabaseClient()[prop as keyof SupabaseClient];
  }
})

// Database table names
export const TABLES = {
  FAVORITES: 'user_favorites',
  SHOPPING_LIST: 'user_shopping_list',
  COCKTAILS: 'cocktails',
  INGREDIENTS: 'ingredients',
  GLASS_TYPES: 'glass_types',
  CATEGORIES: 'categories',
  USERS: 'users'
} as const

// Database types
export interface Database {
  public: {
    Tables: {
      user_favorites: {
        Row: {
          id: string
          user_id: string
          cocktail_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          cocktail_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          cocktail_id?: string
          created_at?: string
        }
      }
      user_shopping_list: {
        Row: {
          id: string
          user_id: string
          ingredient_id: string
          amount: string
          cocktails: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          ingredient_id: string
          amount: string
          cocktails: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          ingredient_id?: string
          amount?: string
          cocktails?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      cocktails: {
        Row: {
          id: string
          name: string
          description: string
          instructions: string[]
          ingredients: unknown[] // CocktailIngredient[] with full nested objects
          glass_type_data: unknown // Complete GlassType object
          category: string
          difficulty: string
          prep_time: number
          servings: number
          garnish: string | null
          tags: string[]
          image_url: string | null
          history: string | null
          variations: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          instructions: string[]
          ingredients: unknown[] // CocktailIngredient[] with full nested objects
          glass_type_data: unknown // Complete GlassType object
          category: string
          difficulty: string
          prep_time: number
          servings?: number
          garnish?: string | null
          tags: string[]
          image_url?: string | null
          history?: string | null
          variations?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          instructions?: string[]
          ingredients?: unknown[] // CocktailIngredient[] with full nested objects
          glass_type_data?: unknown // Complete GlassType object
          category?: string
          difficulty?: string
          prep_time?: number
          servings?: number
          garnish?: string | null
          tags?: string[]
          image_url?: string | null
          history?: string | null
          variations?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      ingredients: {
        Row: {
          id: string
          name: string
          category: string
          alcoholic: boolean
          description: string | null
          abv: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          alcoholic?: boolean
          description?: string | null
          abv?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          alcoholic?: boolean
          description?: string | null
          abv?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      glass_types: {
        Row: {
          id: string
          name: string
          description: string
          icon_url: string | null
          capacity: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          icon_url?: string | null
          capacity?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          icon_url?: string | null
          capacity?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string
          color: string | null
          icon_emoji: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          color?: string | null
          icon_emoji?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          color?: string | null
          icon_emoji?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string | null
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
