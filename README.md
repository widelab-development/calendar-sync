# Calendar Sync

Aplikacja Next.js z autentykacją Google (NextAuth.js) i przechowywaniem danych użytkownika w Supabase.

## Funkcjonalności

- ✅ Logowanie przez Google OAuth (NextAuth.js)
- ✅ Wyświetlanie profilu użytkownika (email)
- ✅ Checkbox z możliwością zmiany wartości (0 lub 1)
- ✅ Przechowywanie danych w Supabase (tylko jako baza danych)
- ✅ Przycisk wylogowania
- ✅ Automatyczne ładowanie danych po ponownym zalogowaniu

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

## Uruchomienie

```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem `http://localhost:3000`

## Struktura projektu

- `src/app/page.tsx` - Główna strona z logiką autentykacji
- `src/components/LoginButton.tsx` - Komponent przycisku logowania
- `src/components/UserProfile.tsx` - Komponent profilu użytkownika
- `src/components/AuthProvider.tsx` - Provider dla NextAuth.js
- `src/hooks/useAuth.ts` - Hook do zarządzania stanem autentykacji (NextAuth.js)
- `src/lib/supabase.ts` - Konfiguracja klienta Supabase (tylko baza danych)
- `src/app/api/auth/[...nextauth]/route.ts` - Konfiguracja NextAuth.js

## Schemat bazy danych

Aplikacja używa tabeli `user_preferences` w Supabase do przechowywania danych użytkownika:

- `user_id` - ID użytkownika z NextAuth.js (string)
- `checkbox_value` - Wartość checkboxa (0 lub 1)
- `created_at` - Data utworzenia
- `updated_at` - Data ostatniej aktualizacji
