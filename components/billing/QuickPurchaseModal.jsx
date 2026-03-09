'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { X } from 'lucide-react';
import { createCheckoutSession } from '@/lib/stripe-client';
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
    isSubscription: true,
    savings: "Starter volume",
    color: "from-[#DC143C] to-[#B91238]",
  },
  {
    id: "ultra",
    name: "Ultra",
    credits: 7000,
    price: 60,
    period: "/month",
    priceId: config.stripe.plans[2]?.priceId,
    isSubscription: true,
    popular: true,
    savings: "Team volume",
    color: "from-[#DC143C] to-[#A01030]",
  },
  {
    id: "studio",
    name: "Studio",
    credits: 24000,
    price: 200,
    period: "/month",
    priceId: config.stripe.plans[3]?.priceId,
    isSubscription: true,
    savings: "Studio volume",
    color: "from-[#DC143C] to-[#B01030]",
  },
];

export default function QuickPurchaseModal({ isOpen, onClose, onSuccess, currentCredits }) {
  const { user } = useUser();
  const [loading, setLoading] = useState(null);

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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0A0A0A] rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-[#3F3F46]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#3F3F46] bg-gradient-to-r from-[#151515] to-[#0A0A0A]">
          <div>
            <h2 className="text-2xl font-bold text-white">Plan & Billing</h2>
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

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-gray-300 mb-5 text-center">
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
                      ? 'border-cinema-red bg-gradient-to-br from-cinema-red/15 to-[#1A1012] shadow-[0_0_0_1px_rgba(220,20,60,0.15)]'
                      : 'border-[#3F3F46] hover:border-cinema-red/60 bg-[#141414]'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:-translate-y-[1px]'}`}
                >
                  {plan.popular && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-cinema-red text-white text-xs font-semibold rounded-full shadow-md">
                      Most Popular
                    </span>
                  )}

                  <div className="flex flex-col items-center text-center space-y-2">
                    <div>
                      <div className="font-semibold text-white">{plan.name}</div>
                      <div className="text-3xl font-extrabold text-white mt-1 tracking-tight">
                        ${plan.price}<span className="text-sm text-gray-400">{plan.period}</span>
                      </div>
                      <div className="text-sm text-base-content/70 mt-1">
                        {plan.credits.toLocaleString()} credits/month
                      </div>
                      {plan.savings && (
                        <div className="text-xs text-green-400 mt-2 font-semibold">
                          {plan.savings}
                        </div>
                      )}
                    </div>
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-cinema-red border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <div className={`w-full mt-2 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                        plan.popular
                          ? 'bg-cinema-red text-white'
                          : 'bg-cinema-red/15 text-cinema-red'
                      }`}>
                        Subscribe
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-[#3F3F46]">
            <p className="text-xs text-gray-500 text-center mb-3">
              Your plan can be changed anytime in account settings.
            </p>
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

