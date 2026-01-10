'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { X, Zap, Calendar } from 'lucide-react';
import { createCreditCheckoutSession, createCheckoutSession } from '@/lib/stripe-client';
import config from '@/config';

// Monthly subscription plans
const SUBSCRIPTION_PLANS = [
  {
    id: "pro",
    name: "Pro",
    credits: 3000,
    price: 29,
    period: "/month",
    priceId: config.stripe.plans[1]?.priceId,
    isSubscription: true,
    savings: "3% off",
    color: "from-[#DC143C] to-[#B91238]",
  },
  {
    id: "ultra",
    name: "Ultra",
    credits: 12000,
    price: 99,
    period: "/month",
    priceId: config.stripe.plans[2]?.priceId,
    isSubscription: true,
    popular: true,
    savings: "15% off",
    color: "from-[#DC143C] to-[#A01030]",
  },
  {
    id: "studio",
    name: "Studio",
    credits: 50000,
    price: 399,
    period: "/month",
    priceId: config.stripe.plans[3]?.priceId,
    isSubscription: true,
    savings: "17% off",
    color: "from-[#DC143C] to-[#B01030]",
  },
];

// One-time credit packages
const CREDIT_PACKAGES = [
  {
    id: "starter",
    name: "Starter Pack",
    credits: 500,
    price: 10,
    packageKey: "starter",
    isSubscription: false,
    color: "from-[#DC143C] to-[#B91238]",
  },
  {
    id: "creator",
    name: "Creator Pack",
    credits: 1500,
    price: 25,
    packageKey: "booster",
    isSubscription: false,
    popular: true,
    savings: "17% off",
    color: "from-[#DC143C] to-[#A01030]",
  },
  {
    id: "pro-pack",
    name: "Pro Pack",
    credits: 4000,
    price: 60,
    packageKey: "mega",
    isSubscription: false,
    savings: "25% off",
    color: "from-[#DC143C] to-[#B01030]",
  },
];

export default function QuickPurchaseModal({ isOpen, onClose, onSuccess, currentCredits }) {
  const { user } = useUser();
  const [loading, setLoading] = useState(null);
  const [activeTab, setActiveTab] = useState('subscriptions'); // 'subscriptions' or 'one-time'

  if (!isOpen) return null;

  const handleSubscriptionPurchase = async (plan) => {
    if (!user) {
      window.location.href = '/sign-in?redirect_url=/dashboard';
      return;
    }

    if (!plan.name) {
      alert('This plan is not yet available. Please contact support.');
      return;
    }

    setLoading(plan.id);

    try {
      const checkoutUrl = await createCheckoutSession(
        plan.name, // Backend expects planName (e.g., "Pro", "Ultra", "Studio")
        `${window.location.origin}/dashboard?subscription=success&plan=${plan.id}`,
        `${window.location.origin}/dashboard`
      );

      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Checkout error:', error);
      alert(`Error: ${error.message}\n\nPlease try again or contact support.`);
      setLoading(null);
    }
  };

  const handleCreditPurchase = async (pkg) => {
    if (!user) {
      window.location.href = '/sign-in?redirect_url=/dashboard';
      return;
    }

    setLoading(pkg.id);

    try {
      const checkoutUrl = await createCreditCheckoutSession(
        pkg.packageKey,
        `${window.location.origin}/dashboard?purchase=success&credits=${pkg.credits}`,
        `${window.location.origin}/dashboard`
      );

      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Checkout error:', error);
      alert(`Error: ${error.message}\n\nPlease try again or contact support.`);
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0A0A0A] rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-[#3F3F46]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#3F3F46]">
          <div>
            <h2 className="text-2xl font-bold text-white">Add Credits</h2>
            <p className="text-sm text-base-content/60 mt-1">
              Current balance: {currentCredits?.toLocaleString() || '0'} credits
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#1F1F1F] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-base-content/60" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-4">
          <div className="flex gap-2 p-1 bg-[#141414] rounded-lg">
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'subscriptions'
                  ? 'bg-cinema-red text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Monthly Plans
              <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">Best Value</span>
            </button>
            <button
              onClick={() => setActiveTab('one-time')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'one-time'
                  ? 'bg-cinema-red text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4" />
              One-Time Packs
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'subscriptions' ? (
            <>
              <p className="text-sm text-gray-400 mb-4 text-center">
                Subscribe for the best value. Credits roll over (up to 2x monthly). Cancel anytime.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SUBSCRIPTION_PLANS.map((plan) => {
                  const isLoading = loading === plan.id;

                  return (
                    <button
                      key={plan.id}
                      onClick={() => handleSubscriptionPurchase(plan)}
                      disabled={isLoading}
                      className={`relative p-4 rounded-lg border-2 transition-all ${
                        plan.popular
                          ? 'border-cinema-red bg-gradient-to-br from-cinema-red/10 to-cinema-red/5'
                          : 'border-[#3F3F46] hover:border-cinema-red/50 bg-[#141414]'
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}`}
                    >
                      {plan.popular && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-cinema-red text-white text-xs font-semibold rounded-full">
                          Most Popular
                        </span>
                      )}

                      <div className="flex flex-col items-center text-center space-y-2">
                        <div>
                          <div className="font-semibold text-white">{plan.name}</div>
                          <div className="text-2xl font-bold text-cinema-red mt-1">
                            ${plan.price}<span className="text-sm text-gray-400">{plan.period}</span>
                          </div>
                          <div className="text-sm text-base-content/60 mt-1">
                            {plan.credits.toLocaleString()} credits/month
                          </div>
                          {plan.savings && (
                            <div className="text-xs text-green-400 mt-1">
                              {plan.savings} vs pay-as-you-go
                            </div>
                          )}
                        </div>
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-cinema-red border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <div className="w-full mt-2 py-2 bg-cinema-red/20 text-cinema-red text-sm font-medium rounded-lg">
                            Subscribe
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-400 mb-4 text-center">
                One-time purchases. Credits never expire. No commitment.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {CREDIT_PACKAGES.map((pkg) => {
                  const isLoading = loading === pkg.id;

                  return (
                    <button
                      key={pkg.id}
                      onClick={() => handleCreditPurchase(pkg)}
                      disabled={isLoading}
                      className={`relative p-4 rounded-lg border-2 transition-all ${
                        pkg.popular
                          ? 'border-cinema-red bg-gradient-to-br from-cinema-red/10 to-cinema-red/5'
                          : 'border-[#3F3F46] hover:border-cinema-red/50 bg-[#141414]'
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}`}
                    >
                      {pkg.popular && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-cinema-red text-white text-xs font-semibold rounded-full">
                          Best Value
                        </span>
                      )}

                      <div className="flex flex-col items-center text-center space-y-2">
                        <div>
                          <div className="font-semibold text-white">{pkg.name}</div>
                          <div className="text-2xl font-bold text-cinema-red mt-1">
                            ${pkg.price}
                          </div>
                          <div className="text-sm text-base-content/60 mt-1">
                            {pkg.credits.toLocaleString()} credits
                          </div>
                          {pkg.savings && (
                            <div className="text-xs text-green-400 mt-1">
                              {pkg.savings}
                            </div>
                          )}
                        </div>
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-cinema-red border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <div className="text-xs text-base-content/50">
                            ${(pkg.price / pkg.credits * 1000).toFixed(2)} per 1,000 credits
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-[#3F3F46]">
            <a
              href="/pricing"
              className="block text-center text-sm text-cinema-red hover:underline"
            >
              View full pricing details →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

