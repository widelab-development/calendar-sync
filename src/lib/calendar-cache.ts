import { supabase } from "@/lib/supabase";
import type { CalendarEvent, CalendarSyncInfo } from "@/types/calendar";

/**
 * Pobiera informacje o ostatniej synchronizacji dla użytkownika
 */
export async function getSyncInfo(
  userId: string,
): Promise<CalendarSyncInfo | null> {
  const { data, error } = await supabase
    .from("calendar_sync")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = not found, co jest OK
    console.error("Błąd pobierania sync info:", error);
    return null;
  }

  if (!data) return null;

  return {
    userId: data.user_id,
    syncToken: data.sync_token,
    lastSyncAt: data.last_sync_at,
    lastUpdated: data.updated_at,
  };
}

/**
 * Zapisuje/aktualizuje informacje o synchronizacji
 */
export async function updateSyncInfo(
  userId: string,
  syncToken?: string,
): Promise<boolean> {
  const { error } = await supabase.from("calendar_sync").upsert(
    {
      user_id: userId,
      sync_token: syncToken,
      last_sync_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id",
    },
  );

  if (error) {
    console.error("Błąd zapisywania sync info:", error);
    return false;
  }

  return true;
}

/**
 * Pobiera cached wydarzenia z bazy danych
 */
export async function getCachedEvents(
  userId: string,
  timeMin: Date,
  timeMax: Date,
): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from("calendar_events")
    .select("event_data")
    .eq("user_id", userId)
    .neq("status", "cancelled")
    .or(
      `start_datetime.gte.${timeMin.toISOString()},start_date.gte.${timeMin.toISOString().split("T")[0]}`,
    )
    .or(
      `start_datetime.lte.${timeMax.toISOString()},start_date.lte.${timeMax.toISOString().split("T")[0]}`,
    )
    .order("start_datetime", { ascending: true, nullsFirst: false })
    .order("start_date", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("Błąd pobierania cached events:", error);
    return [];
  }

  return data?.map((row) => row.event_data as CalendarEvent) || [];
}

/**
 * Zapisuje wydarzenia do cache'u
 */
export async function saveEventsToCache(
  userId: string,
  events: CalendarEvent[],
): Promise<boolean> {
  if (events.length === 0) return true;

  const eventsToInsert = events.map((event) => ({
    id: event.id,
    user_id: userId,
    summary: event.summary || null,
    description: event.description || null,
    location: event.location || null,
    start_datetime: event.start.dateTime || null,
    start_date: event.start.date || null,
    end_datetime: event.end.dateTime || null,
    end_date: event.end.date || null,
    html_link: event.htmlLink || null,
    status: event.status || "confirmed",
    event_data: event,
  }));

  const { error } = await supabase
    .from("calendar_events")
    .upsert(eventsToInsert, {
      onConflict: "id",
    });

  if (error) {
    console.error("Błąd zapisywania events do cache:", error);
    return false;
  }

  return true;
}

/**
 * Usuwa anulowane wydarzenia z cache'u
 */
export async function removeDeletedEvents(
  userId: string,
  deletedEventIds: string[],
): Promise<boolean> {
  if (deletedEventIds.length === 0) return true;

  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("user_id", userId)
    .in("id", deletedEventIds);

  if (error) {
    console.error("Błąd usuwania events z cache:", error);
    return false;
  }

  return true;
}

/**
 * Usuwa stare wydarzenia sprzed określonej daty (czyszczenie cache)
 */
export async function cleanupOldEvents(
  userId: string,
  beforeDate: Date,
): Promise<void> {
  const dateStr = beforeDate.toISOString().split("T")[0];

  await supabase
    .from("calendar_events")
    .delete()
    .eq("user_id", userId)
    .or(
      `and(start_datetime.lt.${beforeDate.toISOString()},start_date.is.null),start_date.lt.${dateStr}`,
    );
}
