/**
 * Workflow Analytics Tracking
 * 
 * Tracks user interactions with the workflow discovery and selection system.
 * Provides insights into:
 * - Which workflows are most popular
 * - How users discover workflows
 * - Filter and search patterns
 * - Conversion from discovery to execution
 */

/**
 * Track workflow page view / discovery
 * @param {Object} context - Discovery context
 * @param {string} context.source - Where user came from ('navigation', 'chat', 'search', 'homepage')
 * @param {number} context.workflowCount - Number of workflows shown
 * @param {string} context.category - Active category filter
 * @param {string} [context.userId] - User ID if logged in
 */
export function trackWorkflowDiscovery(context) {
  const event = {
    event: 'workflow_discovery',
    timestamp: new Date().toISOString(),
    source: context.source || 'unknown',
    workflowCount: context.workflowCount || 0,
    category: context.category || 'all',
    userId: context.userId,
    sessionId: getSessionId(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
  };

  sendAnalyticsEvent(event);
}

/**
 * Track workflow selection/click
 * @param {Object} workflow - Selected workflow
 * @param {string} workflow.id - Workflow ID
 * @param {string} workflow.name - Workflow name
 * @param {string} workflow.inputType - Input type
 * @param {string} workflow.experienceLevel - Experience level
 * @param {Object} workflow.creditRange - Credit cost range
 * @param {string} [context.source] - Where selected from ('desktop', 'mobile', 'search')
 * @param {string} [context.userId] - User ID
 */
export function trackWorkflowSelection(workflow, context = {}) {
  const event = {
    event: 'workflow_selected',
    timestamp: new Date().toISOString(),
    workflowId: workflow.id,
    workflowName: workflow.name,
    inputType: workflow.inputType,
    experienceLevel: workflow.experienceLevel,
    creditCostMin: workflow.creditRange?.min,
    creditCostMax: workflow.creditRange?.max,
    source: context.source || 'unknown',
    userId: context.userId,
    sessionId: getSessionId(),
  };

  sendAnalyticsEvent(event);
}

/**
 * Track workflow filter change
 * @param {Object} filterData - Filter information
 * @param {string} filterData.filterType - Type of filter ('category', 'level', 'action', 'characterConsistency')
 * @param {string} filterData.value - Filter value
 * @param {number} filterData.resultCount - Number of results after filter
 * @param {string} [filterData.userId] - User ID
 */
export function trackWorkflowFilter(filterData) {
  const event = {
    event: 'workflow_filtered',
    timestamp: new Date().toISOString(),
    filterType: filterData.filterType,
    filterValue: filterData.value,
    resultCount: filterData.resultCount,
    userId: filterData.userId,
    sessionId: getSessionId(),
  };

  sendAnalyticsEvent(event);
}

/**
 * Track workflow search
 * @param {Object} searchData - Search information
 * @param {string} searchData.query - Search query
 * @param {number} searchData.resultCount - Number of results
 * @param {string} [searchData.userId] - User ID
 */
export function trackWorkflowSearch(searchData) {
  const event = {
    event: 'workflow_searched',
    timestamp: new Date().toISOString(),
    searchQuery: searchData.query,
    resultCount: searchData.resultCount,
    userId: searchData.userId,
    sessionId: getSessionId(),
  };

  sendAnalyticsEvent(event);
}

/**
 * Track workflow execution start
 * @param {Object} executionData - Execution information
 * @param {string} executionData.workflowId - Workflow ID
 * @param {string} executionData.userId - User ID
 * @param {string} [executionData.source] - Where started from
 */
export function trackWorkflowExecution(executionData) {
  const event = {
    event: 'workflow_executed',
    timestamp: new Date().toISOString(),
    workflowId: executionData.workflowId,
    userId: executionData.userId,
    source: executionData.source || 'unknown',
    sessionId: getSessionId(),
  };

  sendAnalyticsEvent(event);
}

/**
 * Send analytics event to backend
 * @private
 */
async function sendAnalyticsEvent(event) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', event.event, event);
  }

  try {
    // Send to backend API
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
  } catch (error) {
    // Fail silently - don't block user experience
    console.warn('[Analytics] Failed to send event:', error);
  }
}

/**
 * Get or create session ID
 * @private
 */
function getSessionId() {
  if (typeof window === 'undefined') return undefined;
  
  let sessionId = sessionStorage.getItem('analyticsSessionId');
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analyticsSessionId', sessionId);
  }
  
  return sessionId;
}

