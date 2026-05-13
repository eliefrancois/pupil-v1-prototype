// constants.ts — navigation and app constants for the Pupil app.

export interface NavItem {
  id: string
  label: string
  href: string
  icon: string
}

export interface FaqItem {
  q: string
  a: string
}

// ---------- Navigation ----------

export const NAV_STUDENT: NavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: "Home" },
  { id: "mentor", label: "My Mentor", href: "/dashboard/mentor", icon: "User" },
  { id: "schedule", label: "Availability", href: "/dashboard/schedule", icon: "Calendar" },
  { id: "book", label: "Book Session", href: "/dashboard/book", icon: "BookOpen" },
  { id: "messages", label: "Messages", href: "/dashboard/messages", icon: "MessageCircle" },
  { id: "history", label: "Session History", href: "/dashboard/history", icon: "List" },
  { id: "settings", label: "Settings", href: "/dashboard/settings", icon: "Settings" },
]

export const NAV_MENTOR: NavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/mentor", icon: "Home" },
  { id: "mentees", label: "My Mentees", href: "/mentor/mentees", icon: "Users" },
  { id: "schedule", label: "Schedule", href: "/mentor/schedule", icon: "Calendar" },
  { id: "messages", label: "Messages", href: "/mentor/messages", icon: "MessageCircle" },
  { id: "history", label: "Session History", href: "/mentor/history", icon: "List" },
  { id: "settings", label: "Settings", href: "/mentor/settings", icon: "Settings" },
]

export const NAV_ADMIN: NavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/admin", icon: "Home" },
  { id: "matching", label: "Matching Queue", href: "/admin/matching", icon: "Users" },
  { id: "mentors", label: "Mentors", href: "/admin/mentors", icon: "GraduationCap" },
  { id: "students", label: "Students", href: "/admin/students", icon: "BookOpen" },
  { id: "flags", label: "Safety Flags", href: "/admin/flags", icon: "Flag" },
  { id: "rules", label: "Safety Rules", href: "/admin/rules", icon: "Shield" },
  { id: "codes", label: "Access Codes", href: "/admin/codes", icon: "Key" },
  { id: "eligibility", label: "Eligibility", href: "/admin/eligibility", icon: "CheckCircle" },
]

// ---------- FAQ ----------

export const FAQ_ITEMS: FaqItem[] = [
  { q: "What is Pupil?", a: "Pupil is a platform that helps parents and high school students make confident college and career decisions. We address the gaps created by limited personal networks, overextended school counseling capacity, and overwhelming, one-size-fits-all advice. Through Pupil, students connect with vetted near-peer college mentors who share relevant interests and lived experiences, meeting virtually 2\u20134 times per month for practical, experience-based guidance." },
  { q: "How does matching work?", a: "Students set preferences across key dimensions (schools, majors, careers, interests, and identities). Pupil generates a curated set of mentor recommendations. Students can review mentor profiles, request matches, and skip mentors who are less relevant. Either party can end the match at any time." },
  { q: "How does Pupil protect students and mentors?", a: "Safety and compliance are embedded into the product. All sessions are recorded and transcribed. Messaging is filtered for contact info. In-platform reporting with structured escalation workflows. A human reviews any flagged interaction within 24 hours. Pupil does not facilitate in-person meetings unless hosted by a verified university partner." },
  { q: "Who pays for Pupil?", a: "Pupil is built with equity at its core. Free access is available for students who qualify through Free/Reduced-Price Lunch, SNAP, or Common App fee waivers (with eligibility verification). Families who do not qualify can subscribe annually." },
  { q: "Can my student\u2019s school pay for this?", a: "Yes. We work with schools and community-based organizations through bulk access codes." },
  { q: "Does grade level, GPA, or test scores matter?", a: "No. Pupil supports students from 9th through 12th grade and is not gated by grades or test scores. Our focus is on guidance, exploration, and fit." },
  { q: "What happens during a session?", a: "Each 30-minute session is a one-on-one video call between your student and their mentor. Before the call, both receive AI-generated conversation starters tailored to the student\u2019s grade and goals. After the call, both receive a breakdown with topics covered, action items, and suggested focus for next time." },
  { q: "How are mentors vetted?", a: "All mentors are current college students or recent graduates who undergo background checks and training. They must maintain a minimum rating to remain on the platform. Sessions are recorded and transcribed for safety." },
  { q: "What if my student doesn\u2019t click with their mentor?", a: "Either party can end the match at any time. We\u2019ll re-match your student within 24-48 hours at no additional cost." },
  { q: "Is there a refund policy?", a: "Yes. We offer a 90-day no-questions-asked refund guarantee. If Pupil isn\u2019t working for your family, email dario@getpupil.com within 90 days for a full refund." },
  { q: "How many sessions does my student get?", a: "Paid subscribers get up to 24 sessions per year (approximately 2 per month). Free-access students receive 6-12 sessions per year depending on their program." },
  { q: "Can parents see what happens in sessions?", a: "Parents can see session dates, duration, and their student\u2019s assigned mentor. For privacy and trust, parents cannot read messages or view session transcripts. This boundary is intentional \u2014 it helps students speak candidly with their mentor." },
  { q: "What grade levels does Pupil support?", a: "Pupil works with students in grades 9 through 12. Earlier access means more time for exploration. Seniors often focus on applications and deadlines." },
  { q: "Is MentorGPT included?", a: "MentorGPT is coming soon. Sign up for the waitlist to be notified when it launches. It will be included in all active subscriptions at no extra cost." },
]
