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
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
              <p className="text-gray-600">
                We'll review your application within 24-48 hours and send you an email when approved.
              </p>
              <Button className="mt-6" onClick={() => router.push('/affiliates')}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Become an Affiliate</CardTitle>
          <CardDescription>
            Earn 30% commission on every customer you refer to Wryda
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Invite Code */}
            <div>
              <Label htmlFor="invite_code">
                Invite Code*
                <span className="text-xs text-gray-500 ml-2">(Required to apply)</span>
              </Label>
              <Input
                id="invite_code"
                value={formData.invite_code}
                onChange={(e) => setFormData({ ...formData, invite_code: e.target.value })}
                placeholder="Enter your invite code"
                required
                className="mt-1 font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                You need a valid invite code to apply. Contact us if you don't have one.
              </p>
            </div>

            {/* Referral Code */}
            <div>
              <Label htmlFor="referral_code">
                Referral Code* 
                <span className="text-xs text-gray-500 ml-2">(3-20 characters, alphanumeric)</span>
              </Label>
              <Input
                id="referral_code"
                value={formData.referral_code}
                onChange={(e) => setFormData({ ...formData, referral_code: e.target.value })}
                placeholder="yourname123"
                required
                pattern="[a-zA-Z0-9_-]{3,20}"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your link will be: wryda.ai?ref={formData.referral_code || 'yourcode'}
              </p>
            </div>

            {/* Company Name */}
            <div>
              <Label htmlFor="company_name">Company/Channel Name</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Your Company or Content Channel"
                className="mt-1"
              />
            </div>

            {/* Website */}
            <div>
              <Label htmlFor="website_url">Website URL</Label>
              <Input
                id="website_url"
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                placeholder="https://yourwebsite.com"
                className="mt-1"
              />
            </div>

            {/* Bio */}
            <div>
              <Label htmlFor="bio">Bio / Audience Description</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about your audience and how you'll promote Wryda..."
                rows={4}
                className="mt-1"
              />
            </div>

            {/* Social Profiles */}
            <div className="space-y-3">
              <Label>Social Media Profiles (Optional)</Label>
              
              <Input
                placeholder="https://twitter.com/yourhandle"
                value={formData.twitter}
                onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
              />
              
              <Input
                placeholder="https://youtube.com/@yourchannel"
                value={formData.youtube}
                onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
              />
              
              <Input
                placeholder="https://tiktok.com/@yourhandle"
                value={formData.tiktok}
                onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
              />
              
              <Input
                placeholder="https://instagram.com/yourhandle"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
              />
            </div>

            {/* Benefits */}
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">What You'll Get:</h3>
              <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                <li>✅ 30% commission on all referrals</li>
                <li>✅ 30-day cookie tracking window</li>
                <li>✅ Monthly payouts via Stripe</li>
                <li>✅ Real-time analytics dashboard</li>
                <li>✅ Marketing materials & support</li>
              </ul>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Application'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
