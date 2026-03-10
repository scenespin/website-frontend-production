/**
 * Stripe Client for Frontend
 * Handles all Stripe-related API calls from the frontend
 */

import { secureFetch } from '@/utils/api';

export interface StripeCheckoutSession {
    id: string;
    url: string;
}

export interface SubscriptionDetails {
    id: string;
    status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete';
    currentPeriodStart?: number;
    currentPeriodEnd: number;
    cancelAtPeriodEnd: boolean;
    planName: string;
    canceledAt?: number | null;
    overage?: {
        enabled: boolean;
        monthly_limit_usd: number | null;
        spend_current_month_usd: number;
        credits_used_current_month: number;
        period_key: string | null;
    };
}

export interface PaymentMethod {
    id: string;
    type: 'card';
    card: {
        brand: string;
        last4: string;
        expMonth: number;
        expYear: number;
    };
    isDefault: boolean;
}

export interface Invoice {
    id: string;
    created: string;
    amountPaid: number;
    status: string;
    hostedInvoiceUrl?: string;
    pdfUrl?: string;
}

export interface CreditPurchase {
    timestamp: string;
    credits: number;
    priceUSD: number;
    method: 'one-time' | 'auto-recharge';
}

export interface AutoRechargeSettings {
    enabled: boolean;
    threshold: number;
    package: 'starter' | 'booster' | 'mega';
    paymentMethodId?: string;
}

export interface OverageSettings {
    enabled: boolean;
    monthlyLimitUsd: number | null;
    spendCurrentMonthUsd: number;
    creditsUsedCurrentMonth: number;
    periodKey: string | null;
}

export interface BillingUsageHistoryItem {
    id: string;
    timestamp: number;
    occurredAt: string;
    eventType: string;
    eventLabel: string;
    provider: string | null;
    creditsDeducted: number;
    tokensConsumed: number;
}

export interface BillingUsageHistoryResponse {
    items: BillingUsageHistoryItem[];
    page: {
        limit: number;
        nextCursor: string | null;
        hasMore: boolean;
    };
}

/**
 * Create a Stripe checkout session for subscription
 */
export async function createCheckoutSession(
    planName: string,
    successUrl: string = `${window.location.origin}/app/billing/success`,
    cancelUrl: string = `${window.location.origin}/app/billing`
): Promise<string> {
    const response = await secureFetch('/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({
            planName,
            successUrl,
            cancelUrl,
        }),
    });
    // Backend returns { success: true, data: { sessionId, url } }
    return response.data?.url || response.url || '';
}

/**
 * Create a Stripe checkout session for one-time credit purchase
 */
export async function createCreditCheckoutSession(
    packageKey: string,
    successUrl: string = `${window.location.origin}/app/billing/success?type=credits`,
    cancelUrl: string = `${window.location.origin}/app/billing`
): Promise<string> {
    const response = await secureFetch('/api/billing/checkout/credits', {
        method: 'POST',
        body: JSON.stringify({
            packageId: packageKey, // Backend expects packageId
            successUrl,
            cancelUrl,
        }),
    });
    // Backend returns { success: true, data: { sessionId, url } }
    return response.data?.url || response.url || '';
}

/**
 * Get current subscription details
 */
export async function getSubscriptionDetails(): Promise<SubscriptionDetails | null> {
    try {
        const response = await secureFetch('/api/billing/subscription', {
            method: 'GET',
        });
        const data = response.data || response.subscription || response;
        if (!data || data.status === 'none') {
            return null;
        }
        return {
            id: data.id,
            status: data.status,
            currentPeriodStart: data.current_period_start,
            currentPeriodEnd: data.current_period_end,
            cancelAtPeriodEnd: !!data.cancel_at_period_end,
            planName: data.planName || data.plan_name || 'Free',
            canceledAt: data.canceled_at ?? null,
            overage: data.overage
        };
    } catch (error) {
        console.error('Error fetching subscription:', error);
        return null;
    }
}

