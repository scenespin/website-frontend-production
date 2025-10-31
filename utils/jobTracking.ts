/**
 * Job Tracking Utility
 * 
 * Tracks which video/image/composition jobs user has "seen" to prevent
 * duplicate recovery notifications when user returns after phone dies/tab closes.
 * 
 * Feature 0067: Orphaned Job Recovery System
 */

export interface SeenJob {
  jobId: string;
  jobType: 'video' | 'image' | 'composition';
  seenAt: string; // ISO timestamp
  savedToStorage: boolean; // Did user save to Drive/Dropbox?
}

export interface SeenJobsMap {
  [jobId: string]: SeenJob;
}

/**
 * Get localStorage key for user's seen jobs
 */
function getSeenJobsKey(userId: string): string {
  return `seenJobs_${userId}`;
}

/**
 * Load seen jobs from localStorage
 */
function loadSeenJobs(userId: string): SeenJobsMap {
  try {
    const key = getSeenJobsKey(userId);
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      return {};
    }
    
    const parsed = JSON.parse(stored);
    return parsed as SeenJobsMap;
  } catch (error) {
    console.error('[JobTracking] Failed to load seen jobs:', error);
    return {};
  }
}

/**
 * Save seen jobs to localStorage
 */
function saveSeenJobs(userId: string, seenJobs: SeenJobsMap): void {
  try {
    const key = getSeenJobsKey(userId);
    localStorage.setItem(key, JSON.stringify(seenJobs));
  } catch (error) {
    console.error('[JobTracking] Failed to save seen jobs:', error);
  }
}

/**
 * Mark a job as "seen" (user has been notified or viewed it)
 * 
 * @param userId - User ID
 * @param jobId - Job ID
 * @param jobType - Type of job (video/image/composition)
 * @param savedToStorage - Whether user saved to external storage (optional)
 */
export function markJobAsSeen(
  userId: string,
  jobId: string,
  jobType: 'video' | 'image' | 'composition',
  savedToStorage: boolean = false
): void {
  const seenJobs = loadSeenJobs(userId);
  
  seenJobs[jobId] = {
    jobId,
    jobType,
    seenAt: new Date().toISOString(),
    savedToStorage
  };
  
  saveSeenJobs(userId, seenJobs);
  
  console.log(`[JobTracking] Marked job as seen: ${jobId} (saved: ${savedToStorage})`);
}

/**
 * Check if a job was already seen
 * 
 * @param userId - User ID
 * @param jobId - Job ID
 * @returns True if job was already seen
 */
export function wasJobSeen(userId: string, jobId: string): boolean {
  const seenJobs = loadSeenJobs(userId);
  return jobId in seenJobs;
}

/**
 * Mark a job as saved to external storage (Drive/Dropbox)
 * Updates the savedToStorage flag without changing seenAt timestamp
 * 
 * @param userId - User ID
 * @param jobId - Job ID
 */
export function markJobAsSaved(userId: string, jobId: string): void {
  const seenJobs = loadSeenJobs(userId);
  
  if (jobId in seenJobs) {
    seenJobs[jobId].savedToStorage = true;
  } else {
    // Job not seen yet, mark as both seen and saved
    seenJobs[jobId] = {
      jobId,
      jobType: 'video', // Default, will be overridden if needed
      seenAt: new Date().toISOString(),
      savedToStorage: true
    };
  }
  
  saveSeenJobs(userId, seenJobs);
  
  console.log(`[JobTracking] Marked job as saved: ${jobId}`);
}

/**
 * Get all seen jobs for a user
 * Useful for debugging or analytics
 * 
 * @param userId - User ID
 * @returns Map of seen jobs
 */
export function getAllSeenJobs(userId: string): SeenJobsMap {
  return loadSeenJobs(userId);
}

/**
 * Get count of unsaved jobs (seen but not saved to storage)
 * 
 * @param userId - User ID
 * @returns Count of unsaved jobs
 */
export function getUnsavedJobCount(userId: string): number {
  const seenJobs = loadSeenJobs(userId);
  
  return Object.values(seenJobs).filter(job => !job.savedToStorage).length;
}

/**
 * Filter out jobs that have already been seen
 * Returns only "orphaned" (unseen) jobs
 * 
 * @param userId - User ID
 * @param jobs - Array of job objects with jobId field
 * @returns Filtered array of unseen jobs
 */
export function filterUnseenJobs<T extends { jobId: string }>(
  userId: string,
  jobs: T[]
): T[] {
  const seenJobs = loadSeenJobs(userId);
  
  return jobs.filter(job => !(job.jobId in seenJobs));
}

/**
 * Clear all seen jobs for a user
 * Useful for testing or reset functionality
 * 
 * @param userId - User ID
 */
export function clearSeenJobs(userId: string): void {
  const key = getSeenJobsKey(userId);
  localStorage.removeItem(key);
  
  console.log(`[JobTracking] Cleared all seen jobs for user: ${userId}`);
}

/**
 * Clean up old seen jobs (older than 30 days)
 * Prevents localStorage from growing indefinitely
 * 
 * @param userId - User ID
 */
export function cleanupOldSeenJobs(userId: string): void {
  const seenJobs = loadSeenJobs(userId);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  let cleaned = 0;
  
  for (const [jobId, job] of Object.entries(seenJobs)) {
    const seenDate = new Date(job.seenAt);
    
    if (seenDate < thirtyDaysAgo) {
      delete seenJobs[jobId];
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    saveSeenJobs(userId, seenJobs);
    console.log(`[JobTracking] Cleaned up ${cleaned} old seen jobs`);
  }
}

/**
 * Export all seen jobs as JSON (for backup/debugging)
 * 
 * @param userId - User ID
 * @returns JSON string of seen jobs
 */
export function exportSeenJobs(userId: string): string {
  const seenJobs = loadSeenJobs(userId);
  return JSON.stringify(seenJobs, null, 2);
}

/**
 * Import seen jobs from JSON (for restore/migration)
 * 
 * @param userId - User ID
 * @param json - JSON string of seen jobs
 */
export function importSeenJobs(userId: string, json: string): void {
  try {
    const seenJobs = JSON.parse(json) as SeenJobsMap;
    saveSeenJobs(userId, seenJobs);
    console.log(`[JobTracking] Imported ${Object.keys(seenJobs).length} seen jobs`);
  } catch (error) {
    console.error('[JobTracking] Failed to import seen jobs:', error);
    throw new Error('Invalid JSON format');
  }
}

