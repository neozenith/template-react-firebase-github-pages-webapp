import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchGoogleDriveFiles, type GoogleDriveFile } from '@/lib/google-api';

interface UseGoogleDriveResult {
  files: GoogleDriveFile[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch Google Drive files accessible to the authenticated user
 * Excludes spreadsheets (which have their own panel)
 * Requires the user to have granted drive.readonly scope
 */
export function useGoogleDrive(): UseGoogleDriveResult {
  const { accessToken } = useAuth();
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    if (!accessToken) {
      setError('No access token available. Please sign in again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchGoogleDriveFiles(accessToken);
      setFiles(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch drive files';
      setError(message);
      console.error('Error fetching Google Drive files:', err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) {
      void fetchFiles();
    }
  }, [accessToken, fetchFiles]);

  return { files, loading, error, refetch: fetchFiles };
}
