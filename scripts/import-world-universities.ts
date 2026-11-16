#!/usr/bin/env -S npx tsx
/**
 * Import Hipo's world university list into `colleges` so mentors outside the
 * US can find their school in onboarding.
 *
 * Source: https://github.com/Hipo/university-domains-list (MIT license).
 *
 * How rows are reconciled:
 *   - Hipo rows are grouped by country + normalized name (Hipo has a few exact
 *     duplicates that differ only by domain; their domains are merged).
 *   - Each group gets a stable external_id "hipo:<CC>:<normalized name>".
 *   - Already-imported rows are found by external_id (reruns are no-ops unless
 *     Hipo changed domains/web pages).
 *   - Otherwise a group is matched to an existing curated row with the same
 *     normalized name and country (and state when both sides know it). The
 *     curated row keeps its id, name, state and source; we only fill
 *     domains, web_pages and external_id. FKs from mentor_profiles stay valid.
 *   - Unmatched groups are inserted with source = 'hipo'. `colleges.name` is
 *     unique, so a name already used by a school in another country gets a
 *     " (Country)" suffix, e.g. "New York Institute of Technology (Jordan)".
 *
 * Usage:
 *   npx tsx scripts/import-world-universities.ts            # dry run
 *   npx tsx scripts/import-world-universities.ts --apply    # write
 *   npx tsx scripts/import-world-universities.ts --file /tmp/hipo.json
 */

import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

loadEnvLocal()

const HIPO_URL =
  'https://raw.githubusercontent.com/Hipo/university-domains-list/master/world_universities_and_domains.json'
const OUTPUT_DIR = path.resolve(__dirname, 'output')
const PAGE_SIZE = 1000
const WRITE_BATCH = 500

type HipoRow = {
  name: string
  country: string
  alpha_two_code: string
  'state-province': string | null
  domains: string[] | null
  web_pages: string[] | null
}

type HipoGroup = {
  externalId: string
  key: string
  name: string
  country: string
  countryCode: string
  stateProvince: string | null
  usStateCode: string | null
  domains: string[]
  webPages: string[]
}

type CollegeRow = {
  id: string
  name: string
  state: string
  country: string | null
  country_code: string | null
  state_province: string | null
  domains: string[]
  web_pages: string[]
  source: string
  external_id: string | null
}

type CollegeInsert = Omit<CollegeRow, 'id'>

const US_STATES: Record<string, string> = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', 'district of columbia': 'DC',
  florida: 'FL', georgia: 'GA', hawaii: 'HI', idaho: 'ID', illinois: 'IL',
  indiana: 'IN', iowa: 'IA', kansas: 'KS', kentucky: 'KY', louisiana: 'LA',
  maine: 'ME', maryland: 'MD', massachusetts: 'MA', michigan: 'MI',
  minnesota: 'MN', mississippi: 'MS', missouri: 'MO', montana: 'MT',
  nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC',
  'north dakota': 'ND', ohio: 'OH', oklahoma: 'OK', oregon: 'OR',
  pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT',
  vermont: 'VT', virginia: 'VA', washington: 'WA', 'west virginia': 'WV',
  wisconsin: 'WI', wyoming: 'WY',
}
const US_STATE_CODES = new Set(Object.values(US_STATES))
const US_CITY_STATES: Record<string, string> = { 'san francisco': 'CA' }
// Hipo rows whose state-province is wrong, keyed by primary domain.
const US_STATE_FIXES: Record<string, string> = { 'pittstate.edu': 'KS' }

const TOKEN_ALIASES: Record<string, string> = {
  st: 'saint',
  ste: 'sainte',
  mt: 'mount',
  univ: 'university',
}

