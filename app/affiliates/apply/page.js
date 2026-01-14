'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function AffiliateApplyPage() {
  const router = useRouter();
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    invite_code: '',
    referral_code: '',
    company_name: '',
    website_url: '',
    bio: '',
    twitter: '',
    youtube: '',
    tiktok: '',
    instagram: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Check if user is signed in
      if (!isSignedIn || !user) {
        // Redirect to sign-in with return URL
        const currentUrl = window.location.href;
        const signInUrl = `/sign-in?redirect_url=${encodeURIComponent(currentUrl)}`;
        router.push(signInUrl);
        return;
      }

      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        setError('Authentication required. Please log in.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/affiliates/apply', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          invite_code: formData.invite_code || undefined, // Only send if provided
          referral_code: formData.referral_code,
          company_name: formData.company_name || undefined,
          website_url: formData.website_url || undefined,
          bio: formData.bio || undefined,
          social_profiles: {
            twitter: formData.twitter || undefined,
            youtube: formData.youtube || undefined,
            tiktok: formData.tiktok || undefined,
            instagram: formData.instagram || undefined,
          },
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/affiliates');
        }, 3000);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to submit application');
      }
    } catch (err) {
      console.error('Error applying:', err);
      setError('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0A0A0A]">
        <div className="container mx-auto px-4 py-16 max-w-2xl">
          <div className="bg-[#141414] border border-white/10 rounded-lg shadow-2xl p-8 text-center">
            <CheckCircle className="h-20 w-20 text-[#FFD700] mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">Application Submitted!</h2>
            <p className="text-[#B3B3B3] text-lg mb-6">
              We'll review your application within 24-48 hours and send you an email when approved.
            </p>
            <Button 
              className="mt-6 bg-gradient-to-r from-[#DC143C] to-[#8B0000] hover:from-[#DC143C]/90 hover:to-[#8B0000]/90 text-white font-semibold px-8 py-6 text-lg" 
              onClick={() => router.push('/affiliates')}
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Become a Wryda Affiliate</h1>
          <p className="text-xl text-[#B3B3B3] mb-2">Earn 30% recurring commission on every referral</p>
          <p className="text-base text-[#808080]">Join creators who are building passive income by sharing the future of filmmaking</p>
        </div>

        <div className="bg-[#141414] border border-white/10 rounded-lg shadow-2xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-[#1F1F1F] border border-[#DC143C]/30 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-[#DC143C] flex-shrink-0" />
              <p className="text-sm text-[#DC143C]">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Invite Code */}
            <div>
              <Label htmlFor="invite_code" className="text-[#B3B3B3]">
                Invite Code*
                <span className="text-xs text-[#808080] ml-2">(Required to apply)</span>
              </Label>
              <Input
                id="invite_code"
                value={formData.invite_code}
                onChange={(e) => setFormData({ ...formData, invite_code: e.target.value })}
                placeholder="Enter your invite code"
                required
                className="mt-1 font-mono bg-[#1F1F1F] border-white/10 text-white placeholder:text-[#808080]"
              />
              <p className="text-xs text-[#808080] mt-2">
                You need a valid invite code to apply. Contact us if you don't have one.
              </p>
            </div>

            {/* Referral Code */}
            <div>
              <Label htmlFor="referral_code" className="text-[#B3B3B3]">
                Referral Code* 
                <span className="text-xs text-[#808080] ml-2">(3-20 characters, alphanumeric)</span>
              </Label>
              <Input
                id="referral_code"
                value={formData.referral_code}
                onChange={(e) => setFormData({ ...formData, referral_code: e.target.value })}
                placeholder="yourname123"
                required
                pattern="[a-zA-Z0-9_-]{3,20}"
                className="mt-1 bg-[#1F1F1F] border-white/10 text-white placeholder:text-[#808080]"
              />
              <p className="text-xs text-[#808080] mt-2">
                Your link will be: <span className="text-[#00D9FF] font-mono">wryda.ai?ref={formData.referral_code || 'yourcode'}</span>
              </p>
            </div>

            {/* Company Name */}
            <div>
              <Label htmlFor="company_name" className="text-[#B3B3B3]">Company/Channel Name</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Your Company or Content Channel"
                className="mt-1 bg-[#1F1F1F] border-white/10 text-white placeholder:text-[#808080]"
              />
            </div>

            {/* Website */}
            <div>
              <Label htmlFor="website_url" className="text-[#B3B3B3]">Website URL</Label>
              <Input
                id="website_url"
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                placeholder="https://yourwebsite.com"
                className="mt-1 bg-[#1F1F1F] border-white/10 text-white placeholder:text-[#808080]"
              />
            </div>

            {/* Bio */}
            <div>
              <Label htmlFor="bio" className="text-[#B3B3B3]">Bio / Audience Description</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about your audience and how you'll promote Wryda..."
                rows={4}
                className="mt-1 bg-[#1F1F1F] border-white/10 text-white placeholder:text-[#808080]"
              />
            </div>

            {/* Social Profiles */}
            <div className="space-y-3">
              <Label className="text-[#B3B3B3]">Social Media Profiles (Optional)</Label>
              
              <Input
                placeholder="https://twitter.com/yourhandle"
                value={formData.twitter}
                onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                className="bg-[#1F1F1F] border-white/10 text-white placeholder:text-[#808080]"
              />
              
              <Input
                placeholder="https://youtube.com/@yourchannel"
                value={formData.youtube}
                onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                className="bg-[#1F1F1F] border-white/10 text-white placeholder:text-[#808080]"
              />
              
              <Input
                placeholder="https://tiktok.com/@yourhandle"
                value={formData.tiktok}
                onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                className="bg-[#1F1F1F] border-white/10 text-white placeholder:text-[#808080]"
              />
              
              <Input
                placeholder="https://instagram.com/yourhandle"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                className="bg-[#1F1F1F] border-white/10 text-white placeholder:text-[#808080]"
              />
            </div>

            {/* Benefits */}
            <div className="bg-[#1F1F1F] border border-white/5 p-6 rounded-lg">
              <h3 className="font-semibold mb-4 text-white text-lg">What You'll Get:</h3>
              <ul className="text-sm space-y-3 text-[#B3B3B3]">
                <li className="flex items-center gap-3">
                  <span className="text-[#FFD700] text-lg">💰</span>
                  <span>30% recurring commission on all referrals</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-[#00D9FF] text-lg">📊</span>
                  <span>30-day cookie tracking window</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-[#DC143C] text-lg">⚡</span>
                  <span>Monthly payouts via Stripe Connect</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-[#FFD700] text-lg">📈</span>
                  <span>Real-time analytics dashboard</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-[#00D9FF] text-lg">🎬</span>
                  <span>Marketing materials & dedicated support</span>
                </li>
              </ul>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-[#DC143C] to-[#8B0000] hover:from-[#DC143C]/90 hover:to-[#8B0000]/90 text-white font-semibold py-6 text-lg disabled:opacity-50" 
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
