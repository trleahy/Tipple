/**
 * Authentication Service - Handles Supabase auth with admin support
 * Uses Supabase's isomorphic JavaScript library for authentication
 */

'use client';

import { supabase } from './supabase';
import { User, Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email?: string;
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
let isAuthListenerSetup = false;

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (state: AuthState) => void): () => void {
  authListeners.push(callback);
  // Only call callback with current state if auth has been initialized
  // This prevents sending stale loading state before initialization
  if (!authState.loading || authState.user || authState.error) {
    callback(authState);
  }
  return () => {
    authListeners = authListeners.filter(listener => listener !== callback);
  };
}

/**
 * Update auth state and notify listeners
 */
function updateAuthState(updates: Partial<AuthState>): void {
  authState = { ...authState, ...updates };
  authListeners.forEach(listener => listener(authState));
}

/**
 * Transform Supabase user to UserProfile
 */
async function transformSupabaseUser(user: User): Promise<UserProfile> {
  try {
    // Add timeout to prevent hanging on network issues
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('User profile fetch timeout')), 5000);
    });

    // Try to get user profile from Supabase with timeout
    const profilePromise = supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    let { data: profile } = await Promise.race([profilePromise, timeoutPromise]);

    // If user doesn't exist in users table, create them
    if (!profile) {
      console.log('Creating user record for:', user.id);
      const insertPromise = supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          is_admin: false
        });

      const { error: insertError } = await Promise.race([insertPromise, timeoutPromise]);

      if (!insertError) {
        profile = { is_admin: false };
      } else {
        console.error('Failed to create user record:', insertError);
      }
    }

    return {
      id: user.id,
      email: user.email,
      isAdmin: profile?.is_admin || false,
      createdAt: user.created_at,
      lastLoginAt: new Date().toISOString()
    };
  } catch (error) {
    console.warn('Failed to get user profile from Supabase:', error);
    // Return a safe default profile for offline/network issues
    return {
      id: user.id,
      email: user.email,
      isAdmin: false, // Default to non-admin for safety
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
    console.log('Initializing auth...');
    updateAuthState({ loading: true, error: null });

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Auth initialization timeout')), 10000);
    });

    // Get current session from Supabase with timeout
    const { data: { session }, error } = await Promise.race([
      supabase.auth.getSession(),
      timeoutPromise
    ]);

    console.log('Session retrieved:', session ? 'found' : 'none', error ? `error: ${error.message}` : 'no error');

    if (error) {
      console.warn('Supabase auth error:', error);
      updateAuthState({
        user: null,
        session: null,
        loading: false,
        error: error.message
      });
      return;
    }

    if (session?.user) {
      // User is authenticated
      console.log('User authenticated, transforming user profile...');
      const userProfile = await transformSupabaseUser(session.user);
      console.log('User profile created:', userProfile);
      updateAuthState({
        user: userProfile,
        session,
        loading: false,
        error: null
      });
    } else {
      // No authenticated user
      console.log('No authenticated user found');
      updateAuthState({
        user: null,
        session: null,
        loading: false,
        error: null
      });
    }
  } catch (error) {
    console.error('Auth initialization failed:', error);
    updateAuthState({
      user: null,
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
    
    // Sign out from Supabase (this will clear their session storage)
    await supabase.auth.signOut();
    
    // Clear any additional stored auth data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tipple-auth'); // Clear our custom storage
      localStorage.removeItem('cocktailflow-admin-auth'); // Clear old admin session storage

      // Clear any other auth-related items
      const authKeys = ['sb-'];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && authKeys.some(prefix => key.startsWith(prefix))) {
          localStorage.removeItem(key);
        }
      }
    }
    
    // Update our local state
    updateAuthState({
      user: null,
      session: null,
      loading: false,
      error: null
    });
  } catch (error) {
    console.error('Sign out error:', error);
    // Still try to clear state even if there's an error
    updateAuthState({
      user: null,
      session: null,
      loading: false,
      error: error instanceof Error ? error.message : 'Sign out failed'
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
 * Refresh auth state (useful after admin status changes)
 */
export async function refreshAuthState(): Promise<void> {
  await initAuth();
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return authState.user !== null;
}

/**
 * Check if user is admin
 */
export function isAdmin(): boolean {
  return authState.user?.isAdmin || false;
}

/**
 * Validate admin access with comprehensive error handling
 */
export async function validateAdminAccess(): Promise<{ hasAccess: boolean; error?: string; user?: UserProfile }> {
  try {
    // Check if we have a current user
    if (!authState.user || !authState.session) {
      return { hasAccess: false, error: 'No authenticated user' };
    }

    // Check if user is admin
    if (!authState.user.isAdmin) {
      return { hasAccess: false, error: 'User is not an admin', user: authState.user };
    }

    // Verify session is still valid by checking with Supabase
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        // Session is invalid, clear auth state
        updateAuthState({
          user: null,
          session: null,
          loading: false,
          error: 'Session expired'
        });
        return { hasAccess: false, error: 'Session expired' };
      }

      // Session is valid and user is admin
      return { hasAccess: true, user: authState.user };
    } catch (sessionError) {
      console.error('Session validation failed:', sessionError);
      return { hasAccess: false, error: 'Unable to validate session' };
    }
  } catch (error) {
    console.error('Admin access validation failed:', error);
    return { hasAccess: false, error: 'Authentication system error' };
  }
}

/**
 * Set up Supabase auth listener
 */
function setupAuthListener(): void {
  if (isAuthListenerSetup) {
    console.log('Auth listener already set up, skipping');
    return;
  }

  console.log('Setting up Supabase auth listener');
  isAuthListenerSetup = true;

  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Supabase auth event:', event, session?.user?.email);

    if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
      const userProfile = await transformSupabaseUser(session.user);
      updateAuthState({
        user: userProfile,
        session,
        loading: false,
        error: null
      });
    } else if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session)) {
      updateAuthState({
        user: null,
        session: null,
        loading: false,
        error: null
      });
    } else if (event === 'TOKEN_REFRESHED' && session) {
      // When token is refreshed, we need to update the user profile too
      // in case admin status has changed
      if (session.user) {
        const userProfile = await transformSupabaseUser(session.user);
        updateAuthState({
          user: userProfile,
          session,
          loading: false,
          error: null
        });
      } else {
        updateAuthState({
          session,
          loading: false,
          error: null
        });
      }
    }
  });
}

