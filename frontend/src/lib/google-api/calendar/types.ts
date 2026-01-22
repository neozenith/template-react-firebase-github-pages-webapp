/**
 * Google Calendar API Types
 *
 * Type definitions for Google Calendar API v3 responses and parameters.
 * @see https://developers.google.com/calendar/api/v3/reference
 */

/**
 * Calendar metadata
 */
export interface Calendar {
  /** Calendar identifier */
  id: string;
  /** Title of the calendar */
  summary: string;
  /** Description of the calendar */
  description?: string;
  /** Geographic location of the calendar */
  location?: string;
  /** The time zone of the calendar */
  timeZone?: string;
  /** The main color of the calendar */
  backgroundColor?: string;
  /** Foreground color of the calendar */
  foregroundColor?: string;
  /** Whether the calendar is the primary calendar */
  primary?: boolean;
  /** The effective access role for the current user */
  accessRole: 'freeBusyReader' | 'reader' | 'writer' | 'owner';
  /** Whether the calendar has been hidden from the list */
  hidden?: boolean;
  /** Whether the calendar content shows up in the calendar UI */
  selected?: boolean;
  /** ETag of the resource */
  etag?: string;
}

/**
 * Calendar list entry (from calendarList API)
 */
export interface CalendarListEntry extends Calendar {
  /** The default reminders the authenticated user has for this calendar */
  defaultReminders?: Reminder[];
  /** Notification settings for the calendar */
  notificationSettings?: NotificationSettings;
  /** The color of the calendar */
  colorId?: string;
}

/**
 * Notification settings
 */
export interface NotificationSettings {
  notifications: {
    type:
      | 'eventCreation'
      | 'eventChange'
      | 'eventCancellation'
      | 'eventResponse'
      | 'agenda';
    method: 'email' | 'popup';
  }[];
}

/**
 * Reminder settings
 */
export interface Reminder {
  method: 'email' | 'popup';
  minutes: number;
}

/**
 * Calendar event
 */
export interface CalendarEvent {
  /** Opaque identifier of the event */
  id: string;
  /** Status of the event */
  status?: 'confirmed' | 'tentative' | 'cancelled';
  /** Link to the event in Google Calendar */
  htmlLink?: string;
  /** Creation time of the event (RFC 3339) */
  created?: string;
  /** Last modification time (RFC 3339) */
  updated?: string;
  /** Title of the event */
  summary?: string;
  /** Description of the event */
  description?: string;
  /** Geographic location of the event */
  location?: string;
  /** Color ID of the event */
  colorId?: string;
  /** The creator of the event */
  creator?: EventAttendee;
  /** The organizer of the event */
  organizer?: EventAttendee;
  /** Start time of the event */
  start: EventDateTime;
  /** End time of the event */
  end: EventDateTime;
  /** Whether the end time is unspecified */
  endTimeUnspecified?: boolean;
  /** Recurrence rules for the event (RFC 5545) */
  recurrence?: string[];
  /** For recurring events, ID of the recurring event */
  recurringEventId?: string;
  /** For recurring events, the original start time */
  originalStartTime?: EventDateTime;
  /** Visibility of the event */
  visibility?: 'default' | 'public' | 'private' | 'confidential';
  /** The attendees of the event */
  attendees?: EventAttendee[];
  /** Whether attendees can modify the event */
  attendeesOmitted?: boolean;
  /** Extended properties of the event */
  extendedProperties?: {
    private?: Record<string, string>;
    shared?: Record<string, string>;
  };
  /** Conference data for video meetings */
  conferenceData?: ConferenceData;
  /** Reminders for the event */
  reminders?: {
    useDefault: boolean;
    overrides?: Reminder[];
  };
  /** Attachments to the event */
  attachments?: EventAttachment[];
  /** Event type */
  eventType?: 'default' | 'outOfOffice' | 'focusTime' | 'workingLocation';
  /** ETag of the resource */
  etag?: string;
  /** Whether this is an all-day event */
  allDay?: boolean;
}

