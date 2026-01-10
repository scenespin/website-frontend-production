'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { Zap, ChevronDown, Settings, Plus, X } from 'lucide-react';
import { api } from '@/lib/api';
import { getAutoRechargeSettings, CREDIT_PACKAGES } from '@/lib/stripe-client';
import QuickPurchaseModal from './QuickPurchaseModal';
import AutoRechargeModal from './AutoRechargeModal';

export default function CreditWidget() {
  const { user } = useUser();
  const [credits, setCredits] = useState(null);
  const [autoRecharge, setAutoRecharge] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showQuickPurchase, setShowQuickPurchase] = useState(false);
  const [showAutoRecharge, setShowAutoRecharge] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Listen to global refreshCredits event
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Create a custom event listener for credit refresh
      const handleRefresh = () => {
        console.log('[CreditWidget] 🔔 creditsRefreshed event received, forcing refresh...');
        fetchData(true); // Force refresh when event is triggered
      };
      
      // Listen to custom credit refresh events (dispatched by Navigation component)
      window.addEventListener('creditsRefreshed', handleRefresh);
      console.log('[CreditWidget] ✅ Registered creditsRefreshed event listener');
      
      return () => {
        console.log('[CreditWidget] 🧹 Removing creditsRefreshed event listener');
        window.removeEventListener('creditsRefreshed', handleRefresh);
      };
    }
  }, [user]);

  // Periodic credit refresh (every 30 seconds) - acceptable with Redis cache
  // With Redis: 90% cache hit rate, so 30s polling is efficient and scalable
  // Event-driven refresh handles immediate updates after operations
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      // Only refresh if page is visible (don't waste resources on hidden tabs)
      if (!document.hidden) {
        fetchData();
      }
    }, 30000); // 30 seconds - acceptable with Redis cache (90% hit rate, scales to 10K+ users)
    
    return () => clearInterval(interval);
  }, [user]);

  // Refetch credits when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        // Force refresh when page becomes visible to get latest balance
        fetchData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function fetchData(forceRefresh = false) {
    try {
      console.log('[CreditWidget] 🔄 fetchData called, forceRefresh:', forceRefresh);
      setLoading(true);
      // Auth token is handled globally by LayoutClient.js
      // The API interceptor will handle auth token retrieval
      // If auth isn't ready yet, the request will fail gracefully

      // Fetch credits (use refresh parameter to bypass cache if needed)
      const startTime = Date.now();
      const creditsResponse = await api.user.getCredits(forceRefresh);
      const fetchDuration = Date.now() - startTime;
      
      console.log('[CreditWidget] 📡 API call completed in', fetchDuration + 'ms');
      // 🔒 SECURITY: Don't log full response (contains bearer token) - only log data
      const safeResponse = {
        status: creditsResponse.status,
        statusText: creditsResponse.statusText,
        data: creditsResponse.data,
        // Don't include config/headers which contain Authorization token
      };
      console.log('[CreditWidget] 📦 API response (sanitized):', safeResponse);
      
      const creditsData = creditsResponse.data.data;
      const oldCredits = credits;
      const newCredits = creditsData?.balance || 0;
      
      console.log('[CreditWidget] 🔍 Credits data:', {
        old: oldCredits,
        new: newCredits,
        change: newCredits - (oldCredits || 0),
        forceRefresh,
        fetchDuration: fetchDuration + 'ms'
      });
      
      setCredits(newCredits);

      // Fetch auto-recharge status
      try {
        const autoRechargeData = await getAutoRechargeSettings();
        setAutoRecharge(autoRechargeData);
      } catch (error) {
        console.error('Failed to fetch auto-recharge:', error);
        setAutoRecharge({ enabled: false });
      }
    } catch (error) {
      console.error('Failed to fetch credit data:', error);
      setCredits(0);
    } finally {
      setLoading(false);
    }
  }

  const handlePurchaseSuccess = () => {
    fetchData(true); // Force refresh credits (bypass cache)
    setShowQuickPurchase(false);
    setShowDropdown(false);
    
    // Also trigger global refresh for Navigation component
    if (typeof window !== 'undefined' && window.refreshCredits) {
      window.refreshCredits();
    }
  };

  const handleAutoRechargeUpdate = () => {
    fetchData(); // Refresh auto-recharge status
    setShowAutoRecharge(false);
    setShowDropdown(false);
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
      <div className="relative" ref={dropdownRef}>
        <div className="flex items-center gap-2">
          {/* Credit Balance */}
          <div className="flex items-center gap-2 px-4 py-2 bg-base-200 rounded-lg border border-base-300/50 min-h-[40px]">
            <Zap className="w-4 h-4 text-cinema-red" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-base-content leading-tight">
                {credits?.toLocaleString() || '0'}
              </span>
              <span className="text-xs text-base-content/60 leading-tight">credits</span>
            </div>
          </div>

          {/* Add Credits Button */}
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-1.5 px-4 py-2 bg-base-200 hover:bg-base-300 rounded-lg border border-base-300/50 transition-colors text-sm font-medium text-base-content min-h-[40px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Top Up</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Auto-Recharge Status Badge */}
          {autoRecharge?.enabled && (
            <button
              onClick={() => {
                setShowAutoRecharge(true);
                setShowDropdown(false);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 rounded-lg border border-green-500/30 transition-colors text-sm font-medium text-green-600 dark:text-green-400 min-h-[40px]"
              title={`Auto-recharge: ${packageName} at ${autoRecharge.threshold} credits`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Auto: On</span>
            </button>
          )}
        </div>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-base-100 rounded-lg border border-base-300 shadow-xl z-50 overflow-hidden">
            <div className="p-2">
              {/* Quick Purchase Options */}
              <button
                onClick={() => {
                  setShowQuickPurchase(true);
                  setShowDropdown(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-base-200 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-cinema-red" />
                <div>
                  <div className="text-sm font-medium text-base-content">Buy Credits</div>
                  <div className="text-xs text-base-content/60">Quick purchase</div>
                </div>
              </button>

              {/* Manage Auto-Recharge */}
              <button
                onClick={() => {
                  setShowAutoRecharge(true);
                  setShowDropdown(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-base-200 transition-colors flex items-center gap-2"
              >
                <Settings className="w-4 h-4 text-primary" />
                <div>
                  <div className="text-sm font-medium text-base-content">
                    {autoRecharge?.enabled ? 'Manage Auto-Recharge' : 'Set Up Auto-Recharge'}
                  </div>
                  <div className="text-xs text-base-content/60">
                    {autoRecharge?.enabled 
                      ? `${packageName} at ${autoRecharge.threshold} credits`
                      : 'Never run out of credits'
                    }
                  </div>
                </div>
              </button>

              {/* View All Packages */}
              <a
                href="/buy-credits"
                className="block w-full text-left px-3 py-2 rounded-lg hover:bg-base-200 transition-colors text-sm text-base-content/70"
              >
                View All Packages →
              </a>
            </div>
          </div>
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

