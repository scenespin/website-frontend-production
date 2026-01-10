'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { X, Plus, Settings, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import QuickPurchaseModal from './QuickPurchaseModal';
import AutoRechargeModal from './AutoRechargeModal';

const LOW_CREDIT_THRESHOLD = 500;
const NEW_USER_THRESHOLD_HOURS = 48; // Show welcome message for accounts < 48 hours old

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

  // Get status dot color and border color based on credit level
  const getStatusColor = (creditBalance) => {
    if (creditBalance >= 50) return { dot: 'bg-emerald-500', border: 'border-emerald-500' };
    if (creditBalance >= 30) return { dot: 'bg-yellow-500', border: 'border-yellow-500' };
    if (creditBalance >= 15) return { dot: 'bg-orange-500', border: 'border-orange-500' };
    return { dot: 'bg-red-500', border: 'border-red-500' };
  };

  // Determine if this is a new user (account < 48 hours old with 50 credits)
  const isNewUser = user?.createdAt && credits === 50 && (() => {
    const accountAgeMs = Date.now() - new Date(user.createdAt).getTime();
    const accountAgeHours = accountAgeMs / (1000 * 60 * 60);
    return accountAgeHours < NEW_USER_THRESHOLD_HOURS;
  })();

  // Determine message type based on credit balance
  const getMessageType = () => {
    if (isNewUser) return 'welcome';
    if (credits === 0 || credits < 5) return 'veryLow';
    if (credits >= 5 && credits < 15) return 'low';
    if (credits >= 15 && credits < 30) return 'medium';
    if (credits >= 30 && credits < LOW_CREDIT_THRESHOLD) return 'moderate';
    return null;
  };

  const messageType = getMessageType();
  const shouldShow = !loading && credits !== null && messageType && !dismissed;

  if (!shouldShow) return null;

  // Render welcome message for new users
  if (messageType === 'welcome') {
    const statusColor = getStatusColor(credits);
    return (
      <>
        <div className={`bg-emerald-500/10 border-l-4 ${statusColor.border} border-t border-r border-emerald-500/20 rounded-lg px-4 py-3 mb-6`} style={{ borderTopColor: 'rgba(220, 20, 60, 0.4)' }}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className={`w-3 h-3 rounded-full ${statusColor.dot} flex-shrink-0`} />
              <div className="flex-1">
                <div className="font-semibold text-emerald-400 text-base">
                  {credits?.toLocaleString() || '50'} Credits Ready
                </div>
                <div className="text-sm text-base-content/70 mt-0.5">
                  Start creating with Story Advisor & AI writing agents
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowQuickPurchase(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-cinema-red hover:bg-cinema-red/90 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                Start Creating
              </button>
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-emerald-500/20 rounded transition-colors flex-shrink-0"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4 text-base-content/60" />
              </button>
            </div>
          </div>
        </div>

        <QuickPurchaseModal
          isOpen={showQuickPurchase}
          onClose={() => setShowQuickPurchase(false)}
          onSuccess={handlePurchaseSuccess}
          currentCredits={credits}
        />
      </>
    );
  }

  // Render very low credits message (emphasizing free screenwriting tools)
  if (messageType === 'veryLow') {
    const statusColor = getStatusColor(credits);
    return (
      <>
        <div className={`bg-emerald-500/10 border-l-4 ${statusColor.border} border-t border-r border-emerald-500/20 rounded-lg px-4 py-3 mb-6`} style={{ borderTopColor: 'rgba(220, 20, 60, 0.4)' }}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className={`w-3 h-3 rounded-full ${statusColor.dot} flex-shrink-0`} />
              <div className="flex-1">
                <div className="font-semibold text-emerald-400 text-base">
                  Great news! Your screenwriting tools are completely free
                </div>
                <div className="text-sm text-base-content/70 mt-0.5">
                  Write, edit, and format scripts with no credits. Add credits to unlock AI generation features.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowQuickPurchase(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-cinema-red hover:bg-cinema-red/90 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Credits
              </button>
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-emerald-500/20 rounded transition-colors flex-shrink-0"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4 text-base-content/60" />
              </button>
            </div>
          </div>
        </div>

        <QuickPurchaseModal
          isOpen={showQuickPurchase}
          onClose={() => setShowQuickPurchase(false)}
          onSuccess={handlePurchaseSuccess}
          currentCredits={credits}
        />
      </>
    );
  }

  // Render progressive messages for other credit levels
  const getProgressiveMessage = () => {
    if (messageType === 'low') {
      return {
        title: `${credits?.toLocaleString() || '0'} credits remaining`,
        message: `You can still use Story Advisor and all our AI writing agents in the editor!`
      };
    }
    if (messageType === 'medium') {
      return {
        title: `${credits?.toLocaleString() || '0'} credits left`,
        message: `Perfect for one more session with Story Advisor and our AI writing agents, or an image generation!`
      };
    }
    if (messageType === 'moderate') {
      return {
        title: `${credits?.toLocaleString() || '0'} credits remaining`,
        message: `Still enough to explore the editor with Story Advisor and our AI writing agents, or generate an image!`
      };
    }
    return null;
  };

  const progressiveMsg = getProgressiveMessage();
  if (!progressiveMsg) return null;

  const statusColor = getStatusColor(credits);

  return (
    <>
      <div className={`bg-emerald-500/10 border-l-4 ${statusColor.border} border-t border-r border-emerald-500/20 rounded-lg px-4 py-3 mb-6`} style={{ borderTopColor: 'rgba(220, 20, 60, 0.4)' }}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-3 h-3 rounded-full ${statusColor.dot} flex-shrink-0`} />
            <div className="flex-1">
              <div className="font-semibold text-emerald-400 text-base">
                {progressiveMsg.title}
              </div>
              <div className="text-sm text-base-content/70 mt-0.5">
                {progressiveMsg.message}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQuickPurchase(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-cinema-red hover:bg-cinema-red/90 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add More Credits
            </button>
            <button
              onClick={() => setShowAutoRecharge(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-base-200 hover:bg-base-300 text-base-content rounded-lg text-sm font-medium transition-colors border border-base-300"
            >
              <Settings className="w-4 h-4" />
              Set Up Auto-Recharge
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-emerald-500/20 rounded transition-colors flex-shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4 text-base-content/60" />
            </button>
          </div>
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

