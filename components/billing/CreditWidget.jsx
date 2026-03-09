'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Zap, Settings } from 'lucide-react';
import { useCredits } from '@/contexts/CreditsContext';
import { getAutoRechargeSettings, CREDIT_PACKAGES } from '@/lib/stripe-client';
import QuickPurchaseModal from './QuickPurchaseModal';
import AutoRechargeModal from './AutoRechargeModal';

export default function CreditWidget() {
  const { user } = useUser();
  const { credits, loading, refreshCredits } = useCredits();
  const [autoRecharge, setAutoRecharge] = useState(null);
  const [showQuickPurchase, setShowQuickPurchase] = useState(false);
  const [showAutoRecharge, setShowAutoRecharge] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAutoRechargeSettings();
    }
  }, [user]);

  async function fetchAutoRechargeSettings() {
    try {
      const autoRechargeData = await getAutoRechargeSettings();
      setAutoRecharge(autoRechargeData);
    } catch (error) {
      console.error('Failed to fetch auto-recharge:', error);
      setAutoRecharge({ enabled: false });
    }
  }

  const handlePurchaseSuccess = () => {
    refreshCredits(true);
    setShowQuickPurchase(false);
  };

  const handleAutoRechargeUpdate = () => {
    fetchAutoRechargeSettings();
    refreshCredits(true);
    setShowAutoRecharge(false);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-base-200 rounded-lg border border-base-300/50">
        <div className="w-4 h-4 border-2 border-cinema-red border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-base-content/60">Loading...</span>
      </div>
    );
  }

  const packageName = autoRecharge?.enabled && autoRecharge?.package
    ? CREDIT_PACKAGES[autoRecharge.package]?.label || autoRecharge.package
    : null;

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Credit Balance */}
        <div className="flex flex-col px-4 py-2 bg-base-200 rounded-lg border border-base-300/50 min-h-[40px]">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cinema-red flex-shrink-0" />
            <span className="text-sm font-semibold text-base-content leading-tight">
              {credits?.toLocaleString() || '0'}
            </span>
          </div>
          <span className="text-xs text-base-content/60 leading-tight text-center mt-0.5">credits</span>
        </div>

        {/* Plans Button */}
        <button
          onClick={() => setShowQuickPurchase(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-base-200 hover:bg-base-300 rounded-lg border border-base-300/50 transition-colors text-sm font-medium text-base-content min-h-[40px]"
        >
          <span className="text-base">💰</span>
          <span>Plans</span>
        </button>

        {/* Auto-Recharge Status Badge */}
        {autoRecharge?.enabled && (
          <button
            onClick={() => {
              setShowAutoRecharge(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 rounded-lg border border-green-500/30 transition-colors text-sm font-medium text-green-600 dark:text-green-400 min-h-[40px]"
            title={`Auto-recharge: ${packageName} at ${autoRecharge.threshold} credits`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Auto: On</span>
          </button>
        )}
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
        onSuccess={handleAutoRechargeUpdate}
        currentSettings={autoRecharge}
      />
    </>
  );
}

