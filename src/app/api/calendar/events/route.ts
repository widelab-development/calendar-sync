import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    }

    // Pobierz parametry z URL
    const { searchParams } = new URL(request.url);
    const maxResults = searchParams.get("maxResults") || "50";

    // Oblicz zakres dat (7 dni od teraz)
    const now = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    // Pobierz wydarzenia z Google Calendar API
    const calendarUrl =
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      `timeMin=${now.toISOString()}` +
      `&timeMax=${sevenDaysLater.toISOString()}` +
      `&maxResults=${maxResults}` +
      `&singleEvents=true` +
      `&orderBy=startTime`;

    const response = await fetch(calendarUrl, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Błąd podczas pobierania wydarzeń z kalendarza" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Wystąpił błąd podczas pobierania wydarzeń" },
      { status: 500 },
    );
  }
}
