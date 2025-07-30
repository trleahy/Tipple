'use client';

import React, { useState } from 'react';
import { signOut } from '@/lib/auth';
import { useAuth } from './AuthProvider';
import AuthModal from './AuthModal';

export default function UserProfile() {
  const authState = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setShowDropdown(false);
  };



  if (authState.loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none"
        >
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {authState.user ? (authState.user.email?.[0]?.toUpperCase() || '?') : '?'}
          </div>
          <span className="hidden sm:block text-sm">
            {authState.user ? (authState.user.email || 'User') : 'Sign in'}
          </span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
            <div className="py-1">
              {/* User Info */}
              {authState.user ? (
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="text-sm font-medium text-gray-900">
                    {authState.user.email}
                  </div>
                  <div className="text-xs text-gray-500">
                    Authenticated user
                    {authState.user.isAdmin && ' • Admin'}
                  </div>
                </div>
              ) : (
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="text-sm font-medium text-gray-900">
                    Not signed in
                  </div>
                </div>
              )}

              {/* Actions */}
              {!authState.user ? (
                <>
                  <button
                    onClick={() => {
                      setAuthMode('signin');
                      setShowAuthModal(true);
                      setShowDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode('signup');
                      setShowAuthModal(true);
                      setShowDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Sign Out
                </button>
              )}



              {authState.user?.isAdmin && (
                <div className="border-t border-gray-100">
                  <a
                    href="/admin"
                    className="block px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                    onClick={() => setShowDropdown(false)}
                  >
                    ⚙️ Admin Panel
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </>
  );
}
