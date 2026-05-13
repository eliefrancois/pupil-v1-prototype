# Engineering Decisions Log

A running ledger of engineering / implementation decisions. Format is loose ADR-lite: date, decision, why, alternatives considered. Add to the top, oldest at the bottom.

This is for *how* we build things. The PRD Decisions Log covers *what* we build and *who* it's for.

---

## 2026-05-07 — Daily.co webhook on Supabase Edge Function (revision)

**Decision:** Moved the Daily.co webhook handler from a Next.js API route (`app/api/webhooks/daily/route.ts`) to a Supabase Edge Function at `supabase/functions/daily-webhook`. Webhook registration is done once via `scripts/setup-daily-webhook.ts`, which calls Daily's `POST /webhooks` REST endpoint (Daily has no dashboard UI for webhooks).

**Why:**

- **Decoupling**: webhook reliability is now independent of frontend deploys. A bad Vercel deploy can't drop session-completion events.
- **Co-location**: handler runs in the same region as Postgres, with the service role key auto-injected at runtime. One less secret to ship to Vercel.
- **Independence**: stripe-checkout already lives as an Edge Function; same pattern for Daily keeps the deployment story consistent.

**Bug fixes shipped along with the move:**

- The previous handler listened for `transcript.ready`. The actual event is `transcript.ready-to-download` — transcripts would have silently never been recorded.
- `meeting.ended`'s payload only contains `{start_ts, end_ts, meeting_id, room}` — there is no participants array. The old code read `payload.payload.participants` for no-show detection, which always came back empty. New handler calls `GET /meetings/:meeting_id/participants` from inside the function.
- HMAC secret is base64-encoded per Daily's spec; the new handler decodes it to raw bytes before importing into Web Crypto, instead of treating the base64 string as the key directly.

**Webhook registration flow:**

The Daily.co dashboard has no webhook UI — registration is REST-only. `scripts/setup-daily-webhook.ts` generates a 32-byte base64 hmac client-side, POSTs to `https://api.daily.co/v1/webhooks` with our public URL, eventTypes (`meeting.ended`, `recording.ready-to-download`, `transcript.ready-to-download`), and the secret. Generating the secret on our side avoids a race during Daily's verification ping (which arrives signed before the create response returns).

`retryType: "exponential"` (instead of default `circuit-breaker`) so transient ngrok dropouts in dev don't permanently `FAIL` the webhook after 3 misses.

**Recording / transcript persistence:**

`recording.ready-to-download` and `transcript.ready-to-download` payloads don't contain a direct download URL — they contain `recording_id` / transcript `id` plus an S3 key. Playable URLs come from a separate REST call (`GET /recordings/:id/access-link`) and are presigned with short expirations. For V0 we persist the id (in `recording_url` / `transcript_url`); the display layer can fetch a fresh access-link on demand.

**Local dev:** `supabase functions serve daily-webhook --no-verify-jwt --env-file .env.local` plus an `ngrok` tunnel; webhook URL is `https://<ngrok-id>.ngrok-free.app/functions/v1/daily-webhook`. Documented in `docs/TESTING.md`.

**Files added:**
- `supabase/functions/daily-webhook/index.ts` — Deno handler.
- `supabase/functions/_shared/hmac.ts` — Web Crypto signature verification.
- `supabase/functions/_shared/daily.ts` — Daily REST helpers (participant fetch, room name parsing).
- `scripts/setup-daily-webhook.ts` — one-time CLI to register the webhook.
- `supabase/config.toml` — declares `verify_jwt = false` for the webhook function.

**Files removed:**
- `app/api/webhooks/daily/route.ts` (replaced by the Edge Function).
- `lib/supabase/service.ts` (only consumer was the deleted route).

**Alternatives considered:**

