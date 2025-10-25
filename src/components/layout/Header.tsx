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
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border">
      <div className="w-full px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left Navigation */}
          <nav className="flex items-center gap-2">
            <Link href="/create" className="text-sm font-medium text-foreground hover:bg-muted px-4 py-2 rounded-xl transition-all">
              Create Font
            </Link>
            {session?.user && (
              <Link href="/library" className="text-sm font-medium text-foreground hover:bg-muted px-4 py-2 rounded-xl transition-all">
                My Library
              </Link>
            )}
            <Link href="/community" className="text-sm font-medium text-foreground hover:bg-muted px-4 py-2 rounded-xl transition-all">
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
              <div className="w-10 h-10 rounded-xl bg-muted animate-pulse"></div>
            ) : session?.user ? (
              <>
                {/* Token Balance */}
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-muted rounded-xl">
                  <Coins className="w-4 h-4 text-foreground" />
                  <span className="text-sm font-semibold text-foreground">
                    {session.user?.tokensRemaining ?? 0}
                  </span>
                </div>

                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 hover:bg-muted px-4 py-2 rounded-xl transition-all active-press"
                  >
                    <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
                      <User className="w-4 h-4 text-background" />
                    </div>
                    <span className="hidden md:block text-sm font-medium text-foreground">
                      {session.user?.username || session.user?.email || 'User'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-3 w-64 bg-card border border-border rounded-2xl shadow-notion-lg py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-5 py-4 border-b border-border">
                        <p className="text-sm font-semibold text-foreground">
                          {session.user?.username || 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {session.user?.email || ''}
                        </p>
                        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
                          <span className="text-xs font-medium text-foreground">
                            {session.user?.subscriptionTier || 'FREE'}
                          </span>
                        </div>
                      </div>

                      <div className="py-1">
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">Dashboard</span>
                        </Link>

                        {session.user?.username && (
                          <Link
                            href={`/profile/${session.user.username}`}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">Profile</span>
                          </Link>
                        )}

                        <div className="md:hidden">
                          <div className="flex items-center gap-3 px-4 py-2.5 bg-accent/5">
                            <Coins className="w-4 h-4 text-accent" />
                            <span className="text-sm font-medium text-foreground">
                              {session.user?.tokensRemaining ?? 0} tokens
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-border mt-1 pt-1">
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-destructive/10 transition-colors w-full text-left"
                        >
                          <LogOut className="w-4 h-4 text-destructive" />
                          <span className="text-sm font-medium text-destructive">Sign Out</span>
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
                  className="text-sm font-medium text-foreground hover:bg-muted px-4 py-2 rounded-xl transition-all"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="text-sm font-medium bg-foreground text-background px-6 py-2.5 rounded-xl hover:bg-foreground/90 active-press shadow-notion-sm"
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