'use client';

import { useUser, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  CreditCard,
  LogOut,
  ChevronRight,
  Crown,
  Share2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { getOverageSettings, updateOverageSettings, getSubscriptionDetails, cancelSubscription, getBillingUsageHistory } from '@/lib/stripe-client';

export default function AccountPage() {
  const { user, isLoaded } = useUser();
  const { signOut, getToken } = useAuth();
  const router = useRouter();
  const [credits, setCredits] = useState(null);
  const [loadingCredits, setLoadingCredits] = useState(true);
  const [overage, setOverage] = useState(null);
  const [loadingOverage, setLoadingOverage] = useState(true);
  const [savingOverage, setSavingOverage] = useState(false);
  const [overageEnabledDraft, setOverageEnabledDraft] = useState(false);
  const [overageLimitDraft, setOverageLimitDraft] = useState('');
  const [subscription, setSubscription] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [updatingSubscription, setUpdatingSubscription] = useState(false);
  const [usageItems, setUsageItems] = useState([]);
  const [usagePages, setUsagePages] = useState([]);
  const [usagePageIndex, setUsagePageIndex] = useState(0);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [loadingMoreUsage, setLoadingMoreUsage] = useState(false);
  const [affiliateProfile, setAffiliateProfile] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchCreditBalance();
      fetchOverage();
      fetchSubscription();
      fetchUsageHistory({ append: false });
      fetchAffiliateProfile();
    }
  }, [user?.id]);

  async function fetchCreditBalance() {
    try {
      const { api, setAuthTokenGetter } = await import('@/lib/api');
      if (typeof getToken === 'function') {
        setAuthTokenGetter(() => getToken({ template: 'wryda-backend' }));
      }
      
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

  async function fetchOverage() {
    try {
      setLoadingOverage(true);
      const settings = await getOverageSettings();
      setOverage(settings);
      setOverageEnabledDraft(!!settings?.enabled);
      setOverageLimitDraft(
        settings?.monthlyLimitUsd === null || settings?.monthlyLimitUsd === undefined
          ? ''
          : String(settings.monthlyLimitUsd)
      );
    } catch (error) {
      console.error('Failed to fetch overage settings:', error);
      setOverage({ enabled: false, monthlyLimitUsd: null, spendCurrentMonthUsd: 0, creditsUsedCurrentMonth: 0, periodKey: null });
      setOverageEnabledDraft(false);
      setOverageLimitDraft('');
    } finally {
      setLoadingOverage(false);
    }
  }

  async function fetchSubscription() {
    try {
      setLoadingSubscription(true);
      const details = await getSubscriptionDetails();
      setSubscription(details);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
      setSubscription(null);
    } finally {
      setLoadingSubscription(false);
    }
  }

  async function fetchAffiliateProfile() {
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) return;
      const res = await fetch('/api/affiliates/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        setAffiliateProfile(null);
        return;
      }
      const data = await res.json().catch(() => null);
      setAffiliateProfile(data);
    } catch (error) {
      console.error('Failed to fetch affiliate profile:', error);
      setAffiliateProfile(null);
    }
  }

  async function fetchUsageHistory({ append }) {
    try {
      if (append) {
        setLoadingMoreUsage(true);
      } else {
        setLoadingUsage(true);
      }
      const response = await getBillingUsageHistory({
        limit: 20,
        cursor: append ? usagePages[usagePageIndex]?.nextCursor || null : null,
      });
      const items = Array.isArray(response?.items) ? response.items : [];
      const nextCursor = response?.page?.nextCursor || null;
      if (append) {
        if (items.length > 0) {
          setUsagePages((prev) => [...prev, { items, nextCursor }]);
          setUsagePageIndex((prev) => prev + 1);
          setUsageItems(items);
        }
      } else {
        setUsagePages([{ items, nextCursor }]);
        setUsagePageIndex(0);
        setUsageItems(items);
      }
    } catch (error) {
      console.error('Failed to fetch usage history:', error);
      if (!append) {
        setUsageItems([]);
        setUsagePages([]);
        setUsagePageIndex(0);
      }
    } finally {
      if (append) {
        setLoadingMoreUsage(false);
      } else {
        setLoadingUsage(false);
      }
    }
  }

  function goToPreviousUsagePage() {
    setUsagePageIndex((prev) => {
      const nextIndex = Math.max(0, prev - 1);
      const target = usagePages[nextIndex];
      if (target) setUsageItems(target.items || []);
      return nextIndex;
    });
  }

  async function goToNextUsagePage() {
    const existingNextPage = usagePages[usagePageIndex + 1];
    if (existingNextPage) {
      setUsagePageIndex((prev) => prev + 1);
      setUsageItems(existingNextPage.items || []);
      return;
    }
    if (!usagePages[usagePageIndex]?.nextCursor) return;
    await fetchUsageHistory({ append: true });
  }

  async function handleSaveOverage() {
    try {
      setSavingOverage(true);
      const parsed = overageLimitDraft.trim() === '' ? null : Number(overageLimitDraft);
      if (overageEnabledDraft && (parsed === null || !Number.isFinite(parsed) || parsed <= 0)) {
        alert('Set a positive monthly overage limit to enable overage.');
        return;
      }
      if (parsed !== null && (!Number.isFinite(parsed) || parsed < 0)) {
        alert('Monthly overage limit must be a non-negative number.');
        return;
      }

      await updateOverageSettings(overageEnabledDraft, parsed);
      await fetchOverage();
    } catch (error) {
      console.error('Failed to save overage settings:', error);
      alert('Failed to save overage settings. Please try again.');
    } finally {
      setSavingOverage(false);
    }
  }

  async function handleCancelAtPeriodEnd() {
    try {
      setUpdatingSubscription(true);
      await cancelSubscription(true);
      await fetchSubscription();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      alert('Failed to update subscription cancellation. Please try again.');
    } finally {
      setUpdatingSubscription(false);
    }
  }

  async function handleReactivateSubscription() {
    try {
      setUpdatingSubscription(true);
      await cancelSubscription(false);
      await fetchSubscription();
    } catch (error) {
      console.error('Failed to reactivate subscription:', error);
      alert('Failed to reactivate subscription. Please try again.');
    } finally {
      setUpdatingSubscription(false);
    }
  }

  const handleSignOut = async () => {
    await signOut({ redirectUrl: '/' });
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
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
    },
    ...(affiliateProfile ? [{
      title: 'Creator Programs',
      items: [
        {
          icon: Share2,
          label: 'Affiliate Dashboard',
          value: `Status: ${String(affiliateProfile.status || 'active')}`,
          action: () => router.push('/affiliates')
        }
      ]
    }] : [])
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-base-content">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#141414] to-[#0A0A0A] border-b border-[#3F3F46]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="mb-4 text-base-content/60 hover:text-base-content transition-colors flex items-center gap-2"
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
              <p className="text-base-content/60 mt-1">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {accountSections.map((section) => (
            <div key={section.title} className="bg-[#141414] rounded-lg border border-[#3F3F46] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#3F3F46]">
                <h2 className="text-lg font-semibold text-white">{section.title}</h2>
              </div>
              <div className="divide-y divide-[#3F3F46]">
                {section.items.map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    disabled={!item.action}
                    className={`w-full px-6 py-4 flex items-center justify-between transition-colors ${
                      item.action
                        ? 'hover:bg-[#1F1F1F] cursor-pointer'
                        : 'cursor-default'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <item.icon className="w-5 h-5 text-cinema-red" />
                      <div className="text-left">
                        <div className="text-sm font-medium text-base-content">{item.label}</div>
                        <div className="text-sm text-base-content/60 mt-0.5">{item.value}</div>
                      </div>
                    </div>
                    {item.action && (
                      <ChevronRight className="w-5 h-5 text-base-content/40" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Plan Management */}
          <div className="bg-[#141414] rounded-lg border border-[#3F3F46] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#3F3F46]">
              <h2 className="text-lg font-semibold text-white">Plan Management</h2>
            </div>
            <div className="p-6 space-y-4">
              {loadingSubscription ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-6 h-6 border-2 border-cinema-red border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Crown className="w-5 h-5 text-cinema-red" />
                      <div>
                        <div className="text-sm font-medium text-base-content">Current Plan</div>
                        <div className="text-sm text-base-content/60 mt-1">
                          {subscription?.planName || 'Free'}
                          {subscription?.status ? ` • ${subscription.status}` : ''}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push('/buy-credits')}
                      className="px-4 py-2 bg-cinema-red hover:bg-cinema-red/90 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Upgrade or Change
                    </button>
                  </div>

                  {subscription?.currentPeriodEnd && (
                    <div className="text-xs text-base-content/60">
                      Billing period ends: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </div>
                  )}

                  {subscription ? (
                    <div className="pt-3 border-t border-[#3F3F46] flex gap-2 justify-end">
                      {subscription.cancelAtPeriodEnd ? (
                        <button
                          onClick={handleReactivateSubscription}
                          disabled={updatingSubscription}
                          className="px-4 py-2 bg-[#0A0A0A] border border-[#3F3F46] hover:border-cinema-red text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {updatingSubscription ? 'Updating...' : 'Reactivate'}
                        </button>
                      ) : (
                        <button
                          onClick={handleCancelAtPeriodEnd}
                          disabled={updatingSubscription}
                          className="px-4 py-2 bg-[#0A0A0A] border border-[#3F3F46] hover:border-cinema-red text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {updatingSubscription ? 'Updating...' : 'Cancel at Period End'}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-base-content/60">You are on the free plan. Choose a paid plan to unlock monthly allocations and overage.</div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Overage Controls */}
          <div className="bg-[#141414] rounded-lg border border-[#3F3F46] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#3F3F46]">
              <h2 className="text-lg font-semibold text-white">On-Demand Overage</h2>
            </div>
            <div className="p-6 space-y-4">
              {loadingOverage ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-6 h-6 border-2 border-cinema-red border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-base-content">Enable Overage</div>
                      <div className="text-sm text-base-content/60 mt-1">
                        Continue after credits run out, billed against a monthly cap.
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={overageEnabledDraft}
                        onChange={(e) => setOverageEnabledDraft(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-base-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cinema-red rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cinema-red"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-base-content mb-2">
                      Monthly Overage Limit (USD)
                    </label>
                    <input
                      value={overageLimitDraft}
                      onChange={(e) => setOverageLimitDraft(e.target.value)}
                      placeholder="Example: 100"
                      className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded-lg text-base-content"
                    />
                    <p className="text-xs text-base-content/60 mt-2">
                      Overage requires a monthly cap. We bill incrementally as you use overage.
                    </p>
                    <p className="text-xs text-base-content/60 mt-1">
                      Current cycle spend: ${Number(overage?.spendCurrentMonthUsd || 0).toFixed(2)} ({(overage?.creditsUsedCurrentMonth || 0).toLocaleString()} credits)
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveOverage}
                      disabled={savingOverage}
                      className="px-4 py-2 bg-cinema-red hover:bg-cinema-red/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {savingOverage ? 'Saving...' : 'Save Overage Settings'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Usage History */}
          <div className="bg-[#141414] rounded-lg border border-[#3F3F46] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#3F3F46]">
              <h2 className="text-lg font-semibold text-white">Usage History</h2>
              <p className="text-xs text-base-content/60 mt-1">
                Track credit usage by tool (Story Advisor, Rewrite, Director, and more). Values are shown in credits.
              </p>
            </div>
            <div className="p-6">
              {loadingUsage ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-6 h-6 border-2 border-cinema-red border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : usageItems.length === 0 ? (
                <div className="text-sm text-base-content/60">No usage yet.</div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-lg border border-[#3F3F46]">
                    <table className="w-full text-sm">
                      <thead className="bg-[#0F0F10] text-base-content/70">
                        <tr>
                          <th className="text-left px-4 py-3 font-medium">Date</th>
                          <th className="text-left px-4 py-3 font-medium">Activity</th>
                          <th className="text-left px-4 py-3 font-medium">Provider</th>
                          <th className="text-left px-4 py-3 font-medium">Model</th>
                          <th className="text-right px-4 py-3 font-medium">Credits</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#3F3F46]">
                        {usageItems.map((item) => (
                          <tr key={item.id} className="hover:bg-[#1A1A1A]">
                            <td className="px-4 py-3 text-base-content/80 whitespace-nowrap">
                              {new Date(item.occurredAt).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-base-content">{item.eventLabel}</td>
                            <td className="px-4 py-3 text-base-content/70">{item.provider || '-'}</td>
                            <td className="px-4 py-3 text-base-content/70">{item.model || '-'}</td>
                            <td className="px-4 py-3 text-right font-medium text-base-content">
                              {Number(item.creditsDeducted || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-base-content/60">
                      Page {usagePageIndex + 1}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={goToPreviousUsagePage}
                        disabled={loadingMoreUsage || usagePageIndex === 0}
                        className="px-4 py-2 bg-[#0A0A0A] border border-[#3F3F46] hover:border-cinema-red text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={goToNextUsagePage}
                        disabled={loadingMoreUsage || !usagePages[usagePageIndex]?.nextCursor}
                        className="px-4 py-2 bg-[#0A0A0A] border border-[#3F3F46] hover:border-cinema-red text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {loadingMoreUsage ? 'Loading...' : 'Next'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sign Out Button */}
          <div className="bg-[#141414] rounded-lg border border-[#3F3F46] overflow-hidden">
            <button
              onClick={handleSignOut}
              className="w-full px-6 py-4 flex items-center gap-4 hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-5 h-5 text-red-500" />
              <div className="text-left">
                <div className="text-sm font-medium text-red-500">Sign Out</div>
                <div className="text-sm text-base-content/60 mt-0.5">Sign out of your account</div>
              </div>
            </button>
          </div>

          {/* Footer Info */}
          <div className="text-center text-sm text-base-content/50 pt-8">
            <p>Need help? Contact <a href="mailto:support@wryda.ai" className="text-cinema-red hover:underline">support@wryda.ai</a></p>
          </div>
        </div>
      </div>

    </div>
  );
}

