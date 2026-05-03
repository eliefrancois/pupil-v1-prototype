// mock-data.ts — typed mock data for the Pupil app.

// ---------- Types ----------

export interface Mentor {
  id: string
  name: string
  photo: string
  university: string
  major: string
  gradYear: string
  rating: number
  sessions: number
  activeMentees: number
  tags: string[]
  bio: string
  online: boolean
}

export interface StudentIdentity {
  firstGen: boolean
  raceEthnicity: string
  gender: string
}

export interface Student {
  id: string
  firstName: string
  lastName: string
  grade: number
  school: string
  city: string
  gpa: string
  interests: string[]
  colleges: string[]
  careers: string[]
  identity: StudentIdentity
  matchedMentor: string
  sessionsRemaining: number
  sessionsTotal: number
}

export interface ActionItem {
  id: string
  text: string
  done: boolean
}

export interface SessionBreakdown {
  topics: string[]
  actionItems: ActionItem[]
  nextFocus: string
  mentioned: string[]
  transcript: boolean
}

export interface Session {
  id: string
  mentorId: string
  studentId: string
  startsAt: string
  duration: number
  status: "upcoming" | "completed" | "cancelled"
  icebreakers?: string[]
  rated?: number
  breakdown?: SessionBreakdown
}

export interface Message {
  id: string
  from: "mentor" | "student" | "system"
  at: string
  text: string
  systemKind?: string
}

export interface MatchingCandidate {
  mentorId: string
  score: number
  reasons: string[]
}

export interface MatchingQueueStudent {
  name: string
  grade: number
  school: string
  city: string
  interests: string[]
  colleges: string[]
  identity: string[]
}

export interface MatchingQueueItem {
  id: string
  student: MatchingQueueStudent
  candidates: MatchingCandidate[]
}

export interface Flag {
  id: string
  type: "message" | "rating" | "session" | "user"
  severity: "low" | "medium" | "high" | "critical"
  by: string
  at: string
  preview: string
  full: string
  parties: string[]
  status: "open" | "investigating"
}

export interface AccessCode {
  code: string
  school: string
  redeemed: number
  total: number
  expires: string
  status: "active" | "depleted" | "expired"
}

export interface EligibilityApplication {
  id: string
  name: string
  email: string
  grade: number
  school: string
  type: string
  counselor: string
  counselorStatus: "confirmed" | "pending"
  date: string
}

export interface SafetyRule {
  id: string
  name: string
  description: string
  config: string
  active: boolean
}

// ---------- Helpers ----------

export function daysFromNow(d: number, hour = 16, minute = 0): string {
  const now = new Date()
  now.setDate(now.getDate() + d)
  now.setHours(hour, minute, 0, 0)
  return now.toISOString()
}

// ---------- Mentors ----------

export const MENTORS: Mentor[] = [
  {
    id: "m_amara",
    name: "Amara Okafor",
    photo: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&q=80&auto=format",
    university: "Stanford University",
    major: "Computer Science",
    gradYear: "Class of '26",
    rating: 4.9,
    sessions: 142,
    activeMentees: 6,
    tags: ["First-gen", "CS", "Tech internships", "QuestBridge"],
    bio: "First-gen from Houston, currently on track for a CS degree with a focus on systems. I help students figure out the parts of college admissions nobody tells you about \u2014 the supplements, the financial aid letters, the rec letter ask. I was a QuestBridge finalist and I love working with students from similar backgrounds.",
    online: true,
  },
  {
    id: "m_jonas",
    name: "Jonas Lindqvist",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80&auto=format",
    university: "MIT",
    major: "Mechanical Engineering",
    gradYear: "Class of '25",
    rating: 4.8,
    sessions: 98,
    activeMentees: 4,
    tags: ["Engineering", "Robotics", "Research"],
    bio: "Senior at MIT, robotics lab researcher, FIRST Robotics alum. I help students who think they want engineering figure out which kind, and how to talk about hands-on projects in essays.",
    online: false,
  },
  {
    id: "m_priya",
    name: "Priya Raman",
    photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80&auto=format",
    university: "Yale University",
    major: "Molecular Biology",
    gradYear: "Class of '27",
    rating: 5.0,
    sessions: 64,
    activeMentees: 5,
    tags: ["Pre-med", "Bio", "Research", "South Asian"],
    bio: "Sophomore at Yale on a pre-med track. I shadow at Yale-New Haven Hospital and run the Pre-Med Society\u2019s underclassmen mentorship program.",
    online: true,
  },
  {
    id: "m_diego",
    name: "Diego Hern\u00e1ndez",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&auto=format",
    university: "UC Berkeley",
    major: "Economics + Public Policy",
    gradYear: "Class of '26",
    rating: 4.7,
    sessions: 88,
    activeMentees: 5,
    tags: ["Public policy", "First-gen", "Latinx", "UC system"],
    bio: "Junior at Berkeley. Specialize in helping students navigate the UC application and PIQs. First-gen Mexican-American.",
    online: true,
  },
  {
    id: "m_sasha",
    name: "Sasha Chen",
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80&auto=format",
    university: "Northwestern University",
    major: "Journalism",
    gradYear: "Class of '25",
    rating: 4.9,
    sessions: 110,
    activeMentees: 4,
    tags: ["Writing", "Journalism", "Humanities"],
    bio: "Senior at Medill. Editor at the Daily Northwestern. I love working with writers \u2014 Common App essays especially.",
    online: false,
  },
  {
    id: "m_maya",
    name: "Maya Goldberg",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80&auto=format",
    university: "Brown University",
    major: "Cognitive Science",
    gradYear: "Class of '26",
    rating: 4.8,
    sessions: 76,
    activeMentees: 6,
    tags: ["Liberal arts", "Open curriculum", "Cogsci"],
    bio: "Junior at Brown. If you\u2019re drawn to interdisciplinary programs, open curricula, or schools that don\u2019t have core requirements, I can help.",
    online: true,
  },
]

