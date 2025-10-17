# Konfiguracja Supabase i Google OAuth

## Przegląd architektury

Ten projekt używa:

- **Next.js 15.5.5** z React 19 i Turbopack
- **NextAuth.js 4.24.11** do autentykacji Google OAuth
- **Supabase** jako baza danych PostgreSQL (bez Supabase Auth)

**Jak działa przepływ autentykacji:**

1. Użytkownik klika "Zaloguj się przez Google" (`LoginButton.tsx`)
2. NextAuth.js przekierowuje do Google OAuth
3. Google przekierowuje z powrotem do NextAuth.js (`/api/auth/callback/google`)
4. NextAuth.js przetwarza autoryzację i tworzy sesję
5. Sesja jest dostępna przez hook `useAuth` w całej aplikacji
6. Dane użytkownika można zapisywać w Supabase (tylko jako baza danych)

## Zmienne środowiskowe

Stwórz plik `.env.local` w głównym katalogu projektu z następującymi zmiennymi:

```env
# Supabase Configuration (tylko jako baza danych)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google OAuth Configuration (dla NextAuth.js)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# NextAuth.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_key
```

**Jak wygenerować NEXTAUTH_SECRET:**

```bash
openssl rand -base64 32
```

## Struktura plików projektu

```
src/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts          # NextAuth API routes handler
│   ├── layout.tsx                    # Główny layout z AuthProvider
│   ├── page.tsx                      # Strona główna
│   └── globals.css                   # Style globalne
├── components/
│   ├── AuthProvider.tsx              # SessionProvider wrapper
│   ├── LoginButton.tsx               # Przycisk logowania przez Google
│   └── UserProfile.tsx               # Komponent profilu użytkownika
├── hooks/
│   └── useAuth.ts                    # Custom hook do autentykacji
├── lib/
│   ├── auth.ts                       # Konfiguracja NextAuth (authOptions)
│   ├── supabase.ts                   # Klient Supabase (client-side)
│   └── supabase-server.ts            # Klient Supabase (server-side)
└── types/
    └── next-auth.d.ts                # TypeScript definicje dla NextAuth
```

## Konfiguracja Supabase

1. Stwórz projekt na https://supabase.com
2. **NIE** włączaj Google OAuth w Supabase - używamy NextAuth.js
3. Skopiuj URL projektu i anon key do zmiennych środowiskowych
4. Uruchom schemat bazy danych (poniżej)

## Konfiguracja Google OAuth

1. Przejdź do [Google Cloud Console](https://console.cloud.google.com/)
2. Stwórz nowy projekt lub wybierz istniejący
3. Włącz Google+ API (lub People API dla nowszej wersji)
4. Przejdź do "Credentials" i stwórz OAuth 2.0 Client ID
5. Wybierz "Web application" jako typ aplikacji
6. Dodaj **Authorized redirect URIs**:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-domain.com/api/auth/callback/google`
7. Skopiuj Client ID i Client Secret do `.env.local`

**Ważne:**

- Redirect URI musi być dokładnie taki sam jak skonfigurowany w Google Console
- NextAuth.js automatycznie obsługuje route `/api/auth/callback/google`
- Konfiguracja NextAuth znajduje się w `src/lib/auth.ts`

## Schemat bazy danych

W Supabase SQL Editor uruchom następujący kod:

```sql
-- Stwórz tabelę dla danych użytkowników (bez referencji do auth.users)
CREATE TABLE user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL, -- NextAuth user ID (string)
  checkbox_value INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stwórz indeks dla lepszej wydajności
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Stwórz funkcję do automatycznego aktualizowania updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Stwórz trigger dla automatycznego aktualizowania updated_at
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Włącz RLS (Row Level Security) - opcjonalne, jeśli chcesz kontrolować dostęp
-- ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Jeśli używasz RLS, stwórz politykę bezpieczeństwa
-- CREATE POLICY "Users can manage own preferences" ON user_preferences
--     FOR ALL USING (true); -- Uproszczona polityka - w rzeczywistej aplikacji użyj odpowiedniej logiki
```

## Użycie w kodzie

### Autentykacja (Client-side)

Użyj custom hooka `useAuth` w komponentach:

```typescript
import { useAuth } from "@/hooks/useAuth";

export default function MyComponent() {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) return <p>Ładowanie...</p>;

  if (!user) {
    return <button onClick={signIn}>Zaloguj się</button>;
  }

  return (
    <div>
      <p>Witaj, {user.name}!</p>
      <button onClick={signOut}>Wyloguj się</button>
    </div>
  );
}
```

### Dostęp do sesji (Server-side)

W Server Components lub API routes:

```typescript
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Użyj session.user.id do zapytań do bazy danych
  return Response.json({ user: session.user });
}
```

### Zapytania do Supabase

```typescript
import { createClient } from "@/lib/supabase";

// Client-side
const supabase = createClient();

// Przykładowe zapytanie
const { data, error } = await supabase
  .from("user_preferences")
  .select("*")
  .eq("user_id", user.id);
```

## Uruchamianie projektu

```bash
# Instalacja zależności
pnpm install

# Uruchomienie w trybie development
pnpm dev

# Build produkcyjny
pnpm build

# Uruchomienie produkcyjne
pnpm start
```

## Rozwiązywanie problemów

### Błąd "Invalid redirect_uri"

- Sprawdź czy redirect URI w Google Console jest dokładnie taki sam jak `NEXTAUTH_URL` + `/api/auth/callback/google`
- Upewnij się, że nie ma ukośnika na końcu URL

### Sesja nie zapisuje się

- Sprawdź czy `NEXTAUTH_SECRET` jest ustawiony w `.env.local`
- Upewnij się, że `AuthProvider` opakowuje całą aplikację w `layout.tsx`

### Błąd połączenia z Supabase

- Sprawdź czy `NEXT_PUBLIC_SUPABASE_URL` i `NEXT_PUBLIC_SUPABASE_ANON_KEY` są poprawne
- Zmienne muszą mieć prefix `NEXT_PUBLIC_` aby być dostępne w przeglądarce
