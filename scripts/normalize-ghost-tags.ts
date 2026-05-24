#!/usr/bin/env -S npx tsx
/**
 * One-time normalization: re-map the 2023 mentor signup's free-text
 * interests / academic / career fields to our canonical taxonomy.
 *
 * Why this exists:
 *   The CSV import dumped raw 2023 form responses into `mentor_profiles.tags`.
 *   That data was free-text ("Pre-Law", "Pre-law", "Ecnonmics", "Studio)",
 *   etc.) and mixed three different concepts: causes a mentor cares about,
 *   their major, and broad career interests. None of it matches what new
 *   mentors pick during onboarding (the 18-item MENTOR_SPECIALTIES list).
 *   The directory filter and profile chips look terrible as a result.
 *
 *   This script asks Claude Haiku to read each mentor's raw CSV signals
 *   (topics + academic + career + mentor_for_what + bio) and pick:
 *     - 3-5 canonical specialties from MENTOR_SPECIALTIES
 *     - 1 canonical major from the `majors` DB table (120 options)
 *
 *   Result is cached to JSON, then applied to the DB with --apply.
 *
 * Usage:
 *   # Dry-run: classify all mentors, write cache, no DB writes.
 *   npx tsx scripts/normalize-ghost-tags.ts
 *
 *   # Limit to first N (great for prompt iteration).
 *   npx tsx scripts/normalize-ghost-tags.ts --limit 20
 *
 *   # Reuse the previously cached classification (skips Claude entirely).
 *   npx tsx scripts/normalize-ghost-tags.ts --use-cache
 *
 *   # Apply normalized tags + major to DB for ghost mentors.
 *   npx tsx scripts/normalize-ghost-tags.ts --use-cache --apply
 *
 * Cost / runtime estimate (10 mentors per batch, 5 req/min limit):
 *   - 446 / 10 = ~45 Claude calls
 *   - Spaced 13s apart -> ~10 minutes
 *   - ~$0.10 total
 */

import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

import {
  MENTOR_SPECIALTIES,
  MENTOR_SPECIALTIES_SET,
} from '../lib/constants'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ENRICHED_PATH = path.resolve(
  __dirname,
  'data/mentor-signups-enriched.json'
)
const NORMALIZED_PATH = path.resolve(
  __dirname,
  'data/mentor-signups-normalized.json'
)
const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'
const CLAUDE_MODEL = 'claude-haiku-4-5-20251001'
const BATCH_SIZE = 10
const CLAUDE_MIN_INTERVAL_MS = 13_000 // ~5 req/min, with a small buffer

loadEnvLocal()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

// ---------------------------------------------------------------------------
// CLI flags
// ---------------------------------------------------------------------------

