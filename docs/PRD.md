# Pupil B2C Web App V0 - Product Requirements

**Owner:** Dario Anaya, Founder & CEO
**Tech Lead:** Elie Francois
**Last Updated:** May 3, 2026
**PRD Freeze:** May 6, 2026 (Wednesday)
**Target Launch:** May 15, 2026

---

## What Is Pupil

Pupil is a subscription-based college guidance platform. It connects high school students with real college mentors, people who actually attend or recently graduated from the schools those students are interested in.

The platform combines three things:
1. **Live mentorship** with real college students and grads
2. **MentorGPT**, an AI assistant for college guidance questions
3. **Structured planning tools** so sessions aren't just vibes, they're productive

The problem it solves: most families don't have access to quality college guidance. School counselors are stretched thin (400:1 ratio is common). Private consultants charge $5K-$25K. Generic advice online doesn't account for who you are or what matters to you.

Pupil fills that gap at $900/year.

### Brand Positioning

How we talk about Pupil externally vs. how we build it internally are different things, and that's deliberate.

**Externally:** Pupil is the largest network of identity-driven mentoring for college-bound students. The story is human connection, real college mentors, real conversations. Marketing copy, the website, and the pitch deck do not lead with AI.

**Internally:** AI is a moat, not the product. We use it for matching signals, pre-call icebreakers, post-call breakdowns, message moderation, and (later) MentorGPT. None of those features need to scream AI to the user.

The reasoning: tying the brand to AI ties our perception to AI sentiment, which is volatile. People are already souring on AI-branded products. Live or die by the value we provide, not by what OpenAI or Anthropic does next.

This shows up in real product decisions throughout this PRD, especially MentorGPT naming (section 11) and how features are surfaced to users.

---

## What V0 Needs to Do

The goal of V0 is simple: a student (or their parent) should be able to find Pupil, pay for it (or apply for free access), get set up, and book their first session with a mentor. No sales call required.

### The Core User Journey

1. Land on the website
2. Purchase a subscription, apply for free eligibility, or enter a school access code
3. Complete onboarding (tell us about yourself)
4. Get matched with a mentor
5. Book a session
6. Review icebreakers before the call
7. Have a video call with that mentor
8. Get a post-call breakdown with next steps
9. Message your mentor between sessions

### What Already Exists (Dario's Replit Build)

The current codebase covers the marketing site, Stripe checkout, onboarding forms, eligibility/pilot code flows, and a basic admin dashboard. It's built with React, Express, Drizzle ORM, and Postgres.

What still needs to be built:
- Mentor profiles and directory
- Matching system (manual for V0, admin assigns)
- Session scheduling (custom calendar sync)
- Video calls with transcription
- Pre-call icebreakers (AI-generated, grade-specific)
- Post-call breakdown (AI-generated next steps from transcript)
- In-app messaging with safety features
- Post-session ratings
- B2B access code flow (school portal)
- Analytics tracking

---

## Users

### Who Uses This

**Students (primary user)**
High school students, mainly juniors and seniors but open to freshmen and sophomores. They browse mentors, book sessions, message their mentor, and use MentorGPT.

**Parents (buyer)**
Parents purchase the subscription. The student account is the primary account. A parent links to it via invite and gets a scoped dashboard where they can manage billing, see usage stats, see the assigned mentor, and track goals. Parents cannot read messages or session transcripts. This keeps it simple while giving parents enough visibility to feel good about the purchase.

In V0 the parent dashboard UI won't be built yet, but the data model supports it from day one. When we're ready to add the parent view, no schema changes needed.

**Mentors**
College students and recent grads. They set their availability, take calls, message their mentees, and get rated after each session. They are unpaid volunteers in V0 (Dario is re-engaging his existing mentor pool).

**Admin (Dario and team)**
Manages the platform. Reviews eligibility applications, manually matches mentors to students, monitors safety flags, manages pilot codes, views analytics.

**School Admin (future)**
Principals or counselors at partner schools. They can see student activity from their school (not identity data, that stays private). This is a lighter-touch role for V0, mainly for the B2B pitch.

### Roles in the System

