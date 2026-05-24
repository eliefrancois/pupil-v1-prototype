#!/usr/bin/env -S npx tsx
/**
 * One-time import: parse the 2023 mentor signup CSV, clean it, enrich with
 * Claude-generated bios and DiceBear avatars, and create ghost mentor
 * accounts in Supabase.
 *
 * Usage:
 *   # Default: dry-run, no external calls, no DB writes. Prints a table.
 *   npx tsx scripts/import-ghost-mentors.ts
 *
 *   # Validate emails via NeverBounce (costs ~$2 for 437 rows).
 *   npx tsx scripts/import-ghost-mentors.ts --validate
 *
 *   # Generate Claude bios for each mentor (~$0.50 total).
 *   npx tsx scripts/import-ghost-mentors.ts --bios
 *
 *   # Only process the first N rows (for quick iteration).
 *   npx tsx scripts/import-ghost-mentors.ts --limit 5 --bios
 *
 *   # Apply: actually write to Supabase. Pair with --validate --bios.
 *   npx tsx scripts/import-ghost-mentors.ts --apply --validate --bios
 *
 * Safety:
 *   - Dry-run by default. Refuses to write without --apply.
 *   - Dedupes by email (most recent submission wins).
 *   - Skips rows with missing critical fields.
 *   - Idempotent: re-running with --apply updates existing rows by email.
 */

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { parse } from 'csv-parse/sync'
import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CSV_PATH = path.resolve(
  __dirname,
  'data/mentor-signups-2023.csv'
)
const CACHE_PATH = path.resolve(
  __dirname,
  'data/mentor-signups-enriched.json'
)
const NEVERBOUNCE_API = 'https://api.neverbounce.com/v4/single/check'
const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'
const CLAUDE_MODEL = 'claude-haiku-4-5-20251001'
const DICEBEAR_STYLE = 'notionists'

// Load .env.local manually (no dotenv dep).
loadEnvLocal()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const NEVERBOUNCE_KEY = process.env.NEVERBOUNCE_API_KEY
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

// ---------------------------------------------------------------------------
// CLI flags
// ---------------------------------------------------------------------------

