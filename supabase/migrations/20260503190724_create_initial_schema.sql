/*
  # Pupil V0 - Initial Database Schema

  1. New Tables
    - `users` - Core user table with role, subscription status, Stripe IDs
    - `student_profiles` - Student academic info, interests, colleges, identity
    - `mentor_profiles` - Mentor university, bio, availability, rating
    - `session_bookings` - Scheduled sessions between mentors and students
    - `messages` - Chat messages within conversations
    - `conversations` - Chat threads between matched pairs
    - `session_icebreakers` - AI-generated conversation starters
    - `post_call_breakdowns` - AI-generated session summaries
    - `ratings` - Post-session ratings from both parties
    - `access_codes` - School/org bulk access codes
    - `eligibility_applications` - Free access applications
    - `safety_flags` - Moderation flags for admin review
    - `safety_rules` - Configurable platform safety rules
    - `parent_links` - Parent-to-student account linking
    - `waitlist_signups` - MentorGPT waitlist entries
    - `mentor_invites` - Admin-generated mentor invite tokens

  2. Security
    - RLS enabled on ALL tables
    - Students can only access their own data
    - Mentors can access their matched students
    - Admins have full access
    - Waitlist signups are insert-only for public

  3. Important Notes
    - Uses auth.uid() for all ownership checks
    - Identity data (race, gender, first-gen) is never exposed to school admins
    - Messages are scoped to conversation participants only
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid UNIQUE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'mentor', 'admin', 'parent')),
  subscription_status text NOT NULL DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'free')),
  stripe_customer_id text,
  stripe_session_id text,
  onboarding_complete boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users FOR SELECT TO authenticated
  USING (auth.uid() = auth_id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE TO authenticated
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Admins can read all users"
  ON users FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "Admins can update all users"
  ON users FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role = 'admin')
  );

-- Student profiles
CREATE TABLE IF NOT EXISTS student_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  grade int CHECK (grade BETWEEN 9 AND 12),
  gpa text,
  city text,
  state text,
  interests text[] DEFAULT '{}',
  colleges text[] DEFAULT '{}',
  careers text[] DEFAULT '{}',
  identity_json jsonb DEFAULT '{}',
  fit_preferences jsonb DEFAULT '{}',
  matched_mentor_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can read own profile"
  ON student_profiles FOR SELECT TO authenticated
  USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Students can update own profile"
  ON student_profiles FOR UPDATE TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Students can insert own profile"
  ON student_profiles FOR INSERT TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Mentors can read matched student profiles"
  ON student_profiles FOR SELECT TO authenticated
  USING (
    matched_mentor_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Admins can manage all student profiles"
  ON student_profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'));

-- Mentor profiles
CREATE TABLE IF NOT EXISTS mentor_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  university text NOT NULL DEFAULT '',
  major text,
  grad_year int,
  bio text,
  photo_url text,
  tags text[] DEFAULT '{}',
  rating numeric(2,1) DEFAULT 0,
  sessions_count int DEFAULT 0,
  active_mentees_count int DEFAULT 0,
  calendar_provider text,
  timezone text DEFAULT 'America/New_York',
  availability_schedule jsonb DEFAULT '[]',
  buffer_minutes int DEFAULT 15,
  invite_token text UNIQUE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mentor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentors can read own profile"
  ON mentor_profiles FOR SELECT TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Mentors can update own profile"
  ON mentor_profiles FOR UPDATE TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Students can view mentor profiles"
  ON mentor_profiles FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'student')
  );

CREATE POLICY "Admins can manage all mentor profiles"
  ON mentor_profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update mentor profiles"
  ON mentor_profiles FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'));

-- Session bookings
CREATE TABLE IF NOT EXISTS session_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES users(id),
  student_id uuid NOT NULL REFERENCES users(id),
  starts_at timestamptz NOT NULL,
  duration int DEFAULT 30,
  status text DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled')),
  calendar_event_id text,
  cancel_token text UNIQUE DEFAULT gen_random_uuid()::text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE session_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own session bookings"
  ON session_bookings FOR SELECT TO authenticated
  USING (
    mentor_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR student_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Students can insert bookings"
  ON session_bookings FOR INSERT TO authenticated
  WITH CHECK (student_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update own bookings"
  ON session_bookings FOR UPDATE TO authenticated
  USING (
    mentor_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR student_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  )
  WITH CHECK (
    mentor_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR student_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Admins can manage all bookings"
  ON session_bookings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'));

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_ids uuid[] NOT NULL DEFAULT '{}',
  last_message_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view conversations"
  ON conversations FOR SELECT TO authenticated
  USING (
    (SELECT id FROM users WHERE auth_id = auth.uid()) = ANY(participant_ids)
  );

CREATE POLICY "Admins can view all conversations"
  ON conversations FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'));

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users(id),
  content text NOT NULL,
  is_flagged boolean DEFAULT false,
  is_modified boolean DEFAULT false,
  flag_reason text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conversation participants can view messages"
  ON messages FOR SELECT TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE (SELECT id FROM users WHERE auth_id = auth.uid()) = ANY(participant_ids)
    )
  );

CREATE POLICY "Users can insert messages in own conversations"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    AND conversation_id IN (
      SELECT id FROM conversations
      WHERE (SELECT id FROM users WHERE auth_id = auth.uid()) = ANY(participant_ids)
    )
  );

CREATE POLICY "Admins can view all messages"
  ON messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'));

-- Session icebreakers
CREATE TABLE IF NOT EXISTS session_icebreakers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES session_bookings(id) ON DELETE CASCADE,
  prompts text[] DEFAULT '{}',
  grade_context text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE session_icebreakers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session participants can view icebreakers"
  ON session_icebreakers FOR SELECT TO authenticated
  USING (
    session_id IN (
      SELECT id FROM session_bookings
      WHERE mentor_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
        OR student_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

-- Post-call breakdowns
CREATE TABLE IF NOT EXISTS post_call_breakdowns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES session_bookings(id) ON DELETE CASCADE,
  topics text[] DEFAULT '{}',
  action_items jsonb DEFAULT '[]',
  next_focus text,
  mentioned_entities text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE post_call_breakdowns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session participants can view breakdowns"
  ON post_call_breakdowns FOR SELECT TO authenticated
  USING (
    session_id IN (
      SELECT id FROM session_bookings
      WHERE mentor_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
        OR student_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

-- Ratings
CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES session_bookings(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL REFERENCES users(id),
  to_user_id uuid NOT NULL REFERENCES users(id),
  score int NOT NULL CHECK (score BETWEEN 1 AND 5),
  tags text[] DEFAULT '{}',
  comment text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ratings they gave or received"
  ON ratings FOR SELECT TO authenticated
  USING (
    from_user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR to_user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Users can insert ratings"
  ON ratings FOR INSERT TO authenticated
  WITH CHECK (from_user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Admins can view all ratings"
  ON ratings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'));

-- Access codes
CREATE TABLE IF NOT EXISTS access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  school_name text NOT NULL DEFAULT '',
  redeemed_count int DEFAULT 0,
  total_count int DEFAULT 25,
  expires_at timestamptz,
  status text DEFAULT 'active' CHECK (status IN ('active', 'depleted', 'expired')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can validate codes"
  ON access_codes FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage access codes"
  ON access_codes FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update access codes"
  ON access_codes FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'));

-- Eligibility applications
CREATE TABLE IF NOT EXISTS eligibility_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name text NOT NULL,
  email text NOT NULL,
  grade int,
  school text,
  eligibility_type text NOT NULL,
  counselor_email text,
  counselor_status text DEFAULT 'pending' CHECK (counselor_status IN ('pending', 'confirmed')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE eligibility_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit eligibility applications"
  ON eligibility_applications FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all applications"
  ON eligibility_applications FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update applications"
  ON eligibility_applications FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'));

-- Safety flags
CREATE TABLE IF NOT EXISTS safety_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  severity text DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description text,
  full_details text,
  parties text[] DEFAULT '{}',
  status text DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved')),
  reported_by text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE safety_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all flags"
  ON safety_flags FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can insert flags"
  ON safety_flags FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update flags"
  ON safety_flags FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'));

-- Safety rules
CREATE TABLE IF NOT EXISTS safety_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  config text NOT NULL DEFAULT '',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE safety_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view safety rules"
  ON safety_rules FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update safety rules"
  ON safety_rules FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'));

-- Parent links
CREATE TABLE IF NOT EXISTS parent_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id uuid NOT NULL REFERENCES users(id),
  student_user_id uuid NOT NULL REFERENCES users(id),
  relationship text DEFAULT 'parent',
  created_at timestamptz DEFAULT now(),
  UNIQUE(parent_user_id, student_user_id)
);

ALTER TABLE parent_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view own links"
  ON parent_links FOR SELECT TO authenticated
  USING (parent_user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Waitlist signups
CREATE TABLE IF NOT EXISTS waitlist_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  grade text,
  ethnicity text[] DEFAULT '{}',
  first_gen boolean DEFAULT false,
  school_type text,
  open_question text,
  topics text[] DEFAULT '{}',
  trust_response text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE waitlist_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert waitlist signups"
  ON waitlist_signups FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Admins can view waitlist signups"
  ON waitlist_signups FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'));

-- Mentor invites
CREATE TABLE IF NOT EXISTS mentor_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES users(id),
  token text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  email text,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE mentor_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage invites"
  ON mentor_invites FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can create invites"
  ON mentor_invites FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update invites"
  ON mentor_invites FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_bookings_mentor ON session_bookings(mentor_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_session_bookings_student ON session_bookings(student_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
