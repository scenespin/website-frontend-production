'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Sparkles, CheckCircle, X, Plus, Settings, ArrowRight } from 'lucide-react';
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
    return (
      <>
        <div className="bg-emerald-500/10 border-l-4 border-emerald-500 p-4 mb-6 rounded-r-lg">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Sparkles className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-semibold text-emerald-700 dark:text-emerald-400">
                  ✨ Welcome to Wryda.ai! You have 50 credits to get started.
                </div>
                <div className="text-sm text-emerald-600 dark:text-emerald-500 mt-2 space-y-1">
                  <div><strong>Best way to use them:</strong></div>
                  <div>→ Start in the editor with Story Advisor - explore different story directions and get AI feedback (very affordable!)</div>
                  <div>→ Or generate 1-2 images to bring your scenes to life</div>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => setShowQuickPurchase(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-cinema-red hover:bg-cinema-red/90 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Start Creating
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-emerald-500/20 rounded transition-colors flex-shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </button>
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
    return (
      <>
        <div className="bg-blue-500/10 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-semibold text-blue-700 dark:text-blue-400">
                  Great news! Your screenwriting tools are completely free
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-500 mt-1">
                  Write, edit, format, and organize your scripts with no credits needed. To generate AI images, videos, or get AI writing assistance, you'll need credits. Add more to unlock those features! 🚀
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => setShowQuickPurchase(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-cinema-red hover:bg-cinema-red/90 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Credits
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-blue-500/20 rounded transition-colors flex-shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </button>
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
        message: `You can still use the Story Advisor in the editor! 💡`,
        icon: CheckCircle,
        color: 'emerald'
      };
    }
    if (messageType === 'medium') {
      return {
        title: `${credits?.toLocaleString() || '0'} credits left`,
        message: `Perfect for one more Story Advisor session or an image generation! ✨`,
        icon: CheckCircle,
        color: 'emerald'
      };
    }
    if (messageType === 'moderate') {
      return {
        title: `You have ${credits?.toLocaleString() || '0'} credits remaining`,
        message: `Still enough to explore the editor with Story Advisor or generate an image! 🎨`,
        icon: Sparkles,
        color: 'emerald'
      };
    }
    return null;
  };

  const progressiveMsg = getProgressiveMessage();
  if (!progressiveMsg) return null;

  const IconComponent = progressiveMsg.icon;
  const colorClasses = {
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500',
      text: 'text-emerald-700 dark:text-emerald-400',
      textLight: 'text-emerald-600 dark:text-emerald-500',
      hover: 'hover:bg-emerald-500/20',
      icon: 'text-emerald-500'
    }
  };
  const colors = colorClasses[progressiveMsg.color] || colorClasses.emerald;

  return (
    <>
      <div className={`${colors.bg} border-l-4 ${colors.border} p-4 mb-6 rounded-r-lg`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <IconComponent className={`w-5 h-5 ${colors.icon} mt-0.5 flex-shrink-0`} />
            <div className="flex-1">
              <div className={`font-semibold ${colors.text}`}>
                {progressiveMsg.title}
              </div>
              <div className={`text-sm ${colors.textLight} mt-1`}>
                {progressiveMsg.message}
              </div>
              <div className="flex items-center gap-3 mt-3">
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
              </div>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className={`p-1 ${colors.hover} rounded transition-colors flex-shrink-0`}
            aria-label="Dismiss"
          >
            <X className={`w-4 h-4 ${colors.textLight}`} />
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