/**
 * Initialize authentication system
 * This should be called once when the app starts
 */
export async function initializeAuth(): Promise<void> {
  if (typeof window !== 'undefined') {
    setupAuthListener();
    await initAuth();
  }
}

/**
 * Check if current user has admin privileges
 * This is the unified method for checking admin status
 */
export async function checkAdminAccess(): Promise<{ hasAccess: boolean; user?: UserProfile; error?: string }> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      return { hasAccess: false, error: error.message };
    }

    if (!session?.user) {
      return { hasAccess: false, error: 'No authenticated user' };
    }

    const userProfile = await transformSupabaseUser(session.user);

    if (!userProfile.isAdmin) {
      return { hasAccess: false, error: 'User is not an admin' };
    }

    return { hasAccess: true, user: userProfile };
  } catch (error) {
    console.error('Error checking admin access:', error);
    return { hasAccess: false, error: 'Failed to check admin access' };
  }
}

/**
 * Make current user an admin (for development/setup purposes)
 * This should be used carefully and ideally only during initial setup
 */
export async function makeCurrentUserAdmin(): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'No authenticated user' };
    }

    const { error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        is_admin: true
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // Refresh the auth state to reflect the admin status change
    await refreshAuthState();

    return { success: true };
  } catch (error) {
    console.error('Error making user admin:', error);
    return { success: false, error: 'Failed to grant admin privileges' };
  }
}

// Remove automatic initialization - let AuthProvider handle it
// This prevents double initialization and race conditions
