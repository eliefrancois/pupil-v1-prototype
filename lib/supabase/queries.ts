import { createClient } from '@/lib/supabase/server'

export type StudentProfile = {
  user_id: string
  grade: number | null
  gpa: string | null
  city: string | null
  state: string | null
  interests: string[]
  colleges: string[]
  careers: string[]
  identity_json: Record<string, unknown> | null
  matched_mentor_id: string | null
}

export type MatchedMentor = {
  user_id: string
  full_name: string
  university: string
  major: string | null
  grad_year: number | null
  bio: string | null
  photo_url: string | null
  tags: string[]
  rating: number
  sessions_count: number
}

export type SessionBooking = {
  id: string
  mentor_id: string
  student_id: string
  starts_at: string
  duration: number
  status: 'upcoming' | 'completed' | 'cancelled' | string
  created_at: string
  slot_index?: number | null
  cancelled_at?: string | null
  cancel_reason?: string | null
}

export type BookingDetail = SessionBooking & {
  counterpart: {
    user_id: string
    full_name: string
    photo_url: string | null
    university: string | null
  } | null
  viewerRole: 'student' | 'mentor'
}

/**
 * A session is "live or upcoming" if its end time is still in the future.
 * Sessions stay visible on the dashboard during their active window so a
 * mentor or student who refreshes mid-call doesn't lose their Join button.
 * Falls back to a 30-minute duration if the row didn't have one set.
 */
function isLiveOrUpcoming(
  startsAt: string,
  duration: number | null | undefined,
  now: number = Date.now()
): boolean {
  const endsAt = new Date(startsAt).getTime() + (duration ?? 30) * 60_000
  return endsAt > now
}

/**
 * Buffer (in ms) to subtract from `now()` when bounding SQL queries that look
 * for active sessions. The session is considered active until `starts_at +
 * duration`, so we'd never need more than the longest plausible duration.
 * 3 hours is more than enough headroom for a 30-60 min session.
 */
const ACTIVE_SESSION_LOOKBACK_MS = 3 * 60 * 60 * 1000

export async function getBookingDetail(
  bookingId: string,
  viewerId: string
): Promise<BookingDetail | null> {
  const supabase = createClient()
  const { data: booking } = await supabase
    .from('session_bookings')
    .select(
      'id, mentor_id, student_id, starts_at, duration, status, created_at, slot_index, cancelled_at, cancel_reason'
    )
    .eq('id', bookingId)
    .maybeSingle<SessionBooking>()

  if (!booking) return null
  if (booking.mentor_id !== viewerId && booking.student_id !== viewerId) {
    return null
  }

  const viewerRole: 'student' | 'mentor' =
    booking.student_id === viewerId ? 'student' : 'mentor'
  const counterpartId =
    viewerRole === 'student' ? booking.mentor_id : booking.student_id

  const [{ data: userRow }, { data: profileRow }] = await Promise.all([
    supabase
      .from('users')
      .select('id, full_name')
      .eq('id', counterpartId)
      .maybeSingle<{ id: string; full_name: string | null }>(),
    viewerRole === 'student'
      ? supabase
          .from('mentor_profiles')
          .select('user_id, university, photo_url')
          .eq('user_id', counterpartId)
          .maybeSingle<{
            user_id: string
            university: string | null
            photo_url: string | null
          }>()
      : Promise.resolve({ data: null as unknown as null }),
  ])

  return {
    ...booking,
    viewerRole,
    counterpart: userRow
      ? {
          user_id: userRow.id,
          full_name: userRow.full_name ?? 'Unknown',
          photo_url:
            profileRow && 'photo_url' in profileRow
              ? profileRow.photo_url
              : null,
          university:
            profileRow && 'university' in profileRow
              ? profileRow.university
              : null,
        }
      : null,
  }
}

export type SessionWithMentor = SessionBooking & {
  mentor: {
    full_name: string
    photo_url: string | null
    university: string
  } | null
}

export async function getStudentProfile(
  userId: string
): Promise<StudentProfile | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('user_id', userId)
    .single<StudentProfile>()

  return data ?? null
}

export async function getMatchedMentor(
  mentorUserId: string | null | undefined
): Promise<MatchedMentor | null> {
  if (!mentorUserId) return null

  const supabase = createClient()
  const [profileRes, userRes] = await Promise.all([
    supabase
      .from('mentor_profiles')
      .select(
        'user_id, university, major, grad_year, bio, photo_url, tags, rating, sessions_count'
      )
      .eq('user_id', mentorUserId)
      .single(),
    supabase
      .from('users')
      .select('full_name')
      .eq('id', mentorUserId)
      .single(),
  ])

  if (!profileRes.data) return null

  const p = profileRes.data
  return {
    user_id: p.user_id,
    full_name: userRes.data?.full_name ?? '',
    university: p.university,
    major: p.major,
    grad_year: p.grad_year,
    bio: p.bio,
    photo_url: p.photo_url,
    tags: p.tags ?? [],
    rating: p.rating,
    sessions_count: p.sessions_count,
  }
}

