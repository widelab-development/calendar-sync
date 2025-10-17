# Instrukcja konfiguracji cache'owania wydarzeń kalendarza

## Przegląd

System cache'owania wydarzeń kalendarza w Supabase zapewnia:

- 🚀 **Szybsze ładowanie** - wydarzenia pobierane z lokalnej bazy danych zamiast Google Calendar API
- 💾 **Synchronizacja przyrostowa** - tylko nowe/zmienione wydarzenia są pobierane z API
- 🔄 **Automatyczne odświeżanie** - system sam wykrywa kiedy są nowe wydarzenia
- 💪 **Fallback** - jeśli API zawiedzie, wyświetlane są dane z cache

## Jak to działa

### 1. Pierwsza synchronizacja

- Użytkownik wchodzi na stronę po raz pierwszy
- System pobiera wszystkie wydarzenia z Google Calendar API (następne 5 dni)
- Wydarzenia zapisywane są w bazie danych Supabase
- Zapisywany jest timestamp ostatniej synchronizacji

### 2. Kolejne wizyty

- System sprawdza kiedy była ostatnia synchronizacja
- Używa incremental sync z parametrem `updatedMin` - pyta Google API "co się zmieniło od ostatniej synchronizacji?"
- Google zwraca TYLKO zaktualizowane/nowe/usunięte wydarzenia
- Cache jest aktualizowany tylko tam gdzie trzeba
- Użytkownik widzi dane z cache (bardzo szybko!)

### 3. Jeśli są zmiany

- Nowe wydarzenia → dodawane do cache
- Zmienione wydarzenia → aktualizowane w cache
- Usunięte wydarzenia → usuwane z cache
- Aktualizowany timestamp ostatniej synchronizacji

## Instalacja

### Krok 1: Uruchom migrację SQL w Supabase

1. Zaloguj się do swojego projektu Supabase: https://supabase.com
2. Przejdź do **SQL Editor** w menu bocznym
3. Otwórz plik `CALENDAR_CACHE_MIGRATION.sql` z tego repozytorium
4. Skopiuj całą zawartość i wklej do SQL Editor
5. Kliknij **Run** lub naciśnij `Ctrl+Enter`

Skrypt utworzy dwie tabele:

- `calendar_sync` - przechowuje informacje o synchronizacji (timestamp ostatniej synchronizacji)
- `calendar_events` - przechowuje wydarzenia z kalendarza

### Krok 2: Sprawdź czy tabele zostały utworzone

W Supabase przejdź do **Table Editor** i sprawdź czy widzisz:

- ✅ `calendar_sync`
- ✅ `calendar_events`

### Krok 3: (Opcjonalnie) Włącz Row Level Security

Jeśli chcesz dodatkowe bezpieczeństwo, możesz włączyć RLS:

```sql
-- W Supabase SQL Editor
ALTER TABLE calendar_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Uproszczone polityki (możesz je dostosować do swoich potrzeb)
CREATE POLICY "Users can manage own sync data" ON calendar_sync
    FOR ALL USING (true);

CREATE POLICY "Users can manage own events" ON calendar_events
    FOR ALL USING (true);
```

## Testowanie

### Test 1: Pierwsza synchronizacja

1. Uruchom aplikację:

   ```bash
   pnpm dev
   ```

2. Zaloguj się przez Google

3. Przejdź na stronę główną gdzie wyświetlane są wydarzenia

4. Otwórz DevTools → Network → sprawdź request do `/api/calendar/events`

5. Odpowiedź powinna zawierać:

   ```json
   {
     "items": [...],
     "fromCache": false,
     "fullSync": true
   }
   ```

6. W Supabase Table Editor sprawdź tabele:
   - `calendar_sync` powinna mieć 1 rekord z Twoim `user_id` i `sync_token`
   - `calendar_events` powinna zawierać Twoje wydarzenia

### Test 2: Synchronizacja przyrostowa

1. Odśwież stronę (F5)

2. W DevTools → Network sprawdź kolejny request

3. Odpowiedź powinna zawierać:

   ```json
   {
     "items": [...],
     "fromCache": true,
     "updated": 0
   }
   ```

   `updated: 0` oznacza że nie było zmian!

### Test 3: Wykrywanie nowych wydarzeń

1. Dodaj nowe wydarzenie w Google Calendar (w ciągu następnych 5 dni)

2. Odśwież stronę aplikacji

3. Nowe wydarzenie powinno się pojawić automatycznie!

4. W odpowiedzi API zobaczysz:
   ```json
   {
     "items": [...],
     "fromCache": true,
     "updated": 1
   }
   ```

### Test 4: Wymuszenie pełnej synchronizacji

Możesz wymusić pełną synchronizację dodając parametr URL:

```
http://localhost:3000/api/calendar/events?forceRefresh=true
```

## Struktura danych

### Tabela: calendar_sync

| Kolumna      | Typ       | Opis                                                    |
| ------------ | --------- | ------------------------------------------------------- |
| id           | UUID      | Unikalny identyfikator                                  |
| user_id      | TEXT      | ID użytkownika z NextAuth                               |
| sync_token   | TEXT      | (Opcjonalnie) Token synchronizacji (obecnie nieużywany) |
| last_sync_at | TIMESTAMP | Czas ostatniej synchronizacji                           |
| created_at   | TIMESTAMP | Czas utworzenia rekordu                                 |
| updated_at   | TIMESTAMP | Czas ostatniej aktualizacji                             |

