/*
  # student_profiles pair-column GIN indexes (ADDITIVE / NON-DESTRUCTIVE)

  Follow-up to 20260607230000_add_canonical_taxonomy_matching_columns.sql.

  That migration created GIN indexes on mentor_profiles for ALL FIVE promoted
  matching columns, but on student_profiles it only indexed the three MIRROR
  columns (race_ethnicity, academic_identity, first_gen) and missed the two
  PAIR columns (college_experience, career_aspirations). This migration adds
  those two missing GIN indexes so the set of indexed promoted columns is
  symmetric across both profile tables.

  Note: for mentees these two columns currently stay empty — their pair answers
  are PREFERENCES stored in student_profiles.fit_preferences
  (college_experience_pref, career_pref), while the columns hold mentor
  ATTRIBUTES. The indexes are added for symmetry / future-proofing and to keep
  array-overlap (&&) queries fast if mentee-side data ever lands in them.

  Safety: every statement is idempotent (IF NOT EXISTS) and only ADDs. No data
  is read, written, dropped, renamed, or rewritten.
*/

CREATE INDEX IF NOT EXISTS idx_student_profiles_college_experience
  ON student_profiles USING gin (college_experience);
CREATE INDEX IF NOT EXISTS idx_student_profiles_career_aspirations
  ON student_profiles USING gin (career_aspirations);
