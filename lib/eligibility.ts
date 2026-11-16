export const ELIGIBILITY_TYPES = ['SNAP', 'FRPL', 'Common App Waiver'] as const
export type EligibilityType = (typeof ELIGIBILITY_TYPES)[number]

export const ELIGIBILITY_CONSENT_TEXT =
  'I\u2019m the student\u2019s parent or guardian, or I have their permission, and I agree to Pupil contacting the counselor listed to confirm eligibility.'
