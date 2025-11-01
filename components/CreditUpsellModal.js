'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { X, Zap, CreditCard, TrendingUp, CheckCircle } from 'lucide-react';
import Link from 'next/link';

/**
 * Credit Upsell Modal
 * 
 * Triggers when user has used 40+ credits and has less than 10 remaining
 * Encourages upgrade to paid tier
 */
export default function CreditUpsellModal({ 
  isOpen, 
  onClose, 
  creditsRemaining = 0,
  totalCreditsUsed = 0 
}) {
  const { user } = useUser();
  const [closing, setClosing] = useState(false);

  // Auto-check credit status if modal is not controlled externally
  useEffect(() => {
    if (!isOpen) return;

    // Track modal view
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'credit_upsell_shown', {
        credits_remaining: creditsRemaining,
        total_credits_used: totalCreditsUsed,
      });
    }
  }, [isOpen, creditsRemaining, totalCreditsUsed]);

  function handleClose() {
    setClosing(true);
    setTimeout(() => {
      onClose();
      setClosing(false);
    }, 200);

    // Track modal dismissal
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'credit_upsell_dismissed', {
        credits_remaining: creditsRemaining,
      });
    }
  }

  function handleUpgradeClick() {
    // Track upgrade click
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'credit_upsell_clicked', {
        credits_remaining: creditsRemaining,
        total_credits_used: totalCreditsUsed,
      });
    }
  }

  if (!isOpen) return null;

  return (
    <div className={`modal modal-open ${closing ? 'modal-closing' : ''}`}>
      <div className="modal-box max-w-2xl bg-gradient-to-br from-base-200 to-base-300 border-2 border-cinema-gold">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-block p-4 bg-cinema-gold/20 rounded-full mb-4">
            <Zap className="w-12 h-12 text-cinema-gold" />
          </div>
          <h2 className="text-3xl font-bold mb-2">You&apos;re on Fire! 🔥</h2>
          <p className="text-lg text-gray-600">
            You&apos;ve used <span className="font-bold text-cinema-red">{totalCreditsUsed} credits</span> creating amazing content!
          </p>
        </div>

        {/* Credit Status */}
        <div className="alert alert-warning mb-6">
          <TrendingUp className="w-5 h-5" />
          <div>
            <p className="font-semibold">
              Only {creditsRemaining} credits remaining
            </p>
            <p className="text-sm">Keep creating with a credit top-up!</p>
          </div>
        </div>

        {/* Pricing Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Starter Pack */}
          <Link
            href="/pricing"
            onClick={handleUpgradeClick}
            className="card bg-base-100 shadow-lg hover:shadow-2xl transition-all hover:scale-105 cursor-pointer border-2 border-transparent hover:border-cinema-red"
          >
            <div className="card-body">
              <div className="badge badge-primary badge-sm mb-2">MOST POPULAR</div>
              <h3 className="card-title text-cinema-red">Starter Pack</h3>
              <div className="flex items-baseline gap-2 my-2">
                <span className="text-4xl font-bold">$10</span>
                <span className="text-gray-500">500 credits</span>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  <span>10x more value than free tier</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  <span>~20 videos or 100+ images</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  <span>Never expires</span>
                </li>
              </ul>
              <div className="card-actions justify-center mt-4">
                <span className="btn btn-primary btn-block">
                  <CreditCard className="w-4 h-4" />
                  Get 500 Credits
                </span>
              </div>
            </div>
          </Link>

          {/* Pro Pack */}
          <Link
            href="/pricing"
            onClick={handleUpgradeClick}
            className="card bg-base-100 shadow-lg hover:shadow-2xl transition-all hover:scale-105 cursor-pointer border-2 border-transparent hover:border-cinema-gold"
          >
            <div className="card-body">
              <div className="badge badge-warning badge-sm mb-2">BEST VALUE</div>
              <h3 className="card-title text-cinema-gold">Pro Pack</h3>
              <div className="flex items-baseline gap-2 my-2">
                <span className="text-4xl font-bold">$20</span>
                <span className="text-gray-500">1,200 credits</span>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  <span>20% bonus credits</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  <span>~50 videos or 250+ images</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  <span>Priority support</span>
                </li>
              </ul>
              <div className="card-actions justify-center mt-4">
                <span className="btn btn-warning btn-block">
                  <Zap className="w-4 h-4" />
                  Get 1,200 Credits
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Social Proof */}
        <div className="text-center p-4 bg-base-200 rounded-lg">
          <p className="text-sm text-gray-600">
            ✨ Join <span className="font-bold text-cinema-red">thousands of creators</span> who upgraded today
          </p>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            No monthly fees • Credits never expire • Cancel anytime
          </p>
          <button
            onClick={handleClose}
            className="btn btn-ghost btn-sm mt-2"
          >
            I&apos;ll decide later
          </button>
        </div>
      </div>
    </div>
  );
}

