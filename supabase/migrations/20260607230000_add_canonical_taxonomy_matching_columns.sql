/*
  # Canonical Taxonomy v0.1 — matching columns (ADDITIVE / NON-DESTRUCTIVE)

  Phase 1 of the onboarding-questions overhaul. This migration ONLY adds new
  nullable `text[]` columns (with empty-array defaults) and GIN indexes. It does
  NOT drop, rename, alter, or rewrite any existing column or data.

  Storage model:
    - All dimension answers are stored as CODE arrays/values in `identity_json`
      on both profiles (handled in the app layer, no schema change needed).
    - The 5 matching-driver dimensions are PROMOTED to queryable `text[]`
      columns on BOTH profiles so the Phase 2 matcher can do fast array-overlap
      joins:
        race_ethnicity, academic_identity, first_gen,
        college_experience, career_aspirations
    - Mentee preference halves of the pair dimensions live in
      `student_profiles.fit_preferences` (jsonb, already present):
        college_experience_pref, career_pref, campus_belonging_pref, college_list
      For mentees the `college_experience` / `career_aspirations` text[] columns
      stay empty (their answers are preferences, not attributes); only the
      mentor side populates those columns.

  Safety: every statement is idempotent (IF NOT EXISTS) and only ADDs. Constant
  '{}' defaults add instantly without a table rewrite on Postgres 11+.

  Phase 2 hook: the admin match-strength scorer/display is intentionally NOT
  built here. It should read these promoted columns + the fit_preferences keys.
*/

-- ---------- student_profiles: promoted matching columns ----------
ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS race_ethnicity     text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS academic_identity  text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS first_gen          text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS college_experience text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS career_aspirations text[] NOT NULL DEFAULT '{}';

-- ---------- mentor_profiles: promoted matching columns ----------
ALTER TABLE mentor_profiles
  ADD COLUMN IF NOT EXISTS race_ethnicity     text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS academic_identity  text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS first_gen          text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS college_experience text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS career_aspirations text[] NOT NULL DEFAULT '{}';

-- ---------- GIN indexes for array-overlap (&&) matching queries ----------
CREATE INDEX IF NOT EXISTS idx_student_profiles_race_ethnicity
  ON student_profiles USING gin (race_ethnicity);
CREATE INDEX IF NOT EXISTS idx_student_profiles_academic_identity
  ON student_profiles USING gin (academic_identity);
CREATE INDEX IF NOT EXISTS idx_student_profiles_first_gen
  ON student_profiles USING gin (first_gen);

CREATE INDEX IF NOT EXISTS idx_mentor_profiles_race_ethnicity
  ON mentor_profiles USING gin (race_ethnicity);
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_academic_identity
  ON mentor_profiles USING gin (academic_identity);
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_first_gen
  ON mentor_profiles USING gin (first_gen);
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_college_experience
  ON mentor_profiles USING gin (college_experience);
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_career_aspirations
  ON mentor_profiles USING gin (career_aspirations);
