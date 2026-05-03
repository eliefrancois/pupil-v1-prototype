// data.jsx — mock data for the Pupil prototype.
// Realistic but obviously placeholder names + Unsplash photo URLs.

const MENTORS = [
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
    bio: "First-gen from Houston, currently on track for a CS degree with a focus on systems. I help students figure out the parts of college admissions nobody tells you about — the supplements, the financial aid letters, the rec letter ask. I was a QuestBridge finalist and I love working with students from similar backgrounds.",
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
    bio: "Sophomore at Yale on a pre-med track. I shadow at Yale-New Haven Hospital and run the Pre-Med Society's underclassmen mentorship program.",
    online: true,
  },
  {
    id: "m_diego",
    name: "Diego Hernández",
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
    bio: "Senior at Medill. Editor at the Daily Northwestern. I love working with writers — Common App essays especially.",
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
    bio: "Junior at Brown. If you're drawn to interdisciplinary programs, open curricula, or schools that don't have core requirements, I can help.",
    online: true,
  },
];

const STUDENT = {
  id: "s_riley",
  firstName: "Riley",
  lastName: "Park",
  grade: 11,
  school: "West Mesa High School",
  city: "Albuquerque, NM",
  gpa: "3.7–3.9",
  interests: ["Computer Science", "Cognitive Science", "Engineering"],
  colleges: ["Stanford", "MIT", "UC Berkeley", "Brown", "Carnegie Mellon"],
  careers: ["Software engineer", "Researcher", "Product designer"],
  identity: { firstGen: true, raceEthnicity: "Asian American", gender: "Non-binary" },
  matchedMentor: "m_amara",
  sessionsRemaining: 18,
  sessionsTotal: 24,
};

// ---------- Sessions ----------
function daysFromNow(d, hour = 16, minute = 0) {
  const now = new Date();
  now.setDate(now.getDate() + d);
  now.setHours(hour, minute, 0, 0);
  return now.toISOString();
}

