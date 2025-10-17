# Calendar Sync

Aplikacja Next.js z autentykacją Google (NextAuth.js) i przechowywaniem danych użytkownika w Supabase.

## Funkcjonalności

- ✅ Logowanie przez Google OAuth (NextAuth.js)
- ✅ Wyświetlanie profilu użytkownika (email)
- ✅ Checkbox z możliwością zmiany wartości (0 lub 1)
- ✅ Przechowywanie danych w Supabase (tylko jako baza danych)
- ✅ Przycisk wylogowania
- ✅ Automatyczne ładowanie danych po ponownym zalogowaniu
- ✅ **Cache'owanie wydarzeń z Google Calendar** - szybkie ładowanie i synchronizacja przyrostowa
- ✅ **Automatyczna synchronizacja** - wykrywanie nowych wydarzeń bez pełnego pobierania z API

## Architektura

- **NextAuth.js** - obsługuje autentykację Google OAuth
- **Supabase** - służy tylko jako baza danych (bez autentykacji)
- **Next.js** - framework aplikacji

## Instalacja

1. Zainstaluj zależności:

```bash
npm install
```

2. Skonfiguruj zmienne środowiskowe:
   Stwórz plik `.env.local` w głównym katalogu projektu:

```env
# Supabase (tylko jako baza danych)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google OAuth (dla NextAuth.js)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_key
```

3. Skonfiguruj Supabase i Google OAuth (szczegóły w pliku `SUPABASE_SETUP.md`)

4. **WAŻNE:** Skonfiguruj cache'owanie wydarzeń kalendarza:
   - Wykonaj migrację SQL z pliku `CALENDAR_CACHE_MIGRATION.sql` w Supabase SQL Editor
   - Szczegółowe instrukcje w pliku `CALENDAR_CACHE_SETUP.md`

## Uruchomienie

```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem `http://localhost:3000`

## Struktura projektu

- `src/app/page.tsx` - Główna strona z logiką autentykacji
- `src/components/LoginButton.tsx` - Komponent przycisku logowania
- `src/components/UserProfile.tsx` - Komponent profilu użytkownika
- `src/components/CalendarEvents.tsx` - Komponent wyświetlania wydarzeń z kalendarza
- `src/components/AuthProvider.tsx` - Provider dla NextAuth.js
- `src/hooks/useAuth.ts` - Hook do zarządzania stanem autentykacji (NextAuth.js)
- `src/hooks/useCalendarEvents.ts` - Hook do pobierania wydarzeń z kalendarza
- `src/lib/supabase.ts` - Konfiguracja klienta Supabase (tylko baza danych)
- `src/lib/calendar-cache.ts` - Funkcje cache'owania wydarzeń kalendarza
- `src/app/api/auth/[...nextauth]/route.ts` - Konfiguracja NextAuth.js
- `src/app/api/calendar/events/route.ts` - API endpoint do pobierania wydarzeń z cache'em

## Schemat bazy danych

Aplikacja używa następujących tabel w Supabase:

### `user_preferences`

Przechowuje preferencje użytkownika:

- `user_id` - ID użytkownika z NextAuth.js (string)
- `checkbox_value` - Wartość checkboxa (0 lub 1)
- `created_at` - Data utworzenia
- `updated_at` - Data ostatniej aktualizacji

### `calendar_sync`

Przechowuje informacje o synchronizacji kalendarza:

- `user_id` - ID użytkownika z NextAuth.js (string)
- `sync_token` - Token do synchronizacji przyrostowej z Google Calendar API
- `last_sync_at` - Czas ostatniej synchronizacji
- `created_at` - Data utworzenia
- `updated_at` - Data ostatniej aktualizacji

### `calendar_events`

Przechowuje wydarzenia z kalendarza (cache):

- `id` - ID wydarzenia z Google Calendar
- `user_id` - ID użytkownika
- `summary`, `description`, `location` - Dane wydarzenia
- `start_datetime`, `start_date`, `end_datetime`, `end_date` - Daty wydarzenia
- `html_link` - Link do wydarzenia w Google Calendar
- `status` - Status wydarzenia (confirmed, cancelled, etc.)
- `event_data` - Pełne dane wydarzenia (JSONB)
- `created_at`, `updated_at` - Metadane

## Dokumentacja

- `SUPABASE_SETUP.md` - Szczegółowa instrukcja konfiguracji Supabase i Google OAuth
- `CALENDAR_CACHE_SETUP.md` - Instrukcja konfiguracji cache'owania wydarzeń kalendarza
- `CALENDAR_CACHE_MIGRATION.sql` - Migracja SQL dla cache'u kalendarza
