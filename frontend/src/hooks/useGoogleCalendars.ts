import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { GoogleCalendarClient } from '@/lib/google-api';
import { googleApiClient, type CalendarListEntry } from '@/lib/google-api';

interface UseGoogleCalendarsResult {
  calendars: CalendarListEntry[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch Google Calendars accessible to the authenticated user
 * Requires the user to have granted calendar.readonly scope
 *
 * Uses the ClientSideAPIClient architecture with self-throttling
 */
export function useGoogleCalendars(): UseGoogleCalendarsResult {
  const { accessToken } = useAuth();
  const [calendars, setCalendars] = useState<CalendarListEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep a stable reference to the client
  const clientRef = useRef<GoogleCalendarClient | null>(null);

  // Update client when token changes
  useEffect(() => {
    if (accessToken) {
      clientRef.current = googleApiClient('calendar', { accessToken });
    } else {
      clientRef.current = null;
    }
  }, [accessToken]);

  const fetchCalendars = useCallback(async () => {
    if (!accessToken || !clientRef.current) {
      setError('No access token available. Please sign in again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await clientRef.current.listCalendars(25);
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
