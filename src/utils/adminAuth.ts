'use client';

import { supabase } from '@/lib/supabase';

// Simple admin authentication with Supabase integration
const ADMIN_KEY = 'cocktailflow-admin-auth';
const ADMIN_PASSWORD = 'cocktailflow2024'; // In production, this would be hashed and stored securely

export interface AdminSession {
  isAuthenticated: boolean;
  loginTime: number;
  expiresAt: number;
  userId?: string;
  email?: string;
}

/**
 * Check if user is currently authenticated as admin
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  try {
    // First check Supabase auth
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (userData?.is_admin) {
        return true;
      }
    }
  } catch (error) {
    console.warn('Supabase admin check failed, falling back to localStorage:', error);
  }

  // Fallback to localStorage session
  if (typeof window === 'undefined') return false;

  try {
    const session = localStorage.getItem(ADMIN_KEY);
    if (!session) return false;

    const adminSession: AdminSession = JSON.parse(session);

    // Check if session is expired (24 hours)
    if (Date.now() > adminSession.expiresAt) {
      localStorage.removeItem(ADMIN_KEY);
      return false;
    }

    return adminSession.isAuthenticated;
  } catch (error) {
    console.error('Error checking admin authentication:', error);
    return false;
  }
}

/**
 * Check if user is currently authenticated as admin (synchronous version)
 */
export function isAdminAuthenticatedSync(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const session = localStorage.getItem(ADMIN_KEY);
    if (!session) return false;

    const adminSession: AdminSession = JSON.parse(session);

    // Check if session is expired (24 hours)
    if (Date.now() > adminSession.expiresAt) {
      localStorage.removeItem(ADMIN_KEY);
      return false;
    }

    return adminSession.isAuthenticated;
  } catch (error) {
    console.error('Error checking admin authentication:', error);
    return false;
  }
}

/**
 * Authenticate admin with password
 */
export async function authenticateAdmin(password: string): Promise<boolean> {
  if (password !== ADMIN_PASSWORD) {
    return false;
  }

  try {
    // Try to authenticate with Supabase if available
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Update user to be admin in Supabase
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          is_admin: true
        });

      if (!error) {
        // Also store in localStorage for offline access
        const session: AdminSession = {
          isAuthenticated: true,
          loginTime: Date.now(),
          expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
          userId: user.id,
          email: user.email || undefined
        };

        localStorage.setItem(ADMIN_KEY, JSON.stringify(session));
        return true;
      }
    }
  } catch (error) {
    console.warn('Supabase admin auth failed, using localStorage only:', error);
  }

  // Fallback to localStorage only
  const session: AdminSession = {
    isAuthenticated: true,
    loginTime: Date.now(),
    expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  };

  try {
    localStorage.setItem(ADMIN_KEY, JSON.stringify(session));
    return true;
  } catch (error) {
    console.error('Error storing admin session:', error);
    return false;
  }
}

/**
 * Logout admin
 */
export async function logoutAdmin(): Promise<void> {
  try {
    // Try to sign out from Supabase if available
    await supabase.auth.signOut();
  } catch (error) {
    console.warn('Supabase logout failed:', error);
  }

  // Always clear localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(ADMIN_KEY);
    } catch (error) {
      console.error('Error logging out admin:', error);
    }
  }
}

/**
 * Get admin session info
 */
export function getAdminSession(): AdminSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const session = localStorage.getItem(ADMIN_KEY);
    if (!session) return null;

    return JSON.parse(session);
  } catch (error) {
    console.error('Error getting admin session:', error);
    return null;
  }
}

/**
 * Sign up a new admin user with Supabase
 */
export async function signUpAdmin(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      // Set user as admin
      const { error: updateError } = await supabase
        .from('users')
        .upsert({
          id: data.user.id,
          email: data.user.email,
          is_admin: true
        });

      if (updateError) {
        console.error('Error setting admin status:', updateError);
      }
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Failed to sign up admin user' };
  }
}

/**
 * Sign in admin user with Supabase
 */
export async function signInAdmin(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      // Check if user is admin
      const { data: userData } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', data.user.id)
        .single();

      if (!userData?.is_admin) {
        await supabase.auth.signOut();
        return { success: false, error: 'User is not an admin' };
      }

      // Store session in localStorage
      const session: AdminSession = {
        isAuthenticated: true,
        loginTime: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        userId: data.user.id,
        email: data.user.email || undefined
      };

      localStorage.setItem(ADMIN_KEY, JSON.stringify(session));
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Failed to sign in admin user' };
  }
}

/**
 * Get current Supabase user
 */
export async function getCurrentUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}
