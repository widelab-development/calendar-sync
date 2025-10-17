"use client";

import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import type { CalendarEvent } from "@/types/calendar";

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
  const { events, loading, error, isRevalidating, refresh, lastFetch } =
    useCalendarEvents();

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
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Wydarzenia z kalendarza (5 dni)
        </h3>
        <div className="flex items-center gap-3">
          {lastFetch && !isRevalidating && (
            <span className="text-xs text-gray-500">
              Odświeżono:{" "}
              {lastFetch.toLocaleTimeString("pl-PL", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          {isRevalidating && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <svg
                className="h-3 w-3 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Odświeżanie...
            </div>
          )}
          <button
            onClick={refresh}
            disabled={isRevalidating}
            className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            title="Odśwież wydarzenia"
          >
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>
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
