/**
 * Centralized Plan Configuration
 * 
 * Single source of truth for subscription plans.
 * Ensures consistency between signup page, billing, and Stripe integration.
 */

/**
 * Plan IDs - Use these constants everywhere instead of string literals
 */
export const PLAN_IDS = {
  FREE: 'free',
  PRO: 'pro',
  ULTRA: 'ultra',
  STUDIO: 'studio',
} as const;

export type PlanId = typeof PLAN_IDS[keyof typeof PLAN_IDS];

/**
 * Display names for plans (user-facing)
 */
export const PLAN_DISPLAY_NAMES: Record<PlanId, string> = {
  [PLAN_IDS.FREE]: 'Free Plan',
  [PLAN_IDS.PRO]: 'Pro Plan',
  [PLAN_IDS.ULTRA]: 'Ultra Plan',
  [PLAN_IDS.STUDIO]: 'Studio Plan',
};

/**
 * Legacy display name to plan ID mapping (for backward compatibility)
 * Use this to convert old 'Free Plan' strings to new 'free' constants
 */
export const LEGACY_PLAN_NAMES: Record<string, PlanId> = {
  'Free Plan': PLAN_IDS.FREE,
  'Pro Plan': PLAN_IDS.PRO,
  'Ultra Plan': PLAN_IDS.ULTRA,
  'Studio Plan': PLAN_IDS.STUDIO,
  'Free': PLAN_IDS.FREE,
  'Pro': PLAN_IDS.PRO,
  'Ultra': PLAN_IDS.ULTRA,
  'Studio': PLAN_IDS.STUDIO,
  'free': PLAN_IDS.FREE,
  'pro': PLAN_IDS.PRO,
  'ultra': PLAN_IDS.ULTRA,
  'studio': PLAN_IDS.STUDIO,
};

/**
 * Complete plan details for UI display
 */
export interface PlanDetails {
  id: PlanId;
  displayName: string;
  price: string;
  priceUSD: number;
  color: string;
  credits: string;
  keyFeatures: string[];
  badge?: string;
  icon: string;
  // Signup page specific
  signupHeadline?: string;
  signupSubheadline?: string;
  signupValueProp?: string;
  targetAudience?: string;
}

export const PLAN_DETAILS: Record<PlanId, PlanDetails> = {
  [PLAN_IDS.FREE]: {
    id: PLAN_IDS.FREE,
    displayName: PLAN_DISPLAY_NAMES[PLAN_IDS.FREE],
    price: '$0/month',
    priceUSD: 0,
    color: 'text-slate-400',
    credits: '50 AI credits/month',
    icon: '⚡',
    keyFeatures: [
      'Professional Fountain Editor',
      'Industry-standard formatting',
      'Mobile-responsive design',
      'Export to PDF',
    ],
    signupHeadline: 'Start Writing in Minutes',
    signupSubheadline:
      'Join a professional, screenplay-native workspace for faster drafts, sharper rewrites, and stronger pages.',
    signupValueProp:
      'Ideal for writers getting started with professional screenplay workflows.',
    targetAudience: 'Independent writers, students, and aspiring screenwriters',
  },
  [PLAN_IDS.PRO]: {
    id: PLAN_IDS.PRO,
    displayName: PLAN_DISPLAY_NAMES[PLAN_IDS.PRO],
    price: '$20/month',
    priceUSD: 20,
    color: 'text-indigo-500',
    credits: '2,000 AI credits/month',
    icon: '✨',
    keyFeatures: [
      'Three AI Writing Agents (Chat, Director, Precision Editor)',
      '~80 Professional (1080p) or ~26 Premium (4K) videos/month',
      '1,000+ AI images/month',
      'Cloud sync & collaboration',
    ],
    badge: 'Most Popular',
    signupHeadline: 'Write Faster, Produce More',
    signupSubheadline:
      'More monthly credits for consistent writing, visual planning, and delivery workflows.',
    signupValueProp:
      'Monthly credits for frequent writing-agent and production runs.',
    targetAudience: 'Active writers, creators, and small production teams',
  },
  [PLAN_IDS.ULTRA]: {
    id: PLAN_IDS.ULTRA,
    displayName: PLAN_DISPLAY_NAMES[PLAN_IDS.ULTRA],
    price: '$60/month',
    priceUSD: 60,
    color: 'text-purple-500',
    credits: '7,000 AI credits/month',
    icon: '🎬',
    keyFeatures: [
      'Professional Video Generation at scale',
      'All Premium AI Models',
      'Team collaboration and faster throughput',
      'Priority support',
    ],
    badge: 'Best Value',
    signupHeadline: 'Scale High-Volume Production',
    signupSubheadline:
      'High-capacity credits and priority support for teams shipping regularly.',
    signupValueProp:
      'Steady monthly credits for teams running regular production cycles.',
    targetAudience: 'Production companies, agencies, and high-volume teams',
  },
  [PLAN_IDS.STUDIO]: {
    id: PLAN_IDS.STUDIO,
    displayName: PLAN_DISPLAY_NAMES[PLAN_IDS.STUDIO],
    price: '$200/month',
    priceUSD: 200,
    color: 'text-rose-500',
    credits: '24,000 AI credits/month',
    icon: '🏢',
    keyFeatures: [
      '960 Ray Flash videos/month',
      '320 Ray 2 premium videos/month',
      'Unlimited team members',
      'Enterprise support',
    ],
    signupHeadline: 'Enterprise Throughput',
    signupSubheadline:
      'Highest monthly credits for studios and teams running large production workloads.',
    signupValueProp:
      'Built for high-volume organizations that need scale and predictable billing.',
    targetAudience: 'Studios, agencies, and enterprise production teams',
  },
};

/**
 * Get all available plans as an array
 */
export function getAllPlans(): PlanDetails[] {
  return Object.values(PLAN_DETAILS);
}

/**
 * Get plan details by ID
 */
export function getPlanDetails(planId: PlanId | string): PlanDetails | null {
  // Try direct lookup
  if (planId in PLAN_DETAILS) {
    return PLAN_DETAILS[planId as PlanId];
  }
  
  // Try legacy name conversion
  if (planId in LEGACY_PLAN_NAMES) {
    const convertedId = LEGACY_PLAN_NAMES[planId];
    return PLAN_DETAILS[convertedId];
  }
  
  return null;
}

/**
 * Validate if a string is a valid plan ID
 */
export function isValidPlanId(planId: string): planId is PlanId {
  return planId in PLAN_DETAILS || planId in LEGACY_PLAN_NAMES;
}

/**
 * Convert legacy plan name to modern plan ID
 */
export function normalizePlanId(planNameOrId: string): PlanId | null {
  if (planNameOrId in LEGACY_PLAN_NAMES) {
    return LEGACY_PLAN_NAMES[planNameOrId];
  }
  return null;
}

/**
 * Get plan display name (for backward compatibility with existing code)
 */
export function getPlanDisplayName(planId: PlanId | string): string {
  const details = getPlanDetails(planId);
  return details?.displayName || 'Unknown Plan';
}

