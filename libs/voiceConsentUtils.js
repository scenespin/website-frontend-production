/**
 * Voice Consent Utilities
 * 
 * Helper functions for checking and managing voice consent in the frontend.
 * Use these to gate voice cloning features.
 */

/**
 * Check if user has active voice consent
 * @returns {Promise<{hasConsent: boolean, consent: object|null}>}
 */
export async function checkVoiceConsent() {
  try {
    const response = await fetch('/api/voice-cloning/consent');
    const data = await response.json();

    return {
      hasConsent: response.ok && data.hasConsent,
      consent: data.hasConsent ? data : null,
    };
  } catch (error) {
    console.error('Error checking voice consent:', error);
    return { hasConsent: false, consent: null };
  }
}

/**
 * Submit voice consent
 * @param {object} consentData - Consent form data
 * @returns {Promise<{success: boolean, consentId?: string, error?: string}>}
 */
export async function submitVoiceConsent(consentData) {
  try {
    const response = await fetch('/api/voice-cloning/consent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(consentData),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error };
    }

    return { success: true, consentId: data.consentId };
  } catch (error) {
    console.error('Error submitting consent:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Revoke voice consent
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function revokeVoiceConsent() {
  try {
    const response = await fetch('/api/voice-cloning/revoke', {
      method: 'POST',
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error };
    }

    return { success: true };
  } catch (error) {
    console.error('Error revoking consent:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Download voice consent agreement
 * @param {string} format - 'html' or 'json'
 * @returns {Promise<void>}
 */
export async function downloadVoiceConsent(format = 'html') {
  try {
    const response = await fetch(`/api/voice-cloning/consent/download?format=${format}`);
    
    if (format === 'html') {
      const html = await response.text();
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } else {
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voice-consent-${Date.now()}.json`;
      a.click();
    }
  } catch (error) {
    console.error('Error downloading consent:', error);
    throw error;
  }
}

/**
 * React hook for managing voice consent state
 * @returns {object}
 */
export function useVoiceConsent() {
  const [hasConsent, setHasConsent] = React.useState(false);
  const [consent, setConsent] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const checkConsent = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await checkVoiceConsent();
      setHasConsent(result.hasConsent);
      setConsent(result.consent);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    checkConsent();
  }, [checkConsent]);

  const submitConsent = React.useCallback(async (consentData) => {
    const result = await submitVoiceConsent(consentData);
    
    if (result.success) {
      await checkConsent(); // Refresh consent status
    }
    
    return result;
  }, [checkConsent]);

  const revokeConsent = React.useCallback(async () => {
    const result = await revokeVoiceConsent();
    
    if (result.success) {
      setHasConsent(false);
      setConsent(null);
    }
    
    return result;
  }, []);

  const downloadConsent = React.useCallback(async (format = 'html') => {
    return downloadVoiceConsent(format);
  }, []);

  return {
    hasConsent,
    consent,
    loading,
    error,
    checkConsent,
    submitConsent,
    revokeConsent,
    downloadConsent,
  };
}

// Re-export React from 'react' for the hook
import * as React from 'react';

export default {
  checkVoiceConsent,
  submitVoiceConsent,
  revokeVoiceConsent,
  downloadVoiceConsent,
  useVoiceConsent,
};

