-- ============================================================
-- The Anvil — New Tables Migration
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Journal entries
CREATE TABLE IF NOT EXISTS journal_entries (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date       date NOT NULL,
  content    text NOT NULL DEFAULT '',
  mood       smallint CHECK (mood BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own journal" ON journal_entries
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. Achievements earned by users
CREATE TABLE IF NOT EXISTS user_achievements (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id text NOT NULL,
  earned_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own achievements" ON user_achievements
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Program enrollments
CREATE TABLE IF NOT EXISTS user_programs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id   text NOT NULL,
  current_day  smallint NOT NULL DEFAULT 1,
  started_at   date NOT NULL DEFAULT CURRENT_DATE,
  completed_at timestamptz,
  UNIQUE (user_id, program_id)
);

ALTER TABLE user_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own programs" ON user_programs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Per-day completions for programs
CREATE TABLE IF NOT EXISTS user_program_days (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id   text NOT NULL,
  day_number   smallint NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, program_id, day_number)
);

ALTER TABLE user_program_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own program days" ON user_program_days
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. Squad challenges
CREATE TABLE IF NOT EXISTS squad_challenges (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id    uuid NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  ends_at     date,
  created_by  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE squad_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Squad members can view challenges" ON squad_challenges
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM squad_members WHERE squad_id = squad_challenges.squad_id AND user_id = auth.uid())
  );

CREATE POLICY "Squad members can create challenges" ON squad_challenges
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM squad_members WHERE squad_id = squad_challenges.squad_id AND user_id = auth.uid())
    AND auth.uid() = created_by
  );

-- 6. Squad challenge completions
CREATE TABLE IF NOT EXISTS squad_challenge_completions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES squad_challenges(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, user_id)
);

ALTER TABLE squad_challenge_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own challenge completions" ON squad_challenge_completions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Squad members can view all completions" ON squad_challenge_completions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM squad_challenges sc
      JOIN squad_members sm ON sm.squad_id = sc.squad_id
      WHERE sc.id = squad_challenge_completions.challenge_id
        AND sm.user_id = auth.uid()
    )
  );

-- 7. Progress photos
CREATE TABLE IF NOT EXISTS progress_photos (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date       date NOT NULL DEFAULT CURRENT_DATE,
  label      text NOT NULL DEFAULT '',
  url        text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own photos" ON progress_photos
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- IMPORTANT: Also create the Storage bucket in Supabase Dashboard:
-- Storage → New bucket → name: "progress-photos" → Public: true
-- Then add a Storage policy allowing authenticated users to upload to their own folder:
-- Policy: INSERT for authenticated users WHERE (storage.foldername(name))[1] = auth.uid()::text

-- 8. Sleep alarms (if not yet created)
CREATE TABLE IF NOT EXISTS user_sleep_alarms (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label      text NOT NULL DEFAULT 'Sleep',
  alarm_time text NOT NULL,   -- HH:MM (24h)
  days       text[] NOT NULL DEFAULT '{mon,tue,wed,thu,fri,sat,sun}',
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_sleep_alarms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own alarms" ON user_sleep_alarms
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
