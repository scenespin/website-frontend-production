/**
 * Admin API Service
 * 
 * React hooks and API functions for admin dashboard
 * Requires admin authentication
 */

import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// ========================================
// Types
// ========================================

export interface SystemOverview {
  total_users: number;
  users_by_tier: Record<string, number>;
  mrr: number;
  arr: number;
  credits_used_today: number;
  credits_used_week: number;
  credits_used_month: number;
  active_jobs: number;
  total_storage_gb: number;
  api_success_rate: number;
}

export interface UserListItem {
  user_id: string;
  email: string;
  name?: string;
  tier: string;
  status: string;
  credits_remaining: number;
  created_at: number;
  last_login?: number;
  total_spent?: number;
}

export interface UserDetails {
  user: {
    user_id: string;
    email: string;
    name?: string;
    plan_name: string;
    credit_balance: number;
    stripe_customer_id?: string;
    created_at?: number;
    last_login?: number;
  };
  subscription: any;
  credit_balance: number;
  project_count: number;
  storage_used_bytes: number;
  recent_activity: any[];
}

export interface FinancialMetrics {
  revenue_today: number;
  revenue_week: number;
  revenue_month: number;
  revenue_year: number;
  mrr: number;
  arr: number;
  churn_rate: number;
  ltv: number;
  new_subscriptions_month: number;
  canceled_subscriptions_month: number;
  revenue_by_tier: Record<string, number>;
}

export interface AIUsageMetrics {
  total_credits_used: number;
  credits_by_feature: Record<string, number>;
  top_users: Array<{
    user_id: string;
    email: string;
    credits_used: number;
  }>;
  usage_by_day: Array<{
    date: string;
    credits: number;
  }>;
}

export interface ActiveJob {
  job_id: string;
  user_id: string;
  type: 'video' | 'composition' | 'image' | 'audio';
  status: string;
  created_at: number;
  progress?: number;
}

export interface SystemHealth {
  database_healthy: boolean;
  s3_healthy: boolean;
  stripe_healthy: boolean;
  active_jobs: number;
  queue_depth: number;
  error_rate: number;
  avg_response_time_ms: number;
}

export interface AffiliateOverview {
  total_affiliates: number;
  active_affiliates: number;
  total_referrals: number;
  total_commissions_paid: number;
  pending_payouts: number;
  top_affiliates: Array<{
    user_id: string;
    email: string;
    referrals: number;
    commissions: number;
  }>;
}

// ========================================
// API Helper
// ========================================

async function adminFetch<T>(endpoint: string, options: Record<string, any> = {}): Promise<T> {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || 'Request failed');
  }

  return response.json();
}

// ========================================
// System Overview
// ========================================

export function useSystemOverview() {
  const [data, setData] = useState<SystemOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminFetch<SystemOverview>('/api/admin/overview');
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return { data, loading, error, refresh };
}

// ========================================
// User Management
// ========================================

export function useUsers(page: number = 1, limit: number = 20) {
  const [data, setData] = useState<{
    users: UserListItem[];
    total: number;
    page: number;
    limit: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminFetch<any>(`/api/admin/users?page=${page}&limit=${limit}`);
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [page, limit]);

  return { data, loading, error, refresh };
}

export async function getUserDetails(userId: string): Promise<UserDetails> {
  return adminFetch<UserDetails>(`/api/admin/users/${userId}`);
}

export async function suspendUser(userId: string, reason: string): Promise<void> {
  await adminFetch(`/api/admin/users/${userId}/suspend`, {
    method: 'PUT',
    body: JSON.stringify({ reason }),
  });
}

export async function unsuspendUser(userId: string): Promise<void> {
  await adminFetch(`/api/admin/users/${userId}/unsuspend`, {
    method: 'PUT',
  });
}

export async function changeUserTier(userId: string, tier: string): Promise<void> {
  await adminFetch(`/api/admin/users/${userId}/tier`, {
    method: 'PUT',
    body: JSON.stringify({ tier }),
  });
}

export async function addCredits(userId: string, amount: number, reason: string): Promise<void> {
  await adminFetch(`/api/admin/credits/${userId}/add`, {
    method: 'POST',
    body: JSON.stringify({ amount, reason }),
  });
}

export async function removeCredits(userId: string, amount: number, reason: string): Promise<void> {
  await adminFetch(`/api/admin/credits/${userId}/remove`, {
    method: 'POST',
    body: JSON.stringify({ amount, reason }),
  });
}

// ========================================
// Financial Metrics
// ========================================

export function useFinancialMetrics() {
  const [data, setData] = useState<FinancialMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminFetch<FinancialMetrics>('/api/admin/financials');
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return { data, loading, error, refresh };
}

// ========================================
// AI Usage Analytics
// ========================================

