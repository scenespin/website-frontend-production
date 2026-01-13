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

const COLORS = ['#DC143C', '#00D9FF', '#FFD700', '#8B0000', '#0099CC'];

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
      <div className="flex items-center justify-center h-screen bg-[#0A0A0A]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#DC143C] mx-auto"></div>
          <p className="mt-4 text-[#B3B3B3]">Loading affiliate dashboard...</p>
        </div>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="min-h-screen bg-[#0A0A0A]">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4">Join the Wryda Affiliate Program</h1>
            <p className="text-xl text-[#B3B3B3] mb-2">Earn recurring commissions by sharing the future of filmmaking</p>
            <p className="text-lg text-[#808080]">Help creators bring their stories to life while building passive income</p>
          </div>

          <div className="bg-[#141414] border border-white/10 rounded-lg shadow-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Why Become a Wryda Affiliate?</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="text-[#DC143C] text-2xl">💰</div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">30% Recurring Commission</h3>
                  <p className="text-[#B3B3B3]">Earn on every subscription your referrals purchase, month after month</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="text-[#00D9FF] text-2xl">📊</div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Real-Time Analytics</h3>
                  <p className="text-[#B3B3B3]">Track clicks, conversions, and earnings with our comprehensive dashboard</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="text-[#FFD700] text-2xl">🎬</div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">30-Day Cookie Window</h3>
                  <p className="text-[#B3B3B3]">Extended tracking ensures you get credit for every conversion</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="text-[#DC143C] text-2xl">⚡</div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Monthly Payouts</h3>
                  <p className="text-[#B3B3B3]">Fast, reliable payments via Stripe Connect with $50 minimum</p>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => window.location.href = '/affiliates/apply'}
              className="w-full bg-gradient-to-r from-[#DC143C] to-[#8B0000] hover:from-[#DC143C]/90 hover:to-[#8B0000]/90 text-white font-semibold py-6 text-lg"
            >
              Apply to Become an Affiliate
            </Button>
          </div>

          <div className="bg-[#141414] border border-white/10 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Perfect For</h3>
            <div className="grid md:grid-cols-3 gap-4 text-[#B3B3B3]">
              <div>✓ Content Creators</div>
              <div>✓ Filmmaking Educators</div>
              <div>✓ Industry Influencers</div>
              <div>✓ YouTube Channels</div>
              <div>✓ Podcast Hosts</div>
              <div>✓ Blog Writers</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (affiliate.status === 'pending') {
    return (
      <div className="min-h-screen bg-[#0A0A0A]">
        <div className="container mx-auto px-4 py-16 max-w-2xl">
          <div className="bg-[#141414] border border-white/10 rounded-lg shadow-2xl p-8 text-center">
            <Clock className="h-16 w-16 text-[#FFD700] mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-white mb-4">Application Under Review</h1>
            <p className="text-[#B3B3B3] text-lg mb-2">
              Your affiliate application is being reviewed by our team.
            </p>
            <p className="text-[#808080]">
              We'll notify you within 24-48 hours via email when your application is approved.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (affiliate.status === 'suspended') {
    return (
      <div className="min-h-screen bg-[#0A0A0A]">
        <div className="container mx-auto px-4 py-16 max-w-2xl">
          <div className="bg-[#141414] border border-[#DC143C]/30 rounded-lg shadow-2xl p-8 text-center">
            <AlertCircle className="h-16 w-16 text-[#DC143C] mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-white mb-4">Account Suspended</h1>
            <p className="text-[#B3B3B3] text-lg">
              Your affiliate account has been suspended. Please contact support for more information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const trafficSourceData = stats && stats.traffic_sources ? Object.entries(stats.traffic_sources).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  })) : [];

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-3">Affiliate Dashboard</h1>
              <p className="text-[#B3B3B3] text-lg">
                Your referral code: <span className="font-mono font-semibold text-[#00D9FF]">{affiliate.referral_code}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className="bg-[#DC143C] text-white border-0 px-3 py-1">
              {affiliate.status}
            </Badge>
            {affiliate.tier && (
              <Badge 
                className="px-3 py-1 border-0 text-white"
                style={{
                  backgroundColor: affiliate.tier === 'founding_partner' ? '#FFD700' :
                                 affiliate.tier === 'early_adopter' ? '#00D9FF' :
                                 '#DC143C',
                }}
              >
                {affiliate.tier === 'founding_partner' && '🌟 '}
                {affiliate.tier === 'early_adopter' && '⚡ '}
                {affiliate.tier === 'founding_partner' ? 'Founding Partner (30%)' :
                 affiliate.tier === 'early_adopter' ? 'Early Adopter (25%)' :
                 'Standard (20%)'}
              </Badge>
            )}
          </div>
        </div>

      {/* Quick Stats */}
      {stats && stats.overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#141414] border border-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#B3B3B3] mb-1">Total Earnings</p>
                <p className="text-3xl font-bold text-[#FFD700]">${(stats.overview.total_commissions_earned || 0).toFixed(2)}</p>
              </div>
              <DollarSign className="h-10 w-10 text-[#FFD700]" />
            </div>
          </div>

          <div className="bg-[#141414] border border-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#B3B3B3] mb-1">Pending</p>
                <p className="text-3xl font-bold text-[#00D9FF]">${(stats.overview.pending_commissions || 0).toFixed(2)}</p>
              </div>
              <Clock className="h-10 w-10 text-[#00D9FF]" />
            </div>
          </div>

          <div className="bg-[#141414] border border-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#B3B3B3] mb-1">Conversions</p>
                <p className="text-3xl font-bold text-white">{stats.overview.total_conversions || 0}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-[#DC143C]" />
            </div>
          </div>

          <div className="bg-[#141414] border border-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#B3B3B3] mb-1">Conversion Rate</p>
                <p className="text-3xl font-bold text-[#00D9FF]">{stats.overview.conversion_rate || '0'}%</p>
              </div>
              <MousePointer className="h-10 w-10 text-[#00D9FF]" />
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-[#141414] border border-white/10">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#DC143C] data-[state=active]:text-white text-[#B3B3B3]">Overview</TabsTrigger>
          <TabsTrigger value="link" className="data-[state=active]:bg-[#DC143C] data-[state=active]:text-white text-[#B3B3B3]">Referral Link</TabsTrigger>
          <TabsTrigger value="commissions" className="data-[state=active]:bg-[#DC143C] data-[state=active]:text-white text-[#B3B3B3]">Commissions</TabsTrigger>
          <TabsTrigger value="payouts" className="data-[state=active]:bg-[#DC143C] data-[state=active]:text-white text-[#B3B3B3]">Payouts</TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-[#DC143C] data-[state=active]:text-white text-[#B3B3B3]">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {stats && (
            <>
              {/* Performance Chart */}
              {stats.chart_data && stats.chart_data.length > 0 && (
                <div className="bg-[#141414] border border-white/10 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Performance Over Time</h3>
                  <div>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={stats.chart_data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#3F3F46" />
                        <XAxis dataKey="date" stroke="#B3B3B3" />
                        <YAxis stroke="#B3B3B3" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#141414', 
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#FFFFFF'
                          }} 
                        />
                        <Legend wrapperStyle={{ color: '#B3B3B3' }} />
                        <Line type="monotone" dataKey="clicks" stroke="#00D9FF" name="Clicks" />
                        <Line type="monotone" dataKey="signups" stroke="#FFD700" name="Signups" />
                        <Line type="monotone" dataKey="conversions" stroke="#DC143C" name="Conversions" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Traffic Sources */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {trafficSourceData.length > 0 && (
                  <div className="bg-[#141414] border border-white/10 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Traffic Sources</h3>
                    <div>
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
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#141414', 
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              color: '#FFFFFF'
                            }} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {stats.current_period && (
                  <div className="bg-[#141414] border border-white/10 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">This Month</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-[#B3B3B3]">Clicks</span>
                        <span className="font-semibold text-white">{stats.current_period.clicks || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#B3B3B3]">Signups</span>
                        <span className="font-semibold text-white">{stats.current_period.signups || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#B3B3B3]">Conversions</span>
                        <span className="font-semibold text-white">{stats.current_period.conversions || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#B3B3B3]">Revenue</span>
                        <span className="font-semibold text-white">${(stats.current_period.revenue || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-t border-white/10 pt-4">
                        <span className="text-[#B3B3B3] font-semibold">Commissions</span>
                        <span className="font-bold text-[#FFD700]">${(stats.current_period.commissions || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </TabsContent>

        {/* Referral Link Tab */}
        <TabsContent value="link" className="space-y-4">
          <div className="bg-[#141414] border border-white/10 rounded-lg p-6">
            <h3 className="text-2xl font-semibold text-white mb-2">Your Referral Link</h3>
            <p className="text-[#B3B3B3] mb-6">
              Share this link to earn {((affiliate.commission_rate || 0.3) * 100).toFixed(0)}% commission on every conversion
            </p>
            <div className="space-y-4">
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

              <div className="bg-[#1F1F1F] border border-white/5 p-4 rounded-lg">
                <p className="text-sm font-semibold mb-3 text-white">Tips for Success:</p>
                <ul className="text-sm text-[#B3B3B3] space-y-2">
                  <li>• Share on social media with personal recommendations</li>
                  <li>• Create content (blog posts, videos) about Wryda</li>
                  <li>• Include your link in email signatures</li>
                  <li>• Highlight specific features that helped you</li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Commissions Tab */}
        <TabsContent value="commissions">
          <div className="bg-[#141414] border border-white/10 rounded-lg p-6">
            <h3 className="text-2xl font-semibold text-white mb-2">Commission History</h3>
            <p className="text-[#B3B3B3] mb-6">
              All commissions earned from your referrals
            </p>
            <div className="space-y-3">
              {commissions.length === 0 ? (
                <p className="text-center text-[#808080] py-12">No commissions yet</p>
              ) : (
                commissions.map((commission) => (
                  <div key={commission.commission_id} className="flex items-center justify-between p-4 bg-[#1F1F1F] border border-white/5 rounded-lg">
                    <div>
                      <p className="font-semibold text-white text-lg">${(commission.amount_usd || 0).toFixed(2)}</p>
                      <p className="text-sm text-[#B3B3B3]">
                        {commission.type || 'Commission'} • {new Date(commission.earned_at || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={
                      commission.status === 'paid' ? 'bg-[#FFD700] text-black' :
                      commission.status === 'approved' ? 'bg-[#00D9FF] text-black' :
                      'bg-[#1F1F1F] text-[#B3B3B3] border border-white/10'
                    }>
                      {commission.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        {/* Payouts Tab */}
        <TabsContent value="payouts" className="space-y-4">
          {affiliate.payout_method === 'none' || !affiliate.payout_method ? (
            <div className="bg-[#141414] border border-white/10 rounded-lg p-6">
              <h3 className="text-2xl font-semibold text-white mb-2">Setup Payouts</h3>
              <p className="text-[#B3B3B3] mb-6">
                Connect Stripe to receive your earnings
              </p>
              <Button 
                onClick={connectStripe}
                className="bg-gradient-to-r from-[#DC143C] to-[#8B0000] hover:from-[#DC143C]/90 hover:to-[#8B0000]/90 text-white"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Connect Stripe Account
              </Button>
            </div>
          ) : (
            <>
              <div className="bg-[#141414] border border-white/10 rounded-lg p-6">
                <h3 className="text-2xl font-semibold text-white mb-2">Request Payout</h3>
                <p className="text-[#B3B3B3] mb-6">
                  Pending: <span className="text-[#FFD700] font-semibold">${(affiliate.pending_commissions || 0).toFixed(2)}</span> 
                  {' '}(Minimum: ${(affiliate.minimum_payout || 50).toFixed(2)})
                </p>
                <Button 
                  onClick={requestPayout}
                  disabled={(affiliate.pending_commissions || 0) < (affiliate.minimum_payout || 50)}
                  className="bg-gradient-to-r from-[#DC143C] to-[#8B0000] hover:from-[#DC143C]/90 hover:to-[#8B0000]/90 text-white disabled:opacity-50"
                >
                  Request Payout
                </Button>
                {(affiliate.pending_commissions || 0) < (affiliate.minimum_payout || 50) && (
                  <p className="text-sm text-[#808080] mt-3">
                    You need ${((affiliate.minimum_payout || 50) - (affiliate.pending_commissions || 0)).toFixed(2)} more to request a payout
                  </p>
                )}
              </div>

              <div className="bg-[#141414] border border-white/10 rounded-lg p-6">
                <h3 className="text-2xl font-semibold text-white mb-6">Payout History</h3>
                <div className="space-y-3">
                  {payouts.length === 0 ? (
                    <p className="text-center text-[#808080] py-12">No payouts yet</p>
                  ) : (
                    payouts.map((payout) => (
                      <div key={payout.payout_id} className="flex items-center justify-between p-4 bg-[#1F1F1F] border border-white/5 rounded-lg">
                        <div>
                          <p className="font-semibold text-white text-lg">${(payout.amount_usd || 0).toFixed(2)}</p>
                          <p className="text-sm text-[#B3B3B3]">
                            {new Date(payout.requested_at || Date.now()).toLocaleDateString()} via {payout.method || 'Stripe'}
                          </p>
                        </div>
                        <Badge className={
                          payout.status === 'completed' ? 'bg-[#FFD700] text-black' :
                          payout.status === 'processing' ? 'bg-[#00D9FF] text-black' :
                          payout.status === 'failed' ? 'bg-[#DC143C] text-white' :
                          'bg-[#1F1F1F] text-[#B3B3B3] border border-white/10'
                        }>
                          {payout.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <div className="bg-[#141414] border border-white/10 rounded-lg p-6">
            <h3 className="text-2xl font-semibold text-white mb-6">Affiliate Settings</h3>
            <div className="space-y-6">
              <div>
                <Label className="text-[#B3B3B3] mb-2 block">Referral Code</Label>
                <Input value={affiliate.referral_code} disabled className="font-mono bg-[#1F1F1F] border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-[#B3B3B3] mb-2 block">Commission Rate</Label>
                <Input value={`${((affiliate.commission_rate || 0.3) * 100).toFixed(0)}%`} disabled className="bg-[#1F1F1F] border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-[#B3B3B3] mb-2 block">Minimum Payout</Label>
                <Input value={`$${(affiliate.minimum_payout || 50).toFixed(2)}`} disabled className="bg-[#1F1F1F] border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-[#B3B3B3] mb-2 block">Payout Method</Label>
                <Input value={affiliate.payout_method || 'none'} disabled className="capitalize bg-[#1F1F1F] border-white/10 text-white" />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
