'use client';

import Link from 'next/link';
import { useState } from 'react';

const Header = () => {
  const [showAuthOptions, setShowAuthOptions] = useState(false);
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-indigo-600">
          HappyFont
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/create" className="text-gray-700 hover:text-indigo-600 transition-colors">
            Create Font
          </Link>
          <Link href="/community" className="text-gray-700 hover:text-indigo-600 transition-colors">
            Community
          </Link>
        </nav>
        
        <div className="flex items-center space-x-4 relative">
          <div className="relative">
            <button
              className="text-gray-700 hover:text-indigo-600 transition-colors"
              onClick={() => setShowAuthOptions(!showAuthOptions)}
            >
              Login
            </button>
            
            {showAuthOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border">
                <Link 
                  href="/auth/login" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Standard Login
                </Link>
                <Link 
                  href="/auth/login-supabase" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Supabase Login
                </Link>
              </div>
            )}
          </div>
          
          <div className="relative">
            <button
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              onClick={() => setShowAuthOptions(!showAuthOptions)}
            >
              Sign Up
            </button>
            
            {showAuthOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border">
                <Link 
                  href="/auth/register" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Standard Registration
                </Link>
                <Link 
                  href="/auth/register-supabase" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Supabase Registration
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;