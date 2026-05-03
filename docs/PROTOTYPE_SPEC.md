# Pupil V0 - Prototype Specification

**For use with:** Claude Design / Figma / any prototyping tool
**Brand Color:** `#7A60E4` (purple)
**Secondary:** `#1A1A2E` (near-black for text/dark elements)
**Logo:** Purple "P" lollipop mark + "pupil" wordmark in dark gray
**Font:** Inter (or system sans-serif stack)
**Style:** Clean, modern, minimal. Rounded corners. Generous whitespace. No clutter. This is a product parents pay $900 for, it needs to feel premium but approachable.

---

## Design System Tokens

### Colors
| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#7A60E4` | Buttons, links, active states, accent |
| Primary Hover | `#6B4FD1` | Button hover, link hover |
| Primary Light | `#EDE8FB` | Backgrounds, badges, selected states |
| Text Primary | `#1A1A2E` | Headings, body text |
| Text Secondary | `#6B7280` | Muted text, labels, timestamps |
| Background | `#FFFFFF` | Page background |
| Surface | `#F9FAFB` | Cards, panels, sidebar |
| Border | `#E5E7EB` | Dividers, card borders |
| Success | `#10B981` | Confirmed, completed, online |
| Warning | `#F59E0B` | Pending, attention needed |
| Danger | `#EF4444` | Errors, flags, critical |

### Spacing
- 4px base unit
- Component padding: 16px (compact), 24px (standard), 32px (spacious)
- Card border radius: 12px
- Button border radius: 8px
- Page max-width: 1280px (marketing), 1440px (dashboard)

### Typography
| Element | Size | Weight |
|---------|------|--------|
| H1 (page title) | 36px | 700 |
| H2 (section) | 24px | 600 |
| H3 (card title) | 18px | 600 |
| Body | 16px | 400 |
| Small / Label | 14px | 500 |
| Caption | 12px | 400 |

---

## Screen Inventory

### Public Screens (Pre-Auth)

#### 1. Landing Page (`/`)
**Purpose:** Convert parents and students to checkout.

**Layout:**
- Navigation bar: logo (left), links [How It Works, Mentors, Pricing, FAQ] (center), [Login, Get Started] buttons (right)
- Hero section:
  - Headline: "Real mentors. Real guidance. Real results."
  - Subheadline: "Pupil connects your student with a college mentor who's been exactly where they want to go."
  - CTA button: "Get Started - $900/year" (primary purple)
  - Secondary link: "Apply for free access"
  - Trust badge row: "Used by [X] students | [X] universities represented | 30-min 1-on-1 video sessions"
- How It Works section (3 steps with icons):
  1. "Tell us about your student" (onboarding icon)
  2. "We match them with a mentor" (match icon)
  3. "They meet, talk, and grow" (video call icon)
- Mentor preview section: 3-4 mentor cards in a horizontal scroll
  - Photo (circle), name, university, major, rating stars
  - "Browse All Mentors" link
- Pricing section: single card with plan details
- FAQ accordion
- Footer: logo, links, social, copyright

#### 2. Pricing Page (`/pricing`)
**Purpose:** Detail the plan and convert.

**Layout:**
- Single plan card (centered, elevated shadow):
  - Plan name: "Early Access"
  - Price: "$900/year"
  - Feature list with checkmarks:
    - Mentor matching
    - Up to 24 sessions/year (2/month)
    - In-app messaging
    - Session recordings and transcripts
    - Pre-call icebreakers
    - Post-call breakdowns with next steps
    - 90-day refund guarantee
  - CTA: "Subscribe Now" (links to Stripe Checkout)
- Below: "Need free access?" link to eligibility form
- Below: "School or organization?" link to contact/B2B info

#### 3. Login Page (`/login`)
**Layout:**
- Centered card (480px max-width)
- Logo at top
- Email input
- Password input
- "Log In" button (primary)
- "Forgot password?" link
- Divider: "or"
- "Sign in with Google" button (outlined)
- "Don't have an account? Get Started" link

