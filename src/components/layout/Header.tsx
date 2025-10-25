'use client';

import React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import EditableLogo from './EditableLogo';
import { User, LogOut, LayoutDashboard, Coins, ChevronDown } from 'lucide-react';

const Header = () => {
  const { data: session, status } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setDropdownOpen(false);

    try {
      // Sign out from NextAuth
      await signOut({
        redirect: false // Don't auto-redirect, we'll do it manually
      });

      // Clear any local storage
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }

      // Force redirect to home page and reload
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
      // Force redirect anyway
      window.location.href = '/';
    }
  };

  return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="w-full px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left Navigation */}
          <nav className="flex items-center gap-2">
            <Link href="/create" className="text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground px-4 py-2 rounded-md transition-all">
              Create Font
            </Link>
            {session?.user && (
              <Link href="/library" className="text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground px-4 py-2 rounded-md transition-all">
                My Library
              </Link>
            )}
            <Link href="/community" className="text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground px-4 py-2 rounded-md transition-all">
              Community
            </Link>
          </nav>

          {/* Center Logo */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <Link href="/" className="inline-block">
              <EditableLogo />
            </Link>
          </div>

          {/* Right Action */}
          <div className="flex items-center gap-3">
            {status === 'loading' ? (
              <div className="w-10 h-10 rounded-md bg-muted animate-pulse"></div>
            ) : session?.user ? (
              <>
                {/* Token Balance */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-md border border-border">
                  <Coins className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {session.user?.tokensRemaining ?? 0}
                  </span>
                </div>

                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 hover:bg-accent hover:text-accent-foreground px-3 py-2 rounded-md transition-all"
                  >
                    <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                      <User className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="hidden md:block text-sm font-medium">
                      {session.user?.username || session.user?.email || 'User'}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-popover border border-border rounded-lg shadow-lg py-1">
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm font-medium">
                          {session.user?.username || 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {session.user?.email || ''}
                        </p>
                      </div>

                      <div className="py-1">
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Dashboard
                        </Link>

                        {session.user?.username && (
                          <Link
                            href={`/profile/${session.user.username}`}
                            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <User className="w-4 h-4" />
                            Profile
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-border">
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-accent hover:text-accent-foreground transition-colors w-full text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="text-sm font-medium hover:bg-accent hover:text-accent-foreground px-4 py-2 rounded-md transition-all"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-all"
                >
                  Sign Up
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