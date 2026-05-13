# Roadmap

What we plan to build next, in priority order, with the reasoning for the
ordering. This is a working doc — re-rank as priorities shift. Once a slice
is shipped, move it from this doc into `DECISIONS.md` if there are decisions
worth remembering.

PRD captures what the product is. This doc captures what we're building next
and why _now_.

---

## In flight

### 1. Calling (Daily.co integration)

**Why now**: hard blocker. Without it, the "Join" button is dead and sessions
can't actually happen. Calendar sync, fancy reminders, etc. all assume a
working call. Build the thing that delivers the value first.

**Scope (V0)**:

- Create a Daily.co room lazily at "Join" time (not at booking time — avoids
  orphan rooms when bookings get cancelled).
- Store `room_url` on `session_bookings` once created.
- Embed the call inline via `daily-js` iframe (cleaner UX than redirecting to
  daily.co).
- Auto-record + auto-transcribe (Daily.co supports both natively).
- Mark session as `completed` after the call ends (Daily.co webhook).
- Both student and mentor see "Join" 5 min before start, disabled before that.
- After session: short post-session screen with placeholders for "what was
  covered" (filled from transcript later).
- **TODO (regression from initial calling V0)**: auto-start recording and
  transcription. We had `start_cloud_recording: true` and `start_transcription:
  true` on the room create payload, but those are token-level (not room-level)
  properties — Daily.co returns `400 invalid-request-error: invalid property
  name 'start_cloud_recording'`. Removed both for now so calls actually
  connect. Two paths to fix: (a) add `start_cloud_recording: true` to the
  meeting token in `createMeetingToken` (whoever joins first auto-starts), or
  (b) call `POST /rooms/:name/recordings/start` from the server when the first
  `participant.joined` webhook fires. Path (b) is sturdier (decoupled from
  client behavior) but needs a new webhook subscription. Path (a) is one-line.

**Out of scope for V0**:

- Live captions (V1).
- Co-watching, screen-share. We get screen-share for free with Daily.co
  default UI but won't build custom controls.
- Storage of transcripts in our DB — store the Daily.co URL and fetch on
  demand. Move to our own storage later if we need to.

---

## Up next

### 2. Notification doc + Resend wiring

**Why now**: a working booking flow that doesn't notify the mentor is broken.
Once calling exists and people can run sessions, the next missing piece is
making sure both parties know a session is coming.

**Scope**:

- Use the trigger map in `NOTIFICATIONS.md`.
- Wire Resend templates for: booking confirmation (both parties), session
  reminder 24h out, cancellation, mentor approved/rejected, student matched.
- Other entries in `NOTIFICATIONS.md` get sequenced after this initial pass.

### 3. Tier reconciliation: free / free-access / paid

**Why now**: should land before Stripe so the gating model is clean and
Stripe webhooks just write `tier='paid'`. Right now everyone is binary
inactive/active.

**Scope**:

- New column `users.access_tier` (`'free' | 'free_access' | 'paid'`) or
  extend `subscription_status`. Pick one and migrate.
- Set `sessions_total` per tier (free=0, free_access=6 or 12 per code,
  paid=24).
- Redeem-code flow at signup and in `/dashboard/settings`.
- Update `canBook` logic everywhere.
- Admin tooling on `/admin/codes` to issue codes with sessions_total override.

### 4. Stripe checkout + webhooks

**Why now**: revenue. Should be straightforward once the tier model is
clean.

**Scope**:

- $900/yr yearly plan (PRD).
- Checkout session via edge function.
- Webhooks: `checkout.session.completed`, `customer.subscription.updated`,
  `customer.subscription.deleted` → write to `users.access_tier`,
  `stripe_customer_id`, `stripe_subscription_id`.
- Customer portal link in `/dashboard/settings`.
- Test mode wiring + env vars.

### 5. Mentor "block date" exception (calendar-sync stopgap)

**Why now**: cheap, no OAuth, covers ~80% of double-booking cases without the
complexity of full calendar sync.

**Scope**: simple "block this date" button on `/mentor/schedule` that hides
all that day's slots for a one-off (vacation, sick day, etc).

### 6. Safety reporting flow

**Why now**: pre-launch requirement per PRD. Cannot ship to real students
without a way to flag a session.

**Scope**:

- "Report this session" button on session detail.
- Categorized reasons (inappropriate content, no-show, contact info exchange,
  other).
- Lands in `/admin/flags` with status workflow (open / reviewing / resolved).

---

## Later (V1+)

### Calendar sync (Google → Outlook → Apple)

Replaces the manual "block date" feature. Reads free/busy at booking time so
slots in the picker exclude live conflicts. Big OAuth lift; deferred until
mentor density justifies it.

### MentorGPT

PRD calls this out as future. AI assistant that prepares both sides before a
session. Out of scope until V0 stabilizes.

### In-app messaging

Currently a placeholder. Build only after sessions are happening reliably and
we know what kind of messages people actually want to send.

### Live captions in calls

V1 polish. Daily.co supports it; we just don't expose it yet.

### Parent dashboard

PRD allows parents to see session dates/duration/mentor without seeing
content. Build when we have enough sessions for parents to care.

---

## Decision log pointers

When we make a non-obvious call inside any of the slices above (e.g. "we
chose lazy-room-creation over pre-creation because X"), append it to
`DECISIONS.md` with date and reasoning.
