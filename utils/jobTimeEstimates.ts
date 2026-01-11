/**
 * Job Time Estimates Utility
 * 
 * Provides estimated durations for different job types.
 * Used in toast notifications and Jobs Drawer.
 */

export type JobType = 
  | 'complete-scene' 
  | 'pose-generation' 
  | 'image-generation' 
  | 'audio-generation' 
  | 'workflow-execution' 
  | 'playground-experiment' 
  | 'screenplay-reading'
  | string;

/**
 * Get estimated duration for a job type
 */
export function getEstimatedDuration(jobType?: JobType): string {
  switch (jobType) {
    case 'pose-generation':
      return '2-4 minutes';
    case 'image-generation':
      return '3-5 minutes';
    case 'audio-generation':
      return '1-2 minutes';
    case 'complete-scene':
      return '5-10 minutes';
    case 'screenplay-reading':
      return '5-10 minutes'; // Actual: ~30 seconds per scene, so 10-20 scenes = 5-10 min
    case 'workflow-execution':
      return '3-7 minutes';
    default:
      return '3-5 minutes';
  }
}

