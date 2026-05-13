# Testing Log

Running list of things to manually test as we ship features. Add new items at the top, keep the date so we know what's stale. Check off as you verify, delete fully verified items once they're locked in.

Conventions:
- `[ ]` not tested
- `[x]` tested and works
- `[!]` tested and broken (link the issue/PR)

---

## 2026-05-07 — Daily.co webhook (Supabase Edge Function)

**Local dev setup**

Daily.co's dashboard has no webhook UI — webhooks are registered via REST. Webhook URLs must be publicly reachable (Daily fires a verification ping during creation), so localhost won't work directly. Use ngrok in front of the local function.

Prerequisites:
- Supabase CLI installed (`brew install supabase/tap/supabase`).
- Docker Desktop running. `supabase functions serve` requires it.
- ngrok installed (`brew install ngrok`).

Four terminals:

```
Terminal 1: npm run dev
            # frontend on localhost:3001 (or 3000)

Terminal 2: supabase functions serve daily-webhook \
              --no-verify-jwt --env-file .env.local
            # Edge Function on http://127.0.0.1:54321/functions/v1/daily-webhook

Terminal 3: ngrok http 54321
            # gives a public https://<id>.ngrok-free.app URL

Terminal 4 (one-time): npx tsx scripts/setup-daily-webhook.ts \
              https://<ngrok-id>.ngrok-free.app/functions/v1/daily-webhook
            # prints DAILY_WEBHOOK_SECRET=...
            # paste that into .env.local, then restart Terminal 2
```

Required env in `.env.local` for Terminal 2 (`supabase functions serve`):
- `SUPABASE_URL` (use `NEXT_PUBLIC_SUPABASE_URL` value)
- `SUPABASE_SERVICE_ROLE_KEY`
- `DAILY_API_KEY`
- `DAILY_WEBHOOK_SECRET` (set after running the setup script)

**Alt: skip local serve, deploy and test directly against the deployed function**

If Docker is a hassle, you can deploy the function to Supabase and point Daily directly at the `https://<project-ref>.supabase.co/functions/v1/daily-webhook` URL — no ngrok needed. The downside is iterating means redeploying.

```
supabase login
supabase link --project-ref wkifwlvpqqvbvcteeuzf
supabase secrets set DAILY_API_KEY=$(grep DAILY_API_KEY .env.local | cut -d= -f2)
supabase functions deploy daily-webhook --no-verify-jwt
npx tsx scripts/setup-daily-webhook.ts \
  https://wkifwlvpqqvbvcteeuzf.supabase.co/functions/v1/daily-webhook
supabase secrets set DAILY_WEBHOOK_SECRET=<from-script-output>
```

Tail logs while testing: `supabase functions logs daily-webhook --tail`.

If ngrok rotates URLs (free tier), either re-run the setup script (creates a new webhook) or update the existing one. Cleanup any stale ones via:

```
curl -X DELETE -H "Authorization: Bearer $DAILY_API_KEY" \
  https://api.daily.co/v1/webhooks/<uuid>
```

List existing webhooks:

```
curl -H "Authorization: Bearer $DAILY_API_KEY" https://api.daily.co/v1/webhooks
```

**Webhook smoke checks**

