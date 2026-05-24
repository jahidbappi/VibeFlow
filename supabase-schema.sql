-- VibeFlow shared schema (run once in Supabase SQL editor)

CREATE TABLE IF NOT EXISTS requests (
  id BIGSERIAL PRIMARY KEY,
  prompt TEXT NOT NULL,
  image_data TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access" ON requests;
CREATE POLICY "Allow public access" ON requests FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public insert" ON messages;
CREATE POLICY "Allow public insert" ON messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin full access" ON messages;
CREATE POLICY "Allow admin full access" ON messages FOR ALL USING (true);
