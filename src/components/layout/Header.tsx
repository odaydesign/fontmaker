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

  // DEBUG: Log session state
  useEffect(() => {
    console.log('🔍 Header Debug:', {
      status,
      hasSession: !!session,
      session: session,
      user: session?.user
    });

    // Super visible alert for debugging
    if (status === 'authenticated' && !session?.user) {
      console.error('🚨 PROBLEM: Status is authenticated but no user in session!');
    }
  }, [session, status]);

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
    <div>
      {/* DEBUG PANEL - REMOVE THIS LATER */}
      <div className="fixed bottom-4 right-4 z-[9999] bg-yellow-100 border-2 border-yellow-500 p-4 rounded-lg shadow-lg max-w-sm text-xs">
        <div className="font-bold text-yellow-800 mb-2">DEBUG INFO:</div>
        <div className="space-y-1 text-black">
          <div>Status: <span className="font-mono font-bold">{status}</span></div>
          <div>Has Session: <span className="font-mono font-bold">{session ? 'YES' : 'NO'}</span></div>
          <div>Has User: <span className="font-mono font-bold">{session?.user ? 'YES' : 'NO'}</span></div>
          {session?.user && (
            <>
              <div>Email: <span className="font-mono">{session.user.email}</span></div>
              <div>Username: <span className="font-mono">{session.user.username || 'N/A'}</span></div>
            </>
          )}
        </div>
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-3 items-center">
          {/* Left Navigation */}
          <nav className="flex items-center space-x-6 justify-start">
            <Link href="/create" className="text-foreground hover:text-muted-foreground transition-colors font-medium">
              Create Font
            </Link>
            {session?.user && (
              <Link href="/library" className="text-foreground hover:text-muted-foreground transition-colors font-medium">
                My Library
              </Link>
            )}
            <Link href="/community" className="text-foreground hover:text-muted-foreground transition-colors font-medium">
              Community
            </Link>
          </nav>

          {/* Center Logo */}
          <div className="flex justify-center">
            <Link href="/" className="inline-block">
              <EditableLogo />
            </Link>
          </div>

          {/* Right Action */}
          <div className="flex items-center justify-end gap-4">
            {status === 'loading' ? (
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse"></div>
            ) : session?.user ? (
              <>
                {/* Token Balance */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
                  <Coins className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">
                    {session.user?.tokensRemaining ?? 0}
                  </span>
                </div>

                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 hover:bg-muted px-3 py-2 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <span className="hidden md:block text-sm font-medium text-foreground">
                      {session.user?.username || session.user?.email || 'User'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-background border border-border rounded-lg shadow-lg py-2">
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm font-semibold text-foreground">
                          {session.user?.username || 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {session.user?.email || ''}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {session.user?.subscriptionTier || 'FREE'} Plan
                        </p>
                      </div>

                      <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-2 hover:bg-muted transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">Dashboard</span>
                      </Link>

                      {session.user?.username && (
                        <Link
                          href={`/profile/${session.user.username}`}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-muted transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">Profile</span>
                        </Link>
                      )}

                      <div className="md:hidden border-t border-border mt-2 pt-2">
                        <div className="flex items-center gap-3 px-4 py-2">
                          <Coins className="w-4 h-4 text-primary" />
                          <span className="text-sm text-foreground">
                            {session.user?.tokensRemaining ?? 0} tokens
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-border mt-2 pt-2">
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-destructive/10 transition-colors w-full text-left"
                        >
                          <LogOut className="w-4 h-4 text-destructive" />
                          <span className="text-sm text-destructive">Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/login"
                  className="text-foreground hover:text-muted-foreground transition-colors font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
    </div>
  );
};

export default Header;