- [ ] `npx tsx scripts/setup-daily-webhook.ts <url>` succeeds and prints a UUID + secret. (If it 400s, the function probably isn't responding 200 to the verification ping — check Terminal 2 logs.)
- [ ] After joining a session as both student and mentor and ending the call: Terminal 2 logs `[daily/webhook] type=meeting.ended ...`, the booking flips to `status='completed'`, `ended_at` is set.
- [ ] Mentor never joins, student waits then leaves: booking flips to `status='no_show'`, `cancel_reason='mentor_no_show'`, and `student_profiles.sessions_used` decrements by 1.
- [ ] Student never joins, mentor waits then leaves: booking flips to `status='no_show'`, `cancel_reason='student_no_show'`, no credit refund.
- [ ] After a few minutes Daily fires `recording.ready-to-download`: `session_bookings.recording_url` populates with the recording id.
- [ ] After a few more minutes Daily fires `transcript.ready-to-download`: `session_bookings.transcript_url` populates with the transcript id and `transcript_status` becomes `'completed'`.
- [ ] Send a request with a bad signature (e.g. `curl -X POST <url> -d '{}'`): function returns 401 and logs `signature mismatch`.
- [ ] Idempotency: replay the same `meeting.ended` event twice — second run is a no-op because the booking is no longer `upcoming`.

**Production deploy (when ready)**

```
supabase functions deploy daily-webhook --no-verify-jwt
supabase secrets set DAILY_API_KEY=...
supabase secrets set DAILY_WEBHOOK_SECRET=<new secret from setup script>
npx tsx scripts/setup-daily-webhook.ts \
  https://<project-ref>.supabase.co/functions/v1/daily-webhook
```

Keep dev (ngrok) and prod (supabase.co) registered as two separate Daily webhooks; Daily fans events out to all registered URLs.

---

## 2026-05-07 — Sessions and scheduling V0

**Mentor schedule editor (`/mentor/schedule`)**
- [ ] Approved mentor lands on the page and sees an empty 7×4 grid with no slots selected.
- [ ] Clicking a cell highlights it; clicking again deselects it. Toggle persists locally.
- [ ] "Save availability" is disabled while the selection matches the saved state and re-enables once anything changes.
- [ ] Save round-trip: writes to `mentor_profiles.availability_slots` as an array of `${day}-${slot}` strings, sorted by day then slot.
- [ ] Reload the page: the saved selection is reflected in the grid.
- [ ] Pending (unapproved) mentor: still allowed to set availability but sees the "your account isn't fully active yet" callout.

**Student availability prompt (`/dashboard/book`)**
- [ ] Brand-new paid student with no `availability_slots` lands on `/dashboard/book` and is forced into the modal before they can interact with anything else.
- [ ] Modal cannot be dismissed without saving at least one slot. ("Save & continue" is disabled when 0 selected.)
- [ ] After save, `student_profiles.availability_slots` is populated and the modal closes; booking grid renders.
- [ ] Re-opening the modal from "Edit my availability" pre-fills the saved selection.

**Booking flow**
- [ ] Booking page shows weeks 0-3 in a tab strip ("This week", "Next week", "Week of …", "Week of …"). Switching tabs filters slots.
- [ ] Slot times display in viewer's local timezone label (e.g. "4:00 PM ET / 1:00 PM PDT").
- [ ] Mentor with no `availability_slots`: page renders the "your mentor hasn't set their availability" empty state, no grid.
- [ ] Mentor whose `status` is anything other than `'approved'` (e.g. paused, pending): empty state copy reads "your mentor isn't accepting bookings right now."
- [ ] Admin can approve a pending mentor at `/admin/mentors?status=pending`. After approval, that mentor's bookings page no longer shows the "isn't accepting bookings" empty state.
- [ ] Admin matching page (`/admin/matching`) only lists mentors with `status='approved'` in the dropdown. Mentors are sorted by overlap with the student's slots descending; at-capacity mentors fall to the bottom.
- [ ] Slots already booked by anyone with that mentor (status `upcoming` or `completed`) do not appear in the grid.
- [ ] Past slots in the current day (e.g. it's 2 PM ET, the noon slot today) do not appear.
- [ ] Slots beyond 28 days out do not appear.
- [ ] Slot only in the mentor's set OR only in the student's set: not shown (intersection only).

**Confirmation + race protection**
- [ ] Click a slot, confirm: row appears in `session_bookings` with `status='upcoming'`, `slot_index` set, `starts_at` matches the canonical slot.
- [ ] `student_profiles.sessions_used` increments by 1.
- [ ] Two browser tabs hit the same slot: second one fails with "That slot was just booked." (Confirms partial unique index.)
- [ ] Booking with `sessions_used >= sessions_total`: server action returns "You have no session credits remaining this period."

**Email + ICS**
- [ ] With `RESEND_API_KEY` unset: server logs `[email] RESEND_API_KEY not set` and the booking still completes (no thrown error).
- [ ] With key set in dev: both student and mentor receive an email with subject `Booked: session with …` / `New booking: …` and a `pupil-session.ics` attachment that imports cleanly into Google Calendar / Apple Calendar.

**Cancel flow (`/dashboard/session/[id]` and `/mentor/session/[id]`)**
- [ ] Cancel > 24h out: status flips to `cancelled`, `sessions_used` decrements by 1, both parties see refund language.
- [ ] Cancel < 24h out: status flips to `cancelled`, `sessions_used` does NOT decrement, both parties see "credit consumed" language.
- [ ] Cancel as mentor: same behavior, RLS allows the update.
- [ ] Cancel reason is optional and persists in `cancel_reason` column when supplied.
- [ ] After cancel, the slot reappears in the booking grid (because partial unique only blocks `upcoming`/`completed`).

**Surface + rendering**
- [ ] Student dashboard: `Next session` card shows the next `upcoming` booking and links to `/dashboard/session/{id}`.
- [ ] Mentor dashboard: `Upcoming sessions` block lists the next 5 upcoming and each links to `/mentor/session/{id}`.
- [ ] Mentor with 0 saved availability slots sees the "Set your weekly availability" nudge above the upcoming list.

**Timezone correctness**
- [ ] Set system timezone to America/Los_Angeles, book the Mon 8 PM ET slot: stored `starts_at` corresponds to 8 PM ET (UTC offset matches whatever DST says that week).
- [ ] Daylight-savings boundary (March 9, 2026 → DST starts; November 2, 2025 → DST ends): the canonical 8 PM ET slot stays at 8 PM ET on both sides of the transition. The UTC offset shifts but the local label doesn't.

## 2026-05-06 — Colleges + majors moved to DB

- [ ] Mentor onboarding step 1: college dropdown loads with ~1,000 schools, search by name returns hits, search by state returns hits (e.g. typing "GA" should filter to Georgia schools via the description keyword).
- [ ] Mentor onboarding step 1: major dropdown opens with the most-popular majors at the top, type-to-search works for the full top-120 list.
- [ ] Submit a new mentor application end to end: confirm `mentor_profiles.college_id` and `major_id` are populated AND `university` / `major` text columns still match the selected names.
- [ ] Re-open onboarding for an in-progress mentor (status = pending): the previously-selected college and major show up pre-filled in the comboboxes.
- [ ] Pick a school from a state that's not the alphabetically-first match (e.g. Hawaii Pacific) to confirm the FK isn't accidentally pinned to the first option.
- [ ] Empty-state behavior: type a name that doesn't exist (e.g. "Hogwarts") and confirm the empty message renders without a JS error.
- [ ] Admin review queue still shows university / major correctly for mentors who applied before this change (no regression from the dual-write).
- [ ] Public mentor directory still filters by school correctly (still keying off the text column).

## 2026-05-04 — Mentor onboarding v0.1 (LinkedIn + shadcn Select)

- [ ] LinkedIn field accepts a full URL (`https://linkedin.com/in/jane`), a path (`linkedin.com/in/jane`), and a bare handle (`jane`); all three save as the canonical `https://www.linkedin.com/in/jane`.
- [ ] LinkedIn left blank: profile saves successfully with `linkedin_url = null`.
- [ ] LinkedIn link in the admin mentor row opens in a new tab and points at the saved URL.
- [ ] Year, gender, timezone selects: keyboard navigation works (arrow keys, enter to select, esc to close).

## Persistent flows to spot-check before every push

- [ ] Sign up as a student, complete onboarding, hit `/dashboard` without seeing a flash of unauthenticated UI.
- [ ] Sign up as a mentor (`/mentor-signup`), complete onboarding, land on `/mentor` with the "review in progress" pending card.
- [ ] Log in as admin, see `/admin/mentors` with status tabs and counts that add up.
- [ ] Confirm RLS: a logged-in student cannot read another student's `users` row or `mentor_profiles` for non-approved mentors (try via the Supabase JS client in the browser console).
- [ ] Hard refresh on every protected route while logged out → redirected to `/login` with `?next=` set correctly.

---

## How to add a new section

When you ship a feature, add a `## YYYY-MM-DD — <feature name>` block at the top with the things you'd want to manually verify in a real browser before trusting it. Keep entries scoped to user-visible behavior, not implementation details (those go in DECISIONS.md).