/**
 * Event date/time
 */
export interface EventDateTime {
  /** Date if this is an all-day event (YYYY-MM-DD) */
  date?: string;
  /** Date-time if this is a timed event (RFC 3339) */
  dateTime?: string;
  /** Time zone (IANA format) */
  timeZone?: string;
}

/**
 * Event attendee
 */
export interface EventAttendee {
  /** Email address of the attendee */
  email?: string;
  /** Display name of the attendee */
  displayName?: string;
  /** Whether this entry represents the calendar itself */
  self?: boolean;
  /** Whether this is the organizer */
  organizer?: boolean;
  /** Whether this is a resource (room, etc.) */
  resource?: boolean;
  /** Response status of the attendee */
  responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  /** Comment from the attendee */
  comment?: string;
  /** Number of additional guests */
  additionalGuests?: number;
  /** Whether this is an optional attendee */
  optional?: boolean;
}

/**
 * Conference data for video meetings
 */
export interface ConferenceData {
  conferenceId?: string;
  conferenceSolution?: {
    key: { type: string };
    name: string;
    iconUri?: string;
  };
  entryPoints?: {
    entryPointType: 'video' | 'phone' | 'sip' | 'more';
    uri?: string;
    label?: string;
    pin?: string;
    accessCode?: string;
    meetingCode?: string;
    passcode?: string;
    password?: string;
  }[];
  notes?: string;
}

/**
 * Event attachment
 */
export interface EventAttachment {
  fileUrl: string;
  title?: string;
  mimeType?: string;
  iconLink?: string;
  fileId?: string;
}

/**
 * Options for listing events
 */
export interface EventListOptions {
  /** Maximum number of events to return (1-2500) */
  maxResults?: number;
  /** Token for pagination */
  pageToken?: string;
  /** Start of the time window (RFC 3339) */
  timeMin?: string;
  /** End of the time window (RFC 3339) */
  timeMax?: string;
  /** Filter by text query */
  q?: string;
  /** Whether to expand recurring events */
  singleEvents?: boolean;
  /** Order by startTime or updated */
  orderBy?: 'startTime' | 'updated';
  /** Whether to show deleted events */
  showDeleted?: boolean;
  /** Whether to show hidden invitations */
  showHiddenInvitations?: boolean;
  /** Time zone for start/end times */
  timeZone?: string;
  /** Sync token from previous list */
  syncToken?: string;
}

/**
 * Response from events.list
 */
export interface EventListResponse {
  items: CalendarEvent[];
  nextPageToken?: string;
  nextSyncToken?: string;
  summary?: string;
  description?: string;
  timeZone?: string;
}

/**
 * Response from calendarList.list
 */
export interface CalendarListResponse {
  items: CalendarListEntry[];
  nextPageToken?: string;
  nextSyncToken?: string;
  etag?: string;
}

/**
 * Input for creating a new event
 */
export interface NewEvent {
  summary: string;
  description?: string;
  location?: string;
  start: EventDateTime;
  end: EventDateTime;
  attendees?: { email: string; optional?: boolean }[];
  recurrence?: string[];
  reminders?: {
    useDefault: boolean;
    overrides?: Reminder[];
  };
  colorId?: string;
  visibility?: 'default' | 'public' | 'private' | 'confidential';
}

/**
 * Options for creating an event
 */
export interface CreateEventOptions {
  /** Whether to send notifications to attendees */
  sendUpdates?: 'all' | 'externalOnly' | 'none';
  /** Whether to create a Google Meet */
  conferenceDataVersion?: 0 | 1;
}

/**
 * Options for updating an event
 */
export interface UpdateEventOptions extends CreateEventOptions {
  /** Whether to send notifications about update */
  sendUpdates?: 'all' | 'externalOnly' | 'none';
}

/**
 * Options for deleting an event
 */
export interface DeleteEventOptions {
  /** Whether to send notifications about deletion */
  sendUpdates?: 'all' | 'externalOnly' | 'none';
}
