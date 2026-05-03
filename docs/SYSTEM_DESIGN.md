# Pupil V0 - System Design

**Author:** Elie Francois
**Last Updated:** April 30, 2026

---

## Architecture Overview

Pupil V0 is a monolith. One deployable app, one database, external services for the hard stuff (video, payments, scheduling, AI). No microservices. At 2,000 users this is the right call. When we hit 10k+ we can extract services if needed.

```
                    ┌──────────────────────────────────────┐
                    │           Vercel (Hosting)            │
                    │                                       │
                    │   Next.js App                         │
                    │   ┌──────────────────────────────┐   │
                    │   │  React Frontend               │   │
                    │   │  - Marketing pages             │   │
                    │   │  - Student dashboard           │   │
                    │   │  - Mentor dashboard            │   │
                    │   │  - Admin panel                 │   │
                    │   │  - Chat UI (chatcn)            │   │
                    │   │  - Video room (Daily embed)    │   │
                    │   │  - Post-call breakdown          │   │
                    │   └──────────────────────────────┘   │
                    │   ┌──────────────────────────────┐   │
                    │   │  API Routes (/api/*)           │   │
                    │   │  - Auth                        │   │
                    │   │  - Checkout + Webhooks         │   │
                    │   │  - Onboarding                  │   │
                    │   │  - Matching                    │   │
                    │   │  - Scheduling (calendar sync)  │   │
                    │   │  - Messaging (moderation)      │   │
                    │   │  - Video (room management)     │   │
                    │   │  - Session tools (icebreakers)  │   │
                    │   │  - Admin                       │   │
                    │   │  - Analytics events            │   │
                    │   └──────────────────────────────┘   │
                    └──────────┬───┬───┬───┬───┬───────────┘
                               │   │   │   │   │
               ┌───────────────┘   │   │   │   └──────────────┐
               │           ┌───────┘   │   └───────┐          │
               v           v           v           v          v
         ┌──────────┐ ┌────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
         │ Supabase │ │ Stripe │ │ Daily   │ │ Google  │ │Anthropic│
         │          │ │        │ │         │ │Calendar │ │         │
         │ Postgres │ │Checkout│ │ Video   │ │   API   │ │ Claude  │
         │ Auth     │ │Webhooks│ │ Record  │ │─────────│ │Sonnet 4 │
         │ Realtime │ │        │ │Transcr. │ │Microsoft│ │         │
         │ Storage  │ │        │ │         │ │Graph API│ │         │
         └──────────┘ └────────┘ └─────────┘ └─────────┘ └─────────┘

         ┌──────────┐
         │ PostHog  │
         │          │
         │Analytics │
         │Surveys   │
         └──────────┘
```

### Why This Stack

| Decision | Why |
|----------|-----|
| **Next.js (migrating from Express/Vite)** | Server components, API routes, better DX than the current Express+Vite setup. Deploys to Vercel with zero config. |
| **Supabase** | Auth, Postgres, Realtime (for chat), and Storage in one service. Generous free tier. Row-level security for multi-tenant safety. |
| **Stripe** | Already integrated for checkout. Keep it. |
| **Daily.co** | Video with built-in transcription and recording. 10k free min/mo. Lowest friction option. |
| **Custom scheduling** | Built-in. Mentors connect Google/Outlook calendars via OAuth. We query FreeBusy for availability, students book slots, we push events back. No vendor dependency. Cal.com went closed source, Astrocal was $49/mo for what amounts to ~400 lines of code. We own this. |
| **Anthropic (Claude)** | AI features: icebreaker generation and post-call breakdowns. Sonnet 4 for robustness + pricing. MentorGPT is post-V0. |
| **PostHog** | Product analytics, funnels, feature flags. Free tier covers our scale. |
| **chatcn** | Pre-built chat UI components on shadcn. One-command install, looks great, backend agnostic. |

### Migration Note

