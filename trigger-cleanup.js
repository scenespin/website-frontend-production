/**
 * Trigger Expired Media Cleanup
 * 
 * Run this in your browser console while logged into the app.
 * It will trigger the cleanup endpoint to archive expired Media Library records.
 * 
 * Usage:
 * 1. Open browser console (F12) while on wryda.ai
 * 2. Copy and paste this entire script
 * 3. Press Enter
 */

(async function() {
  try {
    // Get token from Clerk (should be available in window)
    if (!window.Clerk || !window.Clerk.session) {
      throw new Error('Not logged in. Please log in first.');
    }
    
    const token = await window.Clerk.session.getToken({ template: 'wryda-backend' });
    if (!token) {
      throw new Error('Failed to get authentication token');
    }
    
    const API_URL = 'https://api.wryda.ai';
    
    // Auto-detect screenplayId from various sources
    let screenplayId = null;
    
    // Try URL params first
    const urlParams = new URLSearchParams(window.location.search);
    screenplayId = urlParams.get('project') || urlParams.get('screenplayId');
    
    // Try localStorage (backward compatibility)
    if (!screenplayId && typeof localStorage !== 'undefined') {
      screenplayId = localStorage.getItem('current_screenplay_id');
    }
    
    // Try Clerk metadata if available
    if (!screenplayId && window.Clerk?.user?.unsafeMetadata?.current_screenplay_id) {
      screenplayId = window.Clerk.user.unsafeMetadata.current_screenplay_id;
    }
    
    // If still not found, prompt user
    if (!screenplayId) {
      screenplayId = prompt('Enter screenplay ID (required for cleanup):');
      if (!screenplayId) {
        throw new Error('Screenplay ID is required for cleanup');
      }
    }
    
    console.log('🧹 Starting expired media cleanup...');
    console.log('📡 API URL:', API_URL);
    console.log('📝 Screenplay ID:', screenplayId);
    
    // Trigger cleanup (not dry-run)
    const requestBody = {
      dryRun: false,
      limit: 1000, // Process up to 1000 files
    };
    
    // Add screenplayId if provided
    if (screenplayId) {
      requestBody.screenplayId = screenplayId;
    }
    
    const response = await fetch(`${API_URL}/api/media/cleanup-expired`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Cleanup failed: ${error.message || response.statusText} (${response.status})`);
    }
    
    const result = await response.json();
    
    console.log('✅ Cleanup completed!');
    console.log('📊 Statistics:', result.statistics);
    console.log('⏱️ Processing time:', result.processingTimeMs, 'ms');
    
    return result;
  } catch (error) {
    console.error('❌ Error triggering cleanup:', error);
    throw error;
  }
})();