/**
 * Cancel subscription (at end of period)
 */
export async function cancelSubscription(cancelAtPeriodEnd: boolean = true): Promise<void> {
    await secureFetch('/api/billing/subscription/cancel', {
        method: 'PUT',
        body: JSON.stringify({ cancelAtPeriodEnd }),
    });
}

/**
 * Get payment methods
 */
export async function getPaymentMethods(): Promise<PaymentMethod[]> {
    const response = await secureFetch('/api/billing/payment-methods', {
        method: 'GET',
    });
    return response.paymentMethods || [];
}

/**
 * Update default payment method
 */
export async function updatePaymentMethod(paymentMethodId: string): Promise<void> {
    await secureFetch('/api/billing/payment-method', {
        method: 'PUT',
        body: JSON.stringify({ paymentMethodId }),
    });
}

/**
 * Get invoice history
 */
export async function getInvoiceHistory(): Promise<Invoice[]> {
    const response = await secureFetch('/api/billing/invoices', {
        method: 'GET',
    });
    return response.invoices || [];
}

/**
 * Create Stripe Customer Portal session
 * This allows users to manage their subscription, payment methods, and invoices directly on Stripe
 */
export async function createCustomerPortalSession(
    returnUrl: string = `${window.location.origin}/app/billing`
): Promise<string> {
    const response = await secureFetch('/api/billing/portal', {
        method: 'POST',
        body: JSON.stringify({ returnUrl }),
    });
    return response.data?.url || response.url || '';
}

/**
 * Get credit purchase history
 */
export async function getCreditPurchaseHistory(): Promise<CreditPurchase[]> {
    const response = await secureFetch('/api/credits/history', {
        method: 'GET',
    });
    return response.purchases || [];
}

/**
 * Get auto-recharge settings
 */
export async function getAutoRechargeSettings(): Promise<AutoRechargeSettings> {
    const response = await secureFetch('/api/credits/auto-recharge/status', {
        method: 'GET',
    });
    // Backend returns { enabled, threshold, package, payment_method_id } directly (not wrapped)
    // But check if it's wrapped in data first
    const data = response.data || response;
    return {
        enabled: data.enabled || false,
        threshold: data.threshold || 0,
        package: data.package || null,
        paymentMethodId: data.payment_method_id || null,
    };
}

/**
 * Enable auto-recharge
 */
export async function enableAutoRecharge(
    threshold: number,
    packageKey: string,
    paymentMethodId: string
): Promise<void> {
    await secureFetch('/api/billing/auto-recharge', {
        method: 'POST',
        body: JSON.stringify({
            threshold,
            packageId: packageKey, // Backend expects packageId
            paymentMethodId,
        }),
    });
}

/**
 * Disable auto-recharge
 */
export async function disableAutoRecharge(): Promise<void> {
    await secureFetch('/api/billing/auto-recharge', {
        method: 'DELETE',
    });
}

export async function getOverageSettings(): Promise<OverageSettings> {
    const response = await secureFetch('/api/billing/overage', { method: 'GET' });
    const data = response.data || response;
    return {
        enabled: data.enabled || false,
        monthlyLimitUsd: data.monthly_limit_usd ?? null,
        spendCurrentMonthUsd: data.spend_current_month_usd || 0,
        creditsUsedCurrentMonth: data.credits_used_current_month || 0,
        periodKey: data.period_key || null,
    };
}

export async function updateOverageSettings(enabled: boolean, monthlyLimitUsd: number | null): Promise<void> {
    await secureFetch('/api/billing/overage', {
        method: 'PUT',
        body: JSON.stringify({ enabled, monthlyLimitUsd }),
    });
}