The current codebase (Dario's Replit build) uses Express 5 + Vite + wouter + Drizzle. The marketing site, checkout, onboarding, eligibility flows, and admin panel already work. We have two options:

**Option A: Migrate to Next.js.** Better long-term. Server components, built-in API routes, Vercel deployment, Supabase integrations. But it means rewriting existing pages.

**Option B: Keep Express/Vite, add new features on top.** Faster short-term. But the current setup has Replit-specific dependencies (object storage, dev domain vars) that need cleanup for any real deployment.

Recommendation: **Option A.** The existing pages are mostly marketing copy and forms. They port quickly. The new features (messaging, video, MentorGPT) are easier to build in Next.js with Supabase. And Vercel deployment is simpler than figuring out how to host the current Express bundle.

---

## Database Schema

Moving from Drizzle push-only to Supabase with proper migrations. The existing tables (users, onboarding_responses, eligibility_applications, pilot_codes, waitlist_entries) carry over with modifications. New tables are added for matching, messaging, scheduling, video, ratings, and safety.

### Existing Tables (Modified)

```sql
-- Users table: expanded with mentor fields and auth linkage
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_auth_id uuid UNIQUE,  -- links to Supabase Auth
  
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  phone text,
  avatar_url text,
  
  role text NOT NULL CHECK (role IN ('student', 'parent', 'mentor', 'admin', 'school_admin')),
  
  -- Subscription
  type text CHECK (type IN ('paid', 'free_eligible', 'pilot')),
  status text NOT NULL DEFAULT 'new' CHECK (status IN (
    'new', 'paid', 'onboarding', 'onboarding_complete',
    'eligibility_submitted', 'approved', 'denied',
    'matched', 'active'
  )),
  
  stripe_customer_id text,
  stripe_session_id text,
  
  is_active boolean DEFAULT true,
  onboarding_complete boolean DEFAULT false,
  
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Onboarding: stays mostly the same
CREATE TABLE onboarding_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  grade text NOT NULL,
  gpa text,
  location text NOT NULL,
  interests_majors text NOT NULL,
  career_interests text NOT NULL,
  colleges_interested text,
  fit_preferences jsonb,          -- {size, location_pref, campus_type, etc.}
  urgency_deadlines text NOT NULL,
  parent_concerns_goals text NOT NULL,
  identity_matching jsonb,        -- {race, gender, first_gen, etc.} (private)
  consent_accepted boolean NOT NULL,
  
  created_at timestamptz DEFAULT now()
);

-- Eligibility: stays mostly the same
CREATE TABLE eligibility_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  
  submission_type text NOT NULL CHECK (submission_type IN ('free_attestation', 'pilot_code')),
  pilot_code_id uuid REFERENCES pilot_codes(id),
  
  student_name text NOT NULL,
  parent_name text,
  email text NOT NULL,
  grade text NOT NULL,
  school_name text,
  
  attest_frl boolean DEFAULT false,
  attest_snap boolean DEFAULT false,
  attest_common_app_fee_waiver boolean DEFAULT false,
  proof_upload_url text,           -- required for free eligibility
  counselor_email text,
  
  decision text DEFAULT 'pending' CHECK (decision IN ('pending', 'approved', 'denied')),
  notes text,
  reviewed_by uuid REFERENCES users(id),
  decided_at timestamptz,
  
  granted_sessions int,            -- how many sessions they get if approved
  
  created_at timestamptz DEFAULT now()
);

-- Pilot codes: stays the same
CREATE TABLE pilot_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  school_name text,
  description text,
  auto_approve boolean DEFAULT true,
  sessions_cap_yearly int DEFAULT 12,
  max_redemptions int,
  redeemed_count int DEFAULT 0,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Waitlist: stays the same
CREATE TABLE waitlist_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  grade text NOT NULL,
  questions jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

### Parent-Student Linking

```sql
-- Parent links to student account (schema exists from V0, UI built later)
CREATE TABLE parent_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id uuid NOT NULL REFERENCES users(id),
  student_user_id uuid NOT NULL REFERENCES users(id),
  
  -- Scoped permissions (defaults are the right defaults)
  can_manage_billing boolean DEFAULT true,
  can_view_usage boolean DEFAULT true,
  can_view_mentor boolean DEFAULT true,
  can_view_goals boolean DEFAULT true,
  can_view_messages boolean DEFAULT false,   -- privacy: off by default
  can_view_transcripts boolean DEFAULT false, -- privacy: off by default
  
  invite_token text UNIQUE,    -- for email invite flow
  invited_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  
  UNIQUE(parent_user_id, student_user_id)
);
```

### New Tables

```sql
-- ============================================
-- MENTOR PROFILES
-- ============================================

CREATE TABLE mentor_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  
  university text NOT NULL,
  major text,
  minor text,
  graduation_year int,
  current_role text,              -- "Junior at NYU" or "SWE at Google"
  bio text,
  
  identity_tags text[] DEFAULT '{}',  -- for matching, kept private
  
  max_mentees int DEFAULT 5,
  current_mentee_count int DEFAULT 0,
  avg_rating numeric(2,1),
  total_sessions int DEFAULT 0,
  
  is_available boolean DEFAULT true,
  
  -- Calendar integration (owned, no vendor)
  calendar_provider text CHECK (calendar_provider IN ('google', 'microsoft')),
  calendar_access_token text,
  calendar_refresh_token text,
  calendar_token_expires_at timestamptz,
  calendar_email text,  -- the connected calendar account email
  
  -- Mentor's configured availability (when they're open to sessions)
  -- Stored as JSON: [{ day: 0-6, start: "09:00", end: "17:00" }]
  availability_schedule jsonb DEFAULT '[]',
  timezone text DEFAULT 'America/New_York',
  buffer_minutes int DEFAULT 15,  -- gap between sessions
  
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- STUDENT PROFILES (supplement to onboarding)
-- ============================================