function normalizeName(name: string): string {
  const tokens = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['\u2019`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((t) => TOKEN_ALIASES[t] ?? t)
  if (tokens[0] === 'the' && tokens.length > 1) tokens.shift()
  return tokens.join(' ')
}

function usStateCode(raw: string | null): string | null {
  if (!raw) return null
  const lower = raw.trim().toLowerCase()
  if (US_CITY_STATES[lower]) return US_CITY_STATES[lower]
  for (const part of lower.split(',').map((p) => p.trim()).reverse()) {
    if (part.length === 2 && US_STATE_CODES.has(part.toUpperCase())) {
      return part.toUpperCase()
    }
    if (US_STATES[part]) return US_STATES[part]
  }
  return null
}

function uniq(values: string[]): string[] {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)))
}

function sameArray(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i])
}

function groupHipo(rows: HipoRow[]): HipoGroup[] {
  const groups = new Map<string, HipoGroup>()
  for (const r of rows) {
    const name = r.name?.trim().replace(/\s+/g, ' ')
    const countryCode = r.alpha_two_code?.trim().toUpperCase()
    if (!name || !countryCode || !r.country) continue
    const norm = normalizeName(name)
    const key = `${countryCode}:${norm}`
    const stateProvince = r['state-province']?.trim() || null
    const existing = groups.get(key)
    if (existing) {
      existing.domains = uniq([...existing.domains, ...(r.domains ?? [])])
      existing.webPages = uniq([...existing.webPages, ...(r.web_pages ?? [])])
      existing.stateProvince ??= stateProvince
      existing.usStateCode ??= countryCode === 'US' ? usStateCode(stateProvince) : null
      continue
    }
    groups.set(key, {
      externalId: `hipo:${key}`,
      key,
      name,
      country: r.country.trim(),
      countryCode,
      stateProvince,
      usStateCode: countryCode === 'US' ? usStateCode(stateProvince) : null,
      domains: uniq(r.domains ?? []),
      webPages: uniq(r.web_pages ?? []),
    })
  }
  for (const g of groups.values()) {
    const fix = g.domains.map((d) => US_STATE_FIXES[d]).find(Boolean)
    if (g.countryCode === 'US' && fix) g.usStateCode = fix
  }
  return Array.from(groups.values())
}

async function loadHipo(file: string | null): Promise<HipoRow[]> {
  if (file) return JSON.parse(fs.readFileSync(file, 'utf-8')) as HipoRow[]
  const res = await fetch(HIPO_URL)
  if (!res.ok) throw new Error(`Hipo download failed: ${res.status}`)
  return (await res.json()) as HipoRow[]
}