export async function getBillingUsageHistory(input?: {
    limit?: number;
    cursor?: string | null;
}): Promise<BillingUsageHistoryResponse> {
    const params = new URLSearchParams();
    if (input?.limit) params.set('limit', String(input.limit));
    if (input?.cursor) params.set('cursor', input.cursor);
    const query = params.toString();
    const path = query ? `/api/billing/usage-history?${query}` : '/api/billing/usage-history';
    const response = await secureFetch(path, { method: 'GET' });
    const data = response.data || response;
    return {
        items: Array.isArray(data?.items) ? data.items : [],
        page: {
            limit: Number(data?.page?.limit || input?.limit || 20),
            nextCursor: data?.page?.nextCursor || null,
            hasMore: Boolean(data?.page?.hasMore),
        },
    };
}

/**
 * Credit package definitions (matches backend)
 */
export const CREDIT_PACKAGES = {
    starter: {
        credits: 500,
        priceUSD: 10,
        label: 'Starter Pack',
        bestFor: 'Trying premium features',
    },
    booster: {
        credits: 1500,
        priceUSD: 25,
        label: 'Booster Pack',
        popular: true,
        bestFor: 'Active creation month',
        savings: '17% discount',
    },
    mega: {
        credits: 4000,
        priceUSD: 60,
        label: 'Mega Pack',
        bestFor: 'Heavy production month',
        savings: '25% discount',
    },
} as const;

/**
 * Subscription plan definitions (matches backend)
 * Based on actual Luma API pricing and revised economic model
 * 
 * Free Plan: 50 signup credits + 10/month
 * - 2 Luma Ray Flash videos (25 credits each)
 * - OR 0.66 Luma Ray 2 premium video (75 credits)
 * 
 * Pro Plan: 2,000 monthly credits ($20)
 * - 80 Ray Flash videos/month
 * - OR 26 Ray 2 premium videos/month
 * 
 * Ultra Plan: 7,000 monthly credits ($60)
 * - 280 Ray Flash videos/month
 * - OR 93 Ray 2 premium videos/month
 * 
 * Studio Plan: 24,000 monthly credits ($200)
 * - 960 Ray Flash videos/month
 * - OR 320 Ray 2 premium videos/month
 */
export const SUBSCRIPTION_PLANS = {
    'Free Plan': {
        credits: 50, // Signup credits
        monthlyCredits: 10, // Ongoing monthly credits
        priceUSD: 0,
        priceId: undefined,
        features: [
            '50 signup credits',
            '2 Ray Flash videos immediately',
            '10 credits/month ongoing',
            'Full screenplay editor',
            'All formatting tools',
            'Community support'
        ]
    },
    'Pro Plan': {
        credits: 2000,
        priceUSD: 20,
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO,
        features: [
            '2,000 monthly credits',
            '80 Ray Flash videos/month',
            '26 Ray 2 premium videos/month',
            'Priority generation queue',
            'Commercial usage rights',
            'Higher resolution exports',
            'Email support'
        ],
        popular: true
    },
    'Ultra Plan': {
        credits: 7000,
        priceUSD: 60,
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ULTRA,
        features: [
            '7,000 monthly credits',
            '280 Ray Flash videos/month',
            '93 Ray 2 premium videos/month',
            'Team collaboration (5 members)',
            'Unlimited screenplays',
            'Fastest queue priority',
            'Priority support (< 2hr response)'
        ]
    },
    'Studio Plan': {
        credits: 24000,
        priceUSD: 200,
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STUDIO,
        features: [
            '24,000 monthly credits',
            '960 Ray Flash videos/month',
            '320 Ray 2 premium videos/month',
            'Unlimited team members',
            'API access',
            '4K video exports',
            'Custom model training',
            'Enterprise SLA'
        ]
    }
} as const;

/**
 * Type-safe helper to get subscription plan by name
 */
export function getSubscriptionPlan(planName: string): typeof SUBSCRIPTION_PLANS[keyof typeof SUBSCRIPTION_PLANS] | undefined {
    if (planName in SUBSCRIPTION_PLANS) {
        return SUBSCRIPTION_PLANS[planName as keyof typeof SUBSCRIPTION_PLANS];
    }
    return undefined;
}

