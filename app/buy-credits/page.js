'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { ArrowLeft, Zap } from 'lucide-react';
import QuickPurchaseModal from '@/components/billing/QuickPurchaseModal';
import { api } from '@/lib/api';

export default function BuyCreditsPage() {
  const { user, isLoaded } = useUser();
  const [credits, setCredits] = useState(null);
  const [loadingCredits, setLoadingCredits] = useState(true);
  const [showModal, setShowModal] = useState(true); // Auto-open modal

  // Note: Auth token getter is set up globally in LayoutClient
  // No need to set it up again here

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

  const handlePurchaseSuccess = () => {
    fetchCredits(); // Refresh credits
    // Keep modal open for potential additional purchases
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
    <>
      <div className="min-h-screen bg-[#0A0A0A]">
        {/* Simple Header */}
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

        {/* Minimal Content - Modal handles the rest */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-base-200 rounded-lg mb-4">
              <Zap className="w-4 h-4 text-cinema-red" />
              <span className="text-sm font-semibold text-base-content">
                {loadingCredits ? 'Loading...' : `${credits?.toLocaleString() || '0'} credits`}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-base-content mb-2">Add Credits</h1>
            <p className="text-base-content/60">
              Choose a package to continue creating
            </p>
            <p className="text-xs text-base-content/50 mt-3 max-w-md mx-auto">
              <span className="inline-flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Note: Your receipt will show "Garden State Concentrate LLC" - that's our parent company. Your purchase is for Wryda.ai services.
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Quick Purchase Modal - Auto-opens */}
      <QuickPurchaseModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          // Redirect to dashboard when modal closes
          window.location.href = '/dashboard';
        }}
        onSuccess={handlePurchaseSuccess}
        currentCredits={credits}
      />
    </>
  );
}