const args = process.argv.slice(2)
const FLAG = {
  apply: args.includes('--apply'),
  validate: args.includes('--validate'),
  bios: args.includes('--bios'),
  limit: parseLimit(args),
  sample: args.includes('--sample'), // print 5 random samples and exit
  // Use the cached enriched JSON instead of re-calling Claude/NeverBounce.
  // Pair with --apply to write cached results to the DB.
  useCache: args.includes('--use-cache'),
  // Skip writing the enrichment cache (default: cache always written).
  noCache: args.includes('--no-cache'),
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RawRow {
  timestamp: string
  bachelors: string
  graduate: string
  email: string
  first_name: string
  bachelors_date: string
  last_name: string
  city: string
  state: string
  country: string
  age: string
  graduate_date: string
  first_gen: string
  topics: string
  academic: string
  career: string
  hispanic: string
  ethnicities: string
  gender: string
  hs_confusing: string
  frustration: string
  hs_mentor: string
  would_mentor_help: string
  has_mentor: string
  mentor_for_what: string
  want_mentor: string
  looking_for: string
  would_use_app: string
  would_use_college_app: string
  max_mentees: string
  times_per_month: string
}

interface CleanedRow extends RawRow {
  email_lower: string
  full_name: string
  university: string
  grad_year: number | null
  tags: string[]
  identity: {
    ethnicities: string[]
    gender: string | null
    hispanic_latino: boolean | null
    first_gen: boolean | null
    location: { city: string; state: string } | null
  }
}

interface EnrichedRow extends CleanedRow {
  bio: string | null
  photo_url: string
  email_valid: boolean | null // null = not validated
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('\n=== Pupil Ghost Mentor Importer ===')
  console.log(`Mode: ${FLAG.apply ? 'APPLY (writes to DB)' : 'DRY-RUN'}`)
  if (FLAG.useCache) console.log('Using cached enrichment from disk.')
  else {
    console.log(`Validate emails: ${FLAG.validate ? 'YES' : 'no'}`)
    console.log(`Generate bios: ${FLAG.bios ? 'YES' : 'no'}`)
  }
  if (FLAG.limit !== null) console.log(`Limit: ${FLAG.limit} rows`)
  console.log('')

  // ----- Fast path: load enriched data from cache -----
  if (FLAG.useCache) {
    if (!fs.existsSync(CACHE_PATH)) {
      throw new Error(`Cache file not found at ${CACHE_PATH}. Run without --use-cache first.`)
    }
    const cachedAll: EnrichedRow[] = JSON.parse(
      fs.readFileSync(CACHE_PATH, 'utf-8')
    )
    console.log(`Loaded ${cachedAll.length} enriched mentors from cache.`)
    // Respect --limit in cache mode too. (Earlier versions silently ignored
    // it and applied the whole cache — exactly the bug we want to avoid.)
    const cached =
      FLAG.limit !== null ? cachedAll.slice(0, FLAG.limit) : cachedAll
    if (FLAG.limit !== null) {
      console.log(`Limiting to first ${cached.length} of ${cachedAll.length}.`)
    }

    const previewCount = cached.length <= 15 ? cached.length : 3
    console.log(`\n--- PREVIEW (${previewCount} of ${cached.length} mentors) ---`)
    cached.slice(0, previewCount).forEach((r, i) => printRow(r, r.bio, i + 1))
    const reachable = cached.filter((r) => r.email_valid !== false)
    const withBios = cached.filter((r) => r.bio).length
    console.log(`\nReachable emails: ${reachable.length} / ${cached.length}`)
    console.log(`Bios generated: ${withBios} / ${cached.length}`)
    if (!FLAG.apply) {
      console.log('\nDry-run complete. Re-run with --apply --use-cache to write to DB.')
      return
    }
    await applyToDatabase(cached)
    return
  }

  // 1. Parse + clean
  const raw = parseCSV(CSV_PATH)
  console.log(`Raw CSV rows: ${raw.length}`)
  const cleaned = clean(raw)
  console.log(`After cleaning: ${cleaned.length} valid rows`)
  const deduped = dedupe(cleaned)
  console.log(`After dedup by email: ${deduped.length} unique mentors`)

  // When --limit is small, sample across the whole dataset (deterministic
  // shuffle via name hash) so we see name/school diversity, not just the
  // first N rows which are biased toward the earliest submissions.
  const limited =
    FLAG.limit !== null
      ? [...deduped]
          .sort((a, b) => hashName(a.full_name) - hashName(b.full_name))
          .slice(0, FLAG.limit)
      : deduped
  console.log(`Processing: ${limited.length} mentors\n`)

  // Sample mode: print 5 random and exit
  if (FLAG.sample) {
    const samples = limited
      .sort(() => Math.random() - 0.5)
      .slice(0, 5)
    samples.forEach((r, i) => printRow(r, null, i + 1))
    return
  }

  // 2. Enrich (validate, photos, bios). Resume from partial cache if present.
  let enriched: EnrichedRow[] = []
  const enrichedByEmail = new Map<string, EnrichedRow>()
  if (fs.existsSync(CACHE_PATH) && !FLAG.noCache) {
    try {
      const prior: EnrichedRow[] = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'))
      for (const r of prior) enrichedByEmail.set(r.email_lower, r)
      console.log(`Resuming: ${enrichedByEmail.size} mentors already in cache.\n`)
    } catch {
      // Corrupted cache, ignore.
    }
  }

  for (let i = 0; i < limited.length; i++) {
    const row = limited[i]
    process.stdout.write(`[${i + 1}/${limited.length}] ${row.full_name}... `)

    // If we already enriched this email AND we have what the run asks for,
    // reuse it instead of paying Claude/NeverBounce again.
    const prior = enrichedByEmail.get(row.email_lower)
    const priorIsComplete =
      prior !== undefined &&
      (!FLAG.validate || prior.email_valid !== null) &&
      (!FLAG.bios || prior.bio !== null)
    if (priorIsComplete) {
      enriched.push(prior!)
      process.stdout.write('cached\n')
      continue
    }

    const photo_url = makeDiceBearUrl(row.full_name)
    let email_valid: boolean | null = prior?.email_valid ?? null
    let bio: string | null = prior?.bio ?? null

    if (FLAG.validate && email_valid === null) {
      email_valid = await validateEmail(row.email_lower)
      process.stdout.write(`email:${email_valid ? 'ok' : 'bounce'} `)
    }

    if (FLAG.bios && bio === null && email_valid !== false) {
      // Anthropic low tier = 5 requests per minute. Pace ~12.5s/req with
      // one retry on transient failure.
      await rateLimitForBios()
      bio = await generateBio(row)
      if (!bio) {
        await sleep(15_000)
        bio = await generateBio(row)
      }
      process.stdout.write(`bio:${bio ? 'ok' : 'fail'} `)
    }

    const enrichedRow: EnrichedRow = { ...row, photo_url, email_valid, bio }
    enriched.push(enrichedRow)
    enrichedByEmail.set(row.email_lower, enrichedRow)
    process.stdout.write('\n')

    // Periodically flush cache to disk so a crash doesn't lose progress.
    if (!FLAG.noCache && (i + 1) % 10 === 0) {
      fs.writeFileSync(
        CACHE_PATH,
        JSON.stringify(Array.from(enrichedByEmail.values()), null, 2)
      )
    }

    if (FLAG.validate) await sleep(60)
  }

  // Final cache flush.
  if (!FLAG.noCache) {
    fs.writeFileSync(
      CACHE_PATH,
      JSON.stringify(Array.from(enrichedByEmail.values()), null, 2)
    )
    console.log(`\nCache written: ${CACHE_PATH} (${enrichedByEmail.size} mentors)`)
  }

  // 3. Preview: show all if the batch is small (so you can review every bio),
  // otherwise just the first 3.
  const previewCount = enriched.length <= 15 ? enriched.length : 3
  console.log(`\n--- PREVIEW (${previewCount} of ${enriched.length} mentors) ---`)
  enriched.slice(0, previewCount).forEach((r, i) => printRow(r, r.bio, i + 1))

  const reachable = enriched.filter((r) => r.email_valid !== false)
  const withBios = enriched.filter((r) => r.bio).length
  console.log(`\nReachable emails: ${reachable.length} / ${enriched.length}`)
  console.log(`Bios generated: ${withBios} / ${enriched.length}`)

  // 4. Apply
  if (!FLAG.apply) {
    console.log('\nDry-run complete. Re-run with --apply to write to DB.')
    return
  }

  await applyToDatabase(enriched)
}

// ---------------------------------------------------------------------------
// CSV parsing
// ---------------------------------------------------------------------------

function parseCSV(filePath: string): RawRow[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  // The CSV has a header row with comma-laden questions; csv-parse handles
  // quoted fields properly. We just take row 0 as the header.
  const records: string[][] = parse(content, {
    skip_empty_lines: true,
    relax_column_count: true,
  })

  // Skip header row
  const dataRows = records.slice(1)

  return dataRows.map(
    (r): RawRow => ({
      timestamp: r[0] ?? '',
      bachelors: r[1] ?? '',
      graduate: r[2] ?? '',
      email: r[3] ?? '',
      first_name: r[4] ?? '',
      bachelors_date: r[5] ?? '',
      last_name: r[6] ?? '',
      city: r[7] ?? '',
      state: r[8] ?? '',
      country: r[9] ?? '',
      age: r[10] ?? '',
      graduate_date: r[11] ?? '',
      first_gen: r[12] ?? '',
      topics: r[13] ?? '',
      academic: r[14] ?? '',
      career: r[15] ?? '',
      hispanic: r[16] ?? '',
      ethnicities: r[17] ?? '',
      gender: r[18] ?? '',
      hs_confusing: r[19] ?? '',
      frustration: r[20] ?? '',
      hs_mentor: r[21] ?? '',
      would_mentor_help: r[22] ?? '',
      has_mentor: r[23] ?? '',
      mentor_for_what: r[24] ?? '',
      want_mentor: r[25] ?? '',
      looking_for: r[26] ?? '',
      would_use_app: r[27] ?? '',
      would_use_college_app: r[28] ?? '',
      max_mentees: r[29] ?? '',
      times_per_month: r[30] ?? '',
    })
  )
}

// ---------------------------------------------------------------------------
// Cleaning + dedup
// ---------------------------------------------------------------------------

function clean(rows: RawRow[]): CleanedRow[] {
  return rows
    .map((r) => {
      // Trim everywhere; some fields have leading/trailing spaces.
      const trimmed: RawRow = Object.fromEntries(
        Object.entries(r).map(([k, v]) => [k, (v ?? '').trim()])
      ) as RawRow

      const email = trimmed.email.toLowerCase()
      // Quick email shape check; full validation is NeverBounce.
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null
      if (!trimmed.first_name || !trimmed.last_name) return null
      // Prefer graduate institution if present; else bachelor's.
      const university = trimmed.graduate && trimmed.graduate !== 'N/A' &&
        trimmed.graduate !== 'N/a' && trimmed.graduate !== 'n/a'
        ? trimmed.graduate
        : trimmed.bachelors
      if (!university) return null

      const fullName = `${trimmed.first_name} ${trimmed.last_name}`
        .replace(/\s+/g, ' ')
        .trim()

      const grad_year =
        parseGradYear(trimmed.graduate_date) ??
        parseGradYear(trimmed.bachelors_date)

      const tags = uniq([
        ...parseMulti(trimmed.topics),
        ...parseMulti(trimmed.academic),
        ...parseMulti(trimmed.career),
      ])

      const ethnicities = parseMulti(trimmed.ethnicities)
      const cleanedRow: CleanedRow = {
        ...trimmed,
        email_lower: email,
        full_name: fullName,
        university,
        grad_year,
        tags,
        identity: {
          ethnicities,
          gender: trimmed.gender || null,
          hispanic_latino: yesNoMaybe(trimmed.hispanic),
          first_gen: yesNoMaybe(trimmed.first_gen),
          location:
            trimmed.city && trimmed.state
              ? { city: trimmed.city, state: trimmed.state }
              : null,
        },
      }
      return cleanedRow
    })
    .filter((r): r is CleanedRow => r !== null)
}

function dedupe(rows: CleanedRow[]): CleanedRow[] {
  // Keep most recent submission per email.
  const byEmail = new Map<string, CleanedRow>()
  for (const r of rows) {
    const existing = byEmail.get(r.email_lower)
    if (!existing) {
      byEmail.set(r.email_lower, r)
      continue
    }
    if (parseTs(r.timestamp) > parseTs(existing.timestamp)) {
      byEmail.set(r.email_lower, r)
    }
  }
  return Array.from(byEmail.values())
}

// ---------------------------------------------------------------------------
// Enrichment
// ---------------------------------------------------------------------------

function makeDiceBearUrl(name: string): string {
  // Deterministic: same name always gets the same avatar across re-runs.
  const seed = encodeURIComponent(name.replace(/\s+/g, '-'))
  // notionists style: illustrated, professional, doesn't read as a stock avatar.
  // Soft purple background to match Pupil brand.
  return `https://api.dicebear.com/9.x/${DICEBEAR_STYLE}/svg?seed=${seed}&backgroundColor=ede9fe,ddd6fe,c4b5fd&radius=50`
}

async function validateEmail(email: string): Promise<boolean> {
  if (!NEVERBOUNCE_KEY) {
    throw new Error('NEVERBOUNCE_API_KEY missing in .env.local')
  }
  try {
    const url = `${NEVERBOUNCE_API}?key=${NEVERBOUNCE_KEY}&email=${encodeURIComponent(email)}`
    const res = await fetch(url)
    if (!res.ok) {
      console.warn(`  NeverBounce HTTP ${res.status} for ${email}`)
      return true // fail open: don't drop mentors on API issues
    }
    const data = (await res.json()) as { result?: string }
    // valid + catchall are deliverable. invalid + disposable are not.
    return ['valid', 'catchall', 'unknown'].includes(data.result ?? '')
  } catch (err) {
    console.warn(`  NeverBounce error for ${email}:`, err)
    return true
  }
}

async function generateBio(row: CleanedRow): Promise<string | null> {
  if (!ANTHROPIC_KEY) {
    throw new Error('ANTHROPIC_API_KEY missing in .env.local')
  }

  const prompt = buildBioPrompt(row)

  try {
    const res = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 200,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) {
      const text = await res.text()
      console.warn(`  Claude HTTP ${res.status}: ${text.slice(0, 200)}`)
      return null
    }
    const data = (await res.json()) as {
      content?: Array<{ text?: string }>
    }
    const bio = data.content?.[0]?.text?.trim() ?? null
    return bio && bio.length > 10 ? bio : null
  } catch (err) {
    console.warn('  Claude error:', err)
    return null
  }
}

