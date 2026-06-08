// identity-taxonomy.ts — Canonical Taxonomy v0.1
//
// THE single source of truth for the mentee + mentor onboarding identity
// questions. Both forms import from here. Dimensions MIRROR across roles: the
// same `dimension_key` and the same option `code`s are used on both sides so
// that matching can join mentee answers against mentor answers. Only the
// question LABEL differs by role (mentee = present/aspirational "I am / I
// want"; mentor = lived experience "I was / I can mentor").
//
// Storage rule: we ALWAYS store option `code`s, never display labels. Labels
// are resolved at render/display time via the helpers at the bottom of this
// file.
//
// Phase 2 hook: the admin match-strength scorer/display is NOT built here. It
// should consume the promoted `text[]` columns (see `PROMOTED_COLUMN_KEYS`)
// and the mentee `fit_preferences` keys (see `PAIR_PREF_KEYS`) to compute
// preference→attribute overlap. Nothing in this module computes scores.

// ---------- Standardized escape-hatch tokens ----------
// Every dimension that needs an opt-out / write-in uses these exact tokens.
export const PREFER_NOT_TO_SAY = 'prefer_not_to_say'
export const SELF_DESCRIBE = 'self_describe'

export const PREFER_NOT_TO_SAY_LABEL = 'Prefer not to say'
export const SELF_DESCRIBE_LABEL = 'Self-describe'

/** Free-text written into identity_json under `${dimension_key}_self_describe_text`. */
export function selfDescribeTextKey(dimensionKey: string): string {
  return `${dimensionKey}_self_describe_text`
}

// ---------- Types ----------
export type SelectKind = 'single' | 'multi'

/**
 * How a dimension participates in matching:
 * - 'mirror': both roles answer the same question; matched by shared attribute.
 * - 'pair': mentee answers a PREFERENCE, mentor answers an ATTRIBUTE; matched
 *   by preference→attribute overlap.
 * - 'mentor_only': only the mentor answers (e.g. "who I want to support").
 * - 'display': profile color only, not a matching driver.
 */
export type MatchRole = 'mirror' | 'pair' | 'mentor_only' | 'display'

/** Which onboarding section a dimension renders in. */
export type DimensionGroup =
  | 'basics'
  | 'background'
  | 'fit'
  | 'sensitive'
  | 'mentor'

export interface DimensionOption {
  code: string
  label: string
}

export interface PairMeta {
  /** The role that supplies the PREFERENCE half of the pair. */
  preferenceSide: 'mentee'
  /** Key under `student_profiles.fit_preferences` holding the mentee preference. */
  prefKey: string
}

export interface Dimension {
  dimension_key: string
  menteeLabel: string
  mentorLabel: string
  menteeHelp?: string
  mentorHelp?: string
  options: DimensionOption[]
  required: { mentee: boolean; mentor: boolean }
  select: SelectKind
  matchRole: MatchRole
  consentGated: boolean
  group: DimensionGroup
  /** Present only when matchRole === 'pair'. */
  pair?: PairMeta
  /**
   * True when answers are promoted to a queryable `text[]` column of the same
   * name on BOTH profile tables (in addition to identity_json). Used by the
   * Phase 2 matcher.
   */
  promotedColumn?: boolean
  /**
   * For `college_list`: rendered as the free-form schools tag picker rather
   * than a fixed option set. Such dimensions have `options: []`.
   */
  freeform?: boolean
}

// ---------- Helpers to build escape-hatch tails consistently ----------
const SELF: DimensionOption = { code: SELF_DESCRIBE, label: SELF_DESCRIBE_LABEL }
const PNTS: DimensionOption = {
  code: PREFER_NOT_TO_SAY,
  label: PREFER_NOT_TO_SAY_LABEL,
}

