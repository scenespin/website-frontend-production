'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { ArrowLeft, Check, Clock } from 'lucide-react';
import { createCheckoutSession } from '@/lib/stripe-client';
import { api } from '@/lib/api';
import config from '@/config';

// Monthly subscription plans
const SUBSCRIPTION_PLANS = [
  {
    id: "pro",
    name: "Pro",
    credits: 2000,
    price: 20,
    period: "/month",
    priceId: config.stripe.plans[1]?.priceId,
    savings: "Starter volume",
    features: [
      "2,000 credits/month",
      "Credits roll over (up to 4,000)",
      "All features unlocked",
      "Cancel anytime"
    ],
  },
  {
    id: "ultra",
    name: "Ultra",
    credits: 7000,
    price: 60,
    period: "/month",
    priceId: config.stripe.plans[2]?.priceId,
    popular: true,
    savings: "Team volume",
    features: [
      "7,000 credits/month",
      "Credits roll over (up to 14,000)",
      "All features unlocked",
      "Cancel anytime"
    ],
  },
  {
    id: "studio",
    name: "Studio",
    credits: 24000,
    price: 200,
    period: "/month",
    priceId: config.stripe.plans[3]?.priceId,
    savings: "Studio volume",
    features: [
      "24,000 credits/month",
      "Credits roll over (up to 48,000)",
      "All features unlocked",
      "Cancel anytime"
    ],
  },
];

export default function BuyCreditsPage() {
  const { user, isLoaded } = useUser();
  const [credits, setCredits] = useState(null);
  const [loadingCredits, setLoadingCredits] = useState(true);
  const [loadingPurchase, setLoadingPurchase] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchCredits();
    }
  }, [user?.id]);

  async function fetchCredits() {
    try {
      setLoadingCredits(true);
      const response = await api.user.getCredits();
      const creditsData = response.data.data;
      setCredits(creditsData?.balance || 0);
    } catch (error) {
      console.error('Failed to fetch credits:', error);
      setCredits(0);
    } finally {
      setLoadingCredits(false);
    }
  }

  const handleSubscriptionPurchase = async (plan) => {
    if (!user) {
      window.location.href = '/sign-in?redirect_url=/buy-credits';
      return;
    }

    if (!plan.name) {
      alert('This plan is not yet available. Please contact support.');
      return;
    }

    setLoadingPurchase(plan.id);

    try {
      const checkoutUrl = await createCheckoutSession(
        plan.name, // Backend expects planName (e.g., "Pro", "Ultra", "Studio")
        `${window.location.origin}/dashboard?subscription=success&plan=${plan.id}`,
        `${window.location.origin}/buy-credits`
      );

      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Checkout error:', error);
      alert(`Error: ${error.message}\n\nPlease try again or contact support.`);
      setLoadingPurchase(null);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-cinema-red"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <p className="text-base-content mb-4">Please sign in to purchase credits.</p>
          <Link href="/sign-in" className="btn btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <div className="border-b border-[#3F3F46]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-base-content/70 hover:text-base-content transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-base-200 rounded-lg mb-4">
            <span className="text-sm font-semibold text-base-content">
              {loadingCredits ? 'Loading...' : `${credits?.toLocaleString() || '0'} credits`}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-base-content mb-2">Plan & Billing</h1>
          <p className="text-base-content/60">
            Choose a monthly plan. Subscriptions include credit rollover and flexible cancellation.
          </p>
        </div>
        <p className="text-center text-gray-400 mb-6">
          Subscribe for volume discounts. Credits roll over month-to-month. Cancel anytime.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isLoading = loadingPurchase === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative rounded-lg border-2 transition-all ${
                  plan.popular
                    ? 'border-cinema-red bg-gradient-to-br from-cinema-red/10 to-cinema-red/5'
                    : 'border-[#3F3F46] bg-[#141414]'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 bg-cinema-red text-white text-xs font-semibold rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="p-6">
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                    <div className="text-3xl font-extrabold text-cinema-red">
                      ${plan.price}<span className="text-sm text-gray-400">{plan.period}</span>
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      {plan.credits.toLocaleString()} credits/month
                    </div>
                    {plan.savings && (
                      <div className="inline-block mt-2 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                        {plan.savings}
                      </div>
                    )}
                  </div>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                        <Check className="w-4 h-4 text-cinema-red shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscriptionPurchase(plan)}
                    disabled={isLoading}
                    className={`w-full py-3 rounded-lg font-semibold transition-all ${
                      plan.popular
                        ? 'bg-cinema-red hover:bg-cinema-red/90 text-white'
                        : 'bg-[#0A0A0A] border border-[#3F3F46] hover:border-cinema-red text-white'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </span>
                    ) : (
                      `Subscribe to ${plan.name}`
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Subscription Benefits */}
        <div className="mt-8 p-6 bg-[#141414] border border-[#3F3F46] rounded-lg">
          <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-cinema-red" />
            Why Subscribe?
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
            <div>
              <strong className="text-white">Predictable Monthly Volume</strong>
              <p className="text-gray-400">Choose the monthly credit level that fits your output goals</p>
            </div>
            <div>
              <strong className="text-white">Credits Roll Over</strong>
              <p className="text-gray-400">Unused credits carry over (up to 2x monthly amount)</p>
            </div>
            <div>
              <strong className="text-white">Cancel Anytime</strong>
              <p className="text-gray-400">No contracts, no commitments. Cancel with one click.</p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-xs text-base-content/50 max-w-md mx-auto">
            <span className="inline-flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Note: Your receipt will show &quot;Garden State Concentrate LLC&quot; - that is our parent company. Your purchase is for Wryda.ai services.
            </span>
          </p>
        </div>

        {/* Link to full pricing */}
        <div className="mt-6 text-center">
          <Link
            href="/pricing"
            className="text-cinema-red hover:underline text-sm"
          >
            View full pricing details and feature comparison →
          </Link>
        </div>
      </div>
    </div>
  );
}