// ---------- Student ----------

export const STUDENT: Student = {
  id: "s_riley",
  firstName: "Riley",
  lastName: "Park",
  grade: 11,
  school: "West Mesa High School",
  city: "Albuquerque, NM",
  gpa: "3.7\u20133.9",
  interests: ["Computer Science", "Cognitive Science", "Engineering"],
  colleges: ["Stanford", "MIT", "UC Berkeley", "Brown", "Carnegie Mellon"],
  careers: ["Software engineer", "Researcher", "Product designer"],
  identity: { firstGen: true, raceEthnicity: "Asian American", gender: "Non-binary" },
  matchedMentor: "m_amara",
  sessionsRemaining: 18,
  sessionsTotal: 24,
}

// ---------- Sessions ----------

export const SESSIONS: Session[] = [
  {
    id: "sess_up_1",
    mentorId: "m_amara",
    studentId: "s_riley",
    startsAt: daysFromNow(2, 16, 30),
    duration: 30,
    status: "upcoming",
    icebreakers: [
      "What\u2019s a class you\u2019re taking this semester that\u2019s actually surprising you?",
      "If you had to pick one of your colleges to commit to today, which would it be and why?",
      "What\u2019s something you\u2019ve been doing outside school that you\u2019d want to write about in an essay?",
      "What\u2019s a part of the application process that\u2019s stressing you out the most right now?",
    ],
  },
  {
    id: "sess_p_1",
    mentorId: "m_amara",
    studentId: "s_riley",
    startsAt: daysFromNow(-7, 16, 0),
    duration: 30,
    status: "completed",
    rated: 5,
    breakdown: {
      topics: [
        "Stanford supplemental essay strategy",
        "Choosing between CS and Symbolic Systems",
        "Lining up a summer research position",
      ],
      actionItems: [
        { id: "a1", text: "Draft three openings for the \u2018roommate\u2019 supplement before next session", done: true },
        { id: "a2", text: "Email Prof. Liu about the cognitive systems summer program", done: true },
        { id: "a3", text: "Read \u2018How to Get Into Stanford\u2019 essay collection on the resource hub", done: false },
      ],
      nextFocus: "Bring a draft of the roommate supplement and one short-answer response. We\u2019ll workshop them line by line.",
      mentioned: ["Stanford", "Symbolic Systems", "Common App", "Summer research", "Nov 1 EA deadline"],
      transcript: true,
    },
  },
  {
    id: "sess_p_2",
    mentorId: "m_amara",
    studentId: "s_riley",
    startsAt: daysFromNow(-21, 16, 0),
    duration: 30,
    status: "completed",
    rated: 5,
    breakdown: {
      topics: [
        "College list balance \u2014 reach / target / likely",
        "Activities list framing",
      ],
      actionItems: [
        { id: "b1", text: "Add two target schools to the list \u2014 Vandy and UMich", done: true },
        { id: "b2", text: "Rewrite robotics activity with concrete metrics", done: true },
      ],
      nextFocus: "Move into supplements once the list is locked.",
      mentioned: ["Vanderbilt", "Michigan", "Robotics", "Activities list"],
      transcript: true,
    },
  },
  {
    id: "sess_p_3",
    mentorId: "m_amara",
    studentId: "s_riley",
    startsAt: daysFromNow(-35, 16, 0),
    duration: 30,
    status: "completed",
    rated: 4,
    breakdown: {
      topics: ["Intro session \u2014 goals, schools, anxieties"],
      actionItems: [{ id: "c1", text: "Send Amara your current college list", done: true }],
      nextFocus: "Build the actual list together.",
      mentioned: ["College list", "Intro"],
      transcript: true,
    },
  },
  {
    id: "sess_p_4",
    mentorId: "m_amara",
    studentId: "s_riley",
    startsAt: daysFromNow(-49, 16, 0),
    duration: 30,
    status: "cancelled",
  },
]

