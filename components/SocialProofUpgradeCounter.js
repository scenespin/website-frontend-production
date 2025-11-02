'use client';

import { useEffect, useState } from 'react';

/**
 * Social Proof Upgrade Counter
 * 
 * Displays live upgrade count with animation
 * Shows "X creators upgraded today!" message
 * 
 * Props:
 * - className: Additional CSS classes
 * - showIcon: Whether to show emoji/icon (default: true)
 */
export default function SocialProofUpgradeCounter({ className = '', showIcon = true }) {
  const [upgradeCount, setUpgradeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUpgradeStats();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchUpgradeStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function fetchUpgradeStats() {
    try {
      const response = await fetch('/api/admin/revenue/upgrade-stats');
      
      if (response.ok) {
        const data = await response.json();
        setUpgradeCount(data.todayUpgrades || 0);
        setError(null);
      } else {
        // If not admin or endpoint fails, show fallback
        setUpgradeCount(0);
      }
    } catch (err) {
      console.error('[SocialProofUpgradeCounter] Error fetching stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Don't show if loading or error or count is 0
  if (loading || error || upgradeCount === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      {showIcon && <span className="text-lg">✨</span>}
      <span className="font-semibold text-cinema-red">
        {upgradeCount}
      </span>
      <span className="text-base-content/60">
        {upgradeCount === 1 ? 'creator upgraded' : 'creators upgraded'} today!
      </span>
    </div>
  );
}