#### 4. Free Eligibility Application (`/apply`)
**Layout:**
- Form card:
  - Student name
  - Parent/guardian name
  - Email
  - Grade (dropdown: 9, 10, 11, 12)
  - School name
  - Eligibility type (radio): SNAP / Free/Reduced Lunch / Common App Fee Waiver
  - School counselor email (required, for verification)
  - "Your counselor will receive an email asking them to confirm your eligibility."
  - Submit button
- Sidebar or below: explanation of what qualifies, what happens next

#### 5. Access Code Redemption (`/redeem`)
**Layout:**
- Centered card
- "Enter Your Access Code"
- Code input (large, monospace, uppercase)
- "Redeem" button
- "This code was provided by your school or organization"
- Error state: "Invalid or expired code"
- Success state: redirects to onboarding

---

### Onboarding Flow (Post-Auth, Pre-Match)

#### 6. Onboarding Step 1: About You (`/onboarding/profile`)
**Layout:** Multi-step wizard with progress bar at top (step 1 of 4)
- Grade level (dropdown)
- GPA range (optional, dropdown)
- Location (city/state)
- "Next" button

#### 7. Onboarding Step 2: Interests (`/onboarding/interests`)
**Progress:** Step 2 of 4
- Colleges interested in (multi-select tags or search+add)
- Majors interested in (multi-select tags)
- Career interests (multi-select tags)
- "Next" button

#### 8. Onboarding Step 3: Preferences (`/onboarding/preferences`)
**Progress:** Step 3 of 4
- Identity matching preferences (all optional, clearly labeled as private):
  - Race/ethnicity
  - Gender
  - First-generation student
  - "These are used to match you with a mentor who shares your background. They are never shared with schools."
- "Next" button

#### 9. Onboarding Step 4: Availability (`/onboarding/availability`)
**Progress:** Step 4 of 4
- "When are you usually free for sessions?"
- Grid: days of week (Mon-Sun) x time blocks (Morning 9-12, Afternoon 12-5, Evening 5-9)
- Toggle cells on/off
- Consent checkbox: "I agree to Pupil's terms of service and community guidelines"
- "Complete Setup" button

#### 10. Onboarding Complete (`/onboarding/complete`)
- Success illustration/icon
- "You're all set!"
- "We'll match you with a mentor within 24-48 hours."
- "In the meantime, browse our mentor directory."
- "Go to Dashboard" button

---

### Student Dashboard

#### 11. Dashboard Home (`/dashboard`)
**Layout:** Sidebar navigation (left) + main content (right)

**Sidebar:**
- Logo (top)
- Navigation items:
  - Dashboard (home icon)
  - My Mentor (person icon)
  - Book Session (calendar icon)
  - Messages (chat icon, unread badge)
  - Session History (list icon)
  - Settings (gear icon)
- User avatar + name at bottom

**Main Content (matched state):**
- Welcome header: "Hey [Name]"
- Mentor card (prominent):
  - Mentor photo, name, university, major
  - Rating stars
  - "Book a Session" button (primary)
  - "Message" button (outlined)
- Upcoming session card (if booked):
  - Date, time, countdown ("in 2 days")
  - "View Icebreakers" button
  - "Join Session" button (enabled 5 min before, primary purple)
  - "Cancel" link
- Recent breakdown card (if exists):
  - Last session date
  - 2-3 bullet points from action items
  - "View Full Breakdown" link
- Sessions remaining: "18 of 24 sessions remaining this year"

**Main Content (unmatched state):**
- "We're finding you a mentor" status card with subtle animation
- "Expected match within 24-48 hours"
- "Browse mentors" link

#### 12. Mentor Profile View (`/dashboard/mentor`)
- Large mentor photo
- Name, university, major, grad year
- Bio paragraph
- Stats row: avg rating, total sessions, active mentees
- "Book a Session" CTA
- "Message" CTA

#### 13. Booking Page (`/dashboard/book`)
**Layout:**
- Week view calendar showing available slots
- Week navigation (prev/next arrows, date range label)
- Available slots shown as clickable purple blocks
- Unavailable time grayed out
- Selected slot highlights with darker purple
- Confirm modal:
  - "Confirm your session"
  - Date, time, duration (30 min)
  - Mentor name
  - "Confirm Booking" button
  - "Cancel" link

#### 14. Pre-Call View (`/dashboard/session/[id]`)
**Purpose:** Landing page before joining a call

