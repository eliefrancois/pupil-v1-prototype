/**
 * Daily.co webhook handler.
 *
 * Subscribed events (set when registering the webhook via
 * `scripts/setup-daily-webhook.ts`):
 *   - meeting.ended            → mark booking completed / no_show
 *   - recording.ready-to-download → save recording reference
 *   - transcript.ready-to-download → save transcript reference
 *
 * Auth: HMAC-SHA256, see `_shared/hmac.ts`.
 *
 * Behavior contract:
 *   - Always responds 200 (except 401 on bad signature) so Daily.co's circuit
 *     breaker never trips. Internal errors are logged, not surfaced.
 *   - Idempotent: skips bookings that are already in a terminal status.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

import { verifyDailySignature } from "../_shared/hmac.ts";
import {
  bookingIdFromRoomName,
  DailyParticipant,
  getRoomParticipants,
} from "../_shared/daily.ts";

type WebhookPayload = {
  version?: string;
  type?: string;
  id?: string;
  event_ts?: number;
  payload?: Record<string, unknown>;
};

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const rawBody = await req.text();

  // Verify HMAC signature when a secret is configured. In local dev with the
  // secret unset we accept the request unsigned so curl smoke tests work.
  const secret = Deno.env.get("DAILY_WEBHOOK_SECRET");
  if (secret) {
    const sig = req.headers.get("x-webhook-signature") ?? "";
    const ts = req.headers.get("x-webhook-timestamp") ?? "";
    const ok = await verifyDailySignature({
      secret,
      signature: sig,
      timestamp: ts,
      body: rawBody,
    });
    if (!ok) {
      console.warn("[daily/webhook] signature mismatch; rejecting");
      return new Response("unauthorized", { status: 401 });
    }
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WebhookPayload;
  } catch {
    console.warn("[daily/webhook] non-JSON body; ignoring");
    return ok();
  }

  const room = (payload.payload?.room ?? payload.payload?.room_name) as
    | string
    | undefined;
  console.log(
    `[daily/webhook] type=${payload.type} room=${room ?? "<none>"} id=${payload.id ?? "<none>"}`,
  );

  try {
    switch (payload.type) {
      case "meeting.ended":
        await handleMeetingEnded(payload);
        break;
      case "recording.ready-to-download":
        await handleRecordingReady(payload);
        break;
      case "transcript.ready-to-download":
        await handleTranscriptReady(payload);
        break;
      default:
        // Unsubscribed event — do nothing. We still 200 to be polite.
        break;
    }
  } catch (err) {
    // Don't return 500: Daily.co's circuit-breaker will stop delivering.
    console.error("[daily/webhook] handler error", err);
  }

  return ok();
});

function ok(): Response {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

/** Coerce numbers that Daily occasionally sends as strings. */
function toNumber(v: unknown): number | null {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function service() {
  const url = Deno.env.get("SUPABASE_URL") ??
    Deno.env.get("NEXT_PUBLIC_SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function handleMeetingEnded(payload: WebhookPayload) {
  const p = payload.payload ?? {};
  const roomName = (p.room ?? p.room_name) as string | undefined;
  // Coerce timestamps that Daily sometimes sends as strings.
  const startTs = toNumber(p.start_ts);
  const endTs = toNumber(p.end_ts);
  // Daily sometimes sends fractional seconds (e.g. end_ts = 1778630243.037).
  // `duration_seconds` is an integer column, so we must round — otherwise the
  // UPDATE fails with "invalid input syntax for integer" and we never
  // transition the booking out of `upcoming`.
  const durationSec = startTs !== null && endTs !== null
    ? Math.round(endTs - startTs)
    : null;
  const started_at = startTs !== null
    ? new Date(startTs * 1000).toISOString()
    : null;
  const ended_at = endTs !== null
    ? new Date(endTs * 1000).toISOString()
    : new Date().toISOString();

  if (!roomName) {
    console.warn("[daily/webhook] meeting.ended missing room");
    return;
  }
  const bookingId = bookingIdFromRoomName(roomName);
  if (!bookingId) return;

  const supabase = service();
  const { data: booking, error } = await supabase
    .from("session_bookings")
    .select("id, mentor_id, student_id, status")
    .eq("id", bookingId)
    .maybeSingle();

  if (error) {
    console.error("[daily/webhook] booking fetch failed", error);
    return;
  }
  if (!booking) {
    console.warn(`[daily/webhook] booking ${bookingId} not found`);
    return;
  }
  if (booking.status !== "upcoming") {
    // Already finalized (cancelled, completed, no_show). Idempotency: skip.
    return;
  }

  // Always mark the meeting completed and stamp timestamps first. No-show
  // detection runs as a best-effort downgrade below — if Daily's REST API is
  // slow to expose the participants list or DAILY_API_KEY isn't reachable,
  // we still transition the booking out of `upcoming` so the UI updates and
  // recording/transcript webhooks have something to attach to.
  const baseUpdate: Record<string, unknown> = {
    status: "completed",
    ended_at,
    duration_seconds: durationSec,
  };
  if (started_at) baseUpdate.started_at = started_at;

  const { error: updErr } = await supabase
    .from("session_bookings")
    .update(baseUpdate)
    .eq("id", booking.id);
  if (updErr) {
    console.error("[daily/webhook] booking update failed", updErr);
    return;
  }

  // Best-effort no-show detection. Failures here don't roll back the
  // `completed` write above — admin can re-classify manually if needed.
  let participants: DailyParticipant[] = [];
  try {
    participants = await getRoomParticipants(roomName);
  } catch (err) {
    console.error("[daily/webhook] no-show detection skipped", err);
    return;
  }

  const mentorJoined = participants.some(
    (q) => q.user_id === booking.mentor_id && (q.duration ?? 0) > 0,
  );
  const studentJoined = participants.some(
    (q) => q.user_id === booking.student_id && (q.duration ?? 0) > 0,
  );

  if (!mentorJoined) {
    await supabase
      .from("session_bookings")
      .update({ status: "no_show", cancel_reason: "mentor_no_show" })
      .eq("id", booking.id);
    await refundStudentCredit(supabase, booking.student_id);
  } else if (!studentJoined) {
    await supabase
      .from("session_bookings")
      .update({ status: "no_show", cancel_reason: "student_no_show" })
      .eq("id", booking.id);
  }
}

/**
 * The recording event payload contains `recording_id` and `s3_key` but no
 * direct download link. To play the recording we'd later call
 * `GET /recordings/:id/access-link` which returns a presigned (and expiring)
 * URL. For V0 we just persist the recording_id; the display layer can fetch
 * a fresh access-link on demand.
 */
async function handleRecordingReady(payload: WebhookPayload) {
  const p = payload.payload ?? {};
  const roomName = (p.room_name ?? p.room) as string | undefined;
  const recordingId = p.recording_id as string | undefined;
  if (!roomName || !recordingId) return;
  const bookingId = bookingIdFromRoomName(roomName);
  if (!bookingId) return;

  const supabase = service();
  await supabase
    .from("session_bookings")
    .update({ recording_url: recordingId })
    .eq("id", bookingId);
}

/**
 * Transcript payload: `id` is the transcription id, `s3` has bucket/key. As
 * with recordings, fetching the actual text requires a follow-up REST call
 * (`GET /transcript/:id/access-link`). Persist the id here; UI fetches text
 * on demand.
 */
async function handleTranscriptReady(payload: WebhookPayload) {
  const p = payload.payload ?? {};
  const roomName = (p.room_name ?? p.room) as string | undefined;
  const transcriptId = p.id as string | undefined;
  if (!roomName || !transcriptId) return;
  const bookingId = bookingIdFromRoomName(roomName);
  if (!bookingId) return;

  const supabase = service();
  await supabase
    .from("session_bookings")
    .update({
      transcript_url: transcriptId,
      transcript_status: "completed",
    })
    .eq("id", bookingId);
}

async function refundStudentCredit(
  supabase: ReturnType<typeof service>,
  studentId: string,
) {
  const { data, error } = await supabase
    .from("student_profiles")
    .select("sessions_used")
    .eq("user_id", studentId)
    .maybeSingle();
  if (error || !data) return;
  const used = (data as { sessions_used?: number }).sessions_used ?? 0;
  await supabase
    .from("student_profiles")
    .update({ sessions_used: Math.max(0, used - 1) })
    .eq("user_id", studentId);
}
