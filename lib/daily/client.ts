/**
 * Server-side Daily.co REST API client.
 *
 * Daily.co exposes both a REST API (for room/token management) and a JS SDK
 * (for in-call behavior). This file is for the REST side. Never import this
 * from a client component — it relies on the secret API key.
 */

const DAILY_API_BASE = 'https://api.daily.co/v1'

function getApiKey(): string {
  const key = process.env.DAILY_API_KEY
  if (!key) {
    throw new Error(
      'DAILY_API_KEY is not set. Add it to .env.local. See ' +
        'https://docs.daily.co/reference/rest-api for how to retrieve it.'
    )
  }
  return key
}

type DailyRoom = {
  id: string
  name: string
  url: string
  created_at: string
  privacy: 'private' | 'public'
}

type DailyMeetingToken = {
  token: string
}

/**
 * Create a Daily.co room. Idempotent on `name` — if a room with that name
 * already exists, Daily.co returns 400; we catch that and fetch the existing
 * room instead. This makes the booking → join flow safe to retry.
 */
export async function createOrGetRoom(params: {
  name: string
  // Unix-seconds timestamps for when the room is valid.
  notBefore: number
  expires: number
  // Auto-record + auto-transcribe per PRD safety promise.
  autoRecord?: boolean
  autoTranscribe?: boolean
}): Promise<DailyRoom> {
  // Daily.co splits properties into two namespaces: room-level (here) and
  // meeting-token-level (see `createMeetingToken`).
  //
  // Recording:
  //   - `enable_recording: 'cloud'` (room) — permits cloud recording.
  //   - `start_cloud_recording: true` (mentor token) — starts it on join.
  //
  // Transcription (the config lives on the room, the trigger lives on the
  // mentor token — Daily's docs are explicit about this split):
  //   - `auto_transcription_settings` (room) — language/model/etc. used when
  //     transcription auto-starts. Putting this on the token returns 400.
  //   - `enable_transcription_storage: true` (room) — saves the WebVTT file.
  //   - `auto_start_transcription: true` (mentor token) — starts transcription
  //     on the mentor's join. Mentor is `is_owner: true` so they have the
  //     required permission.
  const body = {
    name: params.name,
    privacy: 'private' as const,
    properties: {
      enable_chat: false,
      enable_screenshare: true,
      enable_prejoin_ui: true,
      enable_knocking: false,
      ...(params.autoRecord !== false ? { enable_recording: 'cloud' } : {}),
      ...(params.autoTranscribe !== false
        ? {
            enable_transcription_storage: true,
            auto_transcription_settings: {
              language: 'en',
              model: 'nova-2',
              profanity_filter: false,
              redact: false,
              endpointing: 200,
              punctuate: true,
              includeRawResponse: false,
              extra: { interim_results: false },
            },
          }
        : {}),
      nbf: params.notBefore,
      exp: params.expires,
      // Auto-eject participants 1 hour after their session token's exp; keeps
      // rooms from lingering open.
      eject_at_room_exp: true,
    },
  }

  const res = await fetch(`${DAILY_API_BASE}/rooms`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (res.ok) {
    return (await res.json()) as DailyRoom
  }

  // Read the body exactly once. Both the "already exists" branch and the
  // generic-failure branch need it, and `Response` bodies can only be
  // consumed a single time.
  const errText = await res.text()

  if (res.status === 400 && errText.includes('already exists')) {
    const existing = await fetch(`${DAILY_API_BASE}/rooms/${params.name}`, {
      headers: { Authorization: `Bearer ${getApiKey()}` },
    })
    if (existing.ok) return (await existing.json()) as DailyRoom
    const existingErr = await existing.text()
    throw new Error(
      `Daily.co getRoom (after duplicate) failed (${existing.status}): ${existingErr}`,
    )
  }

  throw new Error(`Daily.co createRoom failed (${res.status}): ${errText}`)
}

/**
 * Mint a meeting token for a participant. The token encodes:
 * - which room they're allowed into
 * - their display name + user_id (for our own logging)
 * - the time window they can join
 * - their permissions (mentor gets canAdmin: ['participants'])
 *
 * Tokens are short-lived; we re-mint on each Join click rather than caching.
 */
export async function createMeetingToken(params: {
  roomName: string
  userId: string
  userName: string
  isMentor: boolean
  notBefore: number
  expires: number
}): Promise<DailyMeetingToken> {
  // Mentor is a meeting owner so Daily lets the token auto-start recording and
  // transcription. Student is a plain participant — they can't start, stop,
  // or even see recording/transcription controls. Recording UI is hidden for
  // the mentor too so they can't manually stop the recording mid-call
  // (Pupil owns the recording per PRD safety promise).
  const properties: Record<string, unknown> = {
    room_name: params.roomName,
    user_id: params.userId,
    user_name: params.userName,
    nbf: params.notBefore,
    exp: params.expires,
    is_owner: params.isMentor,
    enable_recording_ui: false,
    ...(params.isMentor
      ? {
          start_cloud_recording: true,
          auto_start_transcription: true,
          permissions: { canAdmin: ['participants', 'transcription'] },
        }
      : { permissions: {} }),
  }

  const res = await fetch(`${DAILY_API_BASE}/meeting-tokens`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ properties }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(
      `Daily.co createMeetingToken failed (${res.status}): ${text}`
    )
  }

  return (await res.json()) as DailyMeetingToken
}