CREATE TABLE student_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  
  grade_level int CHECK (grade_level BETWEEN 9 AND 12),
  school_name text,
  school_id uuid REFERENCES schools(id),
  
  interests jsonb DEFAULT '{}',       -- {colleges: [], majors: [], careers: []}
  identity_tags text[] DEFAULT '{}',  -- private, never shown to school admins
  goals text,
  graduation_year int,
  
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- SCHOOLS (B2B support)
-- ============================================

CREATE TABLE schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text CHECK (type IN ('public', 'private', 'charter')),
  district text,
  state text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE school_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  school_id uuid REFERENCES schools(id),
  role text CHECK (role IN ('principal', 'counselor', 'admin')),
  can_view_activity boolean DEFAULT true,
  can_view_identity boolean DEFAULT false,  -- privacy protection
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, school_id)
);

-- ============================================
-- AVAILABILITY PREFERENCES (for matching)
-- ============================================

CREATE TABLE user_availability_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  day_of_week int CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Sunday
  time_block text CHECK (time_block IN ('morning', 'afternoon', 'evening')),
  -- morning: 8-10 AM, afternoon: 12-2 PM, evening: 5-7 PM
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, day_of_week, time_block)
);

-- ============================================
-- MATCHING
-- ============================================

CREATE TABLE match_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES users(id),
  
  preferred_schools text[],
  preferred_majors text[],
  preferred_identity_tags text[],
  additional_notes text,
  
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'no_match')),
  
  created_at timestamptz DEFAULT now()
);

CREATE TABLE mentor_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES users(id),
  mentor_id uuid NOT NULL REFERENCES users(id),
  request_id uuid REFERENCES match_requests(id),
  
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  
  matched_by uuid REFERENCES users(id),  -- admin who made the match
  match_reason text,
  
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  end_reason text,
  
  UNIQUE(student_id, mentor_id)
);

-- ============================================
-- PAYMENTS & SUBSCRIPTIONS
-- ============================================

CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES users(id),
  
  stripe_subscription_id text,
  plan text CHECK (plan IN ('early_access', 'free_pilot', 'school_sponsored')),
  status text CHECK (status IN ('active', 'cancelled', 'past_due', 'paused')),
  
  sessions_total int DEFAULT 24,
  sessions_used int DEFAULT 0,
  
  current_period_start timestamptz,
  current_period_end timestamptz,
  
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- SCHEDULING
-- ============================================

CREATE TABLE session_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES mentor_matches(id),
  
  -- Calendar event tracking
  calendar_event_id text,  -- Google/Microsoft event ID for updates/deletion
  cancel_token text UNIQUE DEFAULT gen_random_uuid()::text,  -- for email cancel/reschedule links
  
  scheduled_at timestamptz NOT NULL,
  duration_minutes int DEFAULT 30,
  timezone text,
  
  status text DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'completed', 'cancelled', 'no_show', 'rescheduled'
  )),
  
  booked_by uuid REFERENCES users(id),
  cancelled_by uuid REFERENCES users(id),
  cancel_reason text,
  
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- VIDEO
-- ============================================

CREATE TABLE video_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid UNIQUE REFERENCES session_bookings(id),
  
  -- Daily.co fields
  daily_room_name text UNIQUE,
  daily_room_url text,
  
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds int,
  
  -- Transcript
  transcript_url text,       -- Supabase Storage path
  transcript_text text,      -- full text for search/audit
  transcript_status text DEFAULT 'pending'
    CHECK (transcript_status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- Recording
  recording_url text,
  
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- MESSAGING
-- ============================================

CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid UNIQUE REFERENCES mentor_matches(id),
  last_message_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id),
  sender_id uuid NOT NULL REFERENCES users(id),
  content text NOT NULL,
  content_type text DEFAULT 'text' CHECK (content_type IN ('text', 'system')),
  
  -- Moderation
  is_flagged boolean DEFAULT false,
  flag_reason text,       -- 'phone_number', 'email', 'social_media'
  review_status text CHECK (review_status IN ('pending', 'approved', 'removed')),
  
  created_at timestamptz DEFAULT now(),
  is_deleted boolean DEFAULT false
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);

-- ============================================
-- RATINGS
-- ============================================

