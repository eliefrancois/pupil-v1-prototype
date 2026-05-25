/** Minimum weekly slots a mentor must opt into before admin can assign them. */
export const MIN_MENTOR_MATCH_SLOTS = 1

/**
 * Whether admin can assign this mentor to a student.
 * Ghost profiles stay requestable for claim emails but are not assignable.
 */
export function isMentorAssignableForMatch(params: {
  claimStatus: string | null | undefined
  availabilitySlotCount: number
}): boolean {
  if (params.claimStatus === 'ghost') return false
  return params.availabilitySlotCount >= MIN_MENTOR_MATCH_SLOTS
}