const args = process.argv.slice(2)
const FLAG = {
  apply: args.includes('--apply'),
  useCache: args.includes('--use-cache'),
  limit: parseLimit(args),
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EnrichedRow {
  email_lower: string
  full_name: string
  university: string
  grad_year: number | null
  topics?: string
  academic?: string
  career?: string
  mentor_for_what?: string
  bio?: string | null
  tags?: string[]
  // ...other fields are present but unused here
}

interface NormalizedRow {
  email_lower: string
  full_name: string
  specialties: string[]
  major: string | null
  // The raw values Claude returned before validation. Kept for debugging
  // so we can see what got rejected by the canonical guard.
  raw_specialties?: string[]
  raw_major?: string
}

interface ClaudeBatchItem {
  id: number
  specialties: string[]
  major: string
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('\n=== Pupil Ghost Mentor Tag Normalizer ===')
  console.log(`Mode: ${FLAG.apply ? 'APPLY (writes to DB)' : 'DRY-RUN'}`)
  console.log(`Source: ${FLAG.useCache ? 'cached normalization' : 'Claude (live)'}`)
  if (FLAG.limit !== null) console.log(`Limit: ${FLAG.limit} rows`)

  // -------------------------------------------------------------
  // Path A: read pre-normalized JSON from disk and just apply it.
  // -------------------------------------------------------------
  if (FLAG.useCache) {
    if (!fs.existsSync(NORMALIZED_PATH)) {
      throw new Error(
        `Cache not found at ${NORMALIZED_PATH}. Run without --use-cache first.`
      )
    }
    const cachedAll: NormalizedRow[] = JSON.parse(
      fs.readFileSync(NORMALIZED_PATH, 'utf-8')
    )
    const cached =
      FLAG.limit !== null ? cachedAll.slice(0, FLAG.limit) : cachedAll
    console.log(`\nLoaded ${cached.length} normalized mentors from cache.`)
    previewNormalized(cached)
    if (!FLAG.apply) {
      console.log('\nDry-run. Re-run with --apply to write to DB.')
      return
    }
    await applyToDatabase(cached)
    return
  }

  // -------------------------------------------------------------
  // Path B: classify from scratch via Claude.
  // -------------------------------------------------------------
  if (!ANTHROPIC_KEY) {
    throw new Error('ANTHROPIC_API_KEY missing from .env.local')
  }
  if (!fs.existsSync(ENRICHED_PATH)) {
    throw new Error(`Enriched data not found at ${ENRICHED_PATH}.`)
  }
  const enrichedAll: EnrichedRow[] = JSON.parse(
    fs.readFileSync(ENRICHED_PATH, 'utf-8')
  )
  const enriched =
    FLAG.limit !== null ? enrichedAll.slice(0, FLAG.limit) : enrichedAll
  console.log(`\nLoaded ${enriched.length} enriched mentors.`)

  // Fetch the canonical majors list from Supabase once.
  const canonicalMajors = await loadCanonicalMajors()
  console.log(`Loaded ${canonicalMajors.length} canonical majors from DB.`)

  console.log(
    `\nClassifying ${enriched.length} mentors in batches of ${BATCH_SIZE}...`
  )
  const normalized: NormalizedRow[] = []
  const startedAt = Date.now()

  for (let i = 0; i < enriched.length; i += BATCH_SIZE) {
    const batch = enriched.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(enriched.length / BATCH_SIZE)
    process.stdout.write(
      `  [batch ${batchNum}/${totalBatches}] ${batch.length} mentors... `
    )

    const results = await classifyBatch(batch, canonicalMajors)
    for (let j = 0; j < batch.length; j++) {
      const row = batch[j]
      const result = results[j]
      normalized.push(buildNormalizedRow(row, result, canonicalMajors))
    }
    console.log('ok')

    // Save cache after every batch so partial progress is recoverable.
    fs.writeFileSync(NORMALIZED_PATH, JSON.stringify(normalized, null, 2))
  }

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(0)
  console.log(`\nClassified ${normalized.length} mentors in ${elapsed}s.`)
  console.log(`Cached to ${NORMALIZED_PATH}`)
  previewNormalized(normalized)

  if (!FLAG.apply) {
    console.log('\nDry-run. Re-run with --use-cache --apply to write to DB.')
    return
  }
  await applyToDatabase(normalized)
}

// ---------------------------------------------------------------------------
// Claude classification
// ---------------------------------------------------------------------------

async function classifyBatch(
  batch: EnrichedRow[],
  canonicalMajors: string[]
): Promise<ClaudeBatchItem[]> {
  const prompt = buildBatchPrompt(batch, canonicalMajors)
  const response = await callClaude(prompt)
  return parseBatchResponse(response, batch.length)
}

function buildBatchPrompt(
  batch: EnrichedRow[],
  canonicalMajors: string[]
): string {
  // Number each mentor so Claude can return results keyed by id.
  const mentorBlocks = batch
    .map((row, idx) => {
      const signals: string[] = []
      if (row.topics) signals.push(`- topics_they_care_about: ${row.topics}`)
      if (row.academic) signals.push(`- academic_interests: ${row.academic}`)
      if (row.career) signals.push(`- career_interests: ${row.career}`)
      if (row.mentor_for_what)
        signals.push(`- willing_to_mentor_on: ${row.mentor_for_what}`)
      if (row.bio) signals.push(`- bio: ${row.bio}`)
      return [
        `MENTOR ${idx + 1}:`,
        `- name: ${row.full_name}`,
        `- university: ${row.university}${row.grad_year ? ` (class of ${row.grad_year})` : ''}`,
        ...signals,
      ].join('\n')
    })
    .join('\n\n')

  return `You are mapping noisy 2023 mentor signup data to our canonical taxonomy.

CANONICAL SPECIALTIES (pick 3-5 per mentor; values MUST match exactly):
${MENTOR_SPECIALTIES.map((s) => `  - ${s}`).join('\n')}

CANONICAL MAJORS (pick exactly 1 per mentor; values MUST match exactly):
${canonicalMajors.map((m) => `  - ${m}`).join('\n')}

MAPPING GUIDANCE:
- These are TOPICS A MENTOR CAN HELP STUDENTS WITH, not their personal interests.
- A pre-med or biology student likely fits "Pre-med advising" and "STEM applications".
- A CS / engineering student fits "STEM applications" and "Research opportunities".
- An English / humanities / film / arts student fits "Liberal arts essays" and often "Arts / portfolio prep".
- An economics / business student often fits "Career exploration" and "Networking & internships".
- "First-gen guidance" if the bio or signals mention first-gen status or strong financial-aid frustration.
- "Major exploration" is a safe choice for someone with broad interests.
- "Test prep strategy" if SAT/ACT/AP/standardized testing comes up.
- Use "Trade / vocational path" or "Community college path" only if explicitly indicated.
- For majors: pick the BEST single match from the canonical list. If they listed
  multiple majors, pick the most academically rigorous or first-listed one.

OUTPUT FORMAT (strict JSON, no preamble, no markdown fences):
[
  {"id": 1, "specialties": ["...", "..."], "major": "..."},
  {"id": 2, "specialties": ["...", "..."], "major": "..."}
]

Return EXACTLY ${batch.length} objects in id order 1..${batch.length}.

MENTORS:
${mentorBlocks}`
}

async function callClaude(prompt: string, retried = false): Promise<string> {
  await rateLimit()
  const res = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': ANTHROPIC_KEY!,
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (res.status === 429 && !retried) {
    console.log('\n  rate-limited, waiting 30s and retrying once...')
    await sleep(30_000)
    return callClaude(prompt, true)
  }
  if (!res.ok) {
    throw new Error(`Claude ${res.status}: ${await res.text()}`)
  }
  const data = (await res.json()) as { content: { text: string }[] }
  return data.content[0]?.text ?? ''
}

function parseBatchResponse(
  text: string,
  expectedCount: number
): ClaudeBatchItem[] {
  // Claude sometimes wraps JSON in ```json fences despite our instructions.
  const stripped = text
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/```\s*$/m, '')
    .trim()
  let parsed: unknown
  try {
    parsed = JSON.parse(stripped)
  } catch (e) {
    throw new Error(`Claude returned invalid JSON:\n${text}`)
  }
  if (!Array.isArray(parsed)) {
    throw new Error(`Claude returned non-array: ${typeof parsed}`)
  }
  if (parsed.length !== expectedCount) {
    throw new Error(
      `Claude returned ${parsed.length} items, expected ${expectedCount}`
    )
  }
  return parsed as ClaudeBatchItem[]
}

// ---------------------------------------------------------------------------
// Validation + assembly
// ---------------------------------------------------------------------------

function buildNormalizedRow(
  source: EnrichedRow,
  result: ClaudeBatchItem,
  canonicalMajors: string[]
): NormalizedRow {
  const validSpecialties = (result.specialties ?? []).filter((s) =>
    MENTOR_SPECIALTIES_SET.has(s)
  )

  // Safety net: if Claude returned nothing canonical, fall back to a
  // reasonable default rather than leaving the mentor with empty tags.
  const finalSpecialties =
    validSpecialties.length > 0
      ? validSpecialties.slice(0, 5)
      : ['Major exploration', 'Career exploration']

  // Major: exact-match check, then case-insensitive fallback.
  const majorRaw = (result.major ?? '').trim()
  let finalMajor: string | null = null
  if (canonicalMajors.includes(majorRaw)) {
    finalMajor = majorRaw
  } else {
    const ci = canonicalMajors.find(
      (m) => m.toLowerCase() === majorRaw.toLowerCase()
    )
    finalMajor = ci ?? null
  }

  return {
    email_lower: source.email_lower,
    full_name: source.full_name,
    specialties: finalSpecialties,
    major: finalMajor,
    raw_specialties: result.specialties,
    raw_major: majorRaw,
  }
}

// ---------------------------------------------------------------------------
// DB apply
// ---------------------------------------------------------------------------

async function applyToDatabase(normalized: NormalizedRow[]) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Supabase env vars missing.')
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  })

  console.log('\nApplying normalized tags + major to ghost mentors...')

  // Build email -> user_id map for all ghost mentors.
  // mentor_profiles has two FKs to users (user_id + reviewed_by) so we have
  // to name the relationship explicitly, otherwise PostgREST throws PGRST201.
  const { data: ghosts, error: ghostsErr } = await supabase
    .from('mentor_profiles')
    .select(
      'user_id, users:users!mentor_profiles_user_id_fkey!inner(email, role)'
    )
    .eq('claim_status', 'ghost')
  if (ghostsErr) throw ghostsErr

  const emailToUserId = new Map<string, string>()
  for (const g of (ghosts ?? []) as any[]) {
    const email = g.users?.email?.toLowerCase()
    if (email) emailToUserId.set(email, g.user_id)
  }
  console.log(`Found ${emailToUserId.size} ghost mentors in DB.`)

  let updated = 0
  let missing = 0
  let errors = 0

  for (let i = 0; i < normalized.length; i++) {
    const row = normalized[i]
    const userId = emailToUserId.get(row.email_lower)
    if (!userId) {
      missing++
      continue
    }
    const update: Record<string, unknown> = { tags: row.specialties }
    if (row.major) update.major = row.major

    const { error } = await supabase
      .from('mentor_profiles')
      .update(update)
      .eq('user_id', userId)
    if (error) {
      console.error(`  [${i + 1}] ${row.email_lower}: ${error.message}`)
      errors++
      continue
    }
    updated++
    if ((i + 1) % 25 === 0 || i === normalized.length - 1) {
      process.stdout.write(`  ${i + 1}/${normalized.length} updated\r`)
    }
  }

  console.log('\nApply complete:')
  console.log(`  updated:  ${updated}`)
  console.log(`  missing:  ${missing}  (no ghost profile in DB)`)
  console.log(`  errors:   ${errors}`)
}

// ---------------------------------------------------------------------------
// Supabase helpers
// ---------------------------------------------------------------------------

async function loadCanonicalMajors(): Promise<string[]> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Supabase env vars missing.')
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  })
  const { data, error } = await supabase
    .from('majors')
    .select('name, popularity')
    .order('popularity', { ascending: false })
  if (error) throw error
  return (data ?? []).map((r: { name: string }) => r.name)
}

// ---------------------------------------------------------------------------
// Preview
// ---------------------------------------------------------------------------

function previewNormalized(rows: NormalizedRow[]) {
  const previewCount = Math.min(5, rows.length)
  console.log(`\n--- PREVIEW (first ${previewCount}) ---`)
  rows.slice(0, previewCount).forEach((row, i) => {
    console.log(`\n[${i + 1}] ${row.full_name}`)
    console.log(`    email        ${row.email_lower}`)
    console.log(`    major        ${row.major ?? '(no match)'}`)
    console.log(`    specialties  ${row.specialties.join(', ')}`)
  })

  // Summary stats: how many got each specialty?
  const specCounts = new Map<string, number>()
  let majorlessCount = 0
  for (const row of rows) {
    if (!row.major) majorlessCount++
    for (const s of row.specialties) {
      specCounts.set(s, (specCounts.get(s) ?? 0) + 1)
    }
  }
  console.log('\n--- DISTRIBUTION ---')
  console.log(
    `Mentors without a canonical major match: ${majorlessCount} / ${rows.length}`
  )
  const sortedSpecs = Array.from(specCounts.entries()).sort(
    (a, b) => b[1] - a[1]
  )
  for (const [spec, count] of sortedSpecs) {
    console.log(`  ${count.toString().padStart(4)}  ${spec}`)
  }
}

// ---------------------------------------------------------------------------
// Helpers (copied from import-ghost-mentors.ts for self-containment)
// ---------------------------------------------------------------------------

function parseLimit(args: string[]): number | null {
  const idx = args.indexOf('--limit')
  if (idx === -1) return null
  const v = parseInt(args[idx + 1] ?? '', 10)
  return Number.isFinite(v) ? v : null
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

let lastClaudeCallAt = 0
async function rateLimit() {
  const since = Date.now() - lastClaudeCallAt
  if (since < CLAUDE_MIN_INTERVAL_MS) {
    await sleep(CLAUDE_MIN_INTERVAL_MS - since)
  }
  lastClaudeCallAt = Date.now()
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
