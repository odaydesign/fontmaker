'use client';

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
    // Sign out and force redirect to home page
    await signOut({
      callbackUrl: window.location.origin,
      redirect: true
    });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-3 items-center">
          {/* Left Navigation */}
          <nav className="flex items-center space-x-6 justify-start">
            <Link href="/create" className="text-foreground hover:text-muted-foreground transition-colors font-medium">
              Create Font
            </Link>
            {session && (
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
            ) : session ? (
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
  );
};

export default Header;