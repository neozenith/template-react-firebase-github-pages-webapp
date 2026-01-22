import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { GoogleDriveClient } from '@/lib/google-api';
import { googleApiClient, type DriveFile } from '@/lib/google-api';

interface UseGoogleDriveResult {
  files: DriveFile[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch Google Drive files accessible to the authenticated user
 * Excludes spreadsheets (which have their own panel)
 * Requires the user to have granted drive.readonly scope
 *
 * Uses the ClientSideAPIClient architecture with self-throttling
 */
export function useGoogleDrive(): UseGoogleDriveResult {
  const { accessToken } = useAuth();
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep a stable reference to the client
  const clientRef = useRef<GoogleDriveClient | null>(null);

  // Update client when token changes
  useEffect(() => {
    if (accessToken) {
      clientRef.current = googleApiClient('drive', { accessToken });
    } else {
      clientRef.current = null;
    }
  }, [accessToken]);

  const fetchFiles = useCallback(async () => {
    if (!accessToken || !clientRef.current) {
      setError('No access token available. Please sign in again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Exclude spreadsheets (they have their own panel) and trashed files
      const data = await clientRef.current.listFiles({
        q: "mimeType!='application/vnd.google-apps.spreadsheet' and trashed=false",
        orderBy: 'modifiedTime desc',
        pageSize: 25,
      });
      setFiles(data.files);
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