// ---------- The canonical dimension set ----------
export const CANONICAL_TAXONOMY: Dimension[] = [
  // ===================== BASICS (mentee) =====================
  {
    dimension_key: 'grade_level',
    menteeLabel: 'Grade level',
    mentorLabel: 'Grade level',
    options: [
      { code: '9', label: '9th' },
      { code: '10', label: '10th' },
      { code: '11', label: '11th' },
      { code: '12', label: '12th' },
    ],
    required: { mentee: false, mentor: false },
    select: 'single',
    matchRole: 'display',
    consentGated: false,
    group: 'basics',
  },
  {
    dimension_key: 'gpa_range',
    menteeLabel: 'GPA range',
    mentorLabel: 'GPA range',
    // gpa_range is a display-only basics field stored in the dedicated `gpa`
    // text column (not identity_json), so codes are kept human-readable and
    // backward-compatible with existing rows.
    options: [
      { code: '4.0+', label: '4.0+' },
      { code: '3.7-3.9', label: '3.7–3.9' },
      { code: '3.4-3.6', label: '3.4–3.6' },
      { code: '3.0-3.3', label: '3.0–3.3' },
      { code: 'Below 3.0', label: 'Below 3.0' },
      { code: PREFER_NOT_TO_SAY_LABEL, label: PREFER_NOT_TO_SAY_LABEL },
    ],
    required: { mentee: true, mentor: false },
    select: 'single',
    matchRole: 'display',
    consentGated: false,
    group: 'basics',
  },
  {
    dimension_key: 'college_list',
    menteeLabel: 'Schools you want to learn about',
    mentorLabel: 'Your school',
    menteeHelp:
      "We'll prioritize mentors who attend or attended these schools.",
    options: [],
    freeform: true,
    required: { mentee: false, mentor: false },
    select: 'multi',
    matchRole: 'pair',
    consentGated: false,
    group: 'basics',
    pair: { preferenceSide: 'mentee', prefKey: 'college_list' },
  },

  // ===================== MIRRORED IDENTITY / BACKGROUND =====================
  {
    dimension_key: 'race_ethnicity',
    menteeLabel: 'Race / ethnicity',
    mentorLabel: 'Race / ethnicity',
    menteeHelp: 'Select all that apply.',
    mentorHelp: 'Select all that apply.',
    options: [
      { code: 'black_african_american', label: 'Black or African American' },
      { code: 'caribbean', label: 'Caribbean' },
      { code: 'afro_latino', label: 'Afro-Latino/a/e/x' },
      { code: 'hispanic_latino', label: 'Hispanic / Latino/a/e/x' },
      { code: 'asian', label: 'Asian' },
      { code: 'south_asian', label: 'South Asian' },
      { code: 'east_asian', label: 'East Asian' },
      { code: 'southeast_asian', label: 'Southeast Asian' },
      { code: 'white', label: 'White' },
      {
        code: 'american_indian_alaska_native',
        label: 'American Indian / Alaska Native',
      },
      { code: 'indigenous', label: 'Indigenous' },
      { code: 'mena', label: 'Middle Eastern / North African' },
      { code: 'arab', label: 'Arab' },
      {
        code: 'native_hawaiian_pacific_islander',
        label: 'Native Hawaiian / Pacific Islander',
      },
      { code: 'multiracial', label: 'Multiracial / Biracial' },
      SELF,
      PNTS,
    ],
    required: { mentee: false, mentor: false },
    select: 'multi',
    matchRole: 'mirror',
    consentGated: false,
    group: 'background',
    promotedColumn: true,
  },
  {
    dimension_key: 'socioeconomic_background',
    menteeLabel: 'Socioeconomic background',
    mentorLabel: 'Socioeconomic background',
    menteeHelp: 'Select all that apply.',
    mentorHelp: 'Select all that apply.',
    // Merged: union of mentor (work/aid framing) + mentee (income tiers +
    // benefits) lists, with tense duplicates folded (Pell now/future →
    // pell_eligible; financial aid recipient/likely → financial_aid).
    options: [
      { code: 'low_income', label: 'Low-income' },
      { code: 'lower_middle_income', label: 'Lower-middle-income' },
      { code: 'middle_income', label: 'Middle-income' },
      { code: 'pell_eligible', label: 'Pell-eligible' },
      { code: 'financial_aid', label: 'Financial aid' },
      { code: 'scholarship_recipient', label: 'Scholarship recipient' },
      {
        code: 'free_reduced_lunch',
        label: 'Free or reduced-price lunch eligible',
      },
      { code: 'snap_public_benefits', label: 'SNAP / public benefits' },
      { code: 'fee_waiver_eligible', label: 'Fee waiver eligible' },
      { code: 'working_student', label: 'Working student' },
      { code: 'supporting_family', label: 'Supporting family financially' },
      { code: 'housing_insecure', label: 'Housing insecure background' },
      {
        code: 'foster_care',
        label: 'Foster care / ward of the state background',
      },
      SELF,
      PNTS,
    ],
    required: { mentee: false, mentor: false },
    select: 'multi',
    matchRole: 'mirror',
    consentGated: false,
    group: 'background',
  },
  {
    dimension_key: 'first_gen',
    menteeLabel: 'First-generation / family background',
    mentorLabel: 'First-generation / family background',
    menteeHelp: 'Select all that apply.',
    mentorHelp: 'Select all that apply.',
    options: [
      { code: 'first_gen_college', label: 'First-generation college student' },
      { code: 'first_in_family', label: 'First in family to attend college' },
      {
        code: 'first_in_family_us',
        label: 'First in family to attend college in the U.S.',
      },
      { code: 'first_gen_american', label: 'First-generation American' },
      { code: 'child_of_immigrants', label: 'Child of immigrants' },
      { code: 'immigrant_background', label: 'Immigrant background' },
      { code: 'refugee_asylee', label: 'Refugee / asylee background' },
      { code: 'undocumented_daca', label: 'Undocumented / DACA background' },
      { code: 'mixed_status_family', label: 'Mixed-status family' },
      { code: 'fgli', label: 'Low-income / FGLI background' },
      SELF,
      PNTS,
    ],
    required: { mentee: false, mentor: false },
    select: 'multi',
    matchRole: 'mirror',
    consentGated: false,
    group: 'background',
    promotedColumn: true,
  },
  {
    dimension_key: 'academic_identity',
    menteeLabel: 'Academic identity',
    mentorLabel: 'Academic identity',
    menteeHelp: 'What you study or want to study. Select all that apply.',
    mentorHelp:
      'What you studied or focused on. Select all that apply. Required.',
    // No prefer_not_to_say: this is a matching driver and is required for
    // mentors. self_describe is kept as the write-in escape hatch.
    options: [
      { code: 'stem', label: 'STEM' },
      { code: 'business', label: 'Business' },
      { code: 'humanities', label: 'Humanities' },
      { code: 'social_sciences', label: 'Social sciences' },
      { code: 'arts_creative', label: 'Arts / creative' },
      { code: 'pre_med', label: 'Pre-med' },
      { code: 'pre_law', label: 'Pre-law' },
      { code: 'education', label: 'Education' },
      { code: 'cs_tech', label: 'Computer science / technology' },
      { code: 'engineering', label: 'Engineering' },
      { code: 'undecided', label: 'Undecided / exploring' },
      { code: 'vocational', label: 'Vocational / career-focused' },
      SELF,
    ],
    required: { mentee: false, mentor: true },
    select: 'multi',
    matchRole: 'mirror',
    consentGated: false,
    group: 'background',
    promotedColumn: true,
  },
  {
    dimension_key: 'athlete_creative_extracurricular',
    menteeLabel: 'Athlete / creative / extracurricular identity',
    mentorLabel: 'Athlete / creative / extracurricular identity',
    menteeHelp: 'Select all that apply.',
    mentorHelp: 'Select all that apply.',
    options: [
      { code: 'student_athlete', label: 'Student-athlete' },
      { code: 'artist', label: 'Artist' },
      { code: 'musician', label: 'Musician' },
      { code: 'dancer', label: 'Dancer' },
      { code: 'theater_performing', label: 'Theater / performing arts' },
      { code: 'writer', label: 'Writer' },
      { code: 'designer', label: 'Designer' },
      { code: 'content_creator', label: 'Content creator' },
      { code: 'gamer_esports', label: 'Gamer / esports player' },
      { code: 'debater', label: 'Debater' },
      { code: 'student_govt', label: 'Student government leader' },
      { code: 'community_organizer', label: 'Community organizer' },
      { code: 'entrepreneur', label: 'Entrepreneur' },
      { code: 'researcher', label: 'Researcher' },
      { code: 'volunteer_service', label: 'Volunteer / service leader' },
      { code: 'club_leader', label: 'Club leader' },
      SELF,
    ],
    required: { mentee: false, mentor: false },
    select: 'multi',
    matchRole: 'mirror',
    consentGated: false,
    group: 'background',
  },
  {
    dimension_key: 'high_school_experience',
    menteeLabel: 'High school experience / student status',
    mentorLabel: 'High school experience / student status',
    menteeHelp: 'Select all that apply.',
    mentorHelp: 'What your high school experience was like. Select all that apply.',
    options: [
      { code: 'public_school', label: 'Public school student' },
      { code: 'private_school', label: 'Private school student' },
      { code: 'charter_school', label: 'Charter school student' },
      { code: 'magnet_school', label: 'Magnet school student' },
      { code: 'homeschool', label: 'Homeschool student' },
      { code: 'online_school', label: 'Online school student' },
      { code: 'transfer_student', label: 'Transfer student' },
      { code: 'student_athlete', label: 'Student-athlete' },
      { code: 'working_student', label: 'Working student' },
      {
        code: 'first_gen_college_bound',
        label: 'First-generation college-bound student',
      },
      { code: 'college_prep_program', label: 'College prep program participant' },
      { code: 'dual_enrollment', label: 'Dual enrollment student' },
      { code: 'ap_ib', label: 'AP / IB student' },
      { code: 'cte', label: 'Career & technical education student' },
      SELF,
      PNTS,
    ],
    required: { mentee: false, mentor: false },
    select: 'multi',
    matchRole: 'mirror',
    consentGated: false,
    group: 'background',
  },
  {
    dimension_key: 'language_household',
    menteeLabel: 'Language / household background',
    mentorLabel: 'Language / household background',
    menteeHelp: 'Select all that apply.',
    mentorHelp: 'Select all that apply.',
    options: [
      { code: 'multilingual_household', label: 'Multilingual household' },
      { code: 'esl', label: 'English as a second language' },
      { code: 'bilingual', label: 'Bilingual' },
      { code: 'trilingual', label: 'Trilingual' },
      { code: 'non_english_household', label: 'Non-English speaking household' },
      { code: 'spanish_speaking_household', label: 'Spanish-speaking household' },
      SELF,
      PNTS,
    ],
    required: { mentee: false, mentor: false },
    select: 'multi',
    matchRole: 'mirror',
    consentGated: false,
    group: 'background',
  },
  {
    dimension_key: 'geography_community',
    menteeLabel: 'Geography / community type',
    mentorLabel: 'Geography / community type',
    menteeHelp: 'Select all that apply.',
    mentorHelp: 'Select all that apply.',
    // Union incl. immigrant enclave / low-income / gentrifying.
    options: [
      { code: 'urban', label: 'Urban' },
      { code: 'suburban', label: 'Suburban' },
      { code: 'rural', label: 'Rural' },
      { code: 'small_town', label: 'Small town' },
      { code: 'inner_city', label: 'Inner city' },
      { code: 'major_city', label: 'Major city' },
      { code: 'tribal_reservation', label: 'Tribal / reservation community' },
      { code: 'agricultural_farming', label: 'Agricultural / farming community' },
      { code: 'coastal', label: 'Coastal community' },
      { code: 'island', label: 'Island community' },
      { code: 'border_community', label: 'Border community' },
      { code: 'immigrant_enclave', label: 'Immigrant / ethnic enclave' },
      { code: 'low_income_community', label: 'Low-income community' },
      { code: 'under_resourced', label: 'Under-resourced community' },
      { code: 'gentrifying', label: 'Gentrifying community' },
      { code: 'military_connected', label: 'Military-connected community' },
      SELF,
      PNTS,
    ],
    required: { mentee: false, mentor: false },
    select: 'multi',
    matchRole: 'mirror',
    consentGated: false,
    group: 'background',
  },

  // ===================== PREFERENCE → ATTRIBUTE PAIRS =====================
  {
    dimension_key: 'college_experience',
    menteeLabel: 'College experiences you want in a mentor',
    mentorLabel: 'Your college experience',
    menteeHelp:
      "We'll prioritize mentors who lived these experiences. Select all that apply.",
    mentorHelp: 'Select all that apply.',
    options: [
      { code: 'residential', label: 'Residential student' },
      { code: 'commuter', label: 'Commuter student' },
      { code: 'transfer', label: 'Transfer student' },
      { code: 'out_of_state', label: 'Out-of-state student' },
      { code: 'in_state', label: 'In-state student' },
      { code: 'international', label: 'International student' },
      { code: 'community_college', label: 'Community college student' },
      {
        code: 'former_community_college',
        label: 'Former community college student',
      },
      { code: 'student_athlete', label: 'Student-athlete' },
      { code: 'study_abroad', label: 'Study abroad experience' },
      { code: 'gap_year', label: 'Gap year experience' },
      SELF,
      PNTS,
    ],
    required: { mentee: false, mentor: false },
    select: 'multi',
    matchRole: 'pair',
    consentGated: false,
    group: 'fit',
    pair: { preferenceSide: 'mentee', prefKey: 'college_experience_pref' },
    promotedColumn: true,
  },
  {
    dimension_key: 'career_aspirations',
    menteeLabel: 'Careers you want to explore',
    mentorLabel: 'Your career path / aspirations',
    menteeHelp:
      "We'll prioritize mentors heading toward these careers. Select all that apply.",
    mentorHelp: 'Select all that apply.',
    options: [
      { code: 'doctor_healthcare', label: 'Doctor / healthcare professional' },
      { code: 'engineer', label: 'Engineer' },
      { code: 'founder_entrepreneur', label: 'Founder / entrepreneur' },
      { code: 'educator', label: 'Educator' },
      { code: 'lawyer', label: 'Lawyer' },
      { code: 'researcher', label: 'Researcher' },
      { code: 'public_servant', label: 'Public servant' },
      { code: 'creative_professional', label: 'Creative professional' },
      {
        code: 'software_technologist',
        label: 'Software developer / technologist',
      },
      { code: 'business_finance', label: 'Business / finance professional' },
      { code: 'social_impact', label: 'Social impact leader' },
      { code: 'undecided', label: 'Undecided / exploring' },
      SELF,
    ],
    required: { mentee: false, mentor: false },
    select: 'multi',
    matchRole: 'pair',
    consentGated: false,
    group: 'fit',
    pair: { preferenceSide: 'mentee', prefKey: 'career_pref' },
    promotedColumn: true,
  },
  {
    dimension_key: 'campus_belonging',
    menteeLabel: 'Campus communities you want to find',
    mentorLabel: 'Campus communities you were part of',
    menteeHelp: 'Select all that apply.',
    mentorHelp: 'Select all that apply.',
    // Mentee's fuller ~20-item list is canonical.
    options: [
      { code: 'cultural_centers', label: 'Cultural centers' },
      { code: 'multicultural_center', label: 'Multicultural center' },
      { code: 'black_student_union', label: 'Black Student Union' },
      { code: 'latino_orgs', label: 'Latino/a/e/x student organizations' },
      {
        code: 'asian_pi_orgs',
        label: 'Asian / Pacific Islander student organizations',
      },
      {
        code: 'indigenous_orgs',
        label: 'Indigenous / Native student organizations',
      },
      {
        code: 'mena_orgs',
        label: 'Middle Eastern / North African student organizations',
      },
      { code: 'lgbtq_spaces', label: 'LGBTQ+ spaces' },
      { code: 'fgli_programs', label: 'First-generation / low-income programs' },
      { code: 'women_in_stem', label: 'Women in STEM' },
      { code: 'disability_support', label: 'Disability / accessibility support' },
      { code: 'faith_spiritual', label: 'Faith / spiritual groups' },
      { code: 'international_community', label: 'International student community' },
      { code: 'commuter_community', label: 'Commuter student community' },
      { code: 'transfer_community', label: 'Transfer student community' },
      { code: 'student_athlete_community', label: 'Student-athlete community' },
      { code: 'career_clubs', label: 'Career / pre-professional clubs' },
      { code: 'creative_arts_communities', label: 'Creative / arts communities' },
      {
        code: 'mental_health_wellness',
        label: 'Mental health / wellness resources',
      },
      { code: 'mentorship_programs', label: 'Mentorship programs' },
      {
        code: 'identity_housing',
        label: 'Identity-based housing / living-learning communities',
      },
      SELF,
      PNTS,
    ],
    required: { mentee: false, mentor: false },
    select: 'multi',
    matchRole: 'pair',
    consentGated: false,
    group: 'fit',
    pair: { preferenceSide: 'mentee', prefKey: 'campus_belonging_pref' },
  },

  // ===================== SENSITIVE (consent-gated) =====================
  {
    dimension_key: 'gender_identity',
    menteeLabel: 'Gender identity',
    mentorLabel: 'Gender identity',
    options: [
      { code: 'female', label: 'Female' },
      { code: 'male', label: 'Male' },
      { code: 'non_binary', label: 'Non-binary' },
      { code: 'genderfluid', label: 'Genderfluid' },
      { code: 'genderqueer', label: 'Genderqueer' },
      { code: 'agender', label: 'Agender' },
      { code: 'two_spirit', label: 'Two-Spirit' },
      { code: 'questioning', label: 'Questioning / unsure' },
      SELF,
      PNTS,
    ],
    required: { mentee: false, mentor: false },
    select: 'single',
    matchRole: 'mirror',
    consentGated: true,
    group: 'sensitive',
  },
  {
    dimension_key: 'transgender_status',
    menteeLabel: 'Do you identify as transgender?',
    mentorLabel: 'Do you identify as transgender?',
    options: [
      { code: 'yes', label: 'Yes' },
      { code: 'no', label: 'No' },
      { code: 'questioning', label: 'Questioning / unsure' },
      PNTS,
    ],
    required: { mentee: false, mentor: false },
    select: 'single',
    matchRole: 'mirror',
    consentGated: true,
    group: 'sensitive',
  },
  {
    dimension_key: 'sexual_orientation',
    menteeLabel: 'Sexual orientation',
    mentorLabel: 'Sexual orientation',
    options: [
      { code: 'gay', label: 'Gay' },
      { code: 'lesbian', label: 'Lesbian' },
      { code: 'bisexual', label: 'Bisexual' },
      { code: 'pansexual', label: 'Pansexual' },
      { code: 'queer', label: 'Queer' },
      { code: 'asexual', label: 'Asexual' },
      { code: 'questioning', label: 'Questioning / unsure' },
      SELF,
      PNTS,
    ],
    required: { mentee: false, mentor: false },
    select: 'single',
    matchRole: 'mirror',
    consentGated: true,
    group: 'sensitive',
  },
  {
    dimension_key: 'religion',
    menteeLabel: 'Religion / spiritual background',
    mentorLabel: 'Religion / spiritual background',
    // Catholic / Protestant intentionally fold into self_describe (not listed).
    options: [
      { code: 'christian', label: 'Christian' },
      { code: 'muslim', label: 'Muslim' },
      { code: 'jewish', label: 'Jewish' },
      { code: 'hindu', label: 'Hindu' },
      { code: 'buddhist', label: 'Buddhist' },
      { code: 'sikh', label: 'Sikh' },
      { code: 'spiritual_not_religious', label: 'Spiritual but not religious' },
      { code: 'agnostic', label: 'Agnostic' },
      { code: 'atheist', label: 'Atheist' },
      { code: 'no_affiliation', label: 'No religious affiliation' },
      SELF,
      PNTS,
    ],
    required: { mentee: false, mentor: false },
    select: 'single',
    matchRole: 'mirror',
    consentGated: true,
    group: 'sensitive',
  },
  {
    dimension_key: 'nationality_immigration',
    menteeLabel: 'Nationality / immigration background',
    mentorLabel: 'Nationality / immigration background',
    menteeHelp: 'Select all that apply.',
    mentorHelp: 'Select all that apply.',
    options: [
      { code: 'us_citizen', label: 'U.S. citizen' },
      { code: 'permanent_resident', label: 'Permanent resident / green card holder' },
      { code: 'dual_citizen', label: 'Dual citizen' },
      { code: 'international_student', label: 'International student' },
      { code: 'immigrant_background', label: 'Immigrant background' },
      { code: 'first_gen_american', label: 'First-generation American' },
      { code: 'child_of_immigrants', label: 'Child of immigrants' },
      { code: 'refugee_asylee', label: 'Refugee / asylee background' },
      { code: 'undocumented_daca', label: 'Undocumented / DACA background' },
      { code: 'mixed_status_family', label: 'Mixed-status family' },
      { code: 'visa_holder', label: 'Visa holder' },
      SELF,
      PNTS,
    ],
    required: { mentee: false, mentor: false },
    select: 'multi',
    matchRole: 'mirror',
    consentGated: true,
    group: 'sensitive',
  },
  {
    dimension_key: 'disability_accessibility',
    menteeLabel: 'Disability / accessibility',
    mentorLabel: 'Disability / accessibility',
    menteeHelp: 'Select all that apply.',
    mentorHelp: 'Select all that apply.',
    // Mentee superset incl. Autism, Uses assistive technology, Needs accommodations.
    options: [
      { code: 'no_disability', label: 'No disability or accessibility need' },
      { code: 'neurodivergent', label: 'Neurodivergent' },
      { code: 'adhd', label: 'ADHD' },
      { code: 'autism', label: 'Autism / autistic' },
      { code: 'learning_disability', label: 'Learning disability' },
      { code: 'physical_mobility', label: 'Physical / mobility disability' },
      { code: 'blind_low_vision', label: 'Blind / low vision' },
      { code: 'deaf_hard_of_hearing', label: 'Deaf / hard of hearing' },
      { code: 'chronic_illness', label: 'Chronic illness / medical condition' },
      { code: 'mental_health', label: 'Mental health disability' },
      { code: 'invisible_disability', label: 'Invisible disability' },
      { code: 'uses_assistive_tech', label: 'Uses assistive technology' },
      { code: 'needs_accommodations', label: 'Needs accessibility accommodations' },
      SELF,
      PNTS,
    ],
    required: { mentee: false, mentor: false },
    select: 'multi',
    matchRole: 'mirror',
    consentGated: true,
    group: 'sensitive',
  },

  // ===================== MENTOR-ONLY =====================
  {
    dimension_key: 'mentee_preferences',
    menteeLabel: '', // not shown to mentees
    mentorLabel: "Students you'd especially like to support",
    mentorHelp: 'We use this to weight matching, not as a hard filter. Optional.',
    options: [
      { code: 'first_gen_students', label: 'First-generation students' },
      { code: 'low_income_students', label: 'Students from low-income backgrounds' },
      { code: 'students_of_color', label: 'Students of color' },
      { code: 'lgbtq_students', label: 'LGBTQ+ students' },
      { code: 'rural_students', label: 'Students from rural areas' },
      { code: 'international_students', label: 'International students' },
      { code: 'undocumented_daca_students', label: 'Undocumented / DACA students' },
      { code: 'disability_students', label: 'Students with disabilities' },
      { code: 'open_to_all', label: 'Open to mentoring all students' },
    ],
    required: { mentee: false, mentor: false },
    select: 'multi',
    matchRole: 'mentor_only',
    consentGated: false,
    group: 'mentor',
  },
]

