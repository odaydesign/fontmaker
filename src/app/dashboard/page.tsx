'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CreditCard,
  Download,
  Heart,
  Palette,
  TrendingUp,
  Crown,
  Coins
} from 'lucide-react';

interface DashboardData {
  user: {
    email: string;
    username: string;
    subscriptionTier: string;
    tokensRemaining: number;
  };
  stats: {
    fontsCreated: number;
    totalDownloads: number;
    totalLikes: number;
  };
  tokenHistory: {
    id: string;
    amount: number;
    type: string;
    description: string;
    createdAt: string;
  }[];
  subscription: {
    planType: string;
    status: string;
    currentPeriodEnd: string | null;
  } | null;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status, router]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan: 'PRO' | 'BUSINESS') => {
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'subscription',
          plan,
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/dashboard`,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Failed to create portal session:', error);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Failed to load dashboard data</p>
          <Button onClick={fetchDashboardData} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const { user, stats, tokenHistory, subscription } = dashboardData;
  const tokenPercentage = Math.min((user.tokensRemaining / 500) * 100, 100);

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome back, {user.username}
          </h1>
          <p className="text-muted-foreground">
            Manage your account, view your usage, and upgrade your plan
          </p>
        </div>

        {/* Account Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Subscription Tier Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Current Plan</p>
                  <h3 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    {user.subscriptionTier}
                    {user.subscriptionTier !== 'FREE' && (
                      <Crown className="w-5 h-5 text-primary" />
                    )}
                  </h3>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
              </div>
              {subscription && subscription.status === 'ACTIVE' && subscription.currentPeriodEnd && (
                <p className="text-xs text-muted-foreground">
                  Renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Token Balance Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Token Balance</p>
                  <h3 className="text-2xl font-bold text-foreground">
                    {user.tokensRemaining}
                  </h3>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Coins className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="mt-4">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${tokenPercentage}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fonts Created Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Fonts Created</p>
                  <h3 className="text-2xl font-bold text-foreground">
                    {stats.fontsCreated}
                  </h3>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Palette className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Download className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Downloads</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalDownloads}</p>
                  </div>
                </div>
                <TrendingUp className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Heart className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Likes Received</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalLikes}</p>
                  </div>
                </div>
                <TrendingUp className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Token Usage History */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Token Usage History</h2>
            {tokenHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Description</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Type</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tokenHistory.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-border">
                        <td className="py-3 px-4 text-sm text-foreground">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground">
                          {transaction.description}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              transaction.type === 'PURCHASE' || transaction.type === 'GRANT'
                                ? 'bg-primary/10 text-primary'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {transaction.type}
                          </span>
                        </td>
                        <td
                          className={`py-3 px-4 text-sm text-right font-semibold ${
                            transaction.amount > 0 ? 'text-primary' : 'text-foreground'
                          }`}
                        >
                          {transaction.amount > 0 ? '+' : ''}
                          {transaction.amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No token transactions yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Billing Section */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Billing & Subscription</h2>

            {user.subscriptionTier === 'FREE' ? (
              <div>
                <p className="text-muted-foreground mb-6">
                  Upgrade to a paid plan to get more tokens and unlock additional features
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* PRO Plan */}
                  <div className="border border-border rounded-lg p-6">
                    <h3 className="text-lg font-bold text-foreground mb-2">PRO Plan</h3>
                    <p className="text-3xl font-bold text-foreground mb-1">
                      $19<span className="text-lg text-muted-foreground">/month</span>
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">500 tokens/month</p>
                    <ul className="space-y-2 mb-6">
                      <li className="text-sm text-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>500 tokens monthly</span>
                      </li>
                      <li className="text-sm text-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>Priority support</span>
                      </li>
                      <li className="text-sm text-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>Commercial license</span>
                      </li>
                    </ul>
                    <Button onClick={() => handleUpgrade('PRO')} className="w-full">
                      Upgrade to PRO
                    </Button>
                  </div>

                  {/* BUSINESS Plan */}
                  <div className="border border-primary rounded-lg p-6 relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                      Best Value
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">BUSINESS Plan</h3>
                    <p className="text-3xl font-bold text-foreground mb-1">
                      $49<span className="text-lg text-muted-foreground">/month</span>
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">2000 tokens/month</p>
                    <ul className="space-y-2 mb-6">
                      <li className="text-sm text-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>2000 tokens monthly</span>
                      </li>
                      <li className="text-sm text-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>Priority support</span>
                      </li>
                      <li className="text-sm text-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>Commercial license</span>
                      </li>
                      <li className="text-sm text-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>API access</span>
                      </li>
                    </ul>
                    <Button onClick={() => handleUpgrade('BUSINESS')} className="w-full">
                      Upgrade to BUSINESS
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-foreground font-semibold mb-1">
                      Current Plan: {user.subscriptionTier}
                    </p>
                    {subscription && subscription.status === 'ACTIVE' && (
                      <p className="text-sm text-muted-foreground">
                        Status: Active
                        {subscription.currentPeriodEnd &&
                          ` • Renews ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}
                      </p>
                    )}
                  </div>
                  <Button onClick={handleManageSubscription} variant="outline">
                    Manage Subscription
                  </Button>
                </div>

                {user.subscriptionTier === 'PRO' && (
                  <div className="border border-border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      Want more tokens? Upgrade to BUSINESS for 2000 tokens/month
                    </p>
                    <Button onClick={() => handleUpgrade('BUSINESS')} size="sm">
                      Upgrade to BUSINESS
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 