/**
 * useElevenLabs Hook
 * 
 * Manages ElevenLabs account connection and verified voices for the current user.
 * 
 * Feature 0037: ElevenLabs Verified Voice Integration
 */

import { useState, useEffect, useCallback } from 'react';

export interface VerifiedVoice {
  voice_id: string;
  name: string;
  category: 'cloned' | 'generated' | 'premade';
  preview_url?: string;
  labels?: Record<string, string>;
  verified_by_elevenlabs: boolean;
  created_at: string;
}

export interface ElevenLabsConnectionStatus {
  connected: boolean;
  voices: VerifiedVoice[];
  voice_count: number;
  last_synced_at?: string;
}

export interface UseElevenLabsReturn {
  // State
  connected: boolean;
  voices: VerifiedVoice[];
  loading: boolean;
  error: string | null;
  
  // Actions
  connect: (apiKey: string, consent: boolean) => Promise<void>;
  disconnect: () => Promise<void>;
  syncVoices: () => Promise<void>;
  checkStatus: () => Promise<void>;
}

export function useElevenLabs(): UseElevenLabsReturn {
  const [connected, setConnected] = useState(false);
  const [voices, setVoices] = useState<VerifiedVoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

  /**
   * Get auth token from localStorage
   */
  const getToken = useCallback(() => {
    return localStorage.getItem('jwt_token');
  }, []);

  /**
   * Check connection status
   */
  const checkStatus = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`${apiUrl}/api/elevenlabs/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: ElevenLabsConnectionStatus = await response.json();
        setConnected(data.connected);
        setVoices(data.voices || []);
      }
    } catch (err) {
      console.error('[useElevenLabs] Failed to check status:', err);
    }
  }, [apiUrl, getToken]);

  /**
   * Connect ElevenLabs account
   */
  const connect = useCallback(async (apiKey: string, consent: boolean) => {
    const token = getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/api/elevenlabs/connect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ api_key: apiKey, consent }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to connect ElevenLabs account');
      }

      setConnected(true);
      setVoices(data.voices || []);
      setError(null);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to connect ElevenLabs account';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, getToken]);

  /**
   * Disconnect ElevenLabs account
   */
  const disconnect = useCallback(async () => {
    const token = getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/api/elevenlabs/disconnect`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to disconnect ElevenLabs account');
      }

      setConnected(false);
      setVoices([]);
      setError(null);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to disconnect ElevenLabs account';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, getToken]);

  /**
   * Sync voices from ElevenLabs
   */
  const syncVoices = useCallback(async () => {
    const token = getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/api/elevenlabs/sync-voices`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to sync voices');
      }

      setVoices(data.voices || []);
      setError(null);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to sync voices';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, getToken]);

  // Check status on mount
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return {
    connected,
    voices,
    loading,
    error,
    connect,
    disconnect,
    syncVoices,
    checkStatus,
  };
}