const SESSIONS = [
  {
    id: "sess_up_1",
    mentorId: "m_amara",
    studentId: "s_riley",
    startsAt: daysFromNow(2, 16, 30),
    duration: 30,
    status: "upcoming",
    icebreakers: [
      "What's a class you're taking this semester that's actually surprising you?",
      "If you had to pick one of your colleges to commit to today, which would it be and why?",
      "What's something you've been doing outside school that you'd want to write about in an essay?",
      "What's a part of the application process that's stressing you out the most right now?",
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
        { id: "a1", text: "Draft three openings for the 'roommate' supplement before next session", done: true },
        { id: "a2", text: "Email Prof. Liu about the cognitive systems summer program", done: true },
        { id: "a3", text: "Read 'How to Get Into Stanford' essay collection on the resource hub", done: false },
      ],
      nextFocus: "Bring a draft of the roommate supplement and one short-answer response. We'll workshop them line by line.",
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
        "College list balance — reach / target / likely",
        "Activities list framing",
      ],
      actionItems: [
        { id: "b1", text: "Add two target schools to the list — Vandy and UMich", done: true },
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
      topics: ["Intro session — goals, schools, anxieties"],
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
];

// ---------- Messages ----------
const MESSAGES = [
  { id: "msg1", from: "mentor", at: daysFromNow(-8, 9, 14),  text: "Hey Riley! Looking forward to Tuesday. I read through your activities list — there's some great stuff in there." },
  { id: "msg2", from: "student", at: daysFromNow(-8, 17, 2), text: "Thanks! I was kinda worried the robotics one was too generic." },
  { id: "msg3", from: "mentor", at: daysFromNow(-8, 17, 30), text: "It's not generic, it's just under-told. We'll fix that on the call." },
  { id: "msg4", from: "system", at: daysFromNow(-8, 17, 35), text: "Your message was modified because it contained contact information.", systemKind: "modified" },
  { id: "msg5", from: "student", at: daysFromNow(-7, 19, 18), text: "Today was helpful — the roommate supplement angle is so much clearer now." },
  { id: "msg6", from: "mentor", at: daysFromNow(-6, 12, 5),  text: "Glad! Send me a draft whenever you have one. No rush." },
  { id: "msg7", from: "student", at: daysFromNow(-2, 21, 40),text: "Quick question — do colleges actually read the additional info section?" },
  { id: "msg8", from: "mentor", at: daysFromNow(-2, 22, 8),  text: "Short answer: yes, but only if it earns its place. Let's talk through what you'd put in there on Tuesday." },
];

// ---------- Admin: matching queue ----------
const MATCHING_QUEUE = [
  {
    id: "q1",
    student: { name: "Jordan Tate", grade: 12, school: "Roosevelt HS", city: "Brooklyn, NY", interests: ["Bio", "Pre-med"], colleges: ["Yale", "Hopkins", "Cornell"], identity: ["Asian American", "Female"] },
    candidates: [
      { mentorId: "m_priya", score: 0.94, reasons: ["Pre-med track", "Identity match", "Yale"] },
      { mentorId: "m_amara", score: 0.71, reasons: ["First-gen overlap", "Schedule overlap"] },
      { mentorId: "m_maya",  score: 0.66, reasons: ["Liberal arts", "Schedule overlap"] },
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
      { mentorId: "m_maya",  score: 0.74, reasons: ["Brown", "Liberal arts"] },
    ],
  },
];

const FLAGS = [
  {
    id: "f1", type: "message", severity: "high",
    by: "System", at: daysFromNow(-1, 14, 22),
    preview: "...you can text me at (xxx) xxx-xxxx if you want to talk outside the app...",
    full: "Mentor message to student attempted to share a personal phone number. Auto-modified by contact-info filter. Flagged for review because mentor has had two prior modified messages this month.",
    parties: ["m_jonas", "s_riley_alt"],
    status: "open",
  },
  {
    id: "f2", type: "rating", severity: "medium",
    by: "Student rating", at: daysFromNow(-3, 9, 0),
    preview: "Mentor seemed distracted, kept checking phone.",
    full: "1-star session rating with 'distracted' tag. Mentor's first low rating in 24 sessions.",
    parties: ["m_sasha"],
    status: "open",
  },
  {
    id: "f3", type: "session", severity: "low",
    by: "Auto", at: daysFromNow(-2, 11, 30),
    preview: "Session ended after 4 minutes.",
    full: "Session marked completed but only 4 minutes long. Possible no-show or technical issue.",
    parties: ["m_diego", "s_test1"],
    status: "open",
  },
  {
    id: "f4", type: "user", severity: "critical",
    by: "Student report", at: daysFromNow(-5, 18, 12),
    preview: "Student reported safety concern in session feedback.",
    full: "Student selected 'Report a safety concern' in rating modal. Free-text response: 'mentor asked questions that felt personal in a way that wasn't about applications'. Requires immediate human review.",
    parties: ["m_redacted"],
    status: "investigating",
  },
];

const ACCESS_CODES = [
  { code: "EAGLES-2026-A1", school: "Eastlake High School", redeemed: 24, total: 30, expires: "2026-08-31", status: "active" },
  { code: "BRONX-COLLEGE-PREP", school: "Bronx College Prep", redeemed: 48, total: 50, expires: "2026-12-31", status: "active" },
  { code: "OAK-CHARTER-FALL25", school: "Oakland Charter Network", redeemed: 30, total: 30, expires: "2026-06-30", status: "depleted" },
  { code: "MILLER-FOUNDATION", school: "Miller Family Foundation", redeemed: 12, total: 25, expires: "2027-01-31", status: "active" },
  { code: "PILOT-COHORT-2024", school: "Internal pilot", redeemed: 8, total: 10, expires: "2025-12-31", status: "expired" },
];

const ELIGIBILITY = [
  { id: "e1", name: "Tasha Williams", email: "tasha.w@example.org", grade: 11, school: "Roosevelt HS", type: "SNAP",  counselor: "k.morris@roosevelt.edu",  counselorStatus: "confirmed",  date: daysFromNow(-2) },
  { id: "e2", name: "Luis Mendoza",   email: "lm@example.org",       grade: 12, school: "Garfield HS", type: "FRPL",  counselor: "j.parker@garfield.edu",  counselorStatus: "pending",    date: daysFromNow(-1) },
  { id: "e3", name: "Anya Petrov",    email: "anya.p@example.org",   grade: 10, school: "Central HS",  type: "Common App Waiver", counselor: "d.gomez@central.edu", counselorStatus: "confirmed", date: daysFromNow(-3) },
];

const SAFETY_RULES = [
  { id: "r1", name: "Session hour limits", description: "Sessions can only be booked 8am–10pm in the student's local time.", config: "8:00 – 22:00", active: true },
  { id: "r2", name: "Mentor capacity", description: "Maximum active mentees per mentor.", config: "8 students", active: true },
  { id: "r3", name: "Low rating threshold", description: "Auto-flag mentor for review after this many low ratings in 30 days.", config: "2 ratings ≤ 2 stars", active: true },
  { id: "r4", name: "Contact info filter", description: "Modify any message containing phone numbers, emails, or social handles.", config: "Phone, email, IG, Snap, TikTok, Discord", active: true },
  { id: "r5", name: "Session length minimum", description: "Sessions ending before this duration are flagged for review.", config: "5 minutes", active: false },
];

Object.assign(window, {
  MENTORS, STUDENT, SESSIONS, MESSAGES,
  MATCHING_QUEUE, FLAGS, ACCESS_CODES, ELIGIBILITY, SAFETY_RULES,
  daysFromNow,
});