async function main() {
  const args = process.argv.slice(2)
  const apply = args.includes('--apply')
  const fileIdx = args.indexOf('--file')
  const file = fileIdx >= 0 ? args[fileIdx + 1] : null

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } })

  const hipoRows = await loadHipo(file)
  const groups = groupHipo(hipoRows)

  const colleges: CollegeRow[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('colleges')
      .select(
        'id, name, state, country, country_code, state_province, domains, web_pages, source, external_id'
      )
      .order('id')
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(`Failed to load colleges: ${error.message}`)
    if (!data || data.length === 0) break
    colleges.push(...(data as CollegeRow[]))
    if (data.length < PAGE_SIZE) break
  }

  const byExternalId = new Map<string, CollegeRow>()
  const curatedByKey = new Map<string, CollegeRow[]>()
  const takenNames = new Set<string>()
  for (const c of colleges) {
    takenNames.add(c.name)
    if (c.external_id) byExternalId.set(c.external_id, c)
    if (!c.external_id && c.country_code) {
      const k = `${c.country_code}:${normalizeName(c.name)}`
      curatedByKey.set(k, [...(curatedByKey.get(k) ?? []), c])
    }
  }

  const updates: CollegeRow[] = []
  const inserts: CollegeInsert[] = []
  const counts = {
    hipoRows: hipoRows.length,
    hipoGroups: groups.length,
    alreadyImported: 0,
    refreshed: 0,
    matchedExisting: 0,
    inserted: 0,
    insertedWithSuffix: 0,
    skippedAmbiguous: 0,
    skippedNameCollision: 0,
  }
  const skipped: { name: string; country: string; reason: string }[] = []
  const suffixed: { original: string; stored: string }[] = []
  const matched: { hipo: string; existing: string; state: string }[] = []
  const unmatched: HipoGroup[] = []

  for (const g of groups) {
    const imported = byExternalId.get(g.externalId)
    if (imported) {
      counts.alreadyImported++
      if (!sameArray(imported.domains, g.domains) || !sameArray(imported.web_pages, g.webPages)) {
        counts.refreshed++
        updates.push({ ...imported, domains: g.domains, web_pages: g.webPages })
      }
      continue
    }

    const candidates = (curatedByKey.get(g.key) ?? []).filter(
      (c) => !c.external_id
    )
    let match: CollegeRow | null = null
    if (candidates.length === 1) {
      const c = candidates[0]
      const stateConflict =
        g.countryCode === 'US' &&
        g.usStateCode &&
        US_STATE_CODES.has(c.state) &&
        c.state !== g.usStateCode
      if (!stateConflict) match = c
    } else if (candidates.length > 1) {
      match = candidates.find((c) => g.usStateCode && c.state === g.usStateCode) ?? null
      if (!match) {
        counts.skippedAmbiguous++
        skipped.push({ name: g.name, country: g.country, reason: 'ambiguous existing match' })
        continue
      }
    }

    if (match) {
      counts.matchedExisting++
      match.external_id = g.externalId
      matched.push({ hipo: g.name, existing: match.name, state: match.state })
      updates.push({
        ...match,
        domains: uniq([...match.domains, ...g.domains]),
        web_pages: uniq([...match.web_pages, ...g.webPages]),
        external_id: g.externalId,
      })
      continue
    }
    unmatched.push(g)
  }

  // US schools claim the plain name first; most mentors are in the US.
  unmatched.sort((a, b) => Number(b.countryCode === 'US') - Number(a.countryCode === 'US'))

  for (const g of unmatched) {
    let name = g.name
    if (takenNames.has(name)) {
      const qualifier = (g.countryCode === 'US' && g.usStateCode) || g.country
      const alt = `${g.name} (${qualifier})`
      if (takenNames.has(alt)) {
        counts.skippedNameCollision++
        skipped.push({ name: g.name, country: g.country, reason: 'name already used' })
        continue
      }
      name = alt
      counts.insertedWithSuffix++
      suffixed.push({ original: g.name, stored: name })
    }
    takenNames.add(name)
    counts.inserted++
    inserts.push({
      name,
      state: g.usStateCode ?? g.stateProvince ?? g.country,
      country: g.country,
      country_code: g.countryCode,
      state_province: g.usStateCode ?? g.stateProvince,
      domains: g.domains,
      web_pages: g.webPages,
      source: 'hipo',
      external_id: g.externalId,
    })
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const reportPath = path.join(OUTPUT_DIR, `world-universities-${stamp}.json`)
  fs.writeFileSync(
    reportPath,
    JSON.stringify({ apply, counts, skipped, suffixed, matched }, null, 2)
  )

  console.log(apply ? 'APPLY' : 'DRY RUN (pass --apply to write)')
  console.table(counts)
  console.log(`Report: ${path.relative(process.cwd(), reportPath)}`)

  if (!apply) return

  for (let i = 0; i < updates.length; i += WRITE_BATCH) {
    const batch = updates.slice(i, i + WRITE_BATCH)
    const { error } = await supabase.from('colleges').upsert(batch, { onConflict: 'id' })
    if (error) throw new Error(`Update batch ${i} failed: ${error.message}`)
  }
  for (let i = 0; i < inserts.length; i += WRITE_BATCH) {
    const batch = inserts.slice(i, i + WRITE_BATCH)
    const { error } = await supabase
      .from('colleges')
      .upsert(batch, { onConflict: 'external_id', ignoreDuplicates: true })
    if (error) throw new Error(`Insert batch ${i} failed: ${error.message}`)
  }
  console.log(`Wrote ${updates.length} updates and ${inserts.length} inserts.`)
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
