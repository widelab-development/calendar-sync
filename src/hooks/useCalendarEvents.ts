import { useState, useEffect, useCallback, useRef } from "react";

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  location?: string;
  htmlLink?: string;
}

export interface CalendarEventsResponse {
  items: CalendarEvent[];
  summary: string;
  fromCache?: boolean;
  updated?: number;
}

const CACHE_KEY = "calendar_events_cache";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minut - czas po którym cache jest uznawany za przestarzały

export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const hasFetchedRef = useRef(false); // Użyj ref żeby zapobiec wielokrotnemu fetchowaniu

  const fetchEvents = useCallback(
    async (forceRefresh = false) => {
      // Jeśli już pobieramy dane, nie rób tego ponownie
      if (isRevalidating && !forceRefresh) {
        return;
      }

      try {
        // Sprawdź czy są dane w localStorage
        const cachedData = localStorage.getItem(CACHE_KEY);
        let shouldFetch = forceRefresh;

        if (cachedData && !forceRefresh) {
          try {
            const parsed = JSON.parse(cachedData);
            const cacheAge = Date.now() - new Date(parsed.timestamp).getTime();

            setEvents(parsed.items || []);
            setLoading(false);
            setLastFetch(new Date(parsed.timestamp));

            // Jeśli cache jest świeży (< 5 minut), nie pobieraj z API
            if (cacheAge < CACHE_DURATION) {
              console.log(`Użyto cache (${Math.round(cacheAge / 1000)}s temu)`);
              return;
            }

            // Cache jest stary, pobierz w tle
            shouldFetch = true;
            setIsRevalidating(true);
          } catch (e) {
            console.error("Błąd parsowania cached data:", e);
            shouldFetch = true;
          }
        } else {
          shouldFetch = true;
          if (forceRefresh) {
            setIsRevalidating(true);
          }
        }

        if (!shouldFetch) {
          return;
        }

        // Pobierz świeże dane z API
        const response = await fetch("/api/calendar/events");

        if (!response.ok) {
          throw new Error("Błąd podczas pobierania wydarzeń");
        }

        const data: CalendarEventsResponse = await response.json();

        // Zapisz do localStorage
        const cacheData = {
          items: data.items || [],
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

        // Zaktualizuj wydarzenia
        setEvents(data.items || []);
        setLastFetch(new Date());

        // Pokaż informację o aktualizacji
        if (data.updated && data.updated > 0) {
          console.log(`Zaktualizowano ${data.updated} wydarzeń`);
        }

        setLoading(false);
        setIsRevalidating(false);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nieznany błąd");
        setLoading(false);
        setIsRevalidating(false);
      }
    },
    [isRevalidating],
  );

  // Pobierz dane tylko raz przy pierwszym montowaniu
  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchEvents(false);
    }
  }, [fetchEvents]);

  const refresh = useCallback(() => {
    fetchEvents(true);
  }, [fetchEvents]);

  return { events, loading, error, isRevalidating, refresh, lastFetch };
}