function buildBioPrompt(row: CleanedRow): string {
  const location = row.identity.location
    ? `${row.identity.location.city}, ${row.identity.location.state}`
    : null
  const academicLine = row.academic ? `Academic interests: ${row.academic}.` : ''
  const careerLine = row.career ? `Career interests: ${row.career}.` : ''
  const topicsLine = row.topics ? `Topics they care about: ${row.topics}.` : ''
  const lookingForLine = row.looking_for
    ? `What they look for in a mentor (their own words): "${row.looking_for}".`
    : ''
  const frustrationLine = row.frustration
    ? `What frustrated them about applying to college: "${row.frustration}".`
    : ''
  const firstGen = row.identity.first_gen ? 'They are a first-gen college student.' : ''
  const locationLine = location ? `From ${location}.` : ''

  return `Write a short first-person mentor bio for the Pupil college mentorship platform.

MENTOR:
Name: ${row.full_name}
School: ${row.university}${row.grad_year ? ` (class of ${row.grad_year})` : ''}
${locationLine}
${academicLine}
${careerLine}
${topicsLine}
${firstGen}
${lookingForLine}
${frustrationLine}

BANNED PHRASES (these are AI tells, NEVER use them, no exceptions):
- "I'm here to help"
- "navigate" or "navigating" (use "figure out", "work through", "deal with" instead)
- "journey"
- "I'm passionate about"
- "I'm excited to"
- "I love helping"
- "I believe"
- "find your footing"
- "skip the chaos"
- "what actually matters"
- "your future" (too vague)
- "Let's"
- "drive impact", "leverage", "synergize"
- Em dashes (use commas, periods, or restructure)
- "not X but Y" constructions
- "X, but also Y" parallel constructions
- "Hi, I'm" or "Hello" openers
- Exclamation marks

DO NOT infer year-in-school from the grad year. Don't say "sophomore", "junior", "senior". Say "class of 2027" or just the school name.

VOICE:
- First person, casual but warm.
- Short sentences. Fragments OK.
- Lead with a concrete fact: school, hometown, or what you'd help with.
- Specifics beat feelings. Name actual fields, places, situations.
- End on the offer (what you'll help with), not a generic closer.
- 2-3 sentences. 30-50 words.

GOOD EXAMPLES (study the voice):

Example 1 — Stanford CS student from Brooklyn:
"Stanford '26, studying CS with a focus on systems. Grew up in Brooklyn, public schools the whole way. Happy to talk through CS apps, the supplement essays nobody knows what to do with, or whether a top school is worth taking on loans."

Example 2 — first-gen Penn student:
"First in my family to go to college. I'm at Penn studying econ and African American studies. Got really lost during the Common App and CSS Profile. Ask me anything about financial aid, especially if your school doesn't have a counselor who knows the process."

Example 3 — Caltech engineering student:
"Caltech '27 from Eden Prairie, Minnesota. Engineering, but mostly interested in startups and how research actually becomes a product. I can help with STEM-heavy apps, scholarship essays, or thinking about gap years."

Output ONLY the bio text. No quotes around it. No labels. No preamble.`
}

