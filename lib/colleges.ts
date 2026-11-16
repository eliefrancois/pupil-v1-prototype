export type CollegeRecord = {
  id: string
  name: string
  state: string
  country: string | null
  country_code: string | null
  state_province: string | null
}

export const COLLEGE_COLUMNS =
  'id, name, state, country, country_code, state_province'

export const COLLEGE_SEARCH_MIN_LENGTH = 2

export function collegeLocation(college: CollegeRecord): string {
  if (college.country_code === 'US') {
    return college.state_province
      ? `${college.state_province}, United States`
      : 'United States'
  }
  return college.country ?? college.state
}
