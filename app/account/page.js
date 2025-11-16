'use client';

import { useUser, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  CreditCard,
  Settings,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function AccountPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const [credits, setCredits] = useState(null);
  const [loadingCredits, setLoadingCredits] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchCreditBalance();
    }
  }, [user?.id]);

  async function fetchCreditBalance() {
    try {
      const { api, setAuthTokenGetter } = await import('@/lib/api');
      const { getToken } = await import('@clerk/nextjs');
      setAuthTokenGetter(() => getToken({ template: 'wryda-backend' }));
      
      const response = await api.user.getCredits();
      // FIX: API response is response.data.data.balance (not response.data.balance)
      // Backend returns: { success: true, data: { balance: number } }
      // Axios wraps it: response.data = { success: true, data: { balance: number } }
      const creditsData = response.data.data;
      setCredits(creditsData?.balance || 0);
    } catch (error) {
      console.error('Failed to fetch credits:', error);
      setCredits(0);
    } finally {
      setLoadingCredits(false);
    }
  }

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-cinema-red"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/sign-in');
    return null;
  }

  const accountSections = [
    {
      title: 'Personal Information',
      items: [
        {
          icon: User,
          label: 'Full Name',
          value: user?.fullName || 'Not set',
          action: () => window.Clerk?.openUserProfile()
        },
        {
          icon: Mail,
          label: 'Email',
          value: user?.primaryEmailAddress?.emailAddress || 'Not set',
          action: () => window.Clerk?.openUserProfile()
        },
        {
          icon: Calendar,
          label: 'Member Since',
          value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown',
        }
      ]
    },
    {
      title: 'Billing & Credits',
      items: [
        {
          icon: CreditCard,
          label: 'Credit Balance',
          value: loadingCredits ? 'Loading...' : `${credits?.toLocaleString() || '0'} credits`,
          action: () => router.push('/buy-credits')
        }
      ]
    },
    {
      title: 'Security',
      items: [
        {
          icon: Shield,
          label: 'Password & Security',
          value: 'Manage security settings',
          action: () => window.Clerk?.openUserProfile()
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-base-content">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-b border-slate-700">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="mb-4 text-slate-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-cinema-red flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress?.charAt(0) || 'U'}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Account Settings</h1>
              <p className="text-slate-400 mt-1">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {accountSections.map((section) => (
            <div key={section.title} className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-white">{section.title}</h2>
              </div>
              <div className="divide-y divide-slate-700">
                {section.items.map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    disabled={!item.action}
                    className={`w-full px-6 py-4 flex items-center justify-between transition-colors ${
                      item.action
                        ? 'hover:bg-slate-700/50 cursor-pointer'
                        : 'cursor-default'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <item.icon className="w-5 h-5 text-cinema-red" />
                      <div className="text-left">
                        <div className="text-sm font-medium text-slate-300">{item.label}</div>
                        <div className="text-sm text-slate-400 mt-0.5">{item.value}</div>
                      </div>
                    </div>
                    {item.action && (
                      <ChevronRight className="w-5 h-5 text-slate-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Sign Out Button */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <button
              onClick={handleSignOut}
              className="w-full px-6 py-4 flex items-center gap-4 hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-5 h-5 text-red-500" />
              <div className="text-left">
                <div className="text-sm font-medium text-red-500">Sign Out</div>
                <div className="text-sm text-slate-400 mt-0.5">Sign out of your account</div>
              </div>
            </button>
          </div>

          {/* Footer Info */}
          <div className="text-center text-sm text-slate-500 pt-8">
            <p>Need help? Contact <a href="mailto:support@wryda.ai" className="text-cinema-red hover:underline">support@wryda.ai</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}

