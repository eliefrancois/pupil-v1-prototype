// match-score.ts — Phase 2 match-strength scorer (manual-assignment aid).
//
// A pure, deterministic, explainable function that scores how well a mentor
// fits a mentee, returning an overall 0–100 strength plus a per-dimension
// breakdown. This is NOT auto-matching: it produces a transparent score an
// admin reads while picking a mentor by hand.
//
// Data model it consumes (shipped by Phase 1 — see identity-taxonomy.ts and the
// canonical-taxonomy migration):
//   - Mentor ATTRIBUTES live in promoted text[] columns on mentor_profiles:
//       academic_identity, first_gen, race_ethnicity,
//       college_experience, career_aspirations
//   - Mentee MIRROR attributes live in promoted text[] columns on
//       student_profiles: academic_identity, first_gen, race_ethnicity
//   - Mentee PREFERENCE halves of the pair dimensions live in
//       student_profiles.fit_preferences (jsonb):
//       career_pref, college_experience_pref
//
// All values are stored as canonical option CODES (never labels). The caller
// resolves codes to labels for display via labelForCode / labelsForCodes.
//
// IMPORTANT: consent-gated SENSITIVE_KEYS are never read here. The only five
// dimensions that drive v1 weight are the ones listed below.

import { PREFER_NOT_TO_SAY, SELF_DESCRIBE } from '@/lib/identity-taxonomy'

/** The five dimensions that drive v1 match strength. */
export type MatchDimensionKey =
  | 'academic_identity'
  | 'career_aspirations'
  | 'college_experience'
  | 'first_gen'
  | 'race_ethnicity'

/**
 * How a dimension matched:
 * - 'overlap'    — mentee had data and it shares ≥1 code with the mentor.
 * - 'no_overlap' — mentee had data but nothing was shared (a real 0).
 * - 'no_data'    — mentee supplied nothing here; excluded from the score so a
 *                  blank field never penalizes the mentor.
 */
export type DimensionStatus = 'overlap' | 'no_overlap' | 'no_data'

export interface DimensionBreakdown {
  key: MatchDimensionKey
  /** Human-friendly dimension name for display. */
  label: string
  /** Raw weight (points out of 100) this dimension carries when scorable. */
  weight: number
  status: DimensionStatus
  /** Cleaned mentee-side codes considered for this dimension. */
  menteeCodes: string[]
  /** Cleaned mentor-side codes considered for this dimension. */
  mentorCodes: string[]
  /** Intersection of mentee and mentor codes (the "why"). */
  sharedCodes: string[]
  /** Overlap relative to the mentee's set, 0–1. 0 when no mentee data. */
  ratio: number
  /** Weighted contribution to the numerator (weight * ratio), for display. */
  points: number
}

export interface MatchScore {
  /** Overall match strength, 0–100 (integer). */
  overall: number
  breakdown: DimensionBreakdown[]
  /** Sum of weights of the dimensions that had mentee data (the denominator). */
  scoredWeight: number
}

/** Mentee shape the scorer reads (decoupled from the DB row type). */
export interface ScoreMentee {
  academic_identity?: string[] | null
  first_gen?: string[] | null
  race_ethnicity?: string[] | null
  fit_preferences?:
    | {
        career_pref?: string[] | null
        college_experience_pref?: string[] | null
        [key: string]: unknown
      }
    | null
}

/** Mentor shape the scorer reads (decoupled from the DB row type). */
export interface ScoreMentor {
  academic_identity?: string[] | null
  first_gen?: string[] | null
  race_ethnicity?: string[] | null
  college_experience?: string[] | null
  career_aspirations?: string[] | null
}

// ---------- Weights (document the rationale) ----------
// academic_identity + career_aspirations carry the most weight: shared
// field of study and target career are the core of a mentorship relationship
// (what the mentee actually wants guidance on). college_experience is the next
// strongest fit signal. first_gen and race_ethnicity are meaningful shared-
// lived-experience signals but are weighted lower so identity overlap supports
// — rather than dominates — an academic/career-driven match. Weights sum to 100
// so a perfect match across every scorable dimension reads as 100.
const DIMENSION_WEIGHTS: Record<MatchDimensionKey, number> = {
  academic_identity: 30,
  career_aspirations: 25,
  college_experience: 20,
  first_gen: 15,
  race_ethnicity: 10,
}

const DIMENSION_LABELS: Record<MatchDimensionKey, string> = {
  academic_identity: 'Academic identity',
  career_aspirations: 'Career aspirations',
  college_experience: 'College experience',
  first_gen: 'First-gen / family background',
  race_ethnicity: 'Race / ethnicity',
}

