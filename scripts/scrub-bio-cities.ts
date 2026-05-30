#!/usr/bin/env -S npx tsx
/**
 * Child-safety cleanup: strip city / neighborhood / borough references out of
 * existing mentor bios, leaving STATE-level location at most.
 *
 * Why this exists:
 *   The 2023 ghost-mentor import (`import-ghost-mentors.ts`) fed each mentor's
 *   `city, state` straight into the Claude bio prompt, so most bios open with
 *   "from {City}" / "from the Bronx" / "from {City}, {State}". Mentees are
 *   minors, so a mentor's city/neighborhood must never be exposed.
 *
 *   The prompt itself is now fixed (state-only) so future bios are safe. This
 *   script repairs the rows that already shipped.
 *
 * Approach (deterministic, not LLM):
 *   For each profile we know the original `city` + `state` from `csv_raw`, so
 *   we can surgically rewrite the location reference instead of regenerating
 *   the whole bio. Rules per row:
 *     - "{City}, {State}"  -> "{State}"            (drop city, keep state)
 *     - "(from|in|at) [the] {City}" -> same connector + full state name
 *     - US NYC boroughs (Bronx/Brooklyn/...) -> "New York"
 *     - Foreign / N/A state -> remove the location phrase entirely
 *   Anything that still looks like it leaks a city after scrubbing is flagged
 *   for manual review rather than written blindly.
 *
 *   Tradeoff vs. a full LLM regeneration: a deterministic scrub is instant,
 *   free, reversible, and fully previewable, but can miss unusual phrasings.
 *   The post-scrub leak check surfaces those so they can be handled by hand.
 *
 * Usage:
 *   # Dry-run (default): writes a backup of ALL originals, prints before/after,
 *   # writes NOTHING to the DB.
 *   npx tsx scripts/scrub-bio-cities.ts
 *
 *   # Only look at the first N changed rows in the preview.
 *   npx tsx scripts/scrub-bio-cities.ts --sample 20
 *
 *   # Apply: write scrubbed bios back to mentor_profiles.
 *   npx tsx scripts/scrub-bio-cities.ts --apply
 *
 *   # Roll back: restore originals from a backup file (dry-run unless --apply).
 *   npx tsx scripts/scrub-bio-cities.ts --restore scripts/output/bio-originals-<stamp>.json --apply
 *
 * Safety:
 *   - Dry-run by default. Refuses to write without --apply.
 *   - Always writes a timestamped backup of every original bio to
 *     scripts/output/ BEFORE any mutation, so the change is reversible.
 *   - Only updates rows whose bio actually changed.
 */

import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

loadEnvLocal()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const OUTPUT_DIR = path.resolve(__dirname, 'output')

const args = process.argv.slice(2)
const FLAG = {
  apply: args.includes('--apply'),
  sample: parseIntArg(args, '--sample') ?? 12,
  // Roll back: re-apply originals from a backup file written by an earlier run.
  // Usage: npx tsx scripts/scrub-bio-cities.ts --restore scripts/output/bio-originals-<stamp>.json --apply
  restore: parseStrArg(args, '--restore'),
}

// ---------------------------------------------------------------------------
// US state lookup. Maps abbreviations + full names to the canonical full name.
// Anything not in here (foreign region, "N/A", blank) is treated as "no usable
// state" and the location phrase is removed rather than down-leveled.
// ---------------------------------------------------------------------------

const US_STATES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
  MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire',
  NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina',
  ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania',
  RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee',
  TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington',
  WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming', DC: 'Washington, D.C.',
  PR: 'Puerto Rico',
}
const FULL_STATE_NAMES = new Set(Object.values(US_STATES).map((s) => s.toLowerCase()))

// NYC tokens that all resolve to "New York" at the state level. Used as a
// secondary safety pass for sub-state references that don't match a row's exact
// `city` field. Order matters: longer phrases first so the alternation prefers
// "New York City" over a bare borough.
const NYC_TOKENS = [
  'New York City',
  'NYC',
  'Bronx',
  'Brooklyn',
  'Queens',
  'Manhattan',
  'Staten Island',
  'Harlem',
]
const NYC_ALT = NYC_TOKENS.map(escapeRegex).join('|')

// Words that, when adjacent to a city token, mean it's part of an institution
// name (e.g. "Brooklyn College", "Toronto Metropolitan University") rather than
// a home-location reference. Those are fine to keep, like naming a school.
const INSTITUTION_WORD = 'College|University|State|Institute|Schools?|Tech|Metropolitan|Community'

