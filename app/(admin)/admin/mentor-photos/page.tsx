import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Card, CardContent } from '@/components/ui/card'
import { getCurrentUser } from '@/lib/supabase/get-user'
import { createClient } from '@/lib/supabase/server'

import {
  resolveGhostMentorEmail,
  resolveGhostMentorFullName,
  resolveGhostMentorLocation,
  resolveGhostMentorSchool,
} from '@/lib/ghost-mentor-name'

import { GHOST_PROFILE_QUEUE_OR_FILTER } from '@/lib/ghost-photos'

import GhostPhotosClient, { type GhostPhotoRow } from './client'

export const dynamic = 'force-dynamic'

const LIST_SELECT_BASE =
  'user_id, university, major, grad_year, photo_url, linkedin_url, status, identity_json'
const LIST_SELECT_WITH_CSV = `${LIST_SELECT_BASE}, csv_raw`

const USER_FETCH_CHUNK = 100

async function loadUsersByIds(
  supabase: ReturnType<typeof createClient>,
  ids: string[]
) {
  const chunks: string[][] = []
  for (let i = 0; i < ids.length; i += USER_FETCH_CHUNK) {
    chunks.push(ids.slice(i, i + USER_FETCH_CHUNK))
  }

  const results = await Promise.all(
    chunks.map((chunk) =>
      supabase.from('users').select('id, full_name, email').in('id', chunk)
    )
  )

  const rows: { id: string; full_name: string; email: string }[] = []
  for (const { data, error } of results) {
    if (error) {
      console.error('[admin/mentor-photos] users chunk failed', error)
      continue
    }
    for (const u of data ?? []) {
      rows.push(u as { id: string; full_name: string; email: string })
    }
  }
  return rows
}

async function loadGhostPhotoQueue(supabase: ReturnType<typeof createClient>) {
  const withCsv = await supabase
    .from('mentor_profiles')
    .select(LIST_SELECT_WITH_CSV)
    .eq('claim_status', 'ghost')
    .or(GHOST_PROFILE_QUEUE_OR_FILTER)
    .order('university', { ascending: true, nullsFirst: false })
    .order('major', { ascending: true })

  if (!withCsv.error?.message?.includes('csv_raw')) return withCsv

  return supabase
    .from('mentor_profiles')
    .select(LIST_SELECT_BASE)
    .eq('claim_status', 'ghost')
    .or(GHOST_PROFILE_QUEUE_OR_FILTER)
    .order('university', { ascending: true, nullsFirst: false })
    .order('major', { ascending: true })
}

export default async function AdminGhostPhotosPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/admin/mentor-photos')
  if (user.role !== 'admin') {
    return (
      <div className="p-8">
        <Card className="p-12 text-center">
          <CardContent className="p-0">
            <p className="text-[15px] font-semibold text-text">Admins only</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const supabase = createClient()

  const [profilesRes, totalGhostsRes] = await Promise.all([
    loadGhostPhotoQueue(supabase),
    supabase
      .from('mentor_profiles')
      .select('user_id', { count: 'exact', head: true })
      .eq('claim_status', 'ghost'),
  ])

  if (profilesRes.error) {
    console.error('[admin/mentor-photos] load failed', profilesRes.error)
  }

  const profileRows = profilesRes.data ?? []
  const mentorIds = profileRows.map((r) => r.user_id)

  const userRows =
    mentorIds.length > 0 ? await loadUsersByIds(supabase, mentorIds) : []

  const userById = new Map(userRows.map((u) => [u.id, u]))

  const rows: GhostPhotoRow[] = profileRows.map((row) => {
    const u = userById.get(row.user_id)
    const rawField = 'csv_raw' in row ? row.csv_raw : null
    const csvRaw =
      rawField && typeof rawField === 'object' && !Array.isArray(rawField)
        ? (rawField as Record<string, unknown>)
        : null
    const identityJson =
      row.identity_json &&
      typeof row.identity_json === 'object' &&
      !Array.isArray(row.identity_json)
        ? (row.identity_json as Record<string, unknown>)
        : null
    const { city, state } = resolveGhostMentorLocation({
      csv_raw: csvRaw,
      identity_json: identityJson,
    })

    const email = resolveGhostMentorEmail({
      email: u?.email,
      csv_raw: csvRaw,
    })

    return {
      user_id: row.user_id,
      full_name: resolveGhostMentorFullName({
        full_name: u?.full_name,
        email,
        csv_raw: csvRaw,
        photo_url: row.photo_url,
      }),
      email,
      school: resolveGhostMentorSchool({
        university: row.university,
        csv_raw: csvRaw,
      }),
      university: row.university,
      major: row.major,
      grad_year: row.grad_year,
      city,
      state,
      photo_url: row.photo_url,
      linkedin_url: row.linkedin_url,
      status: row.status,
    }
  })

  const inQueue = rows.length
  const totalGhosts = totalGhostsRes.count ?? 0
  const doneCount = Math.max(0, totalGhosts - inQueue)

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl space-y-6 p-8">
        <div>
          <h1 className="display text-[28px] leading-tight">Ghost mentor setup</h1>
          <p className="mt-1 text-[14px] text-text-2">
            {inQueue} in queue · {doneCount} of {totalGhosts} ghosts complete
            (photo + LinkedIn)
          </p>
          <p className="mt-2 text-[13px] text-text-3">
            Each ghost needs a real headshot and a LinkedIn profile URL before
            they leave this queue. Find them on LinkedIn, paste the photo, save
            the profile link. Wrong photo? Reset{' '}
            <code className="rounded bg-surface-2 px-1 text-[12px]">photo_url</code>{' '}
            in Supabase to a DiceBear URL to re-queue.
          </p>
        </div>

        {rows.length === 0 ? (
          <Card className="p-12 text-center">
            <CardContent className="space-y-3 p-0">
              <p className="text-[15px] font-semibold text-text">
                All ghost mentors have photos and LinkedIn
              </p>
              <p className="text-[14px] text-text-2">
                Nothing left in the queue. You can remove this nav item when ops
                is done.
              </p>
              <Link
                href="/admin/mentors?status=approved"
                className="text-[14px] font-medium text-primary hover:underline"
              >
                View mentors
              </Link>
            </CardContent>
          </Card>
        ) : (
          <GhostPhotosClient rows={rows} />
        )}
      </div>
    </div>
  )
}