// Escape-hatch tokens are never treated as a shared attribute: two people both
// answering "prefer not to say" or both writing in (different) self-describe
// text is not a real overlap, so we strip these before intersecting.
const NON_MATCHABLE_CODES = new Set<string>([PREFER_NOT_TO_SAY, SELF_DESCRIBE])

/** Normalize a stored value into a clean, deduped, matchable code list. */
function cleanCodes(value: string[] | null | undefined): string[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of value) {
    if (typeof raw !== 'string') continue
    const code = raw.trim()
    if (!code || NON_MATCHABLE_CODES.has(code)) continue
    if (seen.has(code)) continue
    seen.add(code)
    out.push(code)
  }
  return out
}

/** Resolve the mentee-side codes for a dimension (mirror column or pref key). */
function menteeCodesFor(
  key: MatchDimensionKey,
  mentee: ScoreMentee
): string[] {
  switch (key) {
    case 'academic_identity':
      return cleanCodes(mentee.academic_identity)
    case 'first_gen':
      return cleanCodes(mentee.first_gen)
    case 'race_ethnicity':
      return cleanCodes(mentee.race_ethnicity)
    case 'career_aspirations':
      // PAIR: mentee preference half lives in fit_preferences.career_pref.
      return cleanCodes(mentee.fit_preferences?.career_pref)
    case 'college_experience':
      // PAIR: mentee preference half lives in college_experience_pref.
      return cleanCodes(mentee.fit_preferences?.college_experience_pref)
  }
}

/** Resolve the mentor-side codes for a dimension (always a promoted column). */
function mentorCodesFor(
  key: MatchDimensionKey,
  mentor: ScoreMentor
): string[] {
  switch (key) {
    case 'academic_identity':
      return cleanCodes(mentor.academic_identity)
    case 'first_gen':
      return cleanCodes(mentor.first_gen)
    case 'race_ethnicity':
      return cleanCodes(mentor.race_ethnicity)
    case 'career_aspirations':
      return cleanCodes(mentor.career_aspirations)
    case 'college_experience':
      return cleanCodes(mentor.college_experience)
  }
}

/** Stable order so the breakdown always renders heaviest signal first. */
export const MATCH_DIMENSION_ORDER: MatchDimensionKey[] = [
  'academic_identity',
  'career_aspirations',
  'college_experience',
  'first_gen',
  'race_ethnicity',
]

/**
 * Score how well `mentor` fits `mentee`.
 *
 * Per dimension we compute an overlap ratio relative to the MENTEE's expressed
 * set ("how much of what the mentee is looking for does this mentor cover").
 * The overall score is the weighted average of those ratios over only the
 * dimensions where the mentee supplied data — so a blank mentee field is marked
 * "no data" and silently excluded rather than dragging the score down. A
 * dimension where the mentee has data but the mentor doesn't is a genuine 0 and
 * still counts (it's a real non-match, not missing data).
 *
 * Deterministic and side-effect free.
 */
export function scoreMatch(mentee: ScoreMentee, mentor: ScoreMentor): MatchScore {
  const breakdown: DimensionBreakdown[] = []
  let numerator = 0
  let scoredWeight = 0

  for (const key of MATCH_DIMENSION_ORDER) {
    const weight = DIMENSION_WEIGHTS[key]
    const menteeCodes = menteeCodesFor(key, mentee)
    const mentorCodes = mentorCodesFor(key, mentor)

    if (menteeCodes.length === 0) {
      breakdown.push({
        key,
        label: DIMENSION_LABELS[key],
        weight,
        status: 'no_data',
        menteeCodes,
        mentorCodes,
        sharedCodes: [],
        ratio: 0,
        points: 0,
      })
      continue
    }

    const mentorSet = new Set(mentorCodes)
    const sharedCodes = menteeCodes.filter((c) => mentorSet.has(c))
    const ratio = sharedCodes.length / menteeCodes.length // 0..1 by construction
    const points = weight * ratio

    numerator += points
    scoredWeight += weight

    breakdown.push({
      key,
      label: DIMENSION_LABELS[key],
      weight,
      status: sharedCodes.length > 0 ? 'overlap' : 'no_overlap',
      menteeCodes,
      mentorCodes,
      sharedCodes,
      ratio,
      points,
    })
  }

  const overall =
    scoredWeight > 0 ? Math.round((numerator / scoredWeight) * 100) : 0

  return { overall, breakdown, scoredWeight }
}

/** Tier buckets for badge coloring / sorting affordances. */
export type MatchTier = 'strong' | 'moderate' | 'weak' | 'none'

export function matchTier(score: MatchScore): MatchTier {
  if (score.scoredWeight === 0) return 'none'
  if (score.overall >= 66) return 'strong'
  if (score.overall >= 33) return 'moderate'
  return 'weak'
}