export async function getStudentSessions(
  studentId: string
): Promise<SessionWithMentor[]> {
  const supabase = createClient()
  const { data: sessions } = await supabase
    .from('session_bookings')
    .select('id, mentor_id, student_id, starts_at, duration, status, created_at')
    .eq('student_id', studentId)
    .order('starts_at', { ascending: false })

  if (!sessions || sessions.length === 0) return []

  const mentorIds = Array.from(new Set(sessions.map((s) => s.mentor_id)))
  const [usersRes, profilesRes] = await Promise.all([
    supabase.from('users').select('id, full_name').in('id', mentorIds),
    supabase
      .from('mentor_profiles')
      .select('user_id, university, photo_url')
      .in('user_id', mentorIds),
  ])

  const userById = new Map(
    (usersRes.data ?? []).map((u) => [u.id, u as { id: string; full_name: string }])
  )
  const profileById = new Map(
    (profilesRes.data ?? []).map((p) => [
      p.user_id,
      p as { user_id: string; university: string; photo_url: string | null },
    ])
  )

  return sessions.map((row) => {
    const u = userById.get(row.mentor_id)
    const p = profileById.get(row.mentor_id)
    return {
      ...(row as SessionBooking),
      mentor:
        u || p
          ? {
              full_name: u?.full_name ?? '',
              university: p?.university ?? '',
              photo_url: p?.photo_url ?? null,
            }
          : null,
    }
  })
}

const DEFAULT_SESSIONS_PER_YEAR = 24

export type StudentSessionUsage = {
  total: number
  used: number
  remaining: number
  upcoming: SessionWithMentor | null
  lastCompleted: SessionWithMentor | null
}

export async function getStudentSessionUsage(
  studentId: string
): Promise<StudentSessionUsage> {
  const supabase = createClient()
  const [sessions, { data: profile }] = await Promise.all([
    getStudentSessions(studentId),
    supabase
      .from('student_profiles')
      .select('sessions_total, sessions_used')
      .eq('user_id', studentId)
      .maybeSingle<{
        sessions_total: number | null
        sessions_used: number | null
      }>(),
  ])

  const now = Date.now()
  const total = profile?.sessions_total ?? DEFAULT_SESSIONS_PER_YEAR
  const used = profile?.sessions_used ?? 0

  const upcoming =
    sessions
      .filter(
        (s) =>
          s.status === 'upcoming' &&
          isLiveOrUpcoming(s.starts_at, s.duration, now)
      )
      .sort(
        (a, b) =>
          new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
      )[0] ?? null
  const lastCompleted =
    sessions.find((s) => s.status === 'completed') ?? null

  return {
    total,
    used,
    remaining: Math.max(0, total - used),
    upcoming,
    lastCompleted,
  }
}

export type MentorUpcoming = {
  id: string
  starts_at: string
  duration: number
  student: {
    user_id: string
    full_name: string
    photo_url: string | null
  } | null
}

export type SessionWithStudent = SessionBooking & {
  student: {
    full_name: string
  } | null
}

export async function getMentorSessions(
  mentorId: string,
): Promise<SessionWithStudent[]> {
  const supabase = createClient()
  const { data: sessions } = await supabase
    .from('session_bookings')
    .select(
      'id, mentor_id, student_id, starts_at, duration, status, created_at',
    )
    .eq('mentor_id', mentorId)
    .order('starts_at', { ascending: false })

  if (!sessions || sessions.length === 0) return []

  const studentIds = Array.from(new Set(sessions.map((s) => s.student_id)))
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name')
    .in('id', studentIds)

  const userById = new Map(
    (users ?? []).map((u) => [
      u.id,
      u as { id: string; full_name: string | null },
    ]),
  )

  return sessions.map((row) => {
    const u = userById.get(row.student_id)
    return {
      ...(row as SessionBooking),
      student: u ? { full_name: u.full_name ?? 'Student' } : null,
    }
  })
}

