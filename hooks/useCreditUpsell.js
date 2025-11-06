'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

/**
 * useCreditUpsell Hook
 * 
 * Automatically checks if user should see credit upsell modal
 * Triggers when:
 * - User has used 40+ credits
 * - User has less than 10 credits remaining
 * - User hasn't purchased credits yet
 * 
 * Returns:
 * - showUpsell: boolean - whether to show modal
 * - creditsRemaining: number
 * - totalCreditsUsed: number  
 * - dismissUpsell: function - to hide modal
 */
export function useCreditUpsell() {
  const { getToken } = useAuth();
  const [showUpsell, setShowUpsell] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState(0);
  const [totalCreditsUsed, setTotalCreditsUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkCreditStatus();
  }, []);

  async function checkCreditStatus() {
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/user/credit-status', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCreditsRemaining(data.creditsRemaining || 0);
        setTotalCreditsUsed(data.totalCreditsUsed || 0);
        
        // Show upsell if criteria met and not dismissed in session
        const dismissed = sessionStorage.getItem('credit_upsell_dismissed');
        if (data.shouldShowUpsell && !dismissed) {
          setShowUpsell(true);
        }
      }
    } catch (error) {
      console.error('[useCreditUpsell] Error checking credit status:', error);
    } finally {
      setLoading(false);
    }
  }

  function dismissUpsell() {
    setShowUpsell(false);
    // Remember dismissal for this session only
    sessionStorage.setItem('credit_upsell_dismissed', 'true');
  }

  return {
    showUpsell,
    creditsRemaining,
    totalCreditsUsed,
    dismissUpsell,
    loading,
  };
}

