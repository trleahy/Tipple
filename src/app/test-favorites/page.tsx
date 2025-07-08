'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { signUp, signIn, signOut, onAuthStateChange, AuthState } from '@/lib/auth';
import { favoritesStorage } from '@/lib/storage';

export default function TestFavoritesPage() {
  const [authState, setAuthState] = useState<AuthState>({ user: null, session: null, loading: true, error: null });
  const [favorites, setFavorites] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const addResult = useCallback((message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  }, []);

  const loadFavorites = useCallback(async () => {
    try {
      const favs = await favoritesStorage.getFavorites();
      setFavorites(favs);
      addResult(`Loaded ${favs.length} favorites: ${JSON.stringify(favs)}`);
    } catch (error) {
      addResult(`Error loading favorites: ${error}`);
    }
  }, [addResult]);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(setAuthState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [authState.user, loadFavorites]);

  const testSignUp = async () => {
    if (!email || !password) {
      addResult('Please enter email and password');
      return;
    }

    try {
      addResult(`Attempting to sign up with: ${email}`);
      const result = await signUp(email, password);
      addResult(`Sign up result: ${JSON.stringify(result)}`);
      
      if (result.success) {
        addResult('Sign up successful! Check your email for confirmation.');
      }
    } catch (error) {
      addResult(`Sign up error: ${error}`);
    }
  };

  const testSignIn = async () => {
    if (!email || !password) {
      addResult('Please enter email and password');
      return;
    }

    try {
      addResult(`Attempting to sign in with: ${email}`);
      const result = await signIn(email, password);
      addResult(`Sign in result: ${JSON.stringify(result)}`);
    } catch (error) {
      addResult(`Sign in error: ${error}`);
    }
  };

  const testAddFavorite = async () => {
    try {
      const testCocktailId = `test-cocktail-${Date.now()}`;
      addResult(`Adding favorite: ${testCocktailId}`);
      addResult(`Current user ID: ${authState.user?.id}`);
      addResult(`User is anonymous: ${authState.user?.isAnonymous}`);

      // Test direct Supabase insert first
      if (authState.user && !authState.user.isAnonymous) {
        addResult('Testing direct Supabase insert...');
        const { data: insertData, error: insertError } = await supabase
          .from('user_favorites')
          .insert({ user_id: authState.user.id, cocktail_id: testCocktailId })
          .select();

        addResult(`Direct insert result: ${JSON.stringify(insertData)}`);
        addResult(`Direct insert error: ${JSON.stringify(insertError)}`);

        if (insertError) {
          addResult(`Insert failed, trying with storage service...`);
        }
      }

      // Now try with storage service
      await favoritesStorage.addFavorite(testCocktailId);
      addResult('Storage service completed');

      await loadFavorites();

      // Check Supabase directly
      if (authState.user && !authState.user.isAnonymous) {
        const { data, error } = await supabase
          .from('user_favorites')
          .select('*')
          .eq('user_id', authState.user.id);

        addResult(`All Supabase favorites for user ${authState.user.id}: ${JSON.stringify(data)}`);
        if (error) {
          addResult(`Supabase query error: ${JSON.stringify(error)}`);
        }

        // Check all favorites in table (for debugging)
        const { data: allFavorites, error: allError } = await supabase
          .from('user_favorites')
          .select('*');

        addResult(`All favorites in table: ${JSON.stringify(allFavorites)}`);
        if (allError) {
          addResult(`All favorites query error: ${JSON.stringify(allError)}`);
        }
      }
    } catch (error) {
      addResult(`Error adding favorite: ${error}`);
    }
  };

  const testRemoveFavorite = async () => {
    if (favorites.length === 0) {
      addResult('No favorites to remove');
      return;
    }

    try {
      const cocktailId = favorites[0];
      addResult(`Removing favorite: ${cocktailId}`);
      
      await favoritesStorage.removeFavorite(cocktailId);
      addResult('Favorite removed successfully');
      
      await loadFavorites();
    } catch (error) {
      addResult(`Error removing favorite: ${error}`);
    }
  };

  const checkSupabaseSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      addResult(`Supabase session: ${JSON.stringify(session?.user?.id || 'No session')}`);
      addResult(`Supabase session error: ${JSON.stringify(error)}`);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      addResult(`Supabase user: ${JSON.stringify(user?.id || 'No user')}`);
      addResult(`Supabase user error: ${JSON.stringify(userError)}`);

      // Test auth.uid() directly
      const { data: authUidData, error: authUidError } = await supabase
        .rpc('auth_uid_test');
      addResult(`auth.uid() test: ${JSON.stringify(authUidData)}`);
      addResult(`auth.uid() error: ${JSON.stringify(authUidError)}`);

      // Test RLS policies directly
      const { data: favoritesTest, error: favoritesError } = await supabase
        .from('user_favorites')
        .select('*');
      addResult(`Favorites query result: ${JSON.stringify(favoritesTest)}`);
      addResult(`Favorites query error: ${JSON.stringify(favoritesError)}`);

    } catch (error) {
      addResult(`Error checking Supabase session: ${error}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Favorites Testing</h1>
      
      {/* Auth Status */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Authentication Status</h2>
        <div className="text-sm">
          <p>User ID: {authState.user?.id || 'None'}</p>
          <p>Email: {authState.user?.email || 'None'}</p>
          <p>Anonymous: {authState.user?.isAnonymous ? 'Yes' : 'No'}</p>
          <p>Loading: {authState.loading ? 'Yes' : 'No'}</p>
          <p>Error: {authState.error || 'None'}</p>
        </div>
      </div>

      {/* Auth Controls */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-4">Authentication</h2>
        <div className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border rounded px-3 py-2 mr-2"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border rounded px-3 py-2 mr-2"
            />
          </div>
          <div className="space-x-2">
            <button onClick={testSignUp} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              Sign Up
            </button>
            <button onClick={testSignIn} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Sign In
            </button>
            <button onClick={signOut} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
              Sign Out
            </button>
            <button onClick={checkSupabaseSession} className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700">
              Check Session
            </button>
          </div>
        </div>
      </div>

      {/* Favorites Controls */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-4">Favorites Testing</h2>
        <div className="space-x-2 mb-4">
          <button onClick={testAddFavorite} className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
            Add Test Favorite
          </button>
          <button onClick={testRemoveFavorite} className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700">
            Remove First Favorite
          </button>
          <button onClick={loadFavorites} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
            Reload Favorites
          </button>
        </div>
        <div>
          <strong>Current Favorites ({favorites.length}):</strong>
          <ul className="list-disc list-inside mt-2">
            {favorites.map((fav, index) => (
              <li key={index} className="text-sm">{fav}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Test Results */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Test Results</h2>
          <button onClick={clearResults} className="bg-gray-600 text-white px-3 py-1 rounded text-sm">
            Clear
          </button>
        </div>
        <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
          {testResults.length === 0 ? (
            <div className="text-gray-500">No test results yet...</div>
          ) : (
            testResults.map((result, index) => (
              <div key={index}>{result}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