// ---------- Derived lookups ----------
const BY_KEY: Record<string, Dimension> = Object.fromEntries(
  CANONICAL_TAXONOMY.map((d) => [d.dimension_key, d])
)

export function getDimension(key: string): Dimension | undefined {
  return BY_KEY[key]
}

/** Dimensions promoted to a `text[]` column of the same name on both tables. */
export const PROMOTED_COLUMN_KEYS: string[] = CANONICAL_TAXONOMY.filter(
  (d) => d.promotedColumn
).map((d) => d.dimension_key)

/** Mentee `fit_preferences` keys produced by the pair dimensions. */
export const PAIR_PREF_KEYS: string[] = CANONICAL_TAXONOMY.filter(
  (d) => d.matchRole === 'pair' && d.pair
).map((d) => d.pair!.prefKey)

/** Sensitive dimensions that sit behind the consent gate. */
export const SENSITIVE_KEYS: string[] = CANONICAL_TAXONOMY.filter(
  (d) => d.consentGated
).map((d) => d.dimension_key)

/**
 * Identity background dimensions rendered generically in the mentee/mentor
 * forms (excludes basics, the consent-gated block, and mentor-only fields).
 * Pairs are surfaced separately via `fitDimensions`.
 */
export const backgroundDimensions: Dimension[] = CANONICAL_TAXONOMY.filter(
  (d) => d.group === 'background'
)

export const fitDimensions: Dimension[] = CANONICAL_TAXONOMY.filter(
  (d) => d.group === 'fit' && !d.freeform
)

export const sensitiveDimensions: Dimension[] = CANONICAL_TAXONOMY.filter(
  (d) => d.group === 'sensitive'
)

export const MENTEE_PREFERENCES_DIMENSION = BY_KEY['mentee_preferences']

// ---------- Display helpers ----------
/** Resolve a single code to its display label for a dimension. */
export function labelForCode(dimensionKey: string, code: string): string {
  const dim = BY_KEY[dimensionKey]
  if (!dim) return code
  return dim.options.find((o) => o.code === code)?.label ?? code
}

/** Resolve an array of codes to display labels for a dimension. */
export function labelsForCodes(
  dimensionKey: string,
  codes: string[] | null | undefined
): string[] {
  if (!codes || codes.length === 0) return []
  return codes.map((c) => labelForCode(dimensionKey, c))
}