CREATE TABLE session_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES video_sessions(id),
  rated_by uuid NOT NULL REFERENCES users(id),
  rated_user uuid NOT NULL REFERENCES users(id),
  
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  
  positive_tags text[] DEFAULT '{}',
  -- Options: 'helpful', 'knowledgeable', 'encouraging', 'good_listener', 'well_prepared'
  
  negative_tags text[] DEFAULT '{}',
  -- Options: 'unprepared', 'late', 'distracted', 'rushed'
  
  feedback_text text,              -- required if rating <= 2
  safety_concern text,             -- free text, auto-flags for admin review
  
  created_at timestamptz DEFAULT now(),
  UNIQUE(session_id, rated_by)
);

-- Trigger to update mentor avg_rating on new rating
CREATE OR REPLACE FUNCTION update_mentor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE mentor_profiles
  SET avg_rating = (
    SELECT AVG(rating)::numeric(2,1)
    FROM session_ratings sr
    JOIN video_sessions vs ON sr.session_id = vs.id
    JOIN session_bookings sb ON vs.booking_id = sb.id
    JOIN mentor_matches mm ON sb.match_id = mm.id
    WHERE mm.mentor_id = NEW.rated_user
  ),
  total_sessions = (
    SELECT COUNT(*)
    FROM session_ratings sr
    JOIN video_sessions vs ON sr.session_id = vs.id
    JOIN session_bookings sb ON vs.booking_id = sb.id
    JOIN mentor_matches mm ON sb.match_id = mm.id
    WHERE mm.mentor_id = NEW.rated_user
  )
  WHERE user_id = NEW.rated_user;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_mentor_rating
AFTER INSERT ON session_ratings
FOR EACH ROW EXECUTE FUNCTION update_mentor_rating();

-- ============================================
-- SESSION TOOLS (Icebreakers + Post-Call Breakdown)
-- ============================================

CREATE TABLE session_icebreakers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid UNIQUE REFERENCES session_bookings(id),
  
  student_grade int,
  session_number int,  -- 1st meeting, 2nd meeting, etc.
  
  content jsonb NOT NULL,  -- array of icebreaker strings
  -- e.g. ["What's one thing you wish you knew about college before applying?", ...]
  
  generated_at timestamptz DEFAULT now()
);

CREATE TABLE post_call_breakdowns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid UNIQUE REFERENCES video_sessions(id),
  
  topics_covered jsonb DEFAULT '[]',     -- bullet points
  action_items jsonb DEFAULT '[]',       -- student next steps
  next_session_focus text,               -- suggested topic for next session
  mentions jsonb DEFAULT '{}',           -- {colleges: [], majors: [], deadlines: []}
  
  raw_summary text,                      -- full AI-generated text
  
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processing_started_at timestamptz,
  completed_at timestamptz,
  
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- MENTOR GPT (Post-V0, schema here for future)
-- ============================================

CREATE TABLE mentor_gpt_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  title text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE mentor_gpt_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES mentor_gpt_conversations(id),
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  tokens_used int,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- SAFETY & MODERATION
-- ============================================

CREATE TABLE flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  flag_type text NOT NULL CHECK (flag_type IN ('message', 'session', 'user', 'rating')),
  flagged_item_id uuid NOT NULL,  -- polymorphic reference
  
  flagged_by uuid REFERENCES users(id),  -- null = system-generated
  
  reason text NOT NULL,
  severity text DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  notes text,
  
  status text DEFAULT 'pending'
    CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  reviewed_by uuid REFERENCES users(id),
  resolved_at timestamptz,
  resolution_notes text,
  action_taken text,  -- 'warning', 'session_suspended', 'account_banned'
  
  created_at timestamptz DEFAULT now()
);

CREATE TABLE safety_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  config jsonb NOT NULL,
  is_active boolean DEFAULT true,
  updated_by uuid REFERENCES users(id),
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Default safety rules
INSERT INTO safety_rules (rule_key, display_name, description, config) VALUES
  ('session_hours', 'Session Time Restrictions',
   'Hours when sessions can be scheduled',
   '{"earliest_hour": 8, "latest_hour": 21}'),
  ('mentor_max_mentees', 'Mentor Capacity',
   'Maximum active mentees per mentor',
   '{"max": 5}'),
  ('low_rating_threshold', 'Quality Alert Threshold',
   'Average rating that triggers admin review',
   '{"threshold": 3.0, "min_sessions": 5}'),
  ('contact_info_filter', 'Contact Info Moderation',
   'Auto-filter phone numbers, emails, social handles in messages',
   '{"enabled": true, "action": "redact"}');

-- ============================================
-- ANALYTICS (lightweight, PostHog handles most of this)
-- ============================================