**Layout:**
- Session header: date, time, mentor name
- Icebreakers card:
  - "Conversation Starters"
  - 3-5 icebreaker questions in a numbered list
  - Subtle purple left border on the card
- "Join Session" button (large, centered, primary)
  - Enabled 5 min before start time
  - Before that: "Session starts in [countdown]"
- Tips card (collapsible):
  - "Find a quiet place"
  - "Check your camera and mic"
  - "Have questions ready"

#### 15. Video Call Room (`/session/[id]`)
**Layout:** Full-screen video embed (Daily.co Prebuilt)
- Daily handles the UI: video feeds, mute, camera toggle, end call
- Pupil branding: small logo in corner
- No screen share button (disabled in Daily config)
- On call end: redirect to dashboard with breakdown spinner

#### 16. Post-Call Breakdown View (`/dashboard/session/[id]/breakdown`)
**Layout:**
- Session header: date, mentor name, duration
- Processing state: spinner + "Processing your session breakdown..."
- Completed state:
  - **Topics Covered** section: bullet list
  - **Your Action Items** section: checklist-style items
  - **Next Session Focus** section: suggested topic paragraph
  - **Mentioned** section: tags for colleges, majors, deadlines that came up
- "Rate This Session" button (if not yet rated)
- "Back to Dashboard" link

#### 17. Messages (`/dashboard/messages`)
**Layout:** Classic chat interface (chatcn components)
- Left panel: conversation list (V0: just one conversation with mentor)
  - Mentor name, avatar, last message preview, timestamp
  - Unread indicator (purple dot)
- Right panel: active conversation
  - Header: mentor name, avatar, "Online" or "Last seen..."
  - Message bubbles:
    - Student messages: right-aligned, purple background, white text
    - Mentor messages: left-aligned, gray background, dark text
    - System messages: centered, smaller, muted (e.g. "Your message was modified because it contained contact information")
  - Message input bar at bottom:
    - Text input
    - Send button (purple)
  - Flagged message state: warning banner at top of modified message

#### 18. Session History (`/dashboard/history`)
**Layout:**
- List of past sessions, newest first
- Each row:
  - Date, time, duration
  - Mentor name
  - Status badge (completed, cancelled, no-show)
  - Rating given (stars)
  - "View Breakdown" link
  - "View Transcript" link (if available)

#### 19. Rating Modal (overlay)
**Trigger:** After session, on next dashboard visit

**Layout:**
- Modal overlay (centered card, 480px)
- "How was your session with [Mentor Name]?"
- 5 star rating (clickable stars, large)
- If 3+ stars: optional positive tag chips (helpful, knowledgeable, encouraging, good listener, well prepared)
- If ≤3 stars: optional negative tag chips (unprepared, late, distracted, rushed)
- If ≤2 stars: required text area "Tell us what happened"
- Always: "Report a safety concern" expandable section with text area
- "Submit Rating" button

---

### Mentor Dashboard

#### 20. Mentor Dashboard Home (`/mentor/dashboard`)
**Sidebar:** same pattern as student but with mentor-specific items:
- Dashboard
- My Mentees
- Schedule
- Messages
- Session History
- Settings

**Main Content:**
- Stats row: active mentees, total sessions, avg rating
- Upcoming sessions list (cards):
  - Student name, date/time, "View Icebreakers" link
  - "Join Session" button
- Pending ratings: count of sessions needing rating

#### 21. Mentor Schedule / Availability (`/mentor/schedule`)
**Layout:**
- Calendar connection card:
  - "Connect Your Calendar" button (if not connected)
  - Connected state: "Google Calendar connected (john@gmail.com)" with disconnect link
  - Or: "Outlook connected" with disconnect link
- Availability editor:
  - Same grid as onboarding: days x time blocks
  - Toggle cells on/off
  - Buffer time setting: "Minutes between sessions" (dropdown: 10, 15, 30)
  - Timezone selector
  - "Save Changes" button
- Upcoming bookings list below

#### 22. Mentor Mentee List (`/mentor/mentees`)
**Layout:**
- Card grid of active mentees:
  - Student name (first name only), grade, school
  - Interests tags
  - Sessions completed together
  - Last session date
  - "Message" button
  - "View History" link