export type SessionForReview = {
  booking: {
    id: string
    mentor_id: string
    student_id: string
    starts_at: string
    duration: number | null
    status: string
    started_at: string | null
    ended_at: string | null
    duration_seconds: number | null
    recording_url: string | null
    transcript_url: string | null
    transcript_status: string | null
  }
  counterpart: {
    user_id: string
    full_name: string
    photo_url: string | null
    university: string | null
  } | null
  viewerRole: 'student' | 'mentor'
  existingRating: number | null
}

/**
 * Loads everything the post-call breakdown page needs in one round-trip:
 * the booking row, the counterpart's display info, and the viewer's existing
 * rating (so the stars can be pre-filled). Returns null if the booking
 * doesn't exist or the viewer isn't a participant — the page treats both
 * cases as 404.
 */
export async function getSessionForReview(
  bookingId: string,
  viewerId: string,
): Promise<SessionForReview | null> {
  const supabase = createClient()
  const { data: booking } = await supabase
    .from('session_bookings')
    .select(
      'id, mentor_id, student_id, starts_at, duration, status, started_at, ended_at, duration_seconds, recording_url, transcript_url, transcript_status',
    )
    .eq('id', bookingId)
    .maybeSingle<SessionForReview['booking']>()

  if (!booking) return null
  if (booking.mentor_id !== viewerId && booking.student_id !== viewerId) {
    return null
  }

  const viewerRole: 'student' | 'mentor' =
    booking.student_id === viewerId ? 'student' : 'mentor'
  const counterpartId =
    viewerRole === 'student' ? booking.mentor_id : booking.student_id

  const [{ data: userRow }, { data: profileRow }, { data: ratingRow }] =
    await Promise.all([
      supabase
        .from('users')
        .select('id, full_name')
        .eq('id', counterpartId)
        .maybeSingle<{ id: string; full_name: string | null }>(),
      viewerRole === 'student'
        ? supabase
            .from('mentor_profiles')
            .select('user_id, university, photo_url')
            .eq('user_id', counterpartId)
            .maybeSingle<{
              user_id: string
              university: string | null
              photo_url: string | null
            }>()
        : Promise.resolve({ data: null as unknown as null }),
      viewerRole === 'student'
        ? supabase
            .from('ratings')
            .select('score')
            .eq('session_id', bookingId)
            .eq('from_user_id', viewerId)
            .maybeSingle<{ score: number }>()
        : Promise.resolve({ data: null as unknown as null }),
    ])

  return {
    booking,
    viewerRole,
    existingRating: ratingRow?.score ?? null,
    counterpart: userRow
      ? {
          user_id: userRow.id,
          full_name: userRow.full_name ?? 'Unknown',
          photo_url:
            profileRow && 'photo_url' in profileRow
              ? profileRow.photo_url
              : null,
          university:
            profileRow && 'university' in profileRow
              ? profileRow.university
              : null,
        }
      : null,
  }
}

export async function getMentorUpcomingSessions(
  mentorId: string,
  limit = 5
): Promise<MentorUpcoming[]> {
  const supabase = createClient()
  // Fetch sessions starting within the lookback window or in the future, then
  // filter precisely in JS to anything still active (now < starts_at + duration).
  // Postgres can't easily compare `starts_at + interval(duration)` here without
  // an RPC, and the row count in the lookback window is bounded.
  const lowerBound = new Date(
    Date.now() - ACTIVE_SESSION_LOOKBACK_MS
  ).toISOString()
  const { data: rows } = await supabase
    .from('session_bookings')
    .select('id, student_id, starts_at, duration')
    .eq('mentor_id', mentorId)
    .eq('status', 'upcoming')
    .gte('starts_at', lowerBound)
    .order('starts_at', { ascending: true })

  if (!rows || rows.length === 0) return []

  const now = Date.now()
  const liveRows = rows
    .filter((r) => isLiveOrUpcoming(r.starts_at, r.duration, now))
    .slice(0, limit)
  if (liveRows.length === 0) return []

  const studentIds = Array.from(new Set(liveRows.map((r) => r.student_id)))
  const [{ data: users }, { data: profiles }] = await Promise.all([
    supabase.from('users').select('id, full_name').in('id', studentIds),
    supabase
      .from('student_profiles')
      .select('user_id')
      .in('user_id', studentIds),
  ])

  const userById = new Map(
    (users ?? []).map((u) => [u.id, u as { id: string; full_name: string }])
  )
  // student_profiles doesn't have photo_url today; we leave it null.
  void profiles

  return liveRows.map((row) => {
    const u = userById.get(row.student_id)
    return {
      id: row.id,
      starts_at: row.starts_at,
      duration: row.duration ?? 30,
      student: u
        ? {
            user_id: u.id,
            full_name: u.full_name,
            photo_url: null,
          }
        : null,
    }
  })
}