| Role | Can Do |
|------|--------|
| Student | Browse mentors, book sessions, video calls, message mentor, use MentorGPT, rate sessions |
| Parent | Manage subscription/billing, see usage stats, see assigned mentor, see goals. Cannot read messages or transcripts. |
| Mentor | Set availability, take calls, message mentees, view session agendas |
| Admin | Everything above plus: match students to mentors, review eligibility, manage pilot codes, view analytics, edit safety rules, flag/ban users |
| School Admin | View students from their school, see activity and match info (not identity data) |

---

## Features

### 1. Marketing Site & Checkout

**Already built.** Landing pages for parents and students. Pricing page with Stripe payment link. Waitlist for MentorGPT.

**Changes needed:**
- Swap pricing from $700 to $900/year
- Add mentor directory preview (show real mentors, build trust before purchase)
- Replace hardcoded Calendly links with actual in-app booking

### 2. Free Eligibility / Pilot Access

**Already built.** Students can apply for free access or redeem pilot codes from partner schools. Admin reviews and approves.

**Accepted documentation (only these three):**
- SNAP benefits
- Free/Reduced Lunch (FRPL)
- Common App fee waiver

No other state-specific programs (e.g. MediCal). Families will try to submit alternative proof. The line has to be firm here or it becomes unmanageable.

**Verification flow:** Student tells their school counselor. Counselor emails Pupil directly with confirmation that the student qualifies under one of the three accepted programs. This is more reliable than self-attestation or document uploads.

**Changes needed:**
- Add counselor email field to eligibility form
- Admin reviews counselor confirmations (not student-uploaded docs)
- Free users get 6-12 sessions/year instead of 24

### 3. Onboarding

**Already built (paid flow).** Collects grade, GPA, location, interests, career goals, college preferences, identity matching preferences, and consent.

**What this data is for:** Matching students to the right mentor. The identity matching fields (race, gender, first-gen status, etc.) are optional and stay private. They are never shown to school admins.

### 4. Mentor Profiles & Directory

**Needs to be built.**

Students should be able to browse mentors filtered by:
- School of interest
- Major
- Identity (optional)

Each mentor profile shows:
- Name, photo, university, major, graduation year
- Short bio
- Average rating
- Session count

If there's no mentor matching what a student wants, they can submit a request and Pupil will try to recruit one. From the conversation: "if there's someone from a school that you really want we'll go find them."

### 5. Matching

**Programmatic pre-filter, manual final assignment in V0.** This is the workflow:

1. Student completes onboarding → a match request is created in the matching queue.
2. The system pre-filters mentors by interests, school overlap, major overlap, available time windows, and current mentee load. It returns a ranked list.
3. Admin opens the matching queue, sees the student's profile, sees the pre-filtered ranked mentor list, and clicks Assign on the chosen mentor.
4. Both parties get a notification email with the match.

The system does the boring work (filtering, scoring, ranking). The admin makes the human call. This is the model V0 ships with. Fully automated assignment is V1+ once we have rating data to validate match quality.

Target: match within 24-48 hours of onboarding completion.

Match criteria (used in pre-filter scoring):
- School of interest overlap
- Major overlap
- Identity preferences (if specified by both parties)
- Time window overlap (the student's selected windows intersect at least one of the mentor's)

A mentor can have up to 5 active mentees (configurable from admin).

### 6. Scheduling

**Needs to be built.**

Two parts:

**Fixed time windows (not open schedules):**
Early on with a marketplace platform, letting everyone set arbitrary availability kills match rates. Instead, Pupil enforces specific time windows when sessions can happen. Think: "afternoons 3-6 PM" or "mornings 9-12 PM." During onboarding, both mentors and students pick which windows they're available for. This is how Exponent does it and they've run that model for years. More structure means more matches.

**Session booking (after match):**
Once matched, the student sees their mentor's real calendar availability within the allowed windows and picks a specific slot. During onboarding, mentors connect their Google or Outlook calendar to Pupil. The system reads their busy times directly from the calendar API, so students only see slots that are actually open. Timezone conversion and double-booking prevention are handled in-house. No scheduling vendor, we own this end to end.

Constraints from the safety rules:
- No sessions before 8 AM or after 9 PM
- Maximum sessions configurable per plan (24/year for paid, 6-12 for free)

### 7. Video Calls

**Needs to be built.**

After booking, a video room is created automatically. Both parties get a link. The call happens in-app using Daily.co (embedded video UI). The student joins from their dashboard, the mentor joins from theirs. Nobody leaves the platform. From the call: "anything that happens outside that platform, one we aren't liable for, but [it] can kill the whole company."