/** Convenience: derive a deterministic Daily.co room name from a booking id. */
export function roomNameForBooking(bookingId: string): string {
  // Daily.co room names must match /^[a-z0-9-]+$/i. UUIDs are fine.
  return `pupil-${bookingId}`
}

/**
 * Get a short-lived presigned URL to download/stream a finished cloud
 * recording. Daily auto-expires the link (default ~1 hour), so fetch fresh
 * each time the breakdown page renders rather than caching.
 *
 * Reference: GET /v1/recordings/:id/access-link
 */
export async function getRecordingAccessLink(
  recordingId: string,
): Promise<string | null> {
  const res = await fetch(
    `${DAILY_API_BASE}/recordings/${recordingId}/access-link`,
    { headers: { Authorization: `Bearer ${getApiKey()}` } },
  )
  if (!res.ok) {
    console.warn(
      `[daily] getRecordingAccessLink failed (${res.status}):`,
      await res.text(),
    )
    return null
  }
  const json = (await res.json()) as {
    download_link?: string
    link?: string
  }
  return json.download_link ?? json.link ?? null
}

/**
 * Same idea for transcripts. Daily stores the WebVTT in their S3 (or yours
 * if you configured `transcription_bucket`); the access-link is a presigned
 * S3 URL we can fetch directly.
 *
 * Reference: GET /v1/transcript/:id/access-link
 */
export async function getTranscriptAccessLink(
  transcriptId: string,
): Promise<string | null> {
  const res = await fetch(
    `${DAILY_API_BASE}/transcript/${transcriptId}/access-link`,
    { headers: { Authorization: `Bearer ${getApiKey()}` } },
  )
  if (!res.ok) {
    console.warn(
      `[daily] getTranscriptAccessLink failed (${res.status}):`,
      await res.text(),
    )
    return null
  }
  const json = (await res.json()) as {
    download_link?: string
    link?: string
  }
  return json.download_link ?? json.link ?? null
}

/**
 * Fetch a WebVTT transcript and flatten it into readable plain text. Daily's
 * output looks roughly like:
 *
 *   WEBVTT
 *
 *   00:00:00.000 --> 00:00:05.000
 *   <v Speaker Name>What we said here</v>
 *
 * For V0 we don't try to preserve timestamps in the UI — we just want the
 * conversation as a paragraph stream. Each cue becomes one line prefixed
 * with the speaker (if present). Bigger formatting / clickable seek lives
 * post-V0 once we wire a real player.
 */
export async function fetchTranscriptText(
  accessLinkUrl: string,
): Promise<string | null> {
  const res = await fetch(accessLinkUrl)
  if (!res.ok) {
    console.warn(`[daily] fetchTranscriptText failed (${res.status})`)
    return null
  }
  const vtt = await res.text()
  return parseVttToPlainText(vtt)
}

function parseVttToPlainText(vtt: string): string {
  const lines = vtt.split(/\r?\n/)
  const cues: string[] = []
  let current: string[] = []
  let inHeader = true

  const flush = () => {
    if (current.length > 0) {
      const joined = current.join(' ').trim()
      if (joined) cues.push(joined)
      current = []
    }
  }

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) {
      flush()
      continue
    }
    if (inHeader && line.startsWith('WEBVTT')) {
      inHeader = false
      continue
    }
    // Skip cue identifier lines:
    //   - bare numbers ("1", "2", ...)
    //   - Daily-style identifiers like "transcript:0"
    //   - timing lines ("00:00:01.000 --> 00:00:05.000")
    if (line.includes('-->')) continue
    if (/^\d+$/.test(line)) continue
    if (/^[A-Za-z][\w-]*:\d+$/.test(line)) continue

    // Daily writes voice tags as `<v>Speaker Name:</v>actual words`. The
    // HTML5 WebVTT spec also allows `<v Speaker Name>words</v>` — handle
    // both. Anything else: strip stray tags and keep the line as-is.
    const dailyVoice = line.match(/^<v>([^<]*?):?<\/v>\s*(.*)$/)
    const htmlVoice = line.match(/^<v\s+([^>]+)>(.*?)(?:<\/v>)?$/)
    if (dailyVoice) {
      const speaker = dailyVoice[1].trim()
      const text = dailyVoice[2].trim()
      current.push(speaker ? `${speaker}: ${text}` : text)
    } else if (htmlVoice) {
      current.push(`${htmlVoice[1].trim()}: ${htmlVoice[2].trim()}`)
    } else {
      current.push(line.replace(/<\/?[^>]+>/g, '').trim())
    }
  }
  flush()

  return cues.join('\n\n')
}
