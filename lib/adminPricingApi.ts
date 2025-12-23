/**
 * Admin Pricing API Client
 * Interfaces with the backend API price management endpoints
 */

export interface PriceEntry {
  provider_id: string
  operation_type: string
  base_cost_usd: number
  retail_credits: number
  margin_percent: number
  last_updated: number
  last_verified: number
  notes?: string
}

export interface PriceChange {
  change_id: string
  provider_id: string
  operation_type: string
  old_price: number
  new_price: number
  change_percent: number
  status: 'pending' | 'approved' | 'rejected'
  detected_at: number
  approved_at?: number
  approved_by?: string
  source: 'web_scraper' | 'manual'
  impact_summary?: {
    annual_impact_usd: number
    affected_workflows: number
    recommended_action: string
  }
}

export interface WorkflowCost {
  workflow_id: string
  name: string
  total_cost_usd: number
  retail_credits: number
  margin_percent: number
  monthly_usage: number
  steps: Array<{
    provider_id: string
    operation_type: string
    cost_usd: number
  }>
}

export interface ScrapingReport {
  providers_checked: number
  changes_detected: number
  changes_auto_approved: number
  changes_pending_review: number
  errors: Array<{
    provider_id: string
    error: string
    timestamp: number
  }>
  timestamp: number
}

/**
 * Fetch all prices from the registry
 */
export async function getPriceRegistry(token?: string): Promise<{ success: boolean; prices: PriceEntry[]; error?: string }> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/admin/pricing/registry', {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return { success: true, prices: data.prices || [] }
  } catch (error: any) {
    console.error('Error fetching price registry:', error)
    return { success: false, prices: [], error: error.message }
  }
}

/**
 * Get a specific provider's price
 */
export async function getProviderPrice(
  providerId: string
): Promise<{ success: boolean; price?: PriceEntry; error?: string }> {
  try {
    const response = await fetch(`/api/admin/pricing/registry/${providerId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return { success: true, price: data.price }
  } catch (error: any) {
    console.error('Error fetching provider price:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Update a provider's price
 */
export async function updateProviderPrice(
  providerId: string,
  newCostUsd: number,
  source: 'manual' | 'web_scraper' = 'manual',
  token?: string,
  operationType?: string,
  retailCredits?: number,
  marginPercent?: number,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const body: any = {
      new_cost_usd: newCostUsd,
      source,
    };
    
    if (operationType) {
      body.operation_type = operationType;
    }
    if (retailCredits !== undefined) {
      body.retail_credits = retailCredits;
    }
    if (marginPercent !== undefined) {
      body.margin_percent = marginPercent;
    }
    if (notes !== undefined) {
      body.notes = notes;
    }

    const response = await fetch(`/api/admin/pricing/registry/${providerId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error updating provider price:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get price changes (optionally filter by status)
 */
export async function getPriceChanges(
  status?: 'pending' | 'approved' | 'rejected',
  limit?: number,
  token?: string
): Promise<{ success: boolean; changes: PriceChange[]; error?: string }> {
  try {
    const params = new URLSearchParams()
    if (status) params.append('status', status)
    if (limit) params.append('limit', limit.toString())

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Note: Price changes endpoint not yet implemented in backend
    // This is a placeholder - backend needs to add this endpoint
    const response = await fetch(`/api/admin/pricing/changes?${params.toString()}`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return { success: true, changes: data.changes || [] }
  } catch (error: any) {
    console.error('Error fetching price changes:', error)
    return { success: false, changes: [], error: error.message }
  }
}

/**
 * Approve a price change
 */
export async function approvePriceChange(changeId: string, token?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`/api/admin/pricing/changes/${changeId}/approve`, {
      method: 'PUT',
      headers,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error approving price change:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Reject a price change
 */
export async function rejectPriceChange(
  changeId: string,
  reason?: string,
  token?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`/api/admin/pricing/changes/${changeId}/reject`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ reason }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error rejecting price change:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get low margin workflows
 */
export async function getLowMarginWorkflows(
  threshold: number = 70,
  token?: string
): Promise<{ success: boolean; workflows: WorkflowCost[]; error?: string }> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`/api/admin/pricing/margins?minMargin=${threshold}`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return { success: true, workflows: data.workflows || [] }
  } catch (error: any) {
    console.error('Error fetching low margin workflows:', error)
    return { success: false, workflows: [], error: error.message }
  }
}

/**
 * Get prices needing verification (>30 days old)
 */
export async function getPricesNeedingVerification(): Promise<{
  success: boolean
  prices: PriceEntry[]
  error?: string
}> {
  try {
    const response = await fetch('/api/admin/pricing/verification', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return { success: true, prices: data.prices || [] }
  } catch (error: any) {
    console.error('Error fetching prices needing verification:', error)
    return { success: false, prices: [], error: error.message }
  }
}

/**
 * Trigger manual price scraping job
 */
export async function triggerPriceScraping(token?: string): Promise<{
  success: boolean
  report?: ScrapingReport
  error?: string
}> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Note: Price scraping endpoint not yet implemented in backend
    // This is a placeholder - backend needs to add this endpoint
    const response = await fetch('/api/admin/pricing/scrape', {
      method: 'POST',
      headers,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return { success: true, report: data.report }
  } catch (error: any) {
    console.error('Error triggering price scraping:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Bulk import prices
 */
export async function bulkImportPrices(prices: Array<{
  provider_id: string
  operation_type: string
  base_cost_usd: number
  retail_credits?: number
}>): Promise<{ success: boolean; imported: number; error?: string }> {
  try {
    const response = await fetch('/api/admin/pricing/bulk-import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prices }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return { success: true, imported: data.imported || 0 }
  } catch (error: any) {
    console.error('Error bulk importing prices:', error)
    return { success: false, imported: 0, error: error.message }
  }
}

/**
 * Get workflow cost breakdown
 */
export async function getWorkflowCost(
  workflowId: string
): Promise<{ success: boolean; workflow?: WorkflowCost; error?: string }> {
  try {
    const response = await fetch(`/api/admin/pricing/workflows/${workflowId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return { success: true, workflow: data.workflow }
  } catch (error: any) {
    console.error('Error fetching workflow cost:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get all providers from config files (comprehensive list for manual editing)
 */
export async function getAllProviders(token?: string): Promise<{
  success: boolean
  all?: any[]
  by_category?: any
  total?: number
  error?: string
}> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/admin/pricing/all-providers', {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return { success: true, ...data }
  } catch (error: any) {
    console.error('Error fetching all providers:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get comprehensive pricing statistics from config files
 */
export async function getPricingStats(token?: string): Promise<{
  success: boolean
  stats?: {
    total_providers: number
    by_category: {
      video: number
      image: number
      audio: number
      llm: number
    }
    average_margin: number
    pending_approvals: number
    needs_verification: number
  }
  error?: string
}> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/admin/pricing/stats', {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return { success: true, stats: data.stats }
  } catch (error: any) {
    console.error('Error fetching pricing stats:', error)
    return { success: false, error: error.message }
  }
}

