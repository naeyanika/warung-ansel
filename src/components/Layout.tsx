import { FileText, Home, LogOut, Shield, User } from 'lucide-react';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, profile, signOut, isAdmin } = useAuth();
  const location = useLocation();

  return (
  <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-cyan-100">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 w-full">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex-1">
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  Warung Ansel
                </h1>
                <p className="text-sm text-gray-500">Anak Selatan</p>
              </div>
            </Link>
            
            {user && (
              <div className="flex items-center gap-3">
                {/* Navigation */}
                <div className="flex items-center gap-1">
                  <Link
                    to="/"
                    className={`p-2 rounded-lg transition-colors ${
                      location.pathname === '/'
                        ? 'bg-cyan-100 text-cyan-600'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`}
                    title="Beranda"
                  >
                    <Home className="h-4 w-4" />
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/orders"
                      className={`p-2 rounded-lg transition-colors ${
                        location.pathname === '/orders'
                          ? 'bg-cyan-100 text-cyan-600'
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      }`}
                      title="Kelola Pesanan"
                    >
                      <FileText className="h-4 w-4" />
                    </Link>
                  )}
                </div>
                
                {/* User info */}
                <div className="flex items-center gap-1 text-sm">
                  {isAdmin ? (
                    <Shield className="h-4 w-4 text-cyan-600" />
                  ) : (
                    <User className="h-4 w-4 text-gray-500" />
                  )}
                  <span className="text-gray-600">
                    {isAdmin ? 'Admin' : 'User'}
                  </span>
                </div>
                
                {/* Logout button */}
                <button
                  onClick={signOut}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
  <main className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-12 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-cyan-100 mt-12">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 text-center">
          <p className="text-sm text-gray-500">
            © 2025 Warung Ansel - Anak Selatan
          </p>
        </div>
      </footer>
    </div>
  );
}