Why Daily.co specifically:
- Free tier covers 10,000 participant-minutes per month. At 30-min sessions with 2 participants that's about 165 sessions/month before we hit the paid tier. Plenty of headroom for V0 and early V1.
- Beyond 10K minutes the per-minute cost is negligible at our scale.
- Programmatic control of recording and transcription, which Google Meet and Zoom embedded options don't offer cleanly.

Key requirements:
- Two participants only (mentor + student)
- Automatic cloud recording
- Automatic transcription (non-negotiable, needed for safety audits AND to feed the post-call breakdown pipeline)
- Auto-end when the room expires
- No screen sharing (keep it focused on conversation)
- 30-minute default session length

After each call ends, both parties are prompted to rate the session.

### 8. Pre-Call Icebreakers

**Needs to be built.**

Before every session, both the student and mentor receive a set of AI-generated icebreakers. The content changes based on the student's grade level. A freshman getting matched for the first time needs very different conversation starters than a senior deep into application season.

For V0: the icebreakers are available as a page/card the student and mentor can view before the call. They open it in a separate tab or see it on their dashboard alongside the "Join Session" button. Simple, low-lift.

For V1: this lives inside the call interface itself, visible during the session.

Generation is straightforward. Take the student's grade, their interests, their goals, and the session number (first meeting vs. fifth meeting) and prompt an LLM to produce 3-5 conversation starters. Run it when the booking is confirmed so it's ready before the call.

### 9. Post-Call Breakdown

**Needs to be built.**

After every call, Pupil processes the transcript through an AI pipeline and generates a breakdown: key topics discussed, deliverables, and suggested next steps. This is the "after combo tool."

For V0: atomic per call. Each breakdown only looks at that session's transcript, not the full history. Processing takes under 5 minutes. After the call ends, the student and mentor see a spinner on their dashboard ("Processing your session breakdown...") and the breakdown appears when it's ready.

For V1: the breakdown builds on all previous sessions. Full context of how the mentorship is progressing, what's been covered, what hasn't. That requires storing and chaining summaries across sessions.

The breakdown content should include:
- Topics covered (bullet points)
- Action items for the student (what to do before the next session)
- Suggested focus for the next session
- Any colleges, majors, or deadlines mentioned

This is one of the "structured planning tools" referenced in the product description. It turns a 30-minute conversation into something concrete the student can act on.

### 10. In-App Messaging

**Needs to be built.**

Once matched, a mentor-student pair gets a private conversation. Real-time messaging powered by Supabase Realtime with a pre-built chat UI (chatcn, shadcn-based components).

#### Two-pass moderation pipeline

Every message goes through this before it's delivered:

1. **Regex pass (free, fast).** Pattern-match against phone numbers, email addresses, and social media handles (`@username`, common platforms). Most messages don't trip a rule, so this is the cheap filter.
2. **AI confirmation pass (only if regex flags).** If regex hits, the message is sent to an LLM to confirm it actually contains contact info (vs. a false positive like "@me" or a phone number quoted as part of an example). Only flagged messages pay tokens.

This split is intentional cost control. Running every message through an LLM would burn budget. Running every message through regex is free. The AI only gates the messages that already look suspicious.

#### Trust-based admin review evolution

How flagged messages are handled changes over time:

- **Phase 1 (launch):** Confirmed flags route to an admin review queue. Dario sees them, decides whether to block, redact, or release. This builds trust in the pipeline and surfaces edge cases.
- **Phase 2 (post-launch):** Once the pipeline has a track record Dario trusts, double-flagged messages (regex + AI) are auto-blocked and the user sees: "Your message was modified because it contained contact information." Admin still has audit access.

The user always sees a clear warning when their message is modified. Full message history is stored and auditable.

This keeps everyone on the platform. From the call: "anything that happens outside that platform, one we aren't liable for, but [it] can kill the whole company."

### 11. MentorGPT (Post-V0)

**Deprioritized for V0 launch.** Shipping May 15th without it.

The reasoning: we want real transcript data from actual mentor-student calls before we train this. Once we see what students are asking about, what topics come up, and what kind of guidance matters most, we can build MentorGPT to be actually useful instead of generic.

**Naming:** likely being renamed. "MentorGPT" ties the brand to a dated GPT concept (OpenAI itself has moved away from "GPTs" as a product framing). Candidates discussed:

