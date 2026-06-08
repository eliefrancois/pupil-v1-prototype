// onboarding-identity.ts — shared serialization from the canonical taxonomy
// answer state into the storage shape used by BOTH onboarding flows. Keeping
// this in one place guarantees the mentee and mentor upserts write the exact
// same code-based structure that the Phase 2 matcher will read.

import {
  CANONICAL_TAXONOMY,
  SELF_DESCRIBE,
  selfDescribeTextKey,
  type Dimension,
} from '@/lib/identity-taxonomy'

import type { Role } from '@/components/onboarding/identity-fields'

// Re-export for callers that want the role type from here.
export type { Role }

export interface IdentityState {
  /** dimension_key -> string[] (multi) or string (single). */
  answers: Record<string, string[] | string>
  /** dimension_key -> free-text written-in value when self_describe is picked. */
  selfText: Record<string, string>
  /** Whether the user opted into the sensitive (consent-gated) block. */
  consent: boolean
}

export function emptyIdentityState(): IdentityState {
  return { answers: {}, selfText: {}, consent: false }
}

function asArray(v: string[] | string | undefined): string[] {
  if (Array.isArray(v)) return v
  if (typeof v === 'string' && v.length > 0) return [v]
  return []
}

function dimsForRole(role: Role): Dimension[] {
  return CANONICAL_TAXONOMY.filter((d) => {
    if (d.group === 'basics') return false // basics handled with dedicated columns
    if (role === 'mentee' && d.matchRole === 'mentor_only') return false
    return true
  })
}

/** The self-describe free text for a dim, or null when not applicable. */
function selfDescribeText(dim: Dimension, state: IdentityState): string | null {
  const selected = asArray(state.answers[dim.dimension_key])
  if (!selected.includes(SELF_DESCRIBE)) return null
  const text = (state.selfText[dim.dimension_key] ?? '').trim()
  return text ? text : null
}

/** Write the self-describe free text key when applicable. */
function applySelfDescribe(
  target: Record<string, unknown>,
  dim: Dimension,
  state: IdentityState
) {
  const text = selfDescribeText(dim, state)
  if (text) target[selfDescribeTextKey(dim.dimension_key)] = text
}

export interface SerializedIdentity {
  /** Goes into the `identity_json` jsonb column (codes only). */
  identityJson: Record<string, unknown>
  /** Promoted text[] columns (subset of dims with promotedColumn). */
  promoted: Record<string, string[]>
  /**
   * Mentee preference keys destined for `student_profiles.fit_preferences`.
   * Empty for the mentor role. `college_list` is merged in by the caller.
   * Values are code arrays, plus optional self-describe text strings.
   */
  fitPreferences: Record<string, string[] | string>
}

/**
 * Build the storage shape for one role from the taxonomy answer state.
 *
 * - Mirror dims -> identity_json (+ promoted column if flagged).
 * - Pair dims: mentee answer is a PREFERENCE -> fit_preferences[prefKey];
 *   mentor answer is an ATTRIBUTE -> identity_json (+ promoted column).
 * - Sensitive (consent-gated) dims are only written when consent === true.
 * - mentee_preferences (mentor_only) -> identity_json on the mentor side.
 */
export function serializeIdentity(
  role: Role,
  state: IdentityState
): SerializedIdentity {
  const identityJson: Record<string, unknown> = {}
  const promoted: Record<string, string[]> = {}
  const fitPreferences: Record<string, string[] | string> = {}

  // Always record the consent decision so we can tell "skipped" from "no data".
  identityJson.sensitive_consent = state.consent

  for (const dim of dimsForRole(role)) {
    const key = dim.dimension_key
    const isMulti = dim.select === 'multi'
    const arr = asArray(state.answers[key])
    const single = typeof state.answers[key] === 'string' ? (state.answers[key] as string) : ''

    // Consent gate: drop sensitive answers entirely unless the user opted in.
    if (dim.consentGated && !state.consent) continue

    if (dim.matchRole === 'pair') {
      if (role === 'mentee') {
        // Mentee supplies the PREFERENCE half -> fit_preferences.
        if (dim.pair && arr.length > 0) {
          fitPreferences[dim.pair.prefKey] = arr
          // Self-describe text rides alongside the pref array in
          // fit_preferences so it round-trips on edit (mentee pair answers
          // never touch identity_json).
          const text = selfDescribeText(dim, state)
          if (text) fitPreferences[selfDescribeTextKey(dim.pair.prefKey)] = text
        }
        // Promoted pair columns stay empty for mentees (their answer is a
        // preference, stored in fit_preferences, not an attribute).
      } else {
        // Mentor supplies the ATTRIBUTE half -> identity_json (+ column).
        if (arr.length > 0) identityJson[key] = arr
        if (dim.promotedColumn) promoted[key] = arr
        applySelfDescribe(identityJson, dim, state)
      }
      continue
    }

    // mirror, mentor_only, (display dims are excluded — none reach here)
    if (isMulti) {
      if (arr.length > 0) identityJson[key] = arr
      if (dim.promotedColumn) promoted[key] = arr
    } else if (single) {
      identityJson[key] = single
    }
    applySelfDescribe(identityJson, dim, state)
  }

  return { identityJson, promoted, fitPreferences }
}

/**
 * Rebuild an IdentityState from a stored identity_json blob (for editing an
 * existing profile). Reads code-based keys written by `serializeIdentity`.
 * Legacy/unknown keys are ignored, so old-shape rows simply start empty.
 */
export function hydrateIdentityState(
  role: Role,
  identityJson: Record<string, unknown> | null | undefined,
  fitPreferences?: Record<string, unknown> | null
): IdentityState {
  const state = emptyIdentityState()
  if (!identityJson) return state

  state.consent = identityJson.sensitive_consent === true

  for (const dim of dimsForRole(role)) {
    const key = dim.dimension_key

    const isMenteePair = dim.matchRole === 'pair' && role === 'mentee'
    const prefKey = dim.pair?.prefKey ?? key

    let raw: unknown
    if (isMenteePair) {
      raw = fitPreferences?.[prefKey]
    } else {
      raw = identityJson[key]
    }

    if (Array.isArray(raw)) {
      state.answers[key] = raw.filter((x): x is string => typeof x === 'string')
    } else if (typeof raw === 'string' && raw.length > 0) {
      state.answers[key] = raw
    }

    // Mentee pair self-describe text lives in fit_preferences; everything
    // else lives in identity_json.
    const selfText = isMenteePair
      ? fitPreferences?.[selfDescribeTextKey(prefKey)]
      : identityJson[selfDescribeTextKey(key)]
    if (typeof selfText === 'string' && selfText.length > 0) {
      state.selfText[key] = selfText
    }
  }

  return state
}
