"use client";

import { useCalendarEvents, CalendarEvent } from "@/hooks/useCalendarEvents";

function formatEventDate(event: CalendarEvent) {
  const start = event.start.dateTime || event.start.date;
  const end = event.end.dateTime || event.end.date;

  if (!start) return "Brak daty";

  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;

  // Sprawdź czy to wydarzenie całodniowe
  const isAllDay = !!event.start.date;

  if (isAllDay) {
    return startDate.toLocaleDateString("pl-PL", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  }

  const dateStr = startDate.toLocaleDateString("pl-PL", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const startTime = startDate.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const endTime = endDate
    ? endDate.toLocaleTimeString("pl-PL", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return `${dateStr}, ${startTime}${endTime ? ` - ${endTime}` : ""}`;
}

export default function CalendarEvents() {
  const { events, loading, error } = useCalendarEvents();

  if (loading) {
    return (
      <div className="rounded-lg bg-gray-800 p-6">
        <h3 className="mb-3 text-lg font-semibold text-white">
          Wydarzenia z kalendarza (5 dni)
        </h3>
        <p className="text-gray-400">Ładowanie wydarzeń...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-gray-800 p-6">
        <h3 className="mb-3 text-lg font-semibold text-white">
          Wydarzenia z kalendarza (5 dni)
        </h3>
        <p className="text-red-400">Błąd: {error}</p>
        <p className="mt-2 text-sm text-gray-400">
          Spróbuj wylogować się i zalogować ponownie.
        </p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-lg bg-gray-800 p-6">
        <h3 className="mb-3 text-lg font-semibold text-white">
          Wydarzenia z kalendarza (5 dni)
        </h3>
        <p className="text-gray-400">
          Brak nadchodzących wydarzeń w ciągu najbliższych 5 dni.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-gray-800 p-6">
      <h3 className="mb-4 text-lg font-semibold text-white">
        Wydarzenia z kalendarza (5 dni)
      </h3>
      <div className="space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="rounded-lg border border-gray-700 bg-gray-900 p-4 transition-colors hover:border-gray-600"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-white">
                  {event.summary || "Bez tytułu"}
                </h4>
                <p className="mt-1 text-sm text-gray-400">
                  {formatEventDate(event)}
                </p>
                {event.location && (
                  <p className="mt-1 text-sm text-gray-500">
                    📍 {event.location}
                  </p>
                )}
                {event.description && (
                  <p className="mt-2 text-sm text-gray-300">
                    {event.description}
                  </p>
                )}
              </div>
              {event.htmlLink && (
                <a
                  href={event.htmlLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-4 rounded-md bg-blue-600 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-700"
                >
                  Otwórz
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-xs text-gray-500">
        Znaleziono {events.length} wydarzeń
      </p>
    </div>
  );
}
