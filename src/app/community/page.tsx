'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Heart, Download, User, Search, Filter } from 'lucide-react';

interface PublicFont {
  id: string;
  name: string;
  fontFamily: string;
  isPublic: boolean;
  downloads: number;
  createdAt: string;
  user: {
    username: string;
  };
  _count: {
    likes: number;
  };
  isLiked?: boolean;
}

export default function CommunityPage() {
  const { data: session } = useSession();
  const [fonts, setFonts] = useState<PublicFont[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'downloads'>('recent');

  useEffect(() => {
    fetchFonts();
  }, [page, sortBy]);

  const fetchFonts = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/fonts/public?page=${page}&limit=12&sortBy=${sortBy}&search=${searchQuery}`
      );

      if (response.ok) {
        const data = await response.json();
        if (page === 1) {
          setFonts(data.fonts);
        } else {
          setFonts((prev) => [...prev, ...data.fonts]);
        }
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error('Failed to fetch fonts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (fontId: string) => {
    if (!session) {
      // Redirect to login
      window.location.href = '/auth/login';
      return;
    }

    try {
      const response = await fetch(`/api/fonts/${fontId}/like`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        // Update the local state
        setFonts((prevFonts) =>
          prevFonts.map((font) =>
            font.id === fontId
              ? {
                  ...font,
                  isLiked: data.liked,
                  _count: {
                    ...font._count,
                    likes: data.liked ? font._count.likes + 1 : font._count.likes - 1,
                  },
                }
              : font
          )
        );
      }
    } catch (error) {
      console.error('Failed to like font:', error);
    }
  };

  const handleDownload = async (fontId: string, fontFamily: string) => {
    try {
      // Increment download count
      await fetch(`/api/fonts/${fontId}/download`, {
        method: 'POST',
      });

      // Trigger actual download
      const downloadUrl = `/api/fonts/${fontId}/file`;
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${fontFamily}.ttf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Update local state
      setFonts((prevFonts) =>
        prevFonts.map((font) =>
          font.id === fontId
            ? { ...font, downloads: font.downloads + 1 }
            : font
        )
      );
    } catch (error) {
      console.error('Failed to download font:', error);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchFonts();
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Community Fonts</h1>
          <p className="text-muted-foreground">
            Discover and download fonts created by the community
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search fonts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button onClick={handleSearch}>Search</Button>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as 'recent' | 'popular' | 'downloads');
                setPage(1);
              }}
              className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="recent">Most Recent</option>
              <option value="popular">Most Liked</option>
              <option value="downloads">Most Downloaded</option>
            </select>
          </div>
        </div>

        {/* Fonts Grid */}
        {loading && page === 1 ? (
          <div className="flex items-center justify-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : fonts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg mb-4">No fonts found</p>
            <Link href="/create">
              <Button>Create the first font</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {fonts.map((font) => (
                <Card key={font.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    {/* Font Preview */}
                    <div className="h-32 flex items-center justify-center bg-muted rounded-lg mb-4">
                      <p
                        className="text-4xl"
                        style={{ fontFamily: font.fontFamily }}
                      >
                        Aa
                      </p>
                    </div>

                    {/* Font Info */}
                    <h3 className="text-lg font-bold text-foreground mb-2 truncate">
                      {font.name}
                    </h3>

                    {/* Creator */}
                    <Link
                      href={`/profile/${font.user.username}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground mb-4 hover:text-primary transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span>{font.user.username}</span>
                    </Link>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {font._count.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="w-4 h-4" />
                          {font.downloads}
                        </span>
                      </div>
                      <span className="text-xs">
                        {new Date(font.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLike(font.id)}
                        className="flex-1"
                      >
                        <Heart
                          className={`w-4 h-4 mr-2 ${
                            font.isLiked ? 'fill-primary text-primary' : ''
                          }`}
                        />
                        {font.isLiked ? 'Liked' : 'Like'}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDownload(font.id, font.fontFamily)}
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center">
                <Button
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={loading}
                  size="lg"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 