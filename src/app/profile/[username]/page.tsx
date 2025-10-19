'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import {
  Heart,
  Download,
  Calendar,
  Palette,
  Mail,
  Settings,
  Lock,
  Globe,
} from 'lucide-react';

interface UserProfile {
  username: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: string;
  subscriptionTier: string;
  stats: {
    totalFonts: number;
    publicFonts: number;
    totalDownloads: number;
    totalLikes: number;
  };
  fonts: {
    id: string;
    name: string;
    fontFamily: string;
    isPublic: boolean;
    downloads: number;
    createdAt: string;
    _count: {
      likes: number;
    };
    isLiked?: boolean;
  }[];
}

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPrivate, setShowPrivate] = useState(false);

  const isOwnProfile = session?.user?.username === username;

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/profile/${username}`);

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (fontId: string) => {
    if (!session) {
      window.location.href = '/auth/login';
      return;
    }

    try {
      const response = await fetch(`/api/fonts/${fontId}/like`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setProfile((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            fonts: prev.fonts.map((font) =>
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
            ),
          };
        });
      }
    } catch (error) {
      console.error('Failed to like font:', error);
    }
  };

  const handleDownload = async (fontId: string, fontFamily: string) => {
    try {
      await fetch(`/api/fonts/${fontId}/download`, {
        method: 'POST',
      });

      const downloadUrl = `/api/fonts/${fontId}/file`;
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${fontFamily}.ttf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          fonts: prev.fonts.map((font) =>
            font.id === fontId ? { ...font, downloads: font.downloads + 1 } : font
          ),
        };
      });
    } catch (error) {
      console.error('Failed to download font:', error);
    }
  };

  const toggleFontVisibility = async (fontId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/fonts/${fontId}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !currentStatus }),
      });

      if (response.ok) {
        setProfile((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            fonts: prev.fonts.map((font) =>
              font.id === fontId ? { ...font, isPublic: !currentStatus } : font
            ),
            stats: {
              ...prev.stats,
              publicFonts: currentStatus ? prev.stats.publicFonts - 1 : prev.stats.publicFonts + 1,
            },
          };
        });
      }
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">User Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The user @{username} doesn't exist or has been removed.
          </p>
          <Link href="/community">
            <Button>Browse Community</Button>
          </Link>
        </div>
      </div>
    );
  }

  const displayedFonts = isOwnProfile
    ? showPrivate
      ? profile.fonts.filter((f) => !f.isPublic)
      : profile.fonts
    : profile.fonts.filter((f) => f.isPublic);

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-4xl font-bold text-primary">
                    {profile.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground mb-1">
                      @{profile.username}
                    </h1>
                    {profile.bio && (
                      <p className="text-muted-foreground mb-2">{profile.bio}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Joined {new Date(profile.createdAt).toLocaleDateString()}
                      </span>
                      {profile.subscriptionTier !== 'FREE' && (
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                          {profile.subscriptionTier}
                        </span>
                      )}
                    </div>
                  </div>

                  {isOwnProfile && (
                    <Link href="/dashboard">
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Palette className="w-5 h-5 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold text-foreground">
                      {profile.stats.totalFonts}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Fonts</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Globe className="w-5 h-5 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold text-foreground">
                      {profile.stats.publicFonts}
                    </p>
                    <p className="text-xs text-muted-foreground">Public</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Download className="w-5 h-5 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold text-foreground">
                      {profile.stats.totalDownloads}
                    </p>
                    <p className="text-xs text-muted-foreground">Downloads</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Heart className="w-5 h-5 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold text-foreground">
                      {profile.stats.totalLikes}
                    </p>
                    <p className="text-xs text-muted-foreground">Likes</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Font Filter (for own profile) */}
        {isOwnProfile && (
          <div className="mb-6 flex gap-2">
            <Button
              variant={!showPrivate ? 'default' : 'outline'}
              onClick={() => setShowPrivate(false)}
            >
              All Fonts ({profile.stats.totalFonts})
            </Button>
            <Button
              variant={showPrivate ? 'default' : 'outline'}
              onClick={() => setShowPrivate(true)}
            >
              <Lock className="w-4 h-4 mr-2" />
              Private ({profile.stats.totalFonts - profile.stats.publicFonts})
            </Button>
          </div>
        )}

        {/* Fonts Grid */}
        {displayedFonts.length === 0 ? (
          <div className="text-center py-20">
            <Palette className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground text-lg mb-4">
              {isOwnProfile
                ? showPrivate
                  ? 'No private fonts yet'
                  : 'No fonts created yet'
                : 'No public fonts yet'}
            </p>
            {isOwnProfile && (
              <Link href="/create">
                <Button>Create Your First Font</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedFonts.map((font) => (
              <Card key={font.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  {/* Font Preview */}
                  <div className="h-32 flex items-center justify-center bg-muted rounded-lg mb-4 relative">
                    <p className="text-4xl" style={{ fontFamily: font.fontFamily }}>
                      Aa
                    </p>
                    {isOwnProfile && (
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={() => toggleFontVisibility(font.id, font.isPublic)}
                          className="p-1.5 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors"
                          title={font.isPublic ? 'Make Private' : 'Make Public'}
                        >
                          {font.isPublic ? (
                            <Globe className="w-4 h-4 text-primary" />
                          ) : (
                            <Lock className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Font Info */}
                  <h3 className="text-lg font-bold text-foreground mb-2 truncate">
                    {font.name}
                  </h3>

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
                  {font.isPublic && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLike(font.id)}
                        className="flex-1"
                        disabled={isOwnProfile}
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
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
