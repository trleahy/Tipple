'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { checkAdminAccess, makeCurrentUserAdmin } from '@/lib/auth';
import { useAuth } from '@/components/AuthProvider';

export default function AdminAccessPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showMakeAdmin, setShowMakeAdmin] = useState(false);
  const router = useRouter();
  const authState = useAuth();

  useEffect(() => {
    checkAccess();
  }, [authState.loading, authState.user]);

  const checkAccess = async () => {
    // Wait for auth to finish loading
    if (authState.loading) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await checkAdminAccess();

      if (result.hasAccess) {
        // User is admin, redirect to admin panel
        router.push('/admin');
      } else {
        if (authState.user) {
          setError(`You are signed in as ${authState.user.email}, but you don't have admin privileges.`);
          setShowMakeAdmin(true);
        } else {
          setError('You need to sign in first to access the admin panel.');
        }
      }
    } catch {
      setError('An error occurred while checking admin access.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMakeAdmin = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await makeCurrentUserAdmin();

      if (result.success) {
        router.push('/admin');
      } else {
        setError(result.error || 'Failed to grant admin privileges.');
      }
    } catch {
      setError('An error occurred while granting admin privileges.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <div className="text-xl font-semibold text-gray-900">Checking admin access...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="text-center">
            <span className="text-6xl">🔐</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Access Required
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            You need admin privileges to access the management interface
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {!authState.user ? (
            <>
              <p className="text-center text-sm text-gray-600">
                Please sign in to your account first.
              </p>
              <div className="text-center">
                <Link
                  href="/"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Go to Main Site & Sign In
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-center text-sm text-gray-600">
                Signed in as: <strong>{authState.user.email}</strong>
              </p>

              {showMakeAdmin && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="text-sm text-yellow-800 mb-3">
                    <strong>Development Mode:</strong> You can grant yourself admin privileges for testing.
                  </div>
                  <button
                    onClick={handleMakeAdmin}
                    disabled={isLoading}
                    className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Granting Admin Access...' : 'Make Me Admin'}
                  </button>
                </div>
              )}

              <div className="text-center space-y-2">
                <button
                  onClick={checkAccess}
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isLoading ? 'Checking...' : 'Check Access Again'}
                </button>
              </div>
            </>
          )}

          <div className="text-center">
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              ← Back to Tipple
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