// A handful of rows have irregular / non-US source data the deterministic
// scrub can't safely rewrite (no "from {city}" anchor, multi-city fields, a
// city used as a noun like "Fresno kid"). We hand-write state-level bios for
// those, keyed by user_id, instead of risking a bad regex transform. These
// replace the scrub output entirely for the listed rows.
const OVERRIDES: Record<string, string> = {
  // Vince Smith — "Fresno kid" (Fresno, CA) used as a noun, no connector.
  'dc414034-4be7-4526-a036-ab0a240594ad':
    "California kid heading into business and computer science. The college app part was smooth for me, but I know it's not that way for everyone. I can help you think through business school stuff, tech programs, or just figure out whether the school you're looking at actually fits what you want to do.",
  // Leyla Zhaksybek — multi-city field "Menton, NYC, Astana"; drop the hometown
  // sentence (the next line already gives region-level "Central Asia" context).
  '687acb60-c5b5-4cf2-897a-58e60d4a9143':
    "Sciences Po and Columbia, class of 2027. Applied as an international student from Central Asia with basically no counselor support, so I get the confusion around essays, school fit, and forms that don't account for where you're actually from. I can help you figure out the Common App, pick schools that make sense for your situation, and deal with the stuff nobody warns you about.",
  // Leonela Espinoza Campomanes — "Innova Schools, Lima."; drop the city, keep
  // the (foreign) school name, which is fine like naming any school.
  'ffe8492f-3df0-4062-8b68-64326e369717':
    'Innova Schools. First-generation student working through a biology degree with a focus on conservation and public health. Applied to college solo, no school support, so I know the stress of figuring out applications without a roadmap. I can help with the actual mechanics of applying abroad, dealing with imposter doubt, and thinking through science programs that align with real-world work.',
  // Will Owen — "bouncing between London and New York" (London, foreign); drop
  // the city clause entirely.
  '46df249a-2c63-40db-a9e2-2cd44707c3a2':
    "Columbia '27. I study math, econ, and studio art, which sounds chaotic but actually makes sense if you squint. I can help you think through arts and business school stuff, figure out how to write about weird academic interests, or just talk through whether a fancy school is worth it.",
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProfileRow {
  user_id: string
  bio: string | null
  csv_raw: { first_name?: string; last_name?: string; city?: string; state?: string } | null
}

interface ScrubResult {
  user_id: string
  name: string
  city: string
  state: string
  original: string
  scrubbed: string
  changed: boolean
  stillLeaks: boolean
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('\n=== Pupil Mentor Bio City Scrubber ===')
  console.log(`Mode: ${FLAG.apply ? 'APPLY (writes to DB)' : 'DRY-RUN'}`)

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Supabase env vars missing from .env.local')
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // ----- Rollback path: restore bios from a backup file. -----
  if (FLAG.restore) {
    await restoreFromBackup(supabase, FLAG.restore)
    return
  }

  const { data, error } = await supabase
    .from('mentor_profiles')
    .select('user_id, bio, csv_raw')
  if (error) throw error
  const rows = (data ?? []) as ProfileRow[]
  console.log(`Loaded ${rows.length} mentor_profiles.\n`)

  // ----- Backup every original bio BEFORE doing anything else. -----
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupPath = path.join(OUTPUT_DIR, `bio-originals-${stamp}.json`)
  fs.writeFileSync(
    backupPath,
    JSON.stringify(
      rows.map((r) => ({ user_id: r.user_id, bio: r.bio })),
      null,
      2
    )
  )
  console.log(`Backup of ${rows.length} original bios written to:\n  ${backupPath}\n`)

  // ----- Compute scrubbed bios. -----
  const results: ScrubResult[] = []
  for (const r of rows) {
    if (!r.bio) continue
    const city = (r.csv_raw?.city ?? '').trim()
    const state = (r.csv_raw?.state ?? '').trim()
    const scrubbed = OVERRIDES[r.user_id] ?? scrubBio(r.bio, city, state)
    const changed = scrubbed !== r.bio
    results.push({
      user_id: r.user_id,
      name: `${r.csv_raw?.first_name ?? ''} ${r.csv_raw?.last_name ?? ''}`.trim(),
      city,
      state,
      original: r.bio,
      scrubbed,
      changed,
      stillLeaks: bioLeaksCity(scrubbed, city, state),
    })
  }

  const changed = results.filter((r) => r.changed)
  const leaks = results.filter((r) => r.stillLeaks)

  // ----- Preview. -----
  console.log(`--- BEFORE / AFTER (first ${Math.min(FLAG.sample, changed.length)} of ${changed.length} changed) ---`)
  changed.slice(0, FLAG.sample).forEach((r, i) => {
    console.log(`\n[${i + 1}] ${r.name}  (city="${r.city}", state="${r.state}")`)
    console.log(`  BEFORE: ${r.original}`)
    console.log(`  AFTER:  ${r.scrubbed}`)
  })

  if (leaks.length > 0) {
    console.log(`\n--- STILL LEAKS A CITY AFTER SCRUB (${leaks.length}) — review manually ---`)
    leaks.forEach((r) => {
      console.log(`\n  ${r.name}  (city="${r.city}", state="${r.state}")`)
      console.log(`  AFTER: ${r.scrubbed}`)
    })
  }

  console.log('\n--- SUMMARY ---')
  console.log(`  total bios:        ${results.length}`)
  console.log(`  changed:           ${changed.length}`)
  console.log(`  unchanged:         ${results.length - changed.length}`)
  console.log(`  still leak a city: ${leaks.length}`)

  if (!FLAG.apply) {
    console.log('\nDry-run complete. No DB writes. Re-run with --apply to write scrubbed bios.')
    return
  }

  // ----- Apply. -----
  console.log(`\nApplying ${changed.length} bio updates to mentor_profiles...`)
  let updated = 0
  let errors = 0
  for (let i = 0; i < changed.length; i++) {
    const r = changed[i]
    const { error: upErr } = await supabase
      .from('mentor_profiles')
      .update({ bio: r.scrubbed })
      .eq('user_id', r.user_id)
    if (upErr) {
      console.error(`  [${i + 1}] ${r.name}: ${upErr.message}`)
      errors++
      continue
    }
    updated++
    if ((i + 1) % 25 === 0 || i === changed.length - 1) {
      process.stdout.write(`  ${i + 1}/${changed.length} updated\r`)
    }
  }
  console.log(`\nApply complete:\n  updated: ${updated}\n  errors:  ${errors}`)
  console.log(`\nOriginals are backed up at:\n  ${backupPath}`)
}

// ---------------------------------------------------------------------------
// Rollback
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function restoreFromBackup(supabase: any, file: string) {
  const p = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file)
  if (!fs.existsSync(p)) throw new Error(`Backup file not found: ${p}`)
  const backup: { user_id: string; bio: string | null }[] = JSON.parse(
    fs.readFileSync(p, 'utf-8')
  )
  console.log(`Loaded ${backup.length} original bios from backup:\n  ${p}\n`)
  if (!FLAG.apply) {
    console.log('Dry-run. Re-run with --apply to restore these originals to the DB.')
    return
  }
  console.log('Restoring original bios to mentor_profiles...')
  let restored = 0
  let errors = 0
  for (const r of backup) {
    const { error } = await supabase
      .from('mentor_profiles')
      .update({ bio: r.bio })
      .eq('user_id', r.user_id)
    if (error) {
      console.error(`  ${r.user_id}: ${error.message}`)
      errors++
      continue
    }
    restored++
  }
  console.log(`\nRestore complete:\n  restored: ${restored}\n  errors:   ${errors}`)
}

