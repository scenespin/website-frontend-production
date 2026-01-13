'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Copy, 
  ExternalLink, 
  DollarSign, 
  Users, 
  MousePointer, 
  TrendingUp,
  Wallet,
  AlertCircle,
  CheckCircle,
  Clock,
  Settings,
  Share2,
  Download
} from 'lucide-react';

// Charts
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];

export default function AffiliatePortal() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [affiliate, setAffiliate] = useState(null);
  const [stats, setStats] = useState(null);
  const [commissions, setCommissions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const referralLink = affiliate ? `${typeof window !== 'undefined' ? window.location.origin : 'https://www.wryda.ai'}?ref=${affiliate.referral_code}` : '';

  useEffect(() => {
    if (user) {
      loadAffiliateData();
    }
  }, [user]);

  const loadAffiliateData = async () => {
    try {
      setLoading(true);

      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        console.error('[Affiliate Portal] No auth token');
        setLoading(false);
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
      };

      // Load affiliate profile
      const profileRes = await fetch('/api/affiliates/me', { headers });
      
      if (!profileRes.ok) {
        if (profileRes.status === 404) {
          // Not an affiliate - this is OK
          setAffiliate(null);
          setLoading(false);
          return;
        }
        throw new Error('Failed to load affiliate profile');
      }
      
      const profileData = await profileRes.json();
      setAffiliate(profileData);

      // Only load stats/commissions/payouts if affiliate is active
      if (profileData.status === 'active') {
        // Load stats
        try {
          const statsRes = await fetch('/api/affiliates/stats', { headers });
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            setStats(statsData);
          }
        } catch (e) {
          console.error('Error loading stats:', e);
        }

        // Load commissions
        try {
          const commissionsRes = await fetch('/api/affiliates/commissions', { headers });
          if (commissionsRes.ok) {
            const commissionsData = await commissionsRes.json();
            setCommissions(commissionsData.commissions || []);
          }
        } catch (e) {
          console.error('Error loading commissions:', e);
        }

        // Load payouts
        try {
          const payoutsRes = await fetch('/api/affiliates/payouts', { headers });
          if (payoutsRes.ok) {
            const payoutsData = await payoutsRes.json();
            setPayouts(payoutsData.payouts || []);
          }
        } catch (e) {
          console.error('Error loading payouts:', e);
        }
      }
    } catch (error) {
      console.error('Error loading affiliate data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const requestPayout = async () => {
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        alert('Authentication required');
        return;
      }

      const res = await fetch('/api/affiliates/request-payout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        alert('Payout requested successfully!');
        loadAffiliateData();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || 'Failed to request payout'}`);
      }
    } catch (error) {
      console.error('Error requesting payout:', error);
      alert('Failed to request payout');
    }
  };

  const connectStripe = async () => {
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        alert('Authentication required');
        return;
      }

      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.wryda.ai';
      const res = await fetch('/api/affiliates/stripe-connect', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          return_url: `${origin}/affiliates/connect-success`,
          refresh_url: `${origin}/affiliates/connect-refresh`,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Failed to create Stripe Connect link');
      }
    } catch (error) {
      console.error('Error connecting Stripe:', error);
      alert('Failed to connect Stripe account');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading affiliate dashboard...</p>
        </div>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Become an Affiliate</CardTitle>
            <CardDescription>
              Join our affiliate program and earn 30% commission on every referral
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/affiliates/apply'}>
              Apply Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (affiliate.status === 'pending') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Application Under Review
            </CardTitle>
            <CardDescription>
              Your affiliate application is being reviewed. We'll notify you within 24-48 hours.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (affiliate.status === 'suspended') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Account Suspended
            </CardTitle>
            <CardDescription>
              Your affiliate account has been suspended. Please contact support for more information.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const trafficSourceData = stats && stats.traffic_sources ? Object.entries(stats.traffic_sources).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  })) : [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Affiliate Dashboard</h1>
            <p className="text-gray-600">
              Code: <span className="font-mono font-semibold text-purple-600">{affiliate.referral_code}</span>
              <Badge className="ml-2" variant={affiliate.status === 'active' ? 'default' : 'secondary'}>
                {affiliate.status}
              </Badge>
              {affiliate.tier && (
                <Badge 
                  className="ml-2" 
                  variant={
                    affiliate.tier === 'founding_partner' ? 'default' :
                    affiliate.tier === 'early_adopter' ? 'secondary' :
                    'outline'
                  }
                  style={{
                    backgroundColor: affiliate.tier === 'founding_partner' ? '#f59e0b' :
                                   affiliate.tier === 'early_adopter' ? '#3b82f6' :
                                   '#6366f1',
                    color: 'white'
                  }}
                >
                  {affiliate.tier === 'founding_partner' && '🌟 '}
                  {affiliate.tier === 'early_adopter' && '⚡ '}
                  {affiliate.tier === 'founding_partner' ? 'Founding Partner (30%)' :
                   affiliate.tier === 'early_adopter' ? 'Early Adopter (25%)' :
                   'Standard (20%)'}
                </Badge>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {stats && stats.overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Earnings</p>
                  <p className="text-2xl font-bold">${(stats.overview.total_commissions_earned || 0).toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold">${(stats.overview.pending_commissions || 0).toFixed(2)}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Conversions</p>
                  <p className="text-2xl font-bold">{stats.overview.total_conversions || 0}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold">{stats.overview.conversion_rate || '0'}%</p>
                </div>
                <MousePointer className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="link">Referral Link</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {stats && (
            <>
              {/* Performance Chart */}
              {stats.chart_data && stats.chart_data.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={stats.chart_data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="clicks" stroke="#3B82F6" name="Clicks" />
                        <Line type="monotone" dataKey="signups" stroke="#10B981" name="Signups" />
                        <Line type="monotone" dataKey="conversions" stroke="#8B5CF6" name="Conversions" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Traffic Sources */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {trafficSourceData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Traffic Sources</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={trafficSourceData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {trafficSourceData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {stats.current_period && (
                  <Card>
                    <CardHeader>
                      <CardTitle>This Month</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Clicks</span>
                        <span className="font-semibold">{stats.current_period.clicks || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Signups</span>
                        <span className="font-semibold">{stats.current_period.signups || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Conversions</span>
                        <span className="font-semibold">{stats.current_period.conversions || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Revenue</span>
                        <span className="font-semibold">${(stats.current_period.revenue || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-600 font-semibold">Commissions</span>
                        <span className="font-bold text-green-600">${(stats.current_period.commissions || 0).toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </TabsContent>

        {/* Referral Link Tab */}
        <TabsContent value="link" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Referral Link</CardTitle>
              <CardDescription>
                Share this link to earn {((affiliate.commission_rate || 0.3) * 100).toFixed(0)}% commission on every conversion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  value={referralLink} 
                  readOnly 
                  className="font-mono text-sm"
                />
                <Button onClick={copyReferralLink} variant="outline">
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    const text = `Check out Wryda.ai - ${referralLink}`;
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Twitter
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    const text = `Check out Wryda.ai - ${referralLink}`;
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, '_blank');
                  }}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Facebook
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    const text = `Check out Wryda.ai - ${referralLink}`;
                    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`, '_blank');
                  }}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  LinkedIn
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    window.location.href = `mailto:?subject=Check out Wryda.ai&body=${encodeURIComponent(`I think you'd love Wryda.ai! ${referralLink}`)}`;
                  }}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Email
                </Button>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <p className="text-sm font-semibold mb-2">Tips for Success:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Share on social media with personal recommendations</li>
                  <li>• Create content (blog posts, videos) about Wryda</li>
                  <li>• Include your link in email signatures</li>
                  <li>• Highlight specific features that helped you</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commissions Tab */}
        <TabsContent value="commissions">
          <Card>
            <CardHeader>
              <CardTitle>Commission History</CardTitle>
              <CardDescription>
                All commissions earned from your referrals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {commissions.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No commissions yet</p>
                ) : (
                  commissions.map((commission) => (
                    <div key={commission.commission_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold">${(commission.amount_usd || 0).toFixed(2)}</p>
                        <p className="text-sm text-gray-600">
                          {commission.type || 'Commission'} • {new Date(commission.earned_at || Date.now()).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={
                        commission.status === 'paid' ? 'default' :
                        commission.status === 'approved' ? 'secondary' :
                        'outline'
                      }>
                        {commission.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payouts Tab */}
        <TabsContent value="payouts" className="space-y-4">
          {affiliate.payout_method === 'none' || !affiliate.payout_method ? (
            <Card>
              <CardHeader>
                <CardTitle>Setup Payouts</CardTitle>
                <CardDescription>
                  Connect Stripe to receive your earnings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={connectStripe}>
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect Stripe Account
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Request Payout</CardTitle>
                  <CardDescription>
                    Pending: ${(affiliate.pending_commissions || 0).toFixed(2)} 
                    (Minimum: ${(affiliate.minimum_payout || 50).toFixed(2)})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={requestPayout}
                    disabled={(affiliate.pending_commissions || 0) < (affiliate.minimum_payout || 50)}
                  >
                    Request Payout
                  </Button>
                  {(affiliate.pending_commissions || 0) < (affiliate.minimum_payout || 50) && (
                    <p className="text-sm text-gray-500 mt-2">
                      You need ${((affiliate.minimum_payout || 50) - (affiliate.pending_commissions || 0)).toFixed(2)} more to request a payout
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payout History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {payouts.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No payouts yet</p>
                    ) : (
                      payouts.map((payout) => (
                        <div key={payout.payout_id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-semibold">${(payout.amount_usd || 0).toFixed(2)}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(payout.requested_at || Date.now()).toLocaleDateString()} via {payout.method || 'Stripe'}
                            </p>
                          </div>
                          <Badge variant={
                            payout.status === 'completed' ? 'default' :
                            payout.status === 'processing' ? 'secondary' :
                            payout.status === 'failed' ? 'destructive' :
                            'outline'
                          }>
                            {payout.status}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Affiliate Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Referral Code</Label>
                <Input value={affiliate.referral_code} disabled className="font-mono" />
              </div>
              <div>
                <Label>Commission Rate</Label>
                <Input value={`${((affiliate.commission_rate || 0.3) * 100).toFixed(0)}%`} disabled />
              </div>
              <div>
                <Label>Minimum Payout</Label>
                <Input value={`$${(affiliate.minimum_payout || 50).toFixed(2)}`} disabled />
              </div>
              <div>
                <Label>Payout Method</Label>
                <Input value={affiliate.payout_method || 'none'} disabled className="capitalize" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
