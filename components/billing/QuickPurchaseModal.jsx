'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { X, Zap, Sparkles, Star, Crown } from 'lucide-react';
import { createCreditCheckoutSession } from '@/lib/stripe-client';

// Credit packages matching buy-credits page
const QUICK_PACKAGES = [
  {
    id: "starter",
    name: "Starter Pack",
    credits: 500,
    price: 10,
    packageKey: "starter",
    icon: Zap,
    color: "from-[#DC143C] to-[#B91238]",
  },
  {
    id: "creator",
    name: "Creator Pack",
    credits: 1500,
    price: 25,
    packageKey: "booster",
    popular: true,
    icon: Sparkles,
    color: "from-[#DC143C] to-[#A01030]",
  },
  {
    id: "pro",
    name: "Pro Pack",
    credits: 4000,
    price: 60,
    packageKey: "mega",
    icon: Star,
    color: "from-[#DC143C] to-[#B01030]",
  },
];

export default function QuickPurchaseModal({ isOpen, onClose, onSuccess, currentCredits }) {
  const { user } = useUser();
  const [loading, setLoading] = useState(null);

  if (!isOpen) return null;

  const handlePurchase = async (pkg) => {
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
      <div className="bg-base-100 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-base-300">
          <div>
            <h2 className="text-2xl font-bold text-base-content">Add Credits</h2>
            <p className="text-sm text-base-content/60 mt-1">
              Current balance: {currentCredits?.toLocaleString() || '0'} credits
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-base-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-base-content/60" />
          </button>
        </div>

        {/* Packages Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {QUICK_PACKAGES.map((pkg) => {
              const Icon = pkg.icon;
              const isLoading = loading === pkg.id;

              return (
                <button
                  key={pkg.id}
                  onClick={() => handlePurchase(pkg)}
                  disabled={isLoading}
                  className={`relative p-4 rounded-lg border-2 transition-all ${
                    pkg.popular
                      ? 'border-cinema-red bg-gradient-to-br from-cinema-red/10 to-cinema-red/5'
                      : 'border-base-300 hover:border-cinema-red/50 bg-base-200'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}`}
                >
                  {pkg.popular && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-cinema-red text-white text-xs font-semibold rounded-full">
                      Popular
                    </span>
                  )}

                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${pkg.color}`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-base-content">{pkg.name}</div>
                      <div className="text-2xl font-bold text-cinema-red mt-1">
                        ${pkg.price}
                      </div>
                      <div className="text-sm text-base-content/60 mt-1">
                        {pkg.credits.toLocaleString()} credits
                      </div>
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

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-base-300">
            <a
              href="/buy-credits"
              className="block text-center text-sm text-cinema-red hover:underline"
            >
              View all packages and pricing →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