// ---------------------------------------------------------------------------
// DB apply
// ---------------------------------------------------------------------------

async function applyToDatabase(rows: EnrichedRow[]) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  let createdAuth = 0
  let reusedAuth = 0
  let insertedProfile = 0
  let updatedProfile = 0
  let skipped = 0
  let errors = 0

  console.log('\nApplying to database (creating auth.users + mentor_profiles)...')

  // Prefetch all existing auth users into a map for O(1) email lookups.
  // listUsers returns up to 1000/page; we paginate to cover larger DBs.
  console.log('  prefetching existing auth.users...')
  const existingAuthByEmail = new Map<string, string>()
  let page = 1
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    })
    if (error) throw error
    for (const u of data.users) {
      if (u.email) existingAuthByEmail.set(u.email.toLowerCase(), u.id)
    }
    if (data.users.length < 1000) break
    page++
  }
  console.log(`  found ${existingAuthByEmail.size} existing auth users`)

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (row.email_valid === false) {
      skipped++
      continue
    }

    process.stdout.write(`[${i + 1}/${rows.length}] ${row.email_lower}... `)

    try {
      // Step 1: get an auth user ID. public.users.id MUST equal auth.uid()
      // so RLS works once the mentor claims and logs in. Look up by email
      // in the prefetched map first; if missing, create an auth user
      // (no confirm email, no password — claim flow sets it later).
      let userId = existingAuthByEmail.get(row.email_lower) ?? null
      const wasExisting = userId !== null
      if (!userId) {
        const { data, error } = await supabase.auth.admin.createUser({
          email: row.email_lower,
          email_confirm: false,
          user_metadata: {
            full_name: row.full_name,
            ghost: true,
            source: 'csv_import_2023',
          },
        })
        if (error || !data.user) {
          throw new Error(
            `auth.admin.createUser failed: ${error?.message ?? 'no user'}`
          )
        }
        userId = data.user.id
        existingAuthByEmail.set(row.email_lower, userId)
      }

      // Step 2: upsert public.users (mirrors the auth.users row).
      const { error: userErr } = await supabase.from('users').upsert(
        {
          id: userId,
          email: row.email_lower,
          full_name: row.full_name,
          role: 'mentor',
          subscription_status: 'inactive',
          onboarding_complete: false,
        },
        { onConflict: 'id' }
      )
      if (userErr) throw userErr

      // Step 3: upsert mentor_profiles. Preserve any existing claim_token
      // for an already-imported ghost (idempotent re-runs).
      const existingProfile = await getMentorProfile(supabase, userId)
      const claim_token =
        existingProfile?.claim_token ?? crypto.randomBytes(24).toString('base64url')
      const claim_token_expires_at =
        existingProfile?.claim_token_expires_at ??
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

      const { error: profileErr } = await supabase
        .from('mentor_profiles')
        .upsert(
          {
            user_id: userId,
            university: row.university,
            grad_year: row.grad_year,
            bio: row.bio,
            photo_url: row.photo_url,
            tags: row.tags,
            timezone: 'America/New_York',
            availability_schedule: { time_windows: [] },
            max_mentees: 3,
            commitment: 'open',
            motivations: [],
            identity_json: row.identity,
            status: 'pending',
            signup_source: 'csv_import_2023',
            signup_source_at: parseTs(row.timestamp).toISOString(),
            claim_status: existingProfile?.claim_status ?? 'ghost',
            claim_token,
            claim_token_expires_at,
            csv_raw: row as unknown as Record<string, unknown>,
          },
          { onConflict: 'user_id' }
        )

      if (profileErr) throw profileErr
      if (existingProfile) updatedProfile++
      else insertedProfile++
      if (wasExisting) reusedAuth++
      else createdAuth++
      process.stdout.write('ok\n')
    } catch (err) {
      errors++
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`fail: ${msg}`)
    }
  }

  console.log(
    `\nApply complete:\n` +
      `  auth users created:  ${createdAuth}\n` +
      `  auth users reused:   ${reusedAuth}\n` +
      `  profiles inserted:   ${insertedProfile}\n` +
      `  profiles updated:    ${updatedProfile}\n` +
      `  skipped (bounced):   ${skipped}\n` +
      `  errors:              ${errors}`
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getMentorProfile(supabase: any, userId: string) {
  const { data } = await supabase
    .from('mentor_profiles')
    .select('claim_token, claim_token_expires_at, claim_status')
    .eq('user_id', userId)
    .maybeSingle()
  return data as {
    claim_token: string | null
    claim_token_expires_at: string | null
    claim_status: string | null
  } | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseLimit(args: string[]): number | null {
  const idx = args.indexOf('--limit')
  if (idx === -1) return null
  const v = parseInt(args[idx + 1] ?? '', 10)
  return Number.isFinite(v) ? v : null
}

function parseMulti(v: string): string[] {
  if (!v) return []
  return v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr))
}

