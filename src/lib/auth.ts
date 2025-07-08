/**
 * Authentication Service - Handles Supabase auth with anonymous user support
 * Provides seamless transition between anonymous and authenticated states
 */

'use client';

import { supabase } from './supabase';
import { User, Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email?: string;
  isAnonymous: boolean;
  isAdmin: boolean;
  createdAt: string;
  lastLoginAt: string;
}

export interface AuthState {
  user: UserProfile | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

// Auth state management
let authState: AuthState = {
  user: null,
  session: null,
  loading: true,
  error: null
};

let authListeners: ((state: AuthState) => void)[] = [];

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (state: AuthState) => void): () => void {
  authListeners.push(callback);
  
  // Immediately call with current state
  callback(authState);
  
  // Return unsubscribe function
  return () => {
    authListeners = authListeners.filter(listener => listener !== callback);
  };
}

/**
 * Notify all listeners of auth state changes
 */
function notifyAuthStateChange(): void {
  authListeners.forEach(listener => listener(authState));
}

/**
 * Update auth state
 */
function updateAuthState(updates: Partial<AuthState>): void {
  authState = { ...authState, ...updates };
  notifyAuthStateChange();
}

/**
 * Get or create anonymous user profile
 */
async function getOrCreateAnonymousUser(): Promise<UserProfile> {
  try {
    // Check if we have an existing anonymous user
    let anonymousId = localStorage.getItem('tipple-anonymous-user-id');

    if (!anonymousId) {
      anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('tipple-anonymous-user-id', anonymousId);
      localStorage.setItem('tipple-anonymous-user-created', new Date().toISOString());
    }

    const createdAt = localStorage.getItem('tipple-anonymous-user-created') || new Date().toISOString();
    
    return {
      id: anonymousId,
      isAnonymous: true,
      isAdmin: false,
      createdAt,
      lastLoginAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error creating anonymous user:', error);
    // Fallback anonymous user
    const fallbackId = `anon_${Date.now()}_fallback`;
    return {
      id: fallbackId,
      isAnonymous: true,
      isAdmin: false,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
  }
}

/**
 * Transform Supabase user to UserProfile
 */
async function transformSupabaseUser(user: User): Promise<UserProfile> {
  try {
    // Try to get user profile from Supabase
    let { data: profile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    // If user doesn't exist in users table, create them
    if (!profile) {
      console.log('Creating user record for:', user.id);
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          is_admin: false
        });

      if (!insertError) {
        profile = { is_admin: false };
      } else {
        console.error('Failed to create user record:', insertError);
      }
    }

    return {
      id: user.id,
      email: user.email,
      isAnonymous: false,
      isAdmin: profile?.is_admin || false,
      createdAt: user.created_at,
      lastLoginAt: new Date().toISOString()
    };
  } catch (error) {
    console.warn('Failed to get user profile from Supabase:', error);
    return {
      id: user.id,
      email: user.email,
      isAnonymous: false,
      isAdmin: false,
      createdAt: user.created_at,
      lastLoginAt: new Date().toISOString()
    };
  }
}

/**
 * Initialize authentication
 */
export async function initAuth(): Promise<void> {
  try {
    updateAuthState({ loading: true, error: null });
    
    // Get current session from Supabase
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.warn('Supabase auth error:', error);
      // Fall back to anonymous user
      const anonymousUser = await getOrCreateAnonymousUser();
      updateAuthState({
        user: anonymousUser,
        session: null,
        loading: false,
        error: null
      });
      return;
    }
    
    if (session?.user) {
      // User is authenticated
      const userProfile = await transformSupabaseUser(session.user);
      updateAuthState({
        user: userProfile,
        session,
        loading: false,
        error: null
      });
    } else {
      // No authenticated user, use anonymous
      const anonymousUser = await getOrCreateAnonymousUser();
      updateAuthState({
        user: anonymousUser,
        session: null,
        loading: false,
        error: null
      });
    }
  } catch (error) {
    console.error('Auth initialization failed:', error);
    // Fall back to anonymous user
    const anonymousUser = await getOrCreateAnonymousUser();
    updateAuthState({
      user: anonymousUser,
      session: null,
      loading: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    });
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    updateAuthState({ loading: true, error: null });
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      updateAuthState({ loading: false, error: error.message });
      return { success: false, error: error.message };
    }
    
    if (data.user) {
      const userProfile = await transformSupabaseUser(data.user);
      updateAuthState({
        user: userProfile,
        session: data.session,
        loading: false,
        error: null
      });
      
      // Migrate anonymous data if needed
      await migrateAnonymousData();
      
      return { success: true };
    }
    
    return { success: false, error: 'Sign in failed' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
    updateAuthState({ loading: false, error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * Sign up with email and password
 */
export async function signUp(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    updateAuthState({ loading: true, error: null });
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    
    if (error) {
      updateAuthState({ loading: false, error: error.message });
      return { success: false, error: error.message };
    }
    
    if (data.user) {
      // Note: User might need to confirm email before being fully authenticated
      const userProfile = await transformSupabaseUser(data.user);
      updateAuthState({
        user: userProfile,
        session: data.session,
        loading: false,
        error: null
      });
      
      // Migrate anonymous data if needed
      await migrateAnonymousData();
      
      return { success: true };
    }
    
    return { success: false, error: 'Sign up failed' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
    updateAuthState({ loading: false, error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * Sign out
 */
export async function signOut(): Promise<void> {
  try {
    updateAuthState({ loading: true, error: null });
    
    await supabase.auth.signOut();
    
    // Switch back to anonymous user
    const anonymousUser = await getOrCreateAnonymousUser();
    updateAuthState({
      user: anonymousUser,
      session: null,
      loading: false,
      error: null
    });
  } catch (error) {
    console.error('Sign out error:', error);
    // Still switch to anonymous user even if sign out failed
    const anonymousUser = await getOrCreateAnonymousUser();
    updateAuthState({
      user: anonymousUser,
      session: null,
      loading: false,
      error: null
    });
  }
}

/**
 * Get current user
 */
export function getCurrentUser(): UserProfile | null {
  return authState.user;
}

/**
 * Get current auth state
 */
export function getAuthState(): AuthState {
  return authState;
}

/**
 * Check if user is authenticated (not anonymous)
 */
export function isAuthenticated(): boolean {
  return authState.user !== null && !authState.user.isAnonymous;
}

/**
 * Check if user is admin
 */
export function isAdmin(): boolean {
  return authState.user?.isAdmin || false;
}

/**
 * Migrate anonymous user data to authenticated user
 */
async function migrateAnonymousData(): Promise<void> {
  try {
    console.log('Migrating anonymous data to authenticated user...');

    const anonymousId = localStorage.getItem('tipple-anonymous-user-id');
    if (!anonymousId) return;

    // Get anonymous user's favorites from localStorage
    const favoritesKey = 'cocktailflow-favorites';
    const storedFavorites = localStorage.getItem(favoritesKey);
    const anonymousFavorites = storedFavorites ? JSON.parse(storedFavorites) : [];

    // Note: In the simplified architecture, favorites will be migrated through the storage layer
    // when the user signs in, so we don't need to do complex migration here

    console.log(`Found ${anonymousFavorites.length} favorites for migration`);

    // Clear anonymous user data
    localStorage.removeItem('tipple-anonymous-user-id');
    localStorage.removeItem('tipple-anonymous-user-created');

  } catch (error) {
    console.error('Failed to migrate anonymous data:', error);
  }
}

/**
 * Set up Supabase auth listener
 */
function setupAuthListener(): void {
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Supabase auth event:', event);
    
    if (event === 'SIGNED_IN' && session?.user) {
      const userProfile = await transformSupabaseUser(session.user);
      updateAuthState({
        user: userProfile,
        session,
        loading: false,
        error: null
      });
    } else if (event === 'SIGNED_OUT') {
      const anonymousUser = await getOrCreateAnonymousUser();
      updateAuthState({
        user: anonymousUser,
        session: null,
        loading: false,
        error: null
      });
    } else if (event === 'TOKEN_REFRESHED' && session) {
      updateAuthState({
        session,
        loading: false,
        error: null
      });
    }
  });
}

// Initialize auth when module loads
if (typeof window !== 'undefined') {
  setupAuthListener();
  initAuth();
}