- **Stay with Next.js route**: simpler initially, but ties webhook reliability to frontend deploys. Acceptable for a hackday but worth fixing now while the surface is small.
- **Let Daily auto-generate the hmac**: causes a race — Daily fires its verification ping signed with the new hmac before the create response (containing the hmac) is back. Generating client-side and passing in the request makes the handler ready before the verification ping arrives.
- **Eagerly fetch recording / transcript URLs in the webhook and store them**: Daily access-links expire (presigned), so a stored URL would go stale. Storing the id and fetching on demand is the right shape.

---

## 2026-05-07 — Calling V0: Daily.co with meeting tokens, scoped admin, embedded prebuilt UI

**Decision:** Sessions happen on Daily.co. Both parties join via an embedded iframe inline at `/dashboard/session/[id]` (student) and `/mentor/session/[id]` (mentor), authenticated with per-user time-bound meeting tokens. Mentor token is scoped to `permissions.canAdmin: ['participants']` (mute / kick disruptive joiners) but cannot stop recording. Student token has no admin powers. Pupil owns the recording.

**Why:**

- **Daily.co over Twilio Video / Zoom SDK / Vonage**: Daily.co has the simplest path from "create a room" to "embed in browser" with built-in recording + transcription. The other options either require deeper SDK work (Twilio/Vonage) or ship a more opinionated UI we'd have to fight against (Zoom SDK).
- **Meeting tokens over private room URLs**: a leaked URL is useless without a fresh token, and tokens carry `nbf`/`exp` claims so the join window is enforced server-side, not just in our UI. Also gives us a clean place to attach `user_id` for audit.
- **Mentor scoped admin**: in a 1:1 video call between a teen and an adult, the trusted adult should have practical mid-call safety controls. Symmetric participants would mean a mentor has no way to remove a third party who somehow joined or to mute a disruptive student short of leaving the call themselves. That's the wrong safety failure mode.
- **Pupil owns recording**: per PRD, sessions are recorded for safety and post-session debrief. Letting either party stop the recording mid-call breaks that promise. The mentor's admin scope explicitly excludes `recording`.
- **Themed prebuilt UI over fully custom**: zero working sessions exist today. Custom UI is 2-4x more code and we'd be guessing at what controls matter before we've shipped a single call. Themed prebuilt with a Pupil chrome wrapper gets ~80% of the brand benefit at a small fraction of the cost. Custom UI is a v1 polish pass.

**Join window**: 5 minutes before scheduled start to 30 minutes after scheduled end. Encoded both in client-side gating and in the Daily.co token's `nbf` / `exp` claims. Showing up an hour late means the token won't issue at all.

**Lazy room creation**: rooms are created the first time someone clicks Join, not at booking time. Avoids orphaned rooms when bookings are cancelled. The `joinSession` action is idempotent — `createOrGetRoom` returns the existing room if it's already there.

**No-show handling**: when Daily.co's `meeting.ended` webhook fires, we look at the participants list. If the mentor never had a non-zero duration, mark `status='no_show'`, store `cancel_reason='mentor_no_show'`, and refund the student's credit. If the student never showed but the mentor did, mark `status='no_show'` with `cancel_reason='student_no_show'` and consume the credit. Edge case: if neither party joins at all, `meeting.ended` never fires; that booking stays `upcoming` until an admin or future cleanup job notices. Acceptable for V0.

**In-call chat**: disabled. Chat messages aren't naturally captured in the audio recording, so they'd be a parallel safety surface needing logging + filtering. The PRD already calls for in-app messaging as a separate, audited channel; funneling text exchanges there is consistent. We can flip in-call chat back on after the messaging audit pipeline exists.

**Webhook security**: HMAC-SHA256 over `${timestamp}.${rawBody}` with `DAILY_WEBHOOK_SECRET`, comparison via `crypto.timingSafeEqual`. If the secret isn't set locally, signature verification is skipped (dev convenience).

**Schema notes**: most columns we needed already existed from the scheduling V0 work — `daily_room_name`, `daily_room_url`, `started_at`, `ended_at`, `duration_seconds`, `recording_url`, `transcript_*`. The `daily_meeting_token_*` columns are unused; we re-mint tokens per Join click rather than caching them. Worth dropping in a future migration once we're confident.