CREATE TABLE analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_analytics_type ON analytics_events(event_type, created_at DESC);
CREATE INDEX idx_analytics_user ON analytics_events(user_id, created_at DESC);
```

---

## Data Flows

### Flow 1: Student Signs Up (Paid)

```
Student lands on /pricing
  |
  v
Clicks "Subscribe" -> Stripe Checkout (hosted)
  |
  v
Stripe completes -> redirects to /success?session_id=xxx
  |
  v
Frontend calls POST /api/checkout/verify
  - Validates session with Stripe API
  - Creates user record (type=paid, status=paid)
  - Creates subscription record
  - Sends admin notification email
  |
  v
Redirect to /onboarding
  - Student fills out profile
  - POST /api/onboarding saves data
  - Creates student_profile
  - Creates match_request (status=pending)
  - Saves availability preferences
  - Sets user status=onboarding_complete
  |
  v
Shows "You're all set" confirmation
  - "We'll match you with a mentor within 24-48 hours"
  - MentorGPT is available immediately
```

### Flow 2: Admin Matches Student to Mentor

```
Admin opens /admin/matching
  |
  v
Sees list of pending match_requests
  - Shows student preferences (schools, majors, identity)
  - Shows schedule overlap with available mentors
  |
  v
Admin selects a mentor, clicks "Assign"
  - POST /api/admin/match
  - Creates mentor_matches record
  - Creates conversation record
  - Updates user status=matched
  - Increments mentor current_mentee_count
  - Sends email to student: "You've been matched!"
  - Sends email to mentor: "New mentee assigned"
```

### Flow 3: Student Books a Session

```
Student opens /dashboard
  - Sees their mentor card
  - Clicks "Book a Session"
  |
  v
Booking page loads
  - GET /api/scheduling/availability?mentor_id=xxx&week=2026-05-01
  - Server reads mentor's availability_schedule (configured hours)
  - Server calls Google FreeBusy or Microsoft Graph with mentor's token
    (token refresh utility checks expiry first, refreshes if needed)
  - Subtracts busy blocks + existing Pupil bookings + buffer_minutes
  - Returns available 30-min slots to frontend
  - Frontend filters to allowed hours (safety rule: 8 AM - 9 PM)
  - Student picks a slot
  |
  v
Student confirms booking
  - POST /api/scheduling/book { mentor_id, slot_start, slot_end }
  - Server re-checks availability (race condition guard)
  - Inserts session_bookings record
  - Creates video_sessions record (Daily room pre-created)
  - Pushes calendar event to mentor's Google/Outlook calendar
  - Sends confirmation emails to both parties (ICS attachment via Resend)
  - Decrements sessions remaining on subscription
```

### Flow 4: Pre-Call Icebreakers

```
Booking confirmed (or day-of session reminder)
  |
  v
POST /api/sessions/generate-icebreakers { booking_id }
  - Load student profile (grade_level, interests, goals)
  - Load session_number for this mentor-student pair
  - Count previous completed sessions between them
  |
  v
Call Anthropic API (Sonnet 4)
  - System prompt: generate 3-5 conversation starters
  - Context: student grade, interests, session number
  - Freshmen get "getting to know college" icebreakers
  - Seniors get application-focused, deadline-aware prompts
  - Repeat sessions reference what could build on prior calls
  |
  v
Store in session_icebreakers table
  - Available on dashboard next to "Join Session" button
  - Both student and mentor see the same icebreakers
```

### Flow 5: Video Session

```
Session time arrives
  - Both parties see "Join Session" button on dashboard
  - Icebreakers card visible alongside the join button
  - Click opens Daily.co embedded video room
  - Token-based auth (each user gets a unique meeting token)
  |
  v
During call:
  - Daily records audio/video to cloud
  - Daily transcribes in real-time
  - 2 participants max
  - Auto-ends at room expiry
  |
  v
Call ends:
  - Daily fires webhook: meeting.ended
  - POST /api/webhooks/daily
  - Updates video_sessions (ended_at, duration)
  - Updates session_bookings status=completed
  |
  v
Transcript ready:
  - Daily fires webhook: transcription.ready
  - Download transcript, store in Supabase Storage
  - Save full text to video_sessions.transcript_text
  |
  v
Post-call breakdown triggered:
  - INSERT into post_call_breakdowns (status=processing)
  - Async job: POST /api/sessions/generate-breakdown { session_id }
  |
  v
Anthropic API (Sonnet 4) processes transcript:
  - System prompt: extract topics, action items, next steps
  - Input: full transcript text
  - Output: structured JSON (topics, action_items, mentions, focus)
  - Store parsed result in post_call_breakdowns
  - Set status=completed
  - Under 5 min total processing
  |
  v
