/**
 * Cache Invalidation Utility for Production Hub
 * 
 * Standardizes the aggressive cache invalidation pattern used by Locations
 * to ensure Production Hub cards update immediately when entities are modified
 * in the Creation area.
 * 
 * Pattern: removeQueries → invalidateQueries → refetchQueries (with delay)
 * 
 * The delay accounts for DynamoDB eventual consistency (default 2 seconds).
 */

import { QueryClient } from '@tanstack/react-query';

export type EntityType = 'characters' | 'locations' | 'assets';

/**
 * Invalidates Production Hub cache for a specific entity type
 * 
 * @param queryClient - React Query client instance
 * @param entityType - Type of entity ('characters', 'locations', or 'assets')
 * @param screenplayId - Screenplay/project ID
 * @param delay - Delay in milliseconds before refetch (default 2000ms for DynamoDB eventual consistency)
 */
export function invalidateProductionHubCache(
  queryClient: QueryClient,
  entityType: EntityType,
  screenplayId: string,
  delay: number = 2000
): void {
  const queryKey = [entityType, screenplayId, 'production-hub'];
  
  // Step 1: Remove query from cache completely to force a fresh fetch
  queryClient.removeQueries({ queryKey });
  
  // Step 2: Invalidate to mark as stale (in case query is recreated before refetch)
  queryClient.invalidateQueries({ queryKey });
  
  // Step 3: Refetch after delay to ensure fresh data from DynamoDB
  // The delay accounts for DynamoDB eventual consistency
  setTimeout(() => {
    queryClient.refetchQueries({ 
      queryKey,
      type: 'active' // Only refetch active queries
    });
  }, delay);
}

/**
 * Invalidates both Production Hub cache and Media Library cache
 * 
 * Useful when image operations need to refresh both caches.
 * 
 * @param queryClient - React Query client instance
 * @param entityType - Type of entity ('characters', 'locations', or 'assets')
 * @param screenplayId - Screenplay/project ID
 * @param delay - Delay in milliseconds before refetch (default 2000ms)
 */
export function invalidateProductionHubAndMediaCache(
  queryClient: QueryClient,
  entityType: EntityType,
  screenplayId: string,
  delay: number = 2000
): void {
  // Invalidate Production Hub cache
  invalidateProductionHubCache(queryClient, entityType, screenplayId, delay);
  
  // Also invalidate Media Library cache
  queryClient.invalidateQueries({ 
    queryKey: ['media', 'files', screenplayId] 
  });
}