**Files:**
- `lib/daily/client.ts` — Daily.co REST API helper (create room, mint token).
- `lib/scheduling/join-window.ts` — pure join-window computation, used both client-side for UI gating and server-side for token claims.
- `lib/actions/call-actions.ts` — `joinSession(bookingId)` server action.
- `components/scheduling/call-room.tsx` — Daily iframe wrapper with Pupil chrome.
- `app/(dashboard)/dashboard/session/[id]/session-detail.tsx` — shared session detail UI used by both student and mentor pages; toggles into call view when the user clicks Join.
- Webhook handler now lives in `supabase/functions/daily-webhook/` — see the 2026-05-07 webhook revision entry above.

**Alternatives considered:**

- **Twilio Programmable Video**: stronger SDK, but more opinionated and pricier per minute. Recording + transcription are extra integrations, not built-in.
- **Vonage**: similar to Twilio. Daily.co's free-tier and simpler REST API won.
- **Pre-create rooms at booking time**: simpler from a "the room always exists" perspective but creates orphan rooms for every cancelled booking. Lazy creation is cheaper and still feels instant to the user.
- **Symmetric participants (no admin scope)**: cleaner privacy story, but creates the safety gap above. We took the slightly more complex auth model for the safety win.
- **Custom UI with `daily-js` core**: deferred to v1.

---

## 2026-05-07 — Sessions and scheduling V0: fixed canonical slot grid

**Decision:** Booking happens against a fixed weekly slot grid (Exponent-style) instead of freeform mentor calendars + Google/Outlook OAuth. Both mentors and students opt into a subset of canonical slots; bookings can only land on those exact times.

**Why:** With a small marketplace, freeform availability kills match rates — a Tuesday-7-PM student and a Thursday-5-PM mentor never connect. Fixing the slot grid concentrates demand and makes matching feasible at small N. It also removes calendar OAuth from the V0 critical path, which was the single biggest engineering item on the roadmap. We can layer Google/Outlook on top later as "import your conflicts" without changing the booking model.

**Slot grid (US Eastern, 28 slots/week):**
- Weekdays (Mon-Fri): 12 PM, 4 PM, 6 PM, 8 PM ET
- Weekends (Sat-Sun): 10 AM, 1 PM, 4 PM, 7 PM ET

ET is canonical. Both parties see slots translated to their local time.

