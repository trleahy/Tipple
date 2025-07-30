'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { signOut } from '@/lib/auth';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const authState = useAuth();

  useEffect(() => {
    // Check if user is admin and redirect if not
    if (!authState.loading) {
      if (!authState.user || !authState.user.isAdmin) {
        if (pathname !== '/admin/login') {
          router.push('/admin/login');
        }
      }
    }
  }, [authState, pathname, router]);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/admin/login');
    } catch (error) {
      console.error('Error logging out:', error);
      router.push('/admin/login');
    }
  };

  const adminNavItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/cocktails', label: 'Cocktails', icon: '🍸' },
    { href: '/admin/ingredients', label: 'Ingredients', icon: '🧪' },
    { href: '/admin/categories', label: 'Categories', icon: '📂' },
    { href: '/admin/glass-types', label: 'Glass Types', icon: '🥃' },
    { href: '/admin/import-export', label: 'Import/Export', icon: '📁' },
  ];

  if (authState.loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <div className="text-xl font-semibold text-gray-900">Loading...</div>
        </div>
      </div>
    );
  }

  if (!authState.user || !authState.user.isAdmin) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-100 lg:flex">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed top-16 bottom-0 left-0 z-30 w-64 bg-white shadow-lg transform ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:top-0 lg:flex lg:flex-col lg:w-64 lg:flex-shrink-0`}>

        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-6 bg-blue-600 text-white flex-shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">⚙️</span>
            <span className="text-lg font-semibold">Admin Panel</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-white hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6">
          <div className="px-4 space-y-1">
            {adminNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* User info and logout - Sticky footer */}
        <div className="mt-auto flex-shrink-0 border-t border-gray-200 bg-gray-50 sticky bottom-0">
          {authState.user && (
            <div className="px-4 py-3">
              <div className="text-xs text-gray-500 mb-2">
                Logged in as:
              </div>
              <div className="text-sm font-medium text-gray-900 truncate">
                {authState.user.email}
              </div>
            </div>
          )}
          <div className="px-4 pb-4 flex space-x-2">
            <Link
              href="/"
              className="flex-1 px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-center"
            >
              View Site
            </Link>
            <button
              onClick={handleLogout}
              className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 lg:flex lg:flex-col min-h-screen">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-6 flex-shrink-0">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <h1 className="text-xl font-semibold text-gray-900 lg:block hidden">
            Tipple Admin
          </h1>

          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium px-3 py-1 rounded-md hover:bg-blue-50 transition-colors"
            >
              View Site →
            </Link>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6 bg-gray-50 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