- **Big Sib** — captures "big sibling at any college, scaled." Rejected: abbreviation is BS.
- **Pupil AI** — clear, on-brand, but explicitly AI-labeled.
- Something abstract — leaning here. Doesn't scream "AI" to users. Aligns with the brand positioning above (we're a mentoring network, not an AI product).

Final naming decision pending. Whatever name lands, the principle holds: internally it's AI-powered, externally it's just a helpful tool.

**When it ships:**
An AI chat assistant available to all subscribers. Uses context from the student's profile (grade, interests, colleges, goals) plus insights from their session transcripts.

Capabilities:
- College fit questions
- Major exploration
- Career guidance
- General college application advice

Guardrails:
- System prompt restricts it to college guidance topics only
- No financial advice, no medical advice, no legal advice
- Clear disclaimer that it's AI, not a real mentor

Future versions will train on Pupil's own data (mentor survey responses, call transcripts, student sentiment).

### 12. Post-Session Ratings

**Needs to be built.**

After every video call, both parties rate each other. Like Uber.

Rating flow:
- 1-5 star rating
- If 3+ stars: optional positive tags (helpful, knowledgeable, encouraging, good listener, well prepared)
- If 3 or fewer stars: optional negative tags (unprepared, late, distracted, rushed)
- If 2 or fewer stars: required written feedback
- Always available: "Report a safety concern" (free text, auto-creates admin flag)

Mentors with consistently low ratings (below 3.0 over 5+ sessions) get flagged for admin review. They may be warned, paused, or removed from the platform.

Students can also be rated by mentors. From the conversation: "there might be some big head kids right or some rude kids."

**Open question: require rating before next booking?**
Exponent does this. It's a friction point, but the data is valuable. The concern: Exponent offers a free tier where gating makes sense. Pupil is $900/year. Blocking a paying customer from their next session because they didn't rate feels wrong. Two options:
1. Require it (maximizes data collection, Exponent has proven it works)
2. Prompt heavily but don't block (pop the rating modal on dashboard, show a banner, but let them book regardless)

Decision pending.

### 13. Admin Dashboard

**Partially built.** Existing admin panel handles user lists, eligibility review, and pilot codes.

The admin dashboard is built around the operational tasks Dario will be doing daily, not analytics. Analytics live in PostHog, the admin dashboard is for action.

#### Day-in-the-life of admin

A typical Dario session in the dashboard:

1. **Matching queue first.** Open the queue, see new students from the last 24h, pick a mentor from the pre-filtered ranked list, click Assign. Goal: get every new student matched within 24-48 hours.
2. **Safety flags.** Review any messages that hit the two-pass filter (Phase 1) and decide whether to block, redact, or release. Review any "report a safety concern" reports from session ratings.
3. **Mentor management.** Spot-check low-rated mentors. View ratings, session counts, current mentee load, and availability. Pause or remove mentors with consistent quality issues.
4. **Eligibility review.** Process counselor emails confirming free-access eligibility. Approve, deny, or request more info.
5. **B2B code generation (as needed).** When a new school deal closes, generate a batch of access codes with the right session cap and expiration.

#### Sections to build

- **Matching queue:** student profile + pre-filtered ranked mentor list + Assign action. Track time-to-match.
- **Mentor management:** list view with ratings, session counts, active mentee count, last active. Filter by low-rated. Detail view to pause/remove.
- **Safety flags queue:** flagged messages and safety concern reports. Block/redact/release actions. Audit log.
- **Safety rules editor:** configure session hours, max mentees per mentor, contact filter on/off, low-rating threshold.
- **B2B code generation:** create batches with school name, count, session cap, expiration date. Track redemption.
- **Eligibility review queue:** counselor email confirmations. Approve/deny.

Analytics live entirely in PostHog. No analytics tab in the admin dashboard.

### 14. B2B Access Code Flow

**Needs to be built.** Confirmed for V0. Already working with a large nonprofit.

When Pupil closes a deal with a school or organization:
1. School pays via invoice (offline, not through the app)
2. Admin generates a batch of access codes in the admin dashboard
3. School distributes codes to their students
4. Student goes to Pupil, creates an account, enters the code
5. Code is validated, student gets automatic platform access (no eligibility review needed)

This reuses the existing pilot code system but makes it a proper B2B flow. The admin dashboard needs a code generation tool: specify school name, number of codes, session cap per code, and expiration date.

