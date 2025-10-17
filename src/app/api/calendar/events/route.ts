import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  getSyncInfo,
  updateSyncInfo,
  getCachedEvents,
  saveEventsToCache,
  removeDeletedEvents,
  cleanupOldEvents,
} from "@/lib/calendar-cache";
import type { CalendarEvent } from "@/types/calendar";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken || !session.user?.id) {
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    }

    const userId = session.user.id;

    // Pobierz parametry z URL
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("forceRefresh") === "true";
    const maxResults = searchParams.get("maxResults") || "50";

    // Oblicz zakres dat
    const now = new Date();
    const daysToSync = new Date();
    daysToSync.setDate(daysToSync.getDate() + 5);

    // Usuń stare wydarzenia (starsze niż 7 dni)
    const cleanupDate = new Date();
    cleanupDate.setDate(cleanupDate.getDate() - 7);
    await cleanupOldEvents(userId, cleanupDate);

    // Pobierz informacje o ostatniej synchronizacji
    const syncInfo = await getSyncInfo(userId);

    // Jeśli nie wymuszono odświeżenia i mamy ostatnią datę synchronizacji,
    // użyj incremental sync z updatedMin
    if (!forceRefresh && syncInfo?.lastSyncAt) {
      try {
        // Użyj updatedMin do pobrania tylko zaktualizowanych wydarzeń
        const lastSyncDate = new Date(syncInfo.lastSyncAt);
        // Cofnij się o 1 minutę dla pewności, że nie przegapimy żadnych zmian
        lastSyncDate.setMinutes(lastSyncDate.getMinutes() - 1);

        const incrementalUrl =
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
          `timeMin=${now.toISOString()}` +
          `&timeMax=${daysToSync.toISOString()}` +
          `&updatedMin=${lastSyncDate.toISOString()}` +
          `&maxResults=${maxResults}` +
          `&singleEvents=true` +
          `&orderBy=startTime`;

        const incrementalResponse = await fetch(incrementalUrl, {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });

        if (incrementalResponse.ok) {
          const incrementalData = await incrementalResponse.json();

          // Jeśli są jakieś zaktualizowane wydarzenia
          if (incrementalData.items && incrementalData.items.length > 0) {
            const changedEvents: CalendarEvent[] = incrementalData.items;
            const deletedEventIds: string[] = [];

            // Oddziel usunięte wydarzenia od zaktualizowanych
            const eventsToSave: CalendarEvent[] = [];
            changedEvents.forEach((event: CalendarEvent) => {
              if (event.status === "cancelled") {
                deletedEventIds.push(event.id);
              } else {
                eventsToSave.push(event);
              }
            });

            // Najpierw zaktualizuj sync info
            await updateSyncInfo(userId);

            // Zapisz zaktualizowane wydarzenia
            if (eventsToSave.length > 0) {
              await saveEventsToCache(userId, eventsToSave);
            }

            // Usuń anulowane wydarzenia
            if (deletedEventIds.length > 0) {
              await removeDeletedEvents(userId, deletedEventIds);
            }

            console.log(
              `Synchronizacja przyrostowa: ${eventsToSave.length} zaktualizowanych, ${deletedEventIds.length} usuniętych`,
            );
          } else {
            // Brak zmian - tylko odśwież timestamp
            await updateSyncInfo(userId);
            console.log("Brak zmian od ostatniej synchronizacji");
          }

          // Pobierz zaktualizowane wydarzenia z cache
          const cachedEvents = await getCachedEvents(userId, now, daysToSync);

          return NextResponse.json({
            items: cachedEvents,
            summary: "Cached events",
            updated: incrementalData.items?.length || 0,
            fromCache: true,
          });
        } else {
          throw new Error(
            `Błąd incremental sync: ${incrementalResponse.status}`,
          );
        }
      } catch (error) {
        console.error("Błąd podczas incremental sync:", error);
        // W przypadku błędu, kontynuuj do pełnej synchronizacji
      }
    }

    // Pełna synchronizacja - pobierz wszystkie wydarzenia z Google Calendar API
    const calendarUrl =
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      `timeMin=${now.toISOString()}` +
      `&timeMax=${daysToSync.toISOString()}` +
      `&maxResults=${maxResults}` +
      `&singleEvents=true` +
      `&orderBy=startTime`;

    const response = await fetch(calendarUrl, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      // Jeśli API zawiedzie, spróbuj zwrócić cached dane
      const cachedEvents = await getCachedEvents(userId, now, daysToSync);
      if (cachedEvents.length > 0) {
        return NextResponse.json({
          items: cachedEvents,
          summary: "Cached events (API error fallback)",
          fromCache: true,
          warning: "Nie udało się pobrać najnowszych danych z API",
        });
      }

      return NextResponse.json(
        { error: "Błąd podczas pobierania wydarzeń z kalendarza" },
        { status: response.status },
      );
    }

    const data = await response.json();
    const events: CalendarEvent[] = data.items || [];

    // WAŻNE: Najpierw zapisz sync info (tworzy rekord w calendar_sync)
    // ponieważ calendar_events ma foreign key do calendar_sync
    await updateSyncInfo(userId);

    // Teraz zapisz wydarzenia do cache
    if (events.length > 0) {
      await saveEventsToCache(userId, events);
    }

    console.log(`Pełna synchronizacja: zapisano ${events.length} wydarzeń`);

    return NextResponse.json({
      items: events,
      summary: data.summary,
      fromCache: false,
      fullSync: true,
    });
  } catch (error) {
    console.error("Błąd:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas pobierania wydarzeń" },
      { status: 500 },
    );
  }
}
