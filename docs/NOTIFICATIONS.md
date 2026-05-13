# Notifications

Every notification trigger point in Pupil. Source of truth when wiring email
(Resend), in-app notifications, or future SMS/push.

For each trigger we capture:

- **Trigger**: what event in the system fires this.
- **Audience**: who receives it.
- **Channel**: email, in-app banner, SMS, etc.
- **Frequency cap**: rate-limiting / dedup notes.
- **Status**: `built` | `partial` | `not_built`.

---

## Auth

| Trigger                       | Audience    | Channel | Status |
| ----------------------------- | ----------- | ------- | ------ |
| New signup confirmation email | New user    | Email   | built (Supabase default) |
| Password reset request        | User        | Email   | built (Supabase default) |
| Email change confirmation     | User        | Email   | built (Supabase default) |

Notes: these are handled by Supabase Auth out of the box. Templates may need
custom branding before launch.

---

## Mentor lifecycle

| Trigger                              | Audience       | Channel | Status      |
| ------------------------------------ | -------------- | ------- | ----------- |
| Mentor application submitted         | Mentor         | Email   | not_built   |
| Mentor approved                      | Mentor         | Email   | not_built   |
| Mentor rejected                      | Mentor         | Email   | not_built   |
| Mentor paused by admin               | Mentor         | Email   | not_built   |
| Mentor reactivated                   | Mentor         | Email   | not_built   |
| Mentor hasn't set availability after N days | Mentor   | Email   | not_built   |
| New mentor application to review     | Admin          | Email   | not_built   |

---

## Matching

| Trigger                       | Audience           | Channel | Status      |
| ----------------------------- | ------------------ | ------- | ----------- |
| Student matched with mentor   | Student            | Email   | not_built   |
| Student matched with mentor   | Mentor (the match) | Email   | not_built   |
| Match unassigned by admin     | Student            | Email   | not_built   |
| Match unassigned by admin     | Mentor             | Email   | not_built   |
| Student waiting for match >48h | Student           | Email   | not_built   |
| Student waiting for match >48h | Admin (digest)    | Email   | not_built   |

---

## Booking

| Trigger                                            | Audience          | Channel    | Status      |
| -------------------------------------------------- | ----------------- | ---------- | ----------- |
| Session booked                                     | Student           | Email + ICS | built     |
| Session booked                                     | Mentor            | Email + ICS | not_built (the gap we keep flagging) |
| Session reminder 24h out                           | Student + Mentor  | Email      | not_built   |
| Session reminder 1h out                            | Student + Mentor  | Email      | not_built   |
| Session about to start (5 min)                     | Student + Mentor  | In-app     | not_built   |
| Session cancelled (>24h, credit refunded)          | Other party       | Email      | not_built   |
| Session cancelled (<24h, credit consumed)          | Other party       | Email      | not_built   |
| No-show: counterparty didn't join within 10 min    | Other party       | Email + in-app | not_built |

---

## Sessions / post-session

| Trigger                              | Audience          | Channel | Status      |
| ------------------------------------ | ----------------- | ------- | ----------- |
| Pre-session prep (icebreakers ready) | Both              | Email   | not_built   |
| Post-session debrief (recap)         | Both              | Email   | not_built   |
| Rate-your-mentor reminder            | Student           | Email   | not_built   |
| Mentor low-rating warning            | Mentor + admin    | Email   | not_built   |

---

## Safety

| Trigger                              | Audience          | Channel | Status      |
| ------------------------------------ | ----------------- | ------- | ----------- |
| Session flagged                      | Admin             | Email + in-app | not_built |
| Flag escalated (after admin review)  | Parent / school   | Email   | not_built   |
| Match ended (safety reason)          | Student           | Email   | not_built   |
| Contact info detected in messaging   | Admin             | Email + in-app | not_built |

---

## Billing (Stripe)

| Trigger                              | Audience          | Channel | Status      |
| ------------------------------------ | ----------------- | ------- | ----------- |
| Payment succeeded                    | User              | Email (Stripe receipt) | not_built |
| Payment failed                       | User              | Email                   | not_built |
| Subscription about to renew (T-7d)   | User              | Email                   | not_built |
| Subscription cancelled               | User              | Email                   | not_built |
| Plan changed                         | User              | Email                   | not_built |
| Refund issued                        | User              | Email                   | not_built |

---

## Parent / digest (PRD-mandated)

| Trigger                              | Audience          | Channel | Status      |
| ------------------------------------ | ----------------- | ------- | ----------- |
| Weekly summary (sessions held, mentor name, durations) | Parent | Email | not_built |
| Match update (you've been paired with X) | Parent       | Email   | not_built   |

Notes: per PRD, parents see metadata (when, who, how long) but never message
content or transcripts.

---

## Engagement / lifecycle

| Trigger                                  | Audience    | Channel | Status      |
| ---------------------------------------- | ----------- | ------- | ----------- |
| Onboarding incomplete after 24h          | Student     | Email   | not_built   |
| Free user hasn't upgraded after 14 days  | Student     | Email   | not_built   |
| Mentor hasn't logged in >14 days         | Mentor      | Email   | not_built   |
| Student credit pool below 3              | Student     | Email   | not_built   |
| End of subscription year recap           | Student + parent | Email | not_built  |

---

## Implementation conventions

- All Resend sends go through a single `lib/email/send.ts` wrapper so we can
  add rate-limiting, dedup, and audit logging in one place.
- Each notification has its own template under `src/emails/` (React Email).
- Frequency caps live in the notification record (e.g. only one
  "credit-low" email per week per user). Implement via a `notification_log`
  table once we have more than the booking confirmation built.
- Every email has a one-click unsubscribe link for non-transactional
  notifications. Transactional (booking, cancel, safety) cannot be
  unsubscribed.
- Emails use the same brand as marketing site (purple primary, Newsreader
  for headers).
- ICS attachments use organizer = `bookings@getpupil.com` (or whatever the
  Resend-verified sender is).

---

## Status legend

- **built**: shipped, in active use.
- **partial**: implementation exists but is incomplete (template missing,
  trigger not wired, etc).
- **not_built**: nothing in code yet.