function yesNoMaybe(v: string): boolean | null {
  const s = v.toLowerCase().trim()
  if (s === 'yes') return true
  if (s === 'no') return false
  return null
}

function parseGradYear(s: string): number | null {
  if (!s) return null
  // Expected formats: "May 2027", "June 2027", "2027", "May 2027 ", etc.
  const m = s.match(/(20\d{2})/)
  return m ? parseInt(m[1], 10) : null
}

function parseTs(s: string): Date {
  // CSV format: "6/1/2023 8:22:26"
  const d = new Date(s)
  return isNaN(d.getTime()) ? new Date(0) : d
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

// Hold to <=5 Claude requests/min by spacing each call >=12.5s from the prior.
let lastBioCallAt = 0
const BIO_MIN_INTERVAL_MS = 12_500
async function rateLimitForBios() {
  const since = Date.now() - lastBioCallAt
  if (since < BIO_MIN_INTERVAL_MS) {
    await sleep(BIO_MIN_INTERVAL_MS - since)
  }
  lastBioCallAt = Date.now()
}

function hashName(s: string): number {
  // Tiny deterministic hash so --limit samples the same diverse subset each run.
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0
  }
  return h
}

function printRow(row: CleanedRow | EnrichedRow, bio: string | null, n: number) {
  console.log(`\n[${n}] ${row.full_name}`)
  console.log(`    email     ${row.email_lower}`)
  console.log(`    school    ${row.university}${row.grad_year ? ` '${String(row.grad_year).slice(-2)}` : ''}`)
  if (row.identity.location) {
    console.log(`    from      ${row.identity.location.city}, ${row.identity.location.state}`)
  }
  console.log(`    tags      ${row.tags.slice(0, 4).join(', ')}${row.tags.length > 4 ? ` (+${row.tags.length - 4})` : ''}`)
  if ('photo_url' in row) {
    console.log(`    photo     ${row.photo_url}`)
  }
  if ('email_valid' in row && row.email_valid !== null) {
    console.log(`    valid     ${row.email_valid ? 'yes' : 'BOUNCED'}`)
  }
  if (bio) {
    console.log(`    bio       ${bio}`)
  }
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
