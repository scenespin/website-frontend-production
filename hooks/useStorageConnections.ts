/**
 * useStorageConnections Hook
 * 
 * Check which cloud storage providers the user has connected
 * Used to show connection status in storage decision modals
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';

// Backend API URL for direct calls (Phase 2A: Direct Backend Auth)
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

interface StorageConnection {
  provider: string;
  connected_at: number;
  status: 'active' | 'expired' | 'revoked';
}

interface StorageConnections {
  googleDrive: boolean;
  dropbox: boolean;
  isLoading: boolean;
  error: string | null;
  connections: StorageConnection[];
  refresh: () => Promise<void>;
}

export function useStorageConnections(): StorageConnections {
  const [googleDrive, setGoogleDrive] = useState(false);
  const [dropbox, setDropbox] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connections, setConnections] = useState<StorageConnection[]>([]);

  const { getToken, isSignedIn } = useAuth();

  const fetchConnections = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if user is signed in
      if (!isSignedIn) {
        // User not logged in - silently set connections to false
        setGoogleDrive(false);
        setDropbox(false);
        setConnections([]);
        setIsLoading(false);
        return;
      }

      // Get auth token from Clerk with wryda-backend template
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        // No token available - user not authenticated
        setGoogleDrive(false);
        setDropbox(false);
        setConnections([]);
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${BACKEND_API_URL}/api/storage/connections`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch storage connections');
      }

      const data = await response.json();
      setConnections(data.connections || []);

      // Check which providers are connected and active
      const activeConnections = (data.connections || []).filter(
        (conn: StorageConnection) => conn.status === 'active'
      );

      setGoogleDrive(activeConnections.some((conn: StorageConnection) => conn.provider === 'google-drive'));
      setDropbox(activeConnections.some((conn: StorageConnection) => conn.provider === 'dropbox'));

    } catch (err: any) {
      console.error('Error fetching storage connections:', err);
      setError(err.message || 'Failed to load storage connections');
      setGoogleDrive(false);
      setDropbox(false);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, isSignedIn]);

  // Fetch on mount
  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  return {
    googleDrive,
    dropbox,
    isLoading,
    error,
    connections,
    refresh: fetchConnections
  };
}