Schools with portals will eventually want a dashboard showing aggregate student activity (not identity data, not messages, not transcripts). That's V1.

### 15. Analytics

**Needs to be built.**

All analytics live in PostHog. No analytics dashboard in the admin panel. If Dario wants to see funnels, user behavior, or conversion data, he goes to PostHog. This avoids building duplicate analytics UI and keeps the admin dashboard focused on operational tasks (matching, flags, codes).

Why PostHog specifically:
- Free tier covers ~1M events/month, which we won't approach in V0 or early V1. Cost is effectively zero for the foreseeable future.
- Best-in-class developer experience for startups. Funnels, retention, session replay, and feature flags in one tool.
- We can revisit Mixpanel (more enterprise-leaning) if/when we outgrow PostHog. Not on the roadmap.

#### Funnel philosophy

Don't build every possible funnel from day one. Easy to imagine 30 funnels, hard to know which actually inform decisions until users start showing up. Start with two and add more once we have learnings.

Track these events using PostHog:
- Page visits (landing, pricing, checkout)
- Checkout clicks and completions
- Onboarding starts and completions
- Eligibility submissions
- Match requests created
- Sessions booked, completed, cancelled, no-showed
- Messages sent
- MentorGPT conversations
- Ratings submitted

Key funnels:
- Landing > Checkout > Purchase > Onboarding > First Booking
- Match Request > Match Assigned > First Session > Repeat Session

---

## Pricing

### Paid Plan: $900/year ("Early Access")

Includes:
- Mentor matching
- Up to 24 mentorship sessions per year (2/month)
- In-app messaging with your mentor
- MentorGPT access
- Session recordings and transcripts
- 90-day no-questions-asked refund

### Free Access (Eligibility or Pilot)

For students who qualify via FRPL, SNAP, or Common App fee waiver. Also available through school pilot codes.

Includes:
- Same features as paid
- 6-12 sessions per year (configurable per code/approval)
- Documentation required for eligibility review

---

## Safety

This is a platform where adults interact with minors. Safety is foundational, not an afterthought.

### Rules (all configurable from admin)

| Rule | Default | Why |
|------|---------|-----|
| Session hours | 8 AM - 9 PM | No late night calls with minors |
| Max mentees per mentor | 5 | Quality over quantity |
| Contact info filter | On, auto-redact | Keep all communication on platform |
| Low rating auto-flag | Below 3.0 after 5 sessions | Surface quality issues early |

### What's Auditable
- Every message (stored, searchable)
- Every video call (recorded with transcript)
- Every rating and flag
- Admin actions (who approved/denied what)

### Content Moderation
- Automated: regex-based detection of phone numbers, emails, social media handles
- Manual: admin reviews flagged content from a queue
- Users see a clear warning when their message is modified

---

## What Ships by Mid-May vs What Comes Later

### Must Ship (V0) - May 15, 2026

- Paid checkout flow (exists, needs updates)
- Free eligibility flow (exists, needs counselor verification updates)
- B2B access code flow (school/nonprofit code distribution)
- Onboarding system (exists, needs updates)
- Mentor profiles and directory
- Manual matching (admin dashboard)
- Session scheduling with fixed time windows (custom, Google/Outlook calendar sync)
- Video calls with transcription (Daily.co)
- Pre-call icebreakers (AI-generated, grade-specific)
- Post-call breakdown (AI-generated next steps from transcript)
- In-app messaging with moderation (Supabase Realtime + chatcn)
- Post-session ratings
- Admin dashboard updates (matching queue, safety flags, rules editor, code generation)
- PostHog analytics

### Post-Launch (V1+)