// ---------- Messages ----------

export const MESSAGES: Message[] = [
  { id: "msg1", from: "mentor", at: daysFromNow(-8, 9, 14), text: "Hey Riley! Looking forward to Tuesday. I read through your activities list \u2014 there\u2019s some great stuff in there." },
  { id: "msg2", from: "student", at: daysFromNow(-8, 17, 2), text: "Thanks! I was kinda worried the robotics one was too generic." },
  { id: "msg3", from: "mentor", at: daysFromNow(-8, 17, 30), text: "It\u2019s not generic, it\u2019s just under-told. We\u2019ll fix that on the call." },
  { id: "msg4", from: "system", at: daysFromNow(-8, 17, 35), text: "Your message was modified because it contained contact information.", systemKind: "modified" },
  { id: "msg5", from: "student", at: daysFromNow(-7, 19, 18), text: "Today was helpful \u2014 the roommate supplement angle is so much clearer now." },
  { id: "msg6", from: "mentor", at: daysFromNow(-6, 12, 5), text: "Glad! Send me a draft whenever you have one. No rush." },
  { id: "msg7", from: "student", at: daysFromNow(-2, 21, 40), text: "Quick question \u2014 do colleges actually read the additional info section?" },
  { id: "msg8", from: "mentor", at: daysFromNow(-2, 22, 8), text: "Short answer: yes, but only if it earns its place. Let\u2019s talk through what you\u2019d put in there on Tuesday." },
]

// ---------- Admin: Matching Queue ----------

export const MATCHING_QUEUE: MatchingQueueItem[] = [
  {
    id: "q1",
    student: { name: "Jordan Tate", grade: 12, school: "Roosevelt HS", city: "Brooklyn, NY", interests: ["Bio", "Pre-med"], colleges: ["Yale", "Hopkins", "Cornell"], identity: ["Asian American", "Female"] },
    candidates: [
      { mentorId: "m_priya", score: 0.94, reasons: ["Pre-med track", "Identity match", "Yale"] },
      { mentorId: "m_amara", score: 0.71, reasons: ["First-gen overlap", "Schedule overlap"] },
      { mentorId: "m_maya", score: 0.66, reasons: ["Liberal arts", "Schedule overlap"] },
    ],
  },
  {
    id: "q2",
    student: { name: "Marcus Bell", grade: 11, school: "Garfield HS", city: "Seattle, WA", interests: ["Engineering", "Robotics"], colleges: ["MIT", "CMU", "Caltech"], identity: ["Black", "Male"] },
    candidates: [
      { mentorId: "m_jonas", score: 0.88, reasons: ["MIT", "Robotics", "Engineering"] },
      { mentorId: "m_amara", score: 0.70, reasons: ["CS overlap", "First-gen"] },
    ],
  },
  {
    id: "q3",
    student: { name: "Sofia Reyes", grade: 11, school: "Garfield HS Chicago", city: "Chicago, IL", interests: ["Public policy", "Econ"], colleges: ["UC Berkeley", "UCLA", "USC"], identity: ["Latina", "First-gen"] },
    candidates: [
      { mentorId: "m_diego", score: 0.96, reasons: ["UC system", "Latinx", "First-gen", "Policy"] },
    ],
  },
  {
    id: "q4",
    student: { name: "Theo Bennett", grade: 10, school: "Lakeside School", city: "Portland, OR", interests: ["Writing", "Film"], colleges: ["Northwestern", "Brown", "USC"], identity: ["White", "Male"] },
    candidates: [
      { mentorId: "m_sasha", score: 0.91, reasons: ["Journalism", "Northwestern"] },
      { mentorId: "m_maya", score: 0.74, reasons: ["Brown", "Liberal arts"] },
    ],
  },
]

