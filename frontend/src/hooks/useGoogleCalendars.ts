import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchGoogleCalendars, type GoogleCalendar } from '@/lib/google-api';

interface UseGoogleCalendarsResult {
  calendars: GoogleCalendar[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch Google Calendars accessible to the authenticated user
 * Requires the user to have granted calendar.readonly scope
 */
export function useGoogleCalendars(): UseGoogleCalendarsResult {
  const { accessToken } = useAuth();
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCalendars = useCallback(async () => {
    if (!accessToken) {
      setError('No access token available. Please sign in again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchGoogleCalendars(accessToken);
      setCalendars(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch calendars';
      setError(message);
      console.error('Error fetching Google Calendars:', err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) {
      void fetchCalendars();
    }
  }, [accessToken, fetchCalendars]);

  return { calendars, loading, error, refetch: fetchCalendars };
}
