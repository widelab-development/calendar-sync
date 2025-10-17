export interface CalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  htmlLink?: string;
  status?: string;
}

export interface CalendarSyncInfo {
  userId: string;
  syncToken?: string;
  lastSyncAt: string;
  lastUpdated?: string;
}

export interface CalendarEventsResponse {
  items: CalendarEvent[];
  summary: string;
  fromCache?: boolean;
  updated?: number;
}