// ---------- Admin: Safety Flags ----------

export const FLAGS: Flag[] = [
  {
    id: "f1",
    type: "message",
    severity: "high",
    by: "System",
    at: daysFromNow(-1, 14, 22),
    preview: "...you can text me at (xxx) xxx-xxxx if you want to talk outside the app...",
    full: "Mentor message to student attempted to share a personal phone number. Auto-modified by contact-info filter. Flagged for review because mentor has had two prior modified messages this month.",
    parties: ["m_jonas", "s_riley_alt"],
    status: "open",
  },
  {
    id: "f2",
    type: "rating",
    severity: "medium",
    by: "Student rating",
    at: daysFromNow(-3, 9, 0),
    preview: "Mentor seemed distracted, kept checking phone.",
    full: "1-star session rating with \u2018distracted\u2019 tag. Mentor\u2019s first low rating in 24 sessions.",
    parties: ["m_sasha"],
    status: "open",
  },
  {
    id: "f3",
    type: "session",
    severity: "low",
    by: "Auto",
    at: daysFromNow(-2, 11, 30),
    preview: "Session ended after 4 minutes.",
    full: "Session marked completed but only 4 minutes long. Possible no-show or technical issue.",
    parties: ["m_diego", "s_test1"],
    status: "open",
  },
  {
    id: "f4",
    type: "user",
    severity: "critical",
    by: "Student report",
    at: daysFromNow(-5, 18, 12),
    preview: "Student reported safety concern in session feedback.",
    full: "Student selected \u2018Report a safety concern\u2019 in rating modal. Free-text response: \u2018mentor asked questions that felt personal in a way that wasn\u2019t about applications\u2019. Requires immediate human review.",
    parties: ["m_redacted"],
    status: "investigating",
  },
]

// ---------- Admin: Access Codes ----------

export const ACCESS_CODES: AccessCode[] = [
  { code: "EAGLES-2026-A1", school: "Eastlake High School", redeemed: 24, total: 30, expires: "2026-08-31", status: "active" },
  { code: "BRONX-COLLEGE-PREP", school: "Bronx College Prep", redeemed: 48, total: 50, expires: "2026-12-31", status: "active" },
  { code: "OAK-CHARTER-FALL25", school: "Oakland Charter Network", redeemed: 30, total: 30, expires: "2026-06-30", status: "depleted" },
  { code: "MILLER-FOUNDATION", school: "Miller Family Foundation", redeemed: 12, total: 25, expires: "2027-01-31", status: "active" },
  { code: "PILOT-COHORT-2024", school: "Internal pilot", redeemed: 8, total: 10, expires: "2025-12-31", status: "expired" },
]

// ---------- Admin: Eligibility ----------

export const ELIGIBILITY: EligibilityApplication[] = [
  { id: "e1", name: "Tasha Williams", email: "tasha.w@example.org", grade: 11, school: "Roosevelt HS", type: "SNAP", counselor: "k.morris@roosevelt.edu", counselorStatus: "confirmed", date: daysFromNow(-2) },
  { id: "e2", name: "Luis Mendoza", email: "lm@example.org", grade: 12, school: "Garfield HS", type: "FRPL", counselor: "j.parker@garfield.edu", counselorStatus: "pending", date: daysFromNow(-1) },
  { id: "e3", name: "Anya Petrov", email: "anya.p@example.org", grade: 10, school: "Central HS", type: "Common App Waiver", counselor: "d.gomez@central.edu", counselorStatus: "confirmed", date: daysFromNow(-3) },
]

// ---------- Admin: Safety Rules ----------

export const SAFETY_RULES: SafetyRule[] = [
  { id: "r1", name: "Session hour limits", description: "Sessions can only be booked 8am\u201310pm in the student\u2019s local time.", config: "8:00 \u2013 22:00", active: true },
  { id: "r2", name: "Mentor capacity", description: "Maximum active mentees per mentor.", config: "8 students", active: true },
  { id: "r3", name: "Low rating threshold", description: "Auto-flag mentor for review after this many low ratings in 30 days.", config: "2 ratings \u2264 2 stars", active: true },
  { id: "r4", name: "Contact info filter", description: "Modify any message containing phone numbers, emails, or social handles.", config: "Phone, email, IG, Snap, TikTok, Discord", active: true },
  { id: "r5", name: "Session length minimum", description: "Sessions ending before this duration are flagged for review.", config: "5 minutes", active: false },
]