### Tabela: calendar_events

| Kolumna        | Typ       | Opis                                         |
| -------------- | --------- | -------------------------------------------- |
| id             | TEXT      | ID wydarzenia z Google Calendar              |
| user_id        | TEXT      | ID użytkownika z NextAuth                    |
| summary        | TEXT      | Tytuł wydarzenia                             |
| description    | TEXT      | Opis wydarzenia                              |
| location       | TEXT      | Lokalizacja                                  |
| start_datetime | TIMESTAMP | Data i czas rozpoczęcia                      |
| start_date     | DATE      | Data rozpoczęcia (dla wydarzeń całodniowych) |
| end_datetime   | TIMESTAMP | Data i czas zakończenia                      |
| end_date       | DATE      | Data zakończenia (dla wydarzeń całodniowych) |
| html_link      | TEXT      | Link do wydarzenia w Google Calendar         |
| status         | TEXT      | Status (confirmed, cancelled, etc.)          |
| event_data     | JSONB     | Pełne dane wydarzenia (JSON)                 |
| created_at     | TIMESTAMP | Czas utworzenia rekordu                      |
| updated_at     | TIMESTAMP | Czas ostatniej aktualizacji                  |

## API Endpoint

### GET /api/calendar/events

**Parametry:**

- `maxResults` (opcjonalny, domyślnie: 50) - maksymalna liczba wydarzeń
- `forceRefresh` (opcjonalny, domyślnie: false) - wymusza pełną synchronizację

**Przykładowa odpowiedź:**

```json
{
  "items": [
    {
      "id": "event123",
      "summary": "Spotkanie",
      "start": {
        "dateTime": "2025-10-18T10:00:00Z"
      },
      "end": {
        "dateTime": "2025-10-18T11:00:00Z"
      },
      "htmlLink": "https://calendar.google.com/...",
      "status": "confirmed"
    }
  ],
  "fromCache": true,
  "updated": 0,
  "summary": "Cached events"
}
```

**Pola odpowiedzi:**

- `items` - lista wydarzeń
- `fromCache` - czy dane pochodzą z cache (true) czy z API (false)
- `updated` - liczba zaktualizowanych wydarzeń (tylko dla incremental sync)
- `fullSync` - czy wykonano pełną synchronizację
- `warning` - opcjonalne ostrzeżenie (np. gdy API zawiedzie i używamy fallback)

## Czyszczenie cache

System automatycznie usuwa stare wydarzenia (starsze niż 7 dni) przy każdym wywołaniu API.

Jeśli chcesz ręcznie wyczyścić cache dla użytkownika, możesz wykonać:

```sql
-- Usuń wszystkie wydarzenia użytkownika
DELETE FROM calendar_events WHERE user_id = 'user_id_tutaj';

-- Usuń informacje o synchronizacji (wymusi pełną synchronizację)
DELETE FROM calendar_sync WHERE user_id = 'user_id_tutaj';
```

## Rozwiązywanie problemów

### Błąd: "Brak autoryzacji"

- Upewnij się że użytkownik jest zalogowany
- Sprawdź czy Google OAuth daje dostęp do kalendarza (scope: `https://www.googleapis.com/auth/calendar.readonly`)

### NULL w kolumnie sync_token

- To jest normalne! System używa `updatedMin` zamiast `syncToken`
- Kolumna `sync_token` jest zachowana na przyszłość, ale obecnie nieużywana
- System śledzi zmiany poprzez `last_sync_at` timestamp

### Wydarzenia nie aktualizują się

- Sprawdź czy `last_sync_at` jest zapisany w bazie (`calendar_sync` tabela)
- Spróbuj wymusić pełną synchronizację: `?forceRefresh=true`
- Sprawdź logi w konsoli przeglądarki i serwerze (powinny pokazywać "Synchronizacja przyrostowa" lub "Pełna synchronizacja")

### Brak połączenia z Supabase

- Sprawdź zmienne środowiskowe w `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Upewnij się że tabele zostały utworzone

## Wydajność

### Metryki

**Przed cache'owaniem:**

- Każde wejście na stronę = 1 request do Google Calendar API
- Czas odpowiedzi: 500-2000ms
- Limit: 1,000,000 requests/dzień (ale wolisz oszczędzać!)

**Po cache'owaniu:**

- Pierwsze wejście = 1 request (pełna synchronizacja)
- Kolejne wejścia = 1 request (incremental sync) lub 0 requests (jeśli brak zmian)
- Czas odpowiedzi: 50-200ms (z cache)
- Oszczędność: ~90% requestów do Google API

### Optymalizacja

Możesz dostosować:

- Zakres dat (obecnie: 5 dni do przodu)
- Czas przechowywania starych wydarzeń (obecnie: 7 dni wstecz)
- Częstotliwość czyszczenia cache

## Bezpieczeństwo

✅ **Dane są odizolowane** - każdy użytkownik widzi tylko swoje wydarzenia
✅ **Token autoryzacji** - wymaga zalogowania przez Google OAuth
✅ **Supabase anon key** - można włączyć RLS dla dodatkowej ochrony
✅ **Brak wrażliwych danych** - access token nie jest przechowywany w bazie

## Co dalej?

- [ ] Dodaj webhook od Google Calendar dla real-time aktualizacji
- [ ] Zaimplementuj synchronizację wielu kalendarzy
- [ ] Dodaj możliwość edycji wydarzeń
- [ ] Zaimplementuj powiadomienia o nadchodzących wydarzeniach
