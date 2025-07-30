'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { AuthState, onAuthStateChange, initializeAuth } from '@/lib/auth';

const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  loading: true,
  error: null
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const initializeAndSubscribe = async () => {
      try {
        // Subscribe to auth state changes first
        const unsubscribe = onAuthStateChange((state) => {
          if (isMounted) {
            setAuthState(state);
            // Clear timeout when we get a state update
            if (timeoutId) {
              clearTimeout(timeoutId);
            }
          }
        });

        // Set a fallback timeout to ensure loading state doesn't persist indefinitely
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.warn('Auth initialization timeout, setting to not loading');
            setAuthState(prev => ({
              ...prev,
              loading: false,
              error: prev.error || 'Authentication initialization timeout'
            }));
          }
        }, 15000); // 15 second timeout

        // Initialize the authentication system
        await initializeAuth();

        // Return cleanup function
        return unsubscribe;
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        if (isMounted) {
          setAuthState({
            user: null,
            session: null,
            loading: false,
            error: 'Failed to initialize authentication'
          });
        }
        return () => {};
      }
    };

    let unsubscribe: (() => void) | undefined;

    initializeAndSubscribe().then((cleanup) => {
      unsubscribe = cleanup;
    });

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}