- MentorGPT (deprioritized, needs real transcript data first)
- Automated mentor matching (AI suggestions)
- Parent dashboard UI (schema ships in V0, UI built in V1)
- School admin portal with full analytics
- Evidence-based MentorGPT (trained on Pupil's own data)
- In-call icebreakers (live during session, not just pre-call)
- Cross-session post-call breakdowns (builds on full conversation history)
- Advanced analytics dashboards for schools
- Mentor payout system (if mentors become paid)
- Push notifications / email digests
- Mobile optimization (PWA or Expo)

---

## Non-Functional Requirements

- Page load under 3 seconds
- MentorGPT response under 10 seconds
- Video call connection under 5 seconds
- Messages delivered in under 1 second
- 99.9% uptime target
- All secrets stored as environment variables
- Separate development and production environments
- Sensitive data never exposed in frontend error messages
- HTTPS everywhere
- Session-based auth with secure cookies

---

## Open Questions for Dario

**Mentor compensation:** Are mentors ever paid? If so, when and how? (Affects whether we need Stripe Connect.) V0: unpaid volunteers. Dario is re-engaging his existing mentor pool over summer 2026.

**Mentor onboarding:** What's the mentor sign-up flow? Do they apply, get vetted, then get access? Or is Dario manually adding them?

**Rating gate:** Require rating before next booking (Exponent model) or just prompt heavily? See section 12 for the tradeoff.

**MentorGPT naming:** Rename before V1 launch. Current frontrunners TBD. Avoid tying brand to AI.

### Answered (from April 30 + May 3 calls)

**School admin scope:** B2B access code flow ships in V0 (code gen + student redemption). School admin dashboard with analytics is V1.

**Session structure:** The "structured planning tools" are two features: pre-call icebreakers (AI-generated, grade-specific) and post-call breakdowns (AI-generated from transcript). Both ship in V0. Grade-specific templates and session objectives are handled by the icebreaker generator, not static PDFs.

**Free eligibility verification:** Counselor email route. Student tells counselor, counselor emails Pupil with proof. Only SNAP, FRPL, and Common App fee waiver accepted. No other state programs. Friction is intentional and acceptable, the alternative is families coming out of the woodworks with state-specific eligibility programs we can't reasonably verify.

**Session duration:** 30 minutes.

**LLM for AI features:** Leaning toward Claude (Sonnet 4) for robustness + pricing. Not exclusively OpenAI. Single model for V0, not a gateway/round-robin.

**Scheduling vendor:** None. Custom-built. Cal.com closed the source on the features we needed. Astro Cal is paid. We own scheduling end to end.

**Video vendor:** Daily.co. 10K free participant-minutes/month covers V0 with headroom.

**Mentor compensation in V0:** Unpaid volunteers. Dario re-engages his existing mentor pool over summer 2026. Stripe Connect not needed for V0.

**Messaging moderation:** Two-pass pipeline (regex → AI confirmation). Phase 1 admin reviews flags, Phase 2 auto-blocks once trusted.

**Brand positioning:** External story is "identity-driven mentoring network." AI is internal moat. Don't tie brand to AI sentiment.

---

## Decisions Log

A running log of what got decided when, so we don't relitigate.

This log covers product / strategy decisions (what we build, who it's for, business rules). For engineering decisions (schema, library choices, RLS patterns) see `docs/DECISIONS.md`.


| Date | Decision | Source |
|------|----------|--------|
| Apr 30 | $900/year early access pricing, no monthly tier | call |
| Apr 30 | 30-minute session length | call |
| Apr 30 | Counselor email for free-access eligibility (not student doc upload) | call |
| Apr 30 | Only SNAP, FRPL, and Common App fee waiver qualify for free | call |
| Apr 30 | B2B access code flow ships in V0, school portal is V1 | call |
| Apr 30 | Claude Sonnet 4 as primary LLM | call |
| Apr 30 | Pre-call icebreakers + post-call breakdowns ship in V0 | call |
| Apr 30 | Atomic post-call breakdowns in V0, cross-session in V1 | call |
| May 3 | MentorGPT deprioritized, ship V0 without it | call |
| May 3 | Custom scheduling, no Cal.com, no Astro Cal | call |
| May 3 | Daily.co for video, in-app, never leave platform | call |
| May 3 | Two-pass messaging moderation (regex → AI), phased trust | call |
| May 3 | Programmatic match pre-filter, admin makes final call | call |
| May 3 | Brand external as identity-driven mentoring, internal AI as moat | call |
| May 3 | Mentors unpaid in V0, Dario re-engages existing pool | call |
| May 3 | Time-window-based scheduling (not free-form availability) | call |
| May 3 | All analytics in PostHog, none in admin dashboard | call |
| May 3 | PRD freeze target: Wed May 6, MVP target: May 15 | call |
| May 3 | Mentor signups require admin approval before going live in directory | workshop |
| May 3 | No `.edu` enforcement on mentor email; admin review verifies | workshop |
| May 3 | Incentive research stays out of mentor onboarding (Dario's Google Form covers it) | workshop |
