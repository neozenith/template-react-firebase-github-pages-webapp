import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchGoogleSheets, type GoogleDriveFile } from '@/lib/google-api';

interface UseGoogleSheetsResult {
  sheets: GoogleDriveFile[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch Google Sheets accessible to the authenticated user
 * Requires the user to have granted drive.readonly scope
 */
export function useGoogleSheets(): UseGoogleSheetsResult {
  const { accessToken } = useAuth();
  const [sheets, setSheets] = useState<GoogleDriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSheets = useCallback(async () => {
    if (!accessToken) {
      setError('No access token available. Please sign in again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchGoogleSheets(accessToken);
      setSheets(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch sheets';
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