Dashboard shows breakdown:
  - While processing: spinner "Processing your session breakdown..."
  - When complete: card with topics, action items, next session focus
  - Both student and mentor see the same breakdown
  |
  v
Rating prompt:
  - Both parties see rating modal on next dashboard visit
  - POST /api/ratings
  - Creates session_ratings record
  - If safety_concern is filled, auto-creates flag
  - Triggers mentor avg_rating recalculation
```

### Flow 6: Messaging

```
Matched student opens /messages
  - Loads conversation for their match
  - Supabase Realtime subscribes to new messages
  |
  v
Student types a message, hits send
  |
  v
POST /api/messaging/send
  - Verify user is part of this conversation
  - Run content through moderation:
    - Check for phone numbers (regex)
    - Check for emails (regex)
    - Check for social media handles (regex)
  - If contact info found:
    - Redact it from message content
    - Set is_flagged=true, flag_reason
    - Create flag record for admin review
    - Warn user: "Your message was modified"
  - Insert message into messages table
  - Update conversation.last_message_at
  |
  v
Supabase Realtime pushes to other party instantly
  - Postgres change event on messages table
  - Frontend updates via subscription
```

### Flow 7: MentorGPT (Post-V0)

```
Student opens /mentor-gpt
  - Loads existing conversations or starts new one
  |
  v
Student asks a question
  |
  v
POST /api/chat/send
  - Load student profile context (grade, interests, goals)
  - Build system prompt:
    "You are MentorGPT, a college guidance assistant.
     You are helping a [grade] student interested in [majors]
     at [colleges]. They want to pursue [careers].
     Only answer college guidance questions.
     Do not give financial, medical, or legal advice.
     Be conversational and encouraging."
  - Send conversation history + new message to OpenAI API
  - Stream response back to frontend
  - Save both messages to mentor_gpt_messages
  - Track tokens used
```

---

## Third-Party Integration Details

### Stripe

**What it does:** Checkout, subscription management, refunds.

**Already integrated.** Current code calls Stripe REST API directly with fetch. Works fine. On migration to Next.js, we can use the Stripe Node SDK instead.

**Webhooks needed:**
- `checkout.session.completed` -> create/update user
- `customer.subscription.updated` -> update subscription status
- `customer.subscription.deleted` -> handle cancellation
- `charge.refunded` -> update payment record

**Cost:** 2.9% + $0.30 per transaction. On a $900 annual sub that's ~$26.40 per customer.

### Supabase

**What it does:** Auth, Postgres database, Realtime (messaging), Storage (transcripts, uploads).

**Auth:** Email/password for all users. Social login (Google) as a nice-to-have. Admin role managed via Supabase RLS policies.

**Realtime:** Powers the messaging feature. Frontend subscribes to postgres_changes on the messages table, filtered by conversation_id. No separate WebSocket server needed.

**Storage:** Transcripts (JSON), recordings (if we store locally vs Daily cloud), eligibility proof uploads.

**Cost:** Free tier covers 500MB database, 1GB storage, 50k monthly active users. We won't hit these limits in V0.

### Daily.co

**What it does:** Video calls, recording, transcription.

**Integration points:**
- Room creation (server-side, when booking is confirmed)
- Meeting tokens (server-side, generated when user clicks "Join")
- Embedded video UI (client-side, Daily Prebuilt component)
- Webhooks: meeting.ended, transcription.ready, recording.ready

**Room config:**
- Privacy: private (token required)
- Max participants: 2
- Recording: cloud, automatic
- Transcription: enabled
- Screen share: disabled
- Chat: enabled (in-call only)
- Auto-eject at expiry: true

**Cost:** 10,000 free minutes/month. After that, $0.004/min. At 2,000 students doing 2 sessions/month at 30 min each, that's 120,000 min/month. Past free tier, roughly $440/month. Significant, but manageable with revenue.

### Custom Scheduling (Google Calendar API + Microsoft Graph)

**What it does:** Calendar sync, availability calculation, and booking management. Fully owned, no vendor.

**Why not a scheduling vendor:** Cal.com went closed source April 2026 ($299/mo for Platform API). Astrocal was $49/mo for something that's ~400 lines of code. We already own the chat experience and the booking data model. Scheduling is the same pattern: OAuth tokens, a few API calls, and our own UI.

**Google Calendar integration:**
- OAuth 2.0 via `googleapis` npm package
- Scopes: `calendar.readonly` (FreeBusy), `calendar.events` (push events)
- FreeBusy endpoint: `POST https://www.googleapis.com/calendar/v3/freeBusy`
- Returns busy time ranges for a given date window
- Refresh token is long-lived (until user revokes)

