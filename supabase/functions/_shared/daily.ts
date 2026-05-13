/**
 * Minimal Daily.co REST helpers used from inside Edge Functions.
 *
 * The webhook payload for `meeting.ended` does NOT include a participants list
 * (just `start_ts`, `end_ts`, `meeting_id`, `room`), so we have to fetch the
 * roster ourselves to determine who actually joined for no-show detection.
 */

const DAILY_API_BASE = "https://api.daily.co/v1";

function apiKey(): string {
  const k = Deno.env.get("DAILY_API_KEY");
  if (!k) throw new Error("DAILY_API_KEY env var not set");
  return k;
}

export type DailyParticipant = {
  user_id?: string;
  user_name?: string;
  /** Total seconds the participant was in the room. Zero if they never joined. */
  duration?: number;
  participant_id?: string;
  join_time?: number;
};

/**
 * Fetch all participants across all meetings for a given room.
 *
 * Why room-scoped instead of meeting-scoped: Daily.co's API does NOT expose a
 * `/meetings/:id/participants` endpoint. Participants are embedded inside the
 * `GET /meetings?room=<name>` list response. Additionally, when a user leaves
 * and rejoins, Daily creates a NEW meeting record each time, so a single
 * `meeting.ended` webhook only sees one slice of the room's history. We
 * aggregate across all meetings on the room to get the full roster — anyone
 * who joined any session counts as "joined" for no-show detection.
 */
export async function getRoomParticipants(
  roomName: string,
): Promise<DailyParticipant[]> {
  const url = `${DAILY_API_BASE}/meetings?` +
    new URLSearchParams({ room: roomName, limit: "50" }).toString();
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey()}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Daily list meetings failed (${res.status}): ${text}`,
    );
  }
  const json = await res.json() as {
    data?: Array<{ participants?: DailyParticipant[] }>;
  };
  const meetings = json.data ?? [];
  const all: DailyParticipant[] = [];
  for (const m of meetings) {
    if (Array.isArray(m.participants)) all.push(...m.participants);
  }
  return all;
}

/**
 * Recover a Pupil booking id from a Daily room name. Rooms are named
 * `pupil-<bookingId>` per `roomNameForBooking` in `lib/daily/client.ts`.
 */
export function bookingIdFromRoomName(roomName: string): string | null {
  const prefix = "pupil-";
  if (!roomName.startsWith(prefix)) return null;
  return roomName.slice(prefix.length);
}
