/**
 * Google Calendar API Client
 *
 * Client for interacting with Google Calendar API v3.
 * Provides calendar and event operations.
 *
 * @see https://developers.google.com/calendar/api/v3/reference
 */

import { GoogleApiClient } from '../client';
import type { ClientConfig } from '../types';
import type {
  Calendar,
  CalendarEvent,
  CalendarListEntry,
  CalendarListResponse,
  CreateEventOptions,
  DeleteEventOptions,
  EventListOptions,
  EventListResponse,
  NewEvent,
  UpdateEventOptions,
} from './types';

// Re-export types for convenience
export * from './types';

/**
 * Google Calendar API client
 *
 * Provides methods for:
 * - Listing calendars
 * - Getting calendar metadata
 * - Listing events
 * - Creating, updating, and deleting events
 */
export class GoogleCalendarClient extends GoogleApiClient {
  constructor(config: ClientConfig) {
    super(config, 'calendar');
  }

  /**
   * List all calendars for the authenticated user
   *
   * @param pageSize - Maximum number of calendars to return
   * @returns List of calendars
   */
  async listCalendars(pageSize = 25): Promise<CalendarListEntry[]> {
    const response = await this.get<CalendarListResponse>(
      '/users/me/calendarList',
      {
        maxResults: String(pageSize),
      }
    );

    return response.items;
  }

  /**
   * List all calendars, handling pagination automatically
   *
   * @returns All calendars
   */
  async listAllCalendars(): Promise<CalendarListEntry[]> {
    const allCalendars: CalendarListEntry[] = [];
    let pageToken: string | undefined;

    do {
      const params: Record<string, string> = { maxResults: '250' };
      if (pageToken) params.pageToken = pageToken;

      const response = await this.get<CalendarListResponse>(
        '/users/me/calendarList',
        params
      );

      allCalendars.push(...response.items);
      pageToken = response.nextPageToken;
    } while (pageToken);

    return allCalendars;
  }

  /**
   * Get a specific calendar
   *
   * @param calendarId - Calendar ID (use 'primary' for the user's primary calendar)
   * @returns Calendar metadata
   */
  async getCalendar(calendarId: string): Promise<Calendar> {
    return this.get<Calendar>(`/calendars/${encodeURIComponent(calendarId)}`);
  }

  /**
   * List events from a calendar
   *
   * @param calendarId - Calendar ID ('primary' for primary calendar)
   * @param options - List options (time range, filtering, etc.)
   * @returns List of events with pagination token
   *
   * @example
   * // Get events for the next month
   * const now = new Date();
   * const nextMonth = new Date(now);
   * nextMonth.setMonth(now.getMonth() + 1);
   *
   * const response = await calendar.listEvents('primary', {
   *   timeMin: now.toISOString(),
   *   timeMax: nextMonth.toISOString(),
   *   singleEvents: true,
   *   orderBy: 'startTime',
   * });
   */
  async listEvents(
    calendarId: string,
    options: EventListOptions = {}
  ): Promise<EventListResponse> {
    const params: Record<string, string> = {};

    if (options.maxResults) params.maxResults = String(options.maxResults);
    if (options.pageToken) params.pageToken = options.pageToken;
    if (options.timeMin) params.timeMin = options.timeMin;
    if (options.timeMax) params.timeMax = options.timeMax;
    if (options.q) params.q = options.q;
    if (options.singleEvents !== undefined) {
      params.singleEvents = String(options.singleEvents);
    }
    if (options.orderBy) params.orderBy = options.orderBy;
    if (options.showDeleted !== undefined) {
      params.showDeleted = String(options.showDeleted);
    }
    if (options.showHiddenInvitations !== undefined) {
      params.showHiddenInvitations = String(options.showHiddenInvitations);
    }
    if (options.timeZone) params.timeZone = options.timeZone;
    if (options.syncToken) params.syncToken = options.syncToken;

    return this.get<EventListResponse>(
      `/calendars/${encodeURIComponent(calendarId)}/events`,
      params
    );
  }

  /**
   * List all events, handling pagination automatically
   *
   * @param calendarId - Calendar ID
   * @param options - List options (excluding pageToken)
   * @param maxResults - Maximum total events to fetch
   * @returns All matching events
   */
  async listAllEvents(
    calendarId: string,
    options: Omit<EventListOptions, 'pageToken'> = {},
    maxResults?: number
  ): Promise<CalendarEvent[]> {
    const allEvents: CalendarEvent[] = [];
    let pageToken: string | undefined;

    do {
      const response = await this.listEvents(calendarId, {
        ...options,
        pageToken,
        maxResults: options.maxResults ?? 250,
      });

      allEvents.push(...response.items);
      pageToken = response.nextPageToken;

      if (maxResults && allEvents.length >= maxResults) {
        return allEvents.slice(0, maxResults);
      }
    } while (pageToken);

    return allEvents;
  }