---

### Admin Dashboard

#### 23. Admin Home (`/admin`)
**Sidebar:**
- Dashboard
- Matching Queue
- Mentors
- Students
- Safety Flags
- Safety Rules
- Access Codes
- Eligibility Review

**Main Content:**
- Stats cards row:
  - Pending matches (count, yellow)
  - Active flags (count, red)
  - Total students (count)
  - Total mentors (count)
- Recent activity feed

#### 24. Matching Queue (`/admin/matching`)
**Layout:**
- List of pending match requests
- Each row expandable:
  - Student info: name, grade, interests, colleges, identity preferences
  - Availability overlap visualization
  - Suggested mentors list:
    - Ranked by match score (overlap in school, major, identity, schedule)
    - Each mentor shows: name, university, major, current mentee count, rating
    - "Assign" button per mentor
  - "No suitable mentor" action: flag for recruitment

#### 25. Safety Flags Queue (`/admin/flags`)
**Layout:**
- Filterable list: All | Messages | Sessions | Ratings | Users
- Each flag card:
  - Type badge (message, session, user, rating)
  - Severity badge (low/medium/high/critical)
  - Flagged content preview
  - Flagged by (user or "System")
  - Date
  - Actions: "Investigate", "Resolve", "Dismiss"
- Expanded view: full context (message thread, session transcript, rating details)

#### 26. Safety Rules Editor (`/admin/rules`)
**Layout:**
- Card per rule:
  - Rule name, description
  - Current config (editable inline)
  - Toggle: active/inactive
  - "Save" button per card
- Rules: session hours, mentor capacity, low rating threshold, contact info filter

#### 27. Access Code Generator (`/admin/codes`)
**Layout:**
- Generate section:
  - School/org name (input)
  - Number of codes (input)
  - Sessions per code (dropdown: 6, 8, 10, 12)
  - Expiration date (date picker)
  - "Generate Codes" button
- Existing codes table:
  - Code, school, redeemed/total, expires, status
  - "Deactivate" action

#### 28. Eligibility Review (`/admin/eligibility`)
**Layout:**
- Queue of pending applications
- Each card:
  - Student name, email, grade, school
  - Eligibility type (SNAP / FRPL / Common App waiver)
  - Counselor email provided
  - Counselor confirmation status
  - "Approve" / "Deny" buttons
  - Notes field

---

## Interaction States

### Loading
- Skeleton screens for dashboard content (not spinners)
- Shimmer animation on cards while loading
- Button loading: disable + show small spinner inside button

### Empty States
- No mentor yet: illustration + "We're finding you a mentor"
- No sessions yet: illustration + "Book your first session"
- No messages yet: illustration + "Start a conversation with your mentor"
- No breakdowns yet: "Complete a session to see your breakdown"

### Error States
- Form validation: inline red text below input, red border
- API errors: toast notification (top-right, red background)
- Network offline: persistent banner at top

### Success States
- Form submission: green toast "Saved successfully"
- Booking confirmed: success modal with confetti animation (subtle)
- Code redeemed: green success card

---

## Responsive Behavior

- Desktop-first (primary use case: laptop/desktop)
- Tablet: sidebar collapses to icons-only, content takes full width
- Mobile: sidebar becomes bottom tab bar, cards stack vertically
- Video call: always full-width regardless of device
- Chat: on mobile, conversation list and chat are separate views (tap to enter)

---

## Key Components (Reusable)

| Component | Description |
|-----------|-------------|
| MentorCard | Photo, name, university, major, rating. Used in directory, dashboard, matching |
| SessionCard | Date, time, mentor, status badge, action buttons |
| BreakdownCard | Topics, action items, next focus. Compact and full versions |
| IcebreakerCard | Numbered list of conversation starters with purple accent |
| RatingModal | Stars, tags, feedback, safety concern |
| TimeSlotGrid | Days x blocks grid for availability selection |
| BookingCalendar | Week view with available slot blocks |
| FlagCard | Type, severity, content preview, actions |
| AccessCodeTable | Code, school, usage, status |
| ChatBubble | Left/right aligned, system messages centered |
| StatCard | Number + label + optional trend indicator |
| EmptyState | Illustration + message + CTA |