// ---------------------------------------------------------------------------
// Scrub logic
// ---------------------------------------------------------------------------

function fullStateName(state: string): string | null {
  const s = state.trim()
  if (!s || s.toUpperCase() === 'N/A') return null
  if (US_STATES[s.toUpperCase()]) return US_STATES[s.toUpperCase()]
  if (FULL_STATE_NAMES.has(s.toLowerCase())) {
    // Normalize casing to our canonical full name.
    return Object.values(US_STATES).find((n) => n.toLowerCase() === s.toLowerCase())!
  }
  return null // foreign region, etc.
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Remove / down-level the mentor's city reference. `city` and `state` come from
 * the original CSV row, so we target the exact strings that were injected.
 */
function scrubBio(bio: string, city: string, state: string): string {
  let out = bio
  const full = fullStateName(state)
  // Some CSV city values are malformed (e.g. "From Bucharest"); strip a leading
  // connector so the regexes line up with the bio text.
  const cityClean = city.replace(/^(from|in|at)\s+/i, '').trim()

  if (cityClean) {
    const cityRe = escapeRegex(cityClean)

    // Tokens that can trail a city as ", <token>": the state (as written or its
    // full name) plus NYC boroughs. We consume these alongside the city so a
    // removal never strands a leftover ", Maharashtra" or ", Queens".
    const stateVariants = Array.from(new Set([state, full].filter(Boolean)))
      .map((s) => escapeRegex(s as string))
    const trailingAlt = [...stateVariants, NYC_ALT].filter(Boolean).join('|')

    // Pass 1 (US only): "[the] City, <state>" -> full state name, even without a
    // leading connector. Word boundary so "IL" doesn't match inside "Illinois".
    // Skipped for foreign/N/A states; Pass 2 removes those (connector included).
    if (full && stateVariants.length > 0) {
      const reCityState = new RegExp(
        `(?:the\\s+)?${cityRe}\\s*,\\s*(?:${stateVariants.join('|')})\\b`,
        'gi'
      )
      out = out.replace(reCityState, full)
    }

    // Pass 2: "(from|in|at) [the] City[, state/borough...]" -> connector + full
    // state, or drop the whole phrase (connector included) when there's no
    // usable US state to fall back to.
    const reConnCity = new RegExp(
      `\\b(from|in|at)\\s+(?:the\\s+)?${cityRe}(?:\\s*,\\s*(?:${trailingAlt}))*\\b`,
      'gi'
    )
    out = full
      ? out.replace(reConnCity, (_m, conn) => `${conn} ${full}`)
      : out.replace(reConnCity, '')
  }

  // Pass 3 (safety net): NYC tokens / boroughs that resolve to New York, even
  // when they don't match the row's exact `city` field (e.g. "grew up in NYC").
  const reNyc = new RegExp(
    `\\b(from|in|at)\\s+(?:the\\s+)?(?:${NYC_ALT})(?:\\s*,\\s*(?:${NYC_ALT}))*\\b`,
    'gi'
  )
  out = out.replace(reNyc, (_m, conn) => `${conn} New York`)

  // Pass 4: collapse a leftover "New York, <borough>" into just "New York".
  out = out.replace(new RegExp(`New York,\\s*(?:${NYC_ALT})\\b`, 'gi'), 'New York')

  return tidy(out)
}

/** Collapse the punctuation/whitespace artifacts left behind by removals. */
function tidy(s: string): string {
  return s
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([.,;])/g, '$1')
    .replace(/,\s*,/g, ',')
    .replace(/,\s*\./g, '.')
    .replace(/\.\s*\./g, '.')
    .replace(/\(\s*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * After scrubbing, does the bio still appear to reference the mentor's city or
 * a known borough/neighborhood? Used to flag rows for manual review.
 *
 * Institution names that happen to contain a city (e.g. "Brooklyn College",
 * "UC San Diego", "University of Valencia") are fine to keep, so we neutralize
 * those before testing to avoid false positives.
 */
function bioLeaksCity(bio: string, city: string, state: string): boolean {
  const full = fullStateName(state)
  const cityClean = city.replace(/^(from|in|at)\s+/i, '').trim()

  // Neutralize institution names so a city/borough inside a school name (e.g.
  // "Queens College", "UC San Diego", "Columbia College Chicago") doesn't trip
  // the check. Do this for the row's city AND every NYC token.
  let probe = bio
  for (const token of [cityClean, ...NYC_TOKENS].filter(Boolean)) {
    const t = escapeRegex(token)
    probe = probe
      .replace(new RegExp(`\\bUC\\s+${t}\\b`, 'gi'), '')
      .replace(new RegExp(`\\b(?:University|College|Institute)\\s+of\\s+${t}\\b`, 'gi'), '')
      .replace(new RegExp(`\\b${t}(?:\\s+\\w+){0,2}\\s+(?:${INSTITUTION_WORD})\\b`, 'gi'), '')
      .replace(new RegExp(`\\b(?:${INSTITUTION_WORD})\\s+${t}\\b`, 'gi'), '')
  }

  if (cityClean) {
    const stillThere = new RegExp(`\\b${escapeRegex(cityClean)}\\b`, 'i').test(probe)
    const isJustState = full && full.toLowerCase() === cityClean.toLowerCase()
    if (stillThere && !isJustState) return true
  }
  for (const token of NYC_TOKENS) {
    if (new RegExp(`\\b${escapeRegex(token)}\\b`, 'i').test(probe)) return true
  }
  return false
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseIntArg(argv: string[], flag: string): number | null {
  const idx = argv.indexOf(flag)
  if (idx === -1) return null
  const v = parseInt(argv[idx + 1] ?? '', 10)
  return Number.isFinite(v) ? v : null
}

function parseStrArg(argv: string[], flag: string): string | null {
  const idx = argv.indexOf(flag)
  if (idx === -1) return null
  const v = argv[idx + 1]
  return v && !v.startsWith('--') ? v : null
}

function loadEnvLocal() {
  const envPath = path.resolve(__dirname, '../.env.local')
  if (!fs.existsSync(envPath)) return
  const content = fs.readFileSync(envPath, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const k = trimmed.slice(0, eq).trim()
    const v = trimmed.slice(eq + 1).trim()
    if (!process.env[k]) process.env[k] = v
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