  /**
   * Get a specific event
   *
   * @param calendarId - Calendar ID
   * @param eventId - Event ID
   * @returns Event details
   */
  async getEvent(calendarId: string, eventId: string): Promise<CalendarEvent> {
    return this.get<CalendarEvent>(
      `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`
    );
  }

  /**
   * Create a new event
   *
   * @param calendarId - Calendar ID
   * @param event - Event data
   * @param options - Creation options
   * @returns Created event
   *
   * @example
   * const event = await calendar.createEvent('primary', {
   *   summary: 'Team Meeting',
   *   description: 'Weekly sync',
   *   start: { dateTime: '2026-01-22T10:00:00Z' },
   *   end: { dateTime: '2026-01-22T11:00:00Z' },
   *   attendees: [{ email: 'colleague@example.com' }],
   * });
   */
  async createEvent(
    calendarId: string,
    event: NewEvent,
    options: CreateEventOptions = {}
  ): Promise<CalendarEvent> {
    const params: Record<string, string> = {};
    if (options.sendUpdates) params.sendUpdates = options.sendUpdates;
    if (options.conferenceDataVersion !== undefined) {
      params.conferenceDataVersion = String(options.conferenceDataVersion);
    }

    const queryString =
      Object.keys(params).length > 0
        ? `?${new URLSearchParams(params).toString()}`
        : '';

    return this.post<CalendarEvent>(
      `/calendars/${encodeURIComponent(calendarId)}/events${queryString}`,
      event
    );
  }

  /**
   * Update an existing event
   *
   * @param calendarId - Calendar ID
   * @param eventId - Event ID
   * @param event - Partial event data to update
   * @param options - Update options
   * @returns Updated event
   */
  async updateEvent(
    calendarId: string,
    eventId: string,
    event: Partial<CalendarEvent>,
    options: UpdateEventOptions = {}
  ): Promise<CalendarEvent> {
    const params: Record<string, string> = {};
    if (options.sendUpdates) params.sendUpdates = options.sendUpdates;
    if (options.conferenceDataVersion !== undefined) {
      params.conferenceDataVersion = String(options.conferenceDataVersion);
    }

    const queryString =
      Object.keys(params).length > 0
        ? `?${new URLSearchParams(params).toString()}`
        : '';

    return this.patch<CalendarEvent>(
      `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}${queryString}`,
      event
    );
  }

  /**
   * Delete an event
   *
   * @param calendarId - Calendar ID
   * @param eventId - Event ID
   * @param options - Deletion options
   */
  async deleteEvent(
    calendarId: string,
    eventId: string,
    options: DeleteEventOptions = {}
  ): Promise<void> {
    const params: Record<string, string> = {};
    if (options.sendUpdates) params.sendUpdates = options.sendUpdates;

    const queryString =
      Object.keys(params).length > 0
        ? `?${new URLSearchParams(params).toString()}`
        : '';

    await this.delete<undefined>(
      `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}${queryString}`
    );
  }

  /**
   * Quick add an event using text
   *
   * Google parses the text to create an event (e.g., "Meeting tomorrow at 10am")
   *
   * @param calendarId - Calendar ID
   * @param text - Natural language text describing the event
   * @returns Created event
   */
  async quickAdd(calendarId: string, text: string): Promise<CalendarEvent> {
    const params = new URLSearchParams({ text });

    return this.post<CalendarEvent>(
      `/calendars/${encodeURIComponent(calendarId)}/events/quickAdd?${params.toString()}`
    );
  }

  /**
   * Get upcoming events from the primary calendar
   *
   * Convenience method for common use case of showing upcoming events.
   *
   * @param days - Number of days to look ahead (default: 7)
   * @param maxResults - Maximum events to return (default: 10)
   * @returns Upcoming events sorted by start time
   */
  async getUpcomingEvents(days = 7, maxResults = 10): Promise<CalendarEvent[]> {
    const now = new Date();
    const future = new Date(now);
    future.setDate(now.getDate() + days);

    const response = await this.listEvents('primary', {
      timeMin: now.toISOString(),
      timeMax: future.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults,
    });

    return response.items;
  }
}
