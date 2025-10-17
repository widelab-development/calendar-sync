-- Migracja bazy danych dla cache'owania wydarzeń z kalendarza
-- Wykonaj ten skrypt w Supabase SQL Editor

-- Tabela do przechowywania informacji o synchronizacji kalendarza
CREATE TABLE IF NOT EXISTS calendar_sync (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE, -- NextAuth user ID
  sync_token TEXT, -- Token do incremental sync z Google Calendar API
  last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indeks dla szybkiego wyszukiwania po user_id
CREATE INDEX IF NOT EXISTS idx_calendar_sync_user_id ON calendar_sync(user_id);

-- Tabela do przechowywania wydarzeń z kalendarza
CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY, -- Google Calendar event ID
  user_id TEXT NOT NULL, -- NextAuth user ID
  summary TEXT,
  description TEXT,
  location TEXT,
  start_datetime TIMESTAMP WITH TIME ZONE,
  start_date DATE,
  end_datetime TIMESTAMP WITH TIME ZONE,
  end_date DATE,
  html_link TEXT,
  status TEXT,
  event_data JSONB NOT NULL, -- Pełne dane wydarzenia z Google Calendar API
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES calendar_sync(user_id) ON DELETE CASCADE
);

-- Indeksy dla wydajności
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start ON calendar_events(start_datetime, start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON calendar_events(status);

-- Funkcja do automatycznego aktualizowania updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggery dla automatycznego aktualizowania updated_at
CREATE TRIGGER update_calendar_sync_updated_at
    BEFORE UPDATE ON calendar_sync
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Opcjonalnie: Row Level Security (RLS)
-- Możesz to włączyć dla dodatkowego bezpieczeństwa
-- ALTER TABLE calendar_sync ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Przykładowe polityki RLS (jeśli włączysz RLS)
-- CREATE POLICY "Users can manage own sync data" ON calendar_sync
--     FOR ALL USING (true);
-- CREATE POLICY "Users can manage own events" ON calendar_events
--     FOR ALL USING (true);