**Microsoft Outlook integration:**
- OAuth 2.0 via Microsoft Identity Platform (MSAL)
- Scopes: `Calendars.Read`, `Calendars.ReadWrite`
- Schedule endpoint: `POST https://graph.microsoft.com/v1.0/me/calendar/getSchedule`
- Returns availability view with busy/tentative/OOF blocks
- Tokens expire every 60-90 days, silent refresh via refresh_token

**Token refresh utility:**
```
Before every calendar API call:
1. Check calendar_token_expires_at against now()
2. If expired (or within 5 min of expiry):
   a. Google: POST to https://oauth2.googleapis.com/token with refresh_token
   b. Microsoft: POST to https://login.microsoftonline.com/common/oauth2/v2.0/token
3. Update calendar_access_token and calendar_token_expires_at in DB
4. Proceed with the API call using the fresh token
```
This runs on every availability check and every calendar event push. ~30 lines of code but prevents the "mentor's calendar stopped syncing and nobody noticed" failure.

**Availability calculation flow:**
```
getAvailableSlots(mentorId, dateRange):
  1. Load mentor's availability_schedule from DB (their configured hours)
  2. Load mentor's timezone and buffer_minutes
  3. Refresh token if needed (utility above)
  4. Call FreeBusy API for the date range
  5. Load existing Pupil bookings for mentor in date range
  6. For each day in range:
     a. Generate slots from availability_schedule (e.g. 9 AM - 5 PM → 16 x 30-min slots)
     b. Remove slots that overlap with FreeBusy busy blocks
     c. Remove slots that overlap with existing Pupil bookings
     d. Remove slots that violate buffer_minutes between sessions
     e. Remove slots outside safety rules (before 8 AM, after 9 PM)
  7. Return remaining slots converted to student's timezone
```

**Booking flow:**
```
createBooking(mentorId, slotStart, studentId):
  1. Re-check availability (prevents race conditions)
  2. INSERT into session_bookings
  3. Create Daily.co room for the session
  4. INSERT into video_sessions
  5. Push event to mentor's calendar (Google Events API / Microsoft Graph)
     - Store returned event ID as calendar_event_id for future updates
  6. Send confirmation emails to both parties via Resend
     - Include ICS file attachment (generated with `ics` npm package)
  7. Decrement sessions_remaining on subscription
```

**Cancel/reschedule:**
- Cancel: DELETE the calendar event via stored calendar_event_id, update booking status, send cancellation emails, restore session count
- Reschedule: cancel old + create new (simpler than trying to update in place)
- Both accessible via email links using the cancel_token

**API routes:**
```
GET  /api/scheduling/availability?mentor_id=xxx&start=2026-05-01&end=2026-05-07
POST /api/scheduling/book         { mentor_id, slot_start, slot_end }
POST /api/scheduling/cancel       { booking_id, cancel_token, reason }
POST /api/scheduling/reschedule   { booking_id, cancel_token, new_slot_start }
GET  /api/auth/calendar/google    (OAuth redirect)
GET  /api/auth/calendar/google/callback
GET  /api/auth/calendar/microsoft (OAuth redirect)
GET  /api/auth/calendar/microsoft/callback
```

**NPM packages:**
- `googleapis` - Google Calendar API client
- `@azure/msal-node` - Microsoft OAuth
- `date-fns` + `date-fns-tz` - timezone-aware date math
- `ics` - generate ICS calendar attachments

**Cost:** $0. API calls to Google Calendar and Microsoft Graph are free.

### Anthropic (Claude)

**What it does:** Powers V0 AI features: icebreaker generation and post-call breakdowns. MentorGPT (post-V0) will also use this.

**Model:** Sonnet 4. Strong reasoning, good at structured output, competitive pricing.

**V0 usage:**
- Icebreakers: ~500 tokens per generation. One per booking. At 500 students doing 2 sessions/month, ~1,000 calls/month.
- Post-call breakdowns: ~2,000-4,000 tokens per call (transcript input + structured output). Same volume.

**Cost estimate:** Roughly $10-20/month at V0 scale. Negligible.

### PostHog

**What it does:** Product analytics, event tracking, funnels, feature flags.

**Events to track:**
- page_view (all pages)
- checkout_clicked
- purchase_completed
- onboarding_started / onboarding_completed
- eligibility_submitted
- match_requested / match_assigned
- session_booked / session_completed / session_cancelled
- message_sent
- mentor_gpt_conversation_started / mentor_gpt_message_sent
- rating_submitted
- safety_flag_created

**Cost:** Free tier covers 1M events/month and 5k sessions. More than enough.

---

## Environment Variables

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PAYMENT_LINK=

# Daily.co
DAILY_API_KEY=
DAILY_WEBHOOK_SECRET=

# Google Calendar OAuth
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=
GOOGLE_CALENDAR_REDIRECT_URI=