export function useAIUsage() {
  const [data, setData] = useState<AIUsageMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminFetch<AIUsageMetrics>('/api/admin/ai-usage');
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return { data, loading, error, refresh };
}

// ========================================
// System Health
// ========================================

export function useSystemHealth() {
  const [data, setData] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminFetch<SystemHealth>('/api/admin/health');
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error, refresh };
}

// ========================================
// Active Jobs
// ========================================

export function useActiveJobs() {
  const [data, setData] = useState<ActiveJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminFetch<{ jobs: ActiveJob[] }>('/api/admin/jobs');
      setData(result.jobs);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error, refresh };
}

// ========================================
// Affiliate Management
// ========================================

export function useAffiliateOverview() {
  const [data, setData] = useState<AffiliateOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminFetch<AffiliateOverview>('/api/admin/affiliates/overview');
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return { data, loading, error, refresh };
}

// ========================================
// Affiliate Management (Full CRUD)
// ========================================

export interface AffiliateListItem {
  affiliate_id: string;
  user_id: string;
  email: string;
  name?: string;
  company_name?: string;
  referral_code: string;
  status: 'pending' | 'active' | 'suspended' | 'banned';
  commission_rate: number;
  commission_type: 'recurring' | 'one-time';
  total_referrals: number;
  total_conversions: number;
  total_commissions_earned: number;
  total_commissions_paid: number;
  pending_payout: number;
  created_at: number;
}

export interface AffiliateDetails extends AffiliateListItem {
  phone?: string;
  website?: string;
  promotional_methods?: string;
  notes?: string;
  approved_by?: string;
  approved_at?: number;
  recent_referrals: any[];
  recent_commissions: any[];
}

export interface PendingPayout {
  payout_id: string;
  affiliate_id: string;
  affiliate_email: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  commissions_included: string[];
  created_at: number;
  processed_at?: number;
}

/**
 * Get all affiliates with optional filtering
 */
export function useAffiliates(status?: string, page: number = 1, limit: number = 50) {
  const [data, setData] = useState<{
    affiliates: AffiliateListItem[];
    total: number;
    page: number;
    limit: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      
      const result = await adminFetch<any>(`/api/admin/affiliates?${params.toString()}`);
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [status, page, limit]);

  return { data, loading, error, refresh };
}

/**
 * Get detailed affiliate information
 */
export async function getAffiliateDetails(affiliateId: string): Promise<AffiliateDetails> {
  return adminFetch<AffiliateDetails>(`/api/admin/affiliates/${affiliateId}`);
}

/**
 * Approve a pending affiliate
 */
export async function approveAffiliate(affiliateId: string): Promise<void> {
  await adminFetch(`/api/admin/affiliates/${affiliateId}/approve`, {
    method: 'PUT',
  });
}

/**
 * Suspend an affiliate
 */
export async function suspendAffiliate(affiliateId: string, reason: string): Promise<void> {
  await adminFetch(`/api/admin/affiliates/${affiliateId}/suspend`, {
    method: 'PUT',
    body: JSON.stringify({ reason }),
  });
}

/**
 * Unsuspend an affiliate (reactivate)
 */
export async function unsuspendAffiliate(affiliateId: string): Promise<void> {
  await adminFetch(`/api/admin/affiliates/${affiliateId}/unsuspend`, {
    method: 'PUT',
  });
}

/**
 * Ban an affiliate permanently
 */
export async function banAffiliate(affiliateId: string, reason: string): Promise<void> {
  await adminFetch(`/api/admin/affiliates/${affiliateId}/ban`, {
    method: 'PUT',
    body: JSON.stringify({ reason }),
  });
}

/**
 * Update affiliate commission rate
 */
export async function updateCommissionRate(
  affiliateId: string, 
  commissionRate: number, 
  commissionType?: 'recurring' | 'one-time',
  reason?: string
): Promise<void> {
  await adminFetch(`/api/admin/affiliates/${affiliateId}/commission-rate`, {
    method: 'PUT',
    body: JSON.stringify({ 
      commission_rate: commissionRate,
      commission_type: commissionType,
      reason,
    }),
  });
}

/**
 * Get pending payouts
 */
export function usePendingPayouts() {
  const [data, setData] = useState<PendingPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminFetch<{ payouts: PendingPayout[] }>('/api/admin/affiliates/payouts/pending');
      setData(result.payouts);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return { data, loading, error, refresh };
}

/**
 * Process payouts in batch
 */
export async function processPayouts(payoutIds: string[]): Promise<{ success: number; failed: number; results: any[] }> {
  return adminFetch<any>('/api/admin/affiliates/process-payouts', {
    method: 'POST',
    body: JSON.stringify({ payout_ids: payoutIds }),
  });
}

