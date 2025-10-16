# Konfiguracja Supabase i Google OAuth

## Zmienne środowiskowe

Stwórz plik `.env.local` w głównym katalogu projektu z następującymi zmiennymi:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Konfiguracja Supabase

1. Stwórz projekt na https://supabase.com
2. **NIE** włączaj Google OAuth w Supabase - używamy NextAuth.js
3. Skopiuj URL projektu i anon key do zmiennych środowiskowych
4. Uruchom schemat bazy danych (poniżej)

**Jak działa przepływ autentykacji:**

1. Użytkownik klika "Zaloguj się przez Google"
2. Przekierowuje do Google OAuth
3. Google przekierowuje z powrotem do NextAuth.js (`/api/auth/callback/google`)
4. NextAuth.js przetwarza autoryzację i tworzy sesję
5. Aplikacja automatycznie wykrywa zalogowanego użytkownika
6. Dane użytkownika są zapisywane w Supabase (tylko jako baza danych)

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

## Konfiguracja Supabase

1. Stwórz projekt na https://supabase.com
2. **NIE** włączaj Google OAuth w Supabase - używamy NextAuth.js
3. Skopiuj URL projektu i anon key do zmiennych środowiskowych
4. Uruchom schemat bazy danych (poniżej)

## Konfiguracja Google OAuth

1. Idź do Google Cloud Console
2. Stwórz nowy projekt lub wybierz istniejący
3. Włącz Google+ API
4. Stwórz OAuth 2.0 credentials
5. Dodaj authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (dla development)
   - `https://yourdomain.com/api/auth/callback/google` (dla production)

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
