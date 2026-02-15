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
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    planName: string;
    amount: number;
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
        return response.subscription;
    } catch (error) {
        console.error('Error fetching subscription:', error);
        return null;
    }
}

/**
 * Cancel subscription (at end of period)
 */
export async function cancelSubscription(): Promise<void> {
    await secureFetch('/api/billing/subscription/cancel', {
        method: 'POST',
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
    return response.url;
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
 * Pro Plan: 3,000 monthly credits ($29)
 * - 120 Ray Flash videos/month
 * - OR 40 Ray 2 premium videos/month
 * 
 * Ultra Plan: 12,000 monthly credits ($99)
 * - 480 Ray Flash videos/month
 * - OR 160 Ray 2 premium videos/month
 * 
 * Studio Plan: 50,000 monthly credits ($399)
 * - 2,000 Ray Flash videos/month
 * - OR 666 Ray 2 premium videos/month
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
        credits: 3000,
        priceUSD: 29,
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO,
        features: [
            '3,000 monthly credits',
            '120 Ray Flash videos/month',
            '40 Ray 2 premium videos/month',
            'Priority generation queue',
            'Commercial usage rights',
            'Higher resolution exports',
            'Email support'
        ],
        popular: true
    },
    'Ultra Plan': {
        credits: 12000,
        priceUSD: 99,
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ULTRA,
        features: [
            '12,000 monthly credits',
            '480 Ray Flash videos/month',
            '160 Ray 2 premium videos/month',
            'Team collaboration (5 members)',
            'Unlimited screenplays',
            'Fastest queue priority',
            'Priority support (< 2hr response)'
        ]
    },
    'Studio Plan': {
        credits: 50000,
        priceUSD: 299,
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STUDIO,
        features: [
            '50,000 monthly credits',
            '2,000 Ray Flash videos/month',
            '666 Ray 2 premium videos/month',
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