# Microsoft Calendar OAuth
MICROSOFT_CALENDAR_CLIENT_ID=
MICROSOFT_CALENDAR_CLIENT_SECRET=
MICROSOFT_CALENDAR_REDIRECT_URI=

# Anthropic (Claude)
ANTHROPIC_API_KEY=

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

# Email
RESEND_API_KEY=

# Admin
ADMIN_EMAIL=
ADMIN_PASSWORD=

# App
NEXT_PUBLIC_APP_URL=
NODE_ENV=
```

---

## Security

### Authentication
- Supabase Auth handles sessions, password hashing, token refresh
- Row-Level Security (RLS) policies on all tables
- Students can only read their own data + their mentor's profile
- Mentors can only see their matched students
- School admins can see students from their school (not identity fields)
- Admin has full access

### RLS Examples

```sql
-- Students can only see their own messages
CREATE POLICY "Users see own conversations" ON messages
  FOR SELECT USING (
    sender_id = auth.uid()
    OR conversation_id IN (
      SELECT c.id FROM conversations c
      JOIN mentor_matches mm ON c.match_id = mm.id
      WHERE mm.student_id = auth.uid() OR mm.mentor_id = auth.uid()
    )
  );

-- School admins cannot see identity_tags
CREATE POLICY "School admins see student profiles without identity" ON student_profiles
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM school_admins sa
      JOIN student_profiles sp ON sp.school_id = sa.school_id
      WHERE sa.user_id = auth.uid() AND sp.user_id = student_profiles.user_id
    )
  );
```

### Data Privacy
- Identity tags (race, gender, first-gen) are never exposed to school admins
- Transcripts and recordings are stored in private Supabase Storage buckets
- Message content is searchable by admin only (for safety review)
- All API calls log timestamp, endpoint, user_id, success/failure
- Sensitive data (passwords, API keys) never in frontend error messages

---

## Build Order

This is the recommended order for building V0. Each phase produces something usable.

### Phase 1: Foundation (Week 1)
- Set up Next.js project on Vercel
- Configure Supabase (Auth, DB, migrations)
- Port marketing pages from existing codebase
- Port Stripe checkout flow
- Port admin login and basic admin pages

### Phase 2: Core User Flow (Week 2)
- Onboarding flow with student profiles
- Mentor profiles and directory page
- Match request creation
- Admin matching dashboard
- Email notifications (match assigned)

### Phase 3: Scheduling + Video (Week 3)
- Google Calendar OAuth flow (connect during mentor onboarding)
- Microsoft Outlook OAuth flow (same pattern, different provider)
- Token refresh utility
- Availability calculation engine (FreeBusy + schedule + buffer)
- Booking page UI (time slot picker, confirm modal)
- Booking API (create, cancel, reschedule) + calendar event push
- ICS email confirmations via Resend
- Daily.co integration (room creation, embed, webhooks)
- Transcript processing and storage
- Session status tracking

### Phase 4: Session Tools + Messaging (Week 4)
- Anthropic API integration (Sonnet 4)
- Icebreaker generation pipeline (grade-aware, session-number-aware)
- Post-call breakdown pipeline (transcript → structured output)
- Supabase Realtime setup
- chatcn components installed and wired
- Content moderation layer

### Phase 5: Ratings + B2B + Analytics (Week 5)
- Post-session rating flow
- Flag system
- B2B access code generation (admin tool)
- Student code redemption flow
- PostHog setup and event tracking
- Admin safety dashboard (flags queue, rules editor)
- Final polish and testing

---

## Cost Projection (Monthly, at 500 Active Users)

| Service | Cost |
|---------|------|
| Vercel (Pro) | $20 |
| Supabase (Free) | $0 |
| Stripe | ~$26/transaction (on $900) |
| Daily.co | ~$100 (if past free tier) |
| Calendar APIs (Google + Microsoft) | $0 |
| Anthropic (Claude) | ~$15 |
| PostHog (Free) | $0 |
| Resend (Free tier) | $0 |
| Domain | ~$12/year |
| **Total (excluding Stripe fees)** | **~$135/month** |

At 100 paid users ($90,000 ARR), infrastructure costs are negligible. That's the point of this stack.

---

## What This Doc Doesn't Cover (Yet)

- Mentor onboarding flow (how do mentors sign up and get verified?)
- Mentor payout system (if they become paid)
- MentorGPT system prompt, guardrails, and data pipeline (post-V0)
- Email templates and notification system design
- Icebreaker prompt engineering (grade-specific templates)
- Post-call breakdown prompt engineering (transcript extraction quality)
- Mobile optimization strategy
- Disaster recovery and backup strategy
- Load testing plan

These can be separate docs as we get closer to each feature.