**Schema:**
- `mentor_profiles.availability_slots jsonb default '[]'` — array of `${day}-${slot}` ids (e.g. `"1-2"` = Monday's 6 PM ET slot). Replaces the old freeform `availability_schedule` which we keep around as dead data for now.
- `student_profiles.availability_slots jsonb default '[]'` — same shape.
- `student_profiles.sessions_total` (default 24) and `sessions_used` (default 0) — credit tracking. We'll move these to a real `subscriptions` table when that exists.
- `session_bookings`:
  - Added `slot_index`, video columns (`daily_room_name`, `daily_room_url`, `daily_meeting_token_*`, `started_at`, `ended_at`, `duration_seconds`, `recording_url`, `transcript_*`), and cancellation columns (`cancelled_at`, `cancelled_by`, `cancel_reason`).
  - CHECK constraint on `status` for `'upcoming' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'`.
  - Partial UNIQUE index on `(mentor_id, starts_at) WHERE status IN ('upcoming','completed')` as the race-condition guard. Multiple cancelled rows can share the same start without conflict.

**Implementation:**
- `lib/scheduling/canonical-slots.ts` — slot grid constants, `SlotKey` type, helpers for ET hour lookup and pretty labels.
- `lib/scheduling/slots.ts` — pure functions: `slotStartUtc`, `getOpenSlots`, `validateBookingSlot`, `formatSlot`, `formatSlotTimeOnly`. Uses `date-fns-tz` for ET ↔ UTC conversion (handles DST). All inputs are sets of slot ids; the math is timezone-agnostic at the data layer.
- `components/scheduling/canonical-slot-grid.tsx` — reusable 7×4 toggle grid used by both the mentor schedule editor and the student availability prompt.
- `components/scheduling/availability-prompt.tsx` — modal that gates booking when the student hasn't set their availability yet. New students hit it on first visit to `/dashboard/book`.
- `app/(mentor)/mentor/schedule/page.tsx` — replaced the old freeform Morning/Afternoon/Evening grid with the canonical slot editor and a server action (`saveMentorAvailability`).
- `app/(dashboard)/dashboard/book/page.tsx` — server-renders open slots from `getOpenSlots(mentor ∩ student − bookings)`, week-paginated 4 weeks out. Booking confirmation uses a Radix dialog; on success we show an inline confirmation card.
- `app/(dashboard)/dashboard/book/actions.ts` — `bookSession` server action does revalidation, race-protected insert, credit decrement, and fires a Resend email with an ICS attachment (no-op if `RESEND_API_KEY` isn't set).
- `lib/actions/booking-actions.ts` — `cancelBooking` server action handles the 24-hour refund rule. Refunds flow back to `student_profiles.sessions_used`.
- `app/(dashboard)/dashboard/session/[id]/page.tsx` — converted the mock-data pre-call screen to a real server component reading from `session_bookings`. Shared `SessionDetail` client is reused at `app/(mentor)/mentor/session/[id]/page.tsx`.
- New deps: `date-fns-tz`, `ics`, `resend`.

**Why ET as canonical:**
We need one anchor or the slots become incoherent across DST and timezones. Mentors and students can be in any timezone, but most current users (and most mentors) are East Coast US. ET keeps the brain math simple for the largest cohort. International students see slots translated; if it's awkward, that's surfaced honestly in the UI ("4:00 PM ET / 1:00 AM JST").

**Cancellation rule:**
- > 24h out: refund the credit (decrement `sessions_used`).
- < 24h: credit is consumed. Both parties get an email.

**Out of scope (V0.5+):**
- Google / Outlook OAuth and FreeBusy import.
- Mentor calendar event push.
- Email-link cancel via `cancel_token`.
- Daily.co room creation and join tokens. Columns are ready; population deferred until video integration.
- Reschedule (cancel + re-book is fine for now).
- Date-specific availability overrides ("not next Tuesday").
- Buffer-minutes config (irrelevant with a fixed slot grid).
- Student onboarding step for availability — gated via the booking-time modal in V0.

**Alternatives considered:**
- Freeform availability + Google Calendar OAuth: deferred. 2-3 day engineering item that we can layer in later without changing the booking model.
- Variable per-day slot lengths (60 min for some, 30 for others): rejected. PRD locks at 30 min for V0; adds zero value at this stage.
- Storing availability as `(day, slot)` rows in a separate table: rejected. jsonb is fine for this size; querying isn't on the hot path.

---

## 2026-05-05 — Colleges and majors moved to database tables

**Decision:** Replaced the static TypeScript data files (`lib/data/colleges.ts`, `lib/data/majors.ts`) with `public.colleges` and `public.majors` tables in Supabase. Mentor onboarding now fetches them server-side and submits FK ids alongside the legacy text fields.

**Why:** Static `.ts` files made the bundle bigger than necessary, couldn't be updated without a deploy, and gave us no way to attach metadata (acceptance rate, application fee, popularity) that we already have in the source data and will want for matching and pricing later. Tables also let admins edit the catalog without a code change.

**Schema:**
- `colleges (id, name UNIQUE, city, state, application_fee, acceptance_rate)` — full 1,013-school list (one duplicate name from the source got deduped). Indexed on `state` and a `pg_trgm` GIN index on `name` for fast substring search.
- `majors (id, name UNIQUE, popularity)` — top 120 majors by frequency from the IPEDS data. The user explicitly asked to drop the long-tail since per-school major lists aren't used for matching yet.
- `mentor_profiles.college_id` / `major_id` — nullable FKs added alongside the existing `university` / `major` text columns. Both stay populated on submit so existing reads (directory, admin queue) keep working without joins; the FK is there for joins when we want richer data.
- RLS: anon + authenticated read; admin-only write.

**Implementation:**
- `lib/data/colleges-majors.ts` — `getColleges()` and `getMajors()` server-side fetchers used by the `mentor-onboarding` server component.
- Form receives `colleges: CollegeRecord[]` and `majors: MajorRecord[]` as props, builds `ComboboxOption[]` keyed by id with name as label and state as description.
- Form state now stores `collegeId` / `majorId` (UUIDs) instead of free-text. Submit looks up the record from the prop arrays and writes both `college_id` (FK) and `university` (snapshot string) so the directory's existing select queries don't need to change.
- Backfill migration matches existing rows by lowercased name (no rows to migrate currently, but the migration is idempotent).

**Alternatives considered:**
- Drop the text columns entirely and join everywhere. Rejected for v0 because every existing reader (directory, admin queue, public profile, queries.ts) would need updating in lockstep. Dual-write is cheap insurance.
- All majors instead of top 120. Rejected per user direction — long tail isn't valuable yet.
- Server action with a name → id lookup at submit time. Rejected — we already have the full options array in memory client-side; doing the lookup there is one round trip cheaper.

---

## 2026-05-04 — Mentor onboarding v0.1: shadcn Select, college/major data, LinkedIn

**Decision:** Replaced the native `<select>` wrapper with the proper shadcn (Radix) `Select`. Switched mentor onboarding college and major inputs from free-text to searchable comboboxes backed by real data. Added an optional LinkedIn URL field.

**Why:** The native dropdown didn't match the rest of the design system. Free-text college / major entry leads to typos, weird casing, and dirty data when we eventually need to match against student preferences. LinkedIn gives admins a fast verification signal during review and a richer profile for students.

**Implementation:**
- New `components/ui/select.tsx` — Radix Select with shadcn styling (Trigger, Content, Item, Value, etc.). The old native wrapper moved to `components/ui/native-select.tsx` as `NativeSelect` / `NativeSelectOption`. Existing callers (waitlist, access codes form, schedule, matching) were updated with aliased imports so they keep working until they get migrated.
- New `components/ui/popover.tsx`, `command.tsx`, `combobox.tsx` (depend on `@radix-ui/react-popover` and `cmdk`). The `Combobox` is the searchable variant for huge lists.
- `lib/data/colleges.ts` — 1,014 US colleges from the unicover-data-scrape (filtered to schools with non-zero acceptance rate and application fee). Each entry has name + state.
- `lib/data/majors.ts` — 1,532 unique CIP-style majors aggregated from the same dataset, ordered by frequency descending so the most common ones surface first when the dropdown opens. Trailing `, General` suffix stripped.
- `Combobox` renders the first 200 options up-front and switches to full-list filtering as soon as the user types. Keeps initial open instant for the 1,500-major case.
- `mentor_profiles.linkedin_url` (text, nullable). `normalizeLinkedinUrl` helper accepts a full URL, a `linkedin.com/...` path, or just a username and rewrites to a canonical `https://www.linkedin.com/in/<handle>` form on save.
- Admin review row shows the LinkedIn link inline in the mentor header so reviewers can verify identity without expanding the card.

**Alternatives considered:**
- Hand-curated short list of 50-100 majors. Rejected: doesn't scale and forces "Other" as a free-text fallback, which is the exact thing we're trying to avoid.
- Using IPEDS API at runtime. Rejected: adds an external dependency and a network hop per pageview for data that doesn't change often. The static dataset gzips small.
- Async-loaded data file. Considered, deferred. The combined ~130 KB is fine for now and the onboarding page is auth-gated so SEO doesn't matter.

---

## 2026-05-03 — Mentor onboarding: shipped

**Decision:** Built the mentor onboarding flow as 5 in-product steps. Live behind `/mentor-signup` → `/mentor-onboarding`.

**Steps:**
1. Academic profile (school, year, grad year, major)
2. Public profile (photo upload, bio, specialty tags)
3. Identity & matching preferences (all optional)
4. Availability (timezone, time windows, capacity, commitment)
5. Safety acknowledgments (5 required checkboxes)

**Implementation notes:**
- Photo storage via Supabase Storage bucket `mentor-photos`. RLS scopes uploads to `${user_id}/...` paths so users can only write to their own folder. Public-read so the directory can serve photos.
- Time windows stored in `mentor_profiles.availability_schedule.time_windows` (jsonb). Fixed 6-window vocabulary so matching can do simple overlap checks later.
- Identity fields (gender / ethnicity / first-gen / mentee preferences) stored in `mentor_profiles.identity_json`. Loose schema for now since we're still figuring out what matters for matching.
- Safety acknowledgments stored as `safety_acks` jsonb with timestamps per ack. Will help with audit trail later if there's ever a dispute.
- Submission writes `status = 'pending'`, `submitted_at = now()`. Existing seeded mentors auto-flipped to `approved` so the directory keeps working.
- `/mentor` dashboard now branches on `status`: pending shows a review-in-progress card, rejected shows the admin's note (if provided), paused shows a contact-support card, approved shows the dashboard.
- `/admin/mentors` is now a real review queue with status tabs and approve/reject/pause/reactivate actions. Reject can include a free-text note that's visible to the mentor.

**What's missing (deferred):**
- Email notification to mentor on approval/rejection. The admin actions update the row but don't send an email yet.
- Self-serve edit profile after approval. Approved mentors can't currently change their bio / availability without admin help.
- Background check integration — for now we just collect consent.

---

## 2026-05-03 — Mentor onboarding: admin approval required before activation

**Decision:** New mentors land in `pending` status. Admin reviews in `/admin/mentors` and flips to `approved` (or `rejected`). Only `approved` mentors appear in the public directory and can be assigned to students.

**Why:** Safety. Mentors will be paired with high school minors. A human gate before activation catches obvious red flags (off-tone bios, suspicious emails, etc.) and is cheap.

**Implementation:**
- Add `status text` column to `mentor_profiles` with values `pending | approved | rejected | paused`. Default `pending`.
- Update `public_mentor_profiles` view to filter `status = 'approved'`.
- Build a review queue in `/admin/mentors` with approve / reject actions.
- Send a transactional email on approval with a "set up your availability" CTA.

**Alternatives considered:**
- Auto-active on signup. Rejected: too risky for V0 with no other safety screening.
- Auto-active but hidden from directory. Rejected: same end state as `pending`, just murkier semantics.

---

## 2026-05-03 — No .edu enforcement on mentor signup

**Decision:** Mentors can sign up with any email. The admin review step is the verification gate.

**Why:** Hard `.edu` enforcement excludes recent grads (lose `.edu` access after graduation), some international universities, and edge cases where mentors use a personal address. Admin review is already happening, so it carries the verification weight.

**Implementation:** Same email validation as student signup, no special domain rules.

**Alternatives considered:**
- Strict `.edu` regex. Rejected: false negatives on recent grads.
- `.edu` preferred but flag-for-review otherwise. Reasonable but adds branching in the form for marginal value once admin review exists.

---

## 2026-05-03 — Mentor incentive research stays out of onboarding

**Decision:** Dario's existing Google Form ("Mentor Incentive Feedback Survey") covers research questions about pay, tier systems, and reward preferences. None of that goes into in-product mentor onboarding.

**Why:** Onboarding should be the shortest path to a complete profile. The research data is full of low-quality answers ("N/A", "Not sure", ".") because the survey is too long. Putting it inline would 3x time-to-complete and tank conversion.

**Implementation:** Mentor onboarding only collects what's needed for the public profile, matching, and scheduling. Research surveys live externally (Dario's Google Form) or in a separate optional in-app survey post-first-session if we want the data later.

---

## 2026-05-03 — Real RLS policies for cross-user reads

**Decision:** Added three targeted SELECT policies on `public.users`:
1. Students can read their matched mentor's row.
2. Mentors can read their matched students' rows.
3. Both parties can read each other's rows on shared `session_bookings`.

**Why:** Default RLS only allowed `auth.uid() = id`, which broke joins like "show student their matched mentor's name" and "show session history with mentor names." Without these, every join silently returned null.

**Alternatives considered:**
- A view (`public_user_directory`) exposing only safe fields with RLS bypass. Cleaner long-term but requires changing every existing query that joins `users`. Defer until/unless RLS leaks.
- Open `users` SELECT to all `authenticated`. Too permissive — would expose admins, paused users, etc.

---

## 2026-05-03 — All authenticated layouts fetch user server-side

**Decision:** `(marketing)`, `(dashboard)`, `(mentor)`, and `(admin)` layouts are async server components that call `getCurrentUser()` and pass the user as a prop to client components like `Navbar` and `Sidebar`.

**Why:** Without this, the navbar flickered through a logged-out state on every navigation while the client-side `useCurrentUser` hook caught up. Bad UX, looked broken.

**Implementation:** `lib/supabase/get-user.ts` exports a server-only `getCurrentUser()` that pulls the auth user + their `public.users` row in one async call. Layouts await it and pass `initialUser` down. Client components hydrate with the right state from frame zero.

---

## 2026-05-03 — Database trigger creates `public.users` on signup, not the client

**Decision:** A `BEFORE INSERT ... SECURITY DEFINER` trigger on `auth.users` creates the matching `public.users` row automatically. The client never inserts into `public.users`.

**Why:** Self-signup hit `permission denied for table users` — the `anon` role didn't have INSERT on `public.users`, and granting it would open the door to malicious INSERTs from anonymous clients. The trigger runs with elevated privileges and is the safe path.

**Implementation:** `supabase/migrations/auto_create_public_user_on_signup.sql`. New `auth.users` row → trigger fires → `public.users` row created with role from metadata (defaults to `student`), `subscription_status = 'inactive'`, `onboarding_complete = false`.

**Alternatives considered:**
- Server action / edge function on signup. More code to maintain, slower, and the trigger is bulletproof.

---

## 2026-05-03 — Custom-built scheduling, no calendar vendor

**Decision:** We own session booking end to end. No Cal.com, no Calendly, no Astro Cal. Mentors connect their Google or Outlook calendar via OAuth so we can read busy times directly.

**Why:**
- Cal.com closed-sourced the features we needed.
- Astro Cal is paid and we'd be locked in.
- Owning scheduling lets us enforce time windows (per the PRD), validate against safety rules (no sessions after 9 PM), and avoid a third-party that could pull the rug.

**Trade-off:** More to build and maintain. Worth it for the control.

---

## 2026-05-03 — Public mentor profiles via a database view, not RLS-permitted reads

**Decision:** A `public_mentor_profiles` view aggregates the safe fields (display name initialized as `Firstname L.`, university, major, photo, tags, rating) and is `GRANT`ed SELECT to `anon, authenticated`. The base `mentor_profiles` table is only readable by authenticated users.

**Why:** Lets logged-out visitors browse the mentor directory at `/mentors` without exposing the full mentor record. Last-name initialization protects mentor privacy from random web traffic.

**Implementation:** `supabase/migrations/create_public_mentor_view.sql`.

---

## Template (copy this when adding a new entry)

```
## YYYY-MM-DD — Short decision title

**Decision:** What we decided.

**Why:** Why this option.

**Implementation:** How it shows up in code or schema.

**Alternatives considered:** What else we looked at and why we passed.
```
