'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { AlertTriangle, X, Plus, Settings } from 'lucide-react';
import { api } from '@/lib/api';
import QuickPurchaseModal from './QuickPurchaseModal';
import AutoRechargeModal from './AutoRechargeModal';

const LOW_CREDIT_THRESHOLD = 500;

export default function LowCreditBanner() {
  const { user } = useUser();
  const [credits, setCredits] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [showQuickPurchase, setShowQuickPurchase] = useState(false);
  const [showAutoRecharge, setShowAutoRecharge] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCredits();
      // Check if banner was dismissed in this session
      const dismissedKey = `low_credit_banner_dismissed_${user.id}`;
      const wasDismissed = sessionStorage.getItem(dismissedKey);
      if (wasDismissed) {
        setDismissed(true);
      }
    }
  }, [user]);

  async function fetchCredits() {
    try {
      // Auth token is handled globally by LayoutClient.js
      // No need to set it up here

      const response = await api.user.getCredits();
      const creditsData = response.data.data;
      setCredits(creditsData?.balance || 0);
    } catch (error) {
      console.error('Failed to fetch credits:', error);
      setCredits(0);
    } finally {
      setLoading(false);
    }
  }

  const handleDismiss = () => {
    setDismissed(true);
    if (user) {
      const dismissedKey = `low_credit_banner_dismissed_${user.id}`;
      sessionStorage.setItem(dismissedKey, 'true');
    }
  };

  const handlePurchaseSuccess = () => {
    fetchCredits();
    setShowQuickPurchase(false);
  };

  const handleAutoRechargeSuccess = () => {
    fetchCredits();
    setShowAutoRecharge(false);
  };

  // Show banner if credits are low and not dismissed
  const shouldShow = !loading && credits !== null && credits < LOW_CREDIT_THRESHOLD && !dismissed;

  if (!shouldShow) return null;

  return (
    <>
      <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 mb-6 rounded-r-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-amber-700 dark:text-amber-400">
                Running low on credits
              </div>
              <div className="text-sm text-amber-600 dark:text-amber-500 mt-1">
                You have {credits?.toLocaleString() || '0'} credits remaining. Add more to continue creating without interruption.
              </div>
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={() => setShowQuickPurchase(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-cinema-red hover:bg-cinema-red/90 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Buy Credits
                </button>
                <button
                  onClick={() => setShowAutoRecharge(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-base-200 hover:bg-base-300 text-base-content rounded-lg text-sm font-medium transition-colors border border-base-300"
                >
                  <Settings className="w-4 h-4" />
                  Set Up Auto-Recharge
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-amber-500/20 rounded transition-colors flex-shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </button>
        </div>
      </div>

      {/* Modals */}
      <QuickPurchaseModal
        isOpen={showQuickPurchase}
        onClose={() => setShowQuickPurchase(false)}
        onSuccess={handlePurchaseSuccess}
        currentCredits={credits}
      />

      <AutoRechargeModal
        isOpen={showAutoRecharge}
        onClose={() => setShowAutoRecharge(false)}
        onSuccess={handleAutoRechargeSuccess}
        currentSettings={null}
      />
    </>
  );
}

