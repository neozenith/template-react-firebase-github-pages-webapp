import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { GoogleSheetsClient } from '@/lib/google-api';
import { googleApiClient, type DriveFile } from '@/lib/google-api';

interface UseGoogleSheetsResult {
  sheets: DriveFile[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch Google Sheets accessible to the authenticated user
 * Requires the user to have granted spreadsheets.readonly or drive.readonly scope
 *
 * Uses the ClientSideAPIClient architecture with self-throttling
 */
export function useGoogleSheets(): UseGoogleSheetsResult {
  const { accessToken } = useAuth();
  const [sheets, setSheets] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep a stable reference to the client
  const clientRef = useRef<GoogleSheetsClient | null>(null);

  // Update client when token changes
  useEffect(() => {
    if (accessToken) {
      clientRef.current = googleApiClient('sheets', { accessToken });
    } else {
      clientRef.current = null;
    }
  }, [accessToken]);

  const fetchSheets = useCallback(async () => {
    if (!accessToken || !clientRef.current) {
      setError('No access token available. Please sign in again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await clientRef.current.listSpreadsheets(25);
      setSheets(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch spreadsheets';
      setError(message);
      console.error('Error fetching Google Sheets:', err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) {
      void fetchSheets();
    }
  }, [accessToken, fetchSheets]);

  return { sheets, loading, error, refetch: fetchSheets };
}
