import { formatInTimeZone } from 'date-fns-tz'

export const DEFAULT_TIME_ZONE = 'America/New_York'

// Aliases are compared after lowercasing and stripping non-letters.
// Split states (e.g. parts of TN, KY, IN, FL) use the zone most residents are in.
const STATES_BY_ZONE: Record<string, string[]> = {
  'America/New_York': [
    'ct|connecticut', 'de|delaware', 'dc|district of columbia|washington dc', 'fl|florida',
    'ga|georgia', 'in|indiana', 'ky|kentucky', 'me|maine', 'md|maryland',
    'ma|massachusetts', 'mi|michigan', 'nh|new hampshire', 'nj|new jersey|new jercy',
    'ny|new york', 'nc|north carolina', 'oh|ohio', 'pa|pennsylvania', 'ri|rhode island',
    'sc|south carolina', 'vt|vermont', 'va|virginia', 'wv|west virginia', 'pr|puerto rico',
  ],
  'America/Chicago': [
    'al|alabama', 'ar|arkansas', 'il|illinois', 'ia|iowa', 'ks|kansas', 'la|louisiana',
    'mn|minnesota', 'ms|mississippi', 'mo|missouri', 'ne|nebraska', 'nd|north dakota',
    'ok|oklahoma', 'sd|south dakota', 'tn|tennessee', 'tx|texas', 'wi|wisconsin',
  ],
  'America/Denver': ['co|colorado', 'id|idaho', 'mt|montana', 'nm|new mexico', 'ut|utah', 'wy|wyoming'],
  'America/Phoenix': ['az|arizona'],
  'America/Los_Angeles': ['ca|california', 'nv|nevada', 'or|oregon', 'wa|washington'],
  'America/Anchorage': ['ak|alaska'],
  'Pacific/Honolulu': ['hi|hawaii'],
}

const ZONE_BY_STATE = new Map<string, string>(
  Object.entries(STATES_BY_ZONE).flatMap(([zone, entries]) =>
    entries.flatMap((entry) => entry.split('|').map((alias) => [compact(alias), zone] as const))
  )
)

function compact(s: string): string {
  return s.toLowerCase().replace(/[^a-z]/g, '')
}

/** Best-effort US state (name or abbreviation) to IANA time zone. */
export function timeZoneForState(state: string | null | undefined): string {
  if (!state) return DEFAULT_TIME_ZONE
  return ZONE_BY_STATE.get(compact(state)) ?? DEFAULT_TIME_ZONE
}

export function isValidTimeZone(zone: string | null | undefined): zone is string {
  if (!zone) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone })
    return true
  } catch {
    return false
  }
}

/** yyyy-MM-dd in the given zone. */
export function localDate(at: Date | string | number, zone: string): string {
  return formatInTimeZone(new Date(at), zone, 'yyyy-MM-dd')
}

export function localHour(at: Date, zone: string): number {
  return Number(formatInTimeZone(at, zone, 'H'))
}

/** Calendar arithmetic on yyyy-MM-dd strings, independent of time zones. */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function daysBetween(from: string, to: string): number {
  return Math.round(
    (new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) /
      86_400_000
  )
}
