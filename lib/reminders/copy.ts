import { REMINDERS, type ReminderKey } from './definitions'
import type { ReminderContext } from './facts'

export interface ReminderCopy {
  subject: string
  preview: string
  heading: string
  paragraphs: string[]
}

type Variant = Omit<ReminderCopy, 'preview'>

function list(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  if (names.length === 3) return `${names[0]}, ${names[1]}, and ${names[2]}`
  return `${names[0]}, ${names[1]}, and ${names.length - 2} others`
}

function hi(ctx: ReminderContext): string {
  return ctx.firstName ? `Hi ${ctx.firstName}` : 'Hi there'
}

function fromSchool(school: string | undefined): string {
  return school ? ` from ${school}` : ''
}

const VARIANTS: Record<ReminderKey, (ctx: ReminderContext) => [Variant, Variant, Variant]> = {
  mentor_matched_no_availability: (ctx) => {
    const names = ctx.studentFirstNames ?? []
    const count = names.length
    const who = count === 0 ? 'Your students' : list(names)
    const plural = count !== 1
    const are = plural ? 'are' : 'is'
    return [
      {
        subject: plural
          ? `${count} students matched with you can't book until you add times`
          : `${who} is matched with you and can't book yet`,
        heading: `${hi(ctx)}, ${who} can't book you yet`,
        paragraphs: [
          `${who} ${are} matched with you on Pupil, but you don't have any weekly times set, so there's nothing to book.`,
          'Adding a few slots takes about a minute. Even one hour a week is enough to get started.',
        ],
      },
      {
        subject: `${who} still can't book a session with you`,
        heading: `${who} ${are} still waiting on your times`,
        paragraphs: [
          `${who} ${are} matched with you and still can't book, because your calendar is empty.`,
          'Once you add availability they can grab a slot right away.',
        ],
      },
      {
        subject: `Still want to mentor ${who}?`,
        heading: `${hi(ctx)}, quick check in`,
        paragraphs: [
          `${who} ${plural ? 'have' : 'has'} been waiting a while to book a first session with you.`,
          "If your schedule is packed this term, just reply and I'll find them another mentor. Otherwise add a couple of times and you're set.",
        ],
      },
    ]
  },

  mentor_set_availability: (ctx) => [
    {
      subject: `${ctx.firstName ? `${ctx.firstName}, set` : 'Set'} your Pupil availability`,
      heading: "You're approved, now add your times",
      paragraphs: [
        `You're approved as a Pupil mentor${fromSchool(ctx.mentorSchool)}. Before I can match you with a student, you need at least one weekly time slot.`,
        "It takes about a minute. Pick the hours that work and you're done.",
      ],
    },
    {
      subject: 'Students are looking for mentors like you',
      heading: `${hi(ctx)}, your calendar is still empty`,
      paragraphs: [
        "I have high school students waiting for a mentor, and you can't be matched until you add some availability.",
        'One or two slots a week is plenty.',
      ],
    },
    {
      subject: 'Still up for mentoring on Pupil?',
      heading: `${hi(ctx)}, checking in`,
      paragraphs: [
        "It's been a while since you were approved and your calendar is still empty.",
        "If now's not a good time, no worries, just reply and let me know. If you're still in, add a few times and I'll start matching you.",
      ],
    },
  ],

  mentor_finish_profile: (ctx) => [
    {
      subject: 'Finish your Pupil mentor profile',
      heading: `${hi(ctx)}, you're almost there`,
      paragraphs: [
        "You started signing up to mentor on Pupil but didn't finish your profile. It's a few short questions about your school, your major, and what you want to help with.",
        'Once you submit, I review it and you can start getting matched with high school students.',
      ],
    },
    {
      subject: 'Your mentor profile is still a draft',
      heading: 'Your profile is waiting on you',
      paragraphs: [
        "Your Pupil mentor profile is still unfinished, so students can't be matched with you yet.",
        'The rest takes about 10 minutes.',
      ],
    },
    {
      subject: 'Still want to mentor with Pupil?',
      heading: `${hi(ctx)}, one more check in`,
      paragraphs: [
        "If you've changed your mind about mentoring, all good.",
        'If you still want to help high schoolers figure out college, the rest of your profile takes about 10 minutes.',
      ],
    },
  ],

  student_say_hi: (ctx) => {
    const mentor = ctx.mentorFirstName ?? 'your mentor'
    const free = ctx.firstSessionFree === true
    return [
      {
        subject: `${mentor} is waiting to hear from you`,
        heading: `${hi(ctx)}, say hi to ${mentor}`,
        paragraphs: [
          `You're matched with ${mentor}${fromSchool(ctx.mentorSchool)}. Mentors on Pupil can only reply, so the first message has to come from you.`,
          "It doesn't need to be long. Say hi, what grade you're in, and one thing you're wondering about college.",
          ...(free
            ? [`Messaging is free, and so is your first session with ${mentor} when you're ready to talk.`]
            : []),
        ],
      },
      {
        subject: `A quick hello to ${mentor} goes a long way`,
        heading: `${mentor} hasn't heard from you yet`,
        paragraphs: [
          `A two line message is enough to get started. Tell ${mentor} what grade you're in and what you want help with.`,
          `${mentor} can't message you first, so it's on you to break the ice.`,
          ...(free ? ['Your first session is free too, no card needed.'] : []),
        ],
      },
      {
        subject: `${mentor} is still here when you're ready`,
        heading: `${hi(ctx)}, ${mentor} is still your mentor`,
        paragraphs: [
          `${mentor} is happy to help with anything college related, from picking schools to what dorm life is actually like.`,
          free
            ? 'Whenever you are ready, send a quick message to get things going. Your first session is free, so there is nothing to lose.'
            : 'Whenever you are ready, send a quick message to get things going.',
        ],
      },
    ]
  },

  student_book_first_session: (ctx) => {
    const mentor = ctx.mentorFirstName ?? 'your mentor'
    const free = ctx.firstSessionFree === true
    return [
      {
        subject: free
          ? `Your first session with ${mentor} is free`
          : `Book your first session with ${mentor}`,
        heading: `Ready to talk with ${mentor}?`,
        paragraphs: [
          `You and ${mentor} have been messaging, which is great. The next step is a 30 minute video call.`,
          free
            ? `Your first session is free. Pick a time that works from ${mentor}'s open slots.`
            : `Pick a time that works from ${mentor}'s open slots.`,
        ],
      },
      {
        subject: `Grab a time with ${mentor}`,
        heading: `${hi(ctx)}, ${mentor} has open times`,
        paragraphs: [
          'A first call is the easiest way to get real answers about college, and it only takes 30 minutes.',
          ...(free ? ['Your first session is free, no card needed.'] : []),
        ],
      },
      {
        subject: `Your first session with ${mentor} is a click away`,
        heading: `${hi(ctx)}, still want to meet ${mentor}?`,
        paragraphs: [
          `You haven't booked a call with ${mentor} yet. Whenever you're ready, pick a slot and you're set.`,
          ...(free ? ["Your first session is free, so there's nothing to lose."] : []),
        ],
      },
    ]
  },

  student_finish_onboarding: (ctx) => [
    {
      subject: 'Finish setting up Pupil',
      heading: `${hi(ctx)}, a few questions left`,
      paragraphs: [
        "You created a Pupil account but didn't finish the sign up questions. They help me match you with a college mentor who fits what you're looking for.",
        'It takes about 5 minutes.',
      ],
    },
    {
      subject: 'Your mentor match is waiting on you',
      heading: 'Finish signing up to get matched',
      paragraphs: [
        "I can't match you with a college mentor until you finish signing up. There are just a few questions left about your interests and the schools you're looking at.",
      ],
    },
    {
      subject: 'Still want a college mentor?',
      heading: `${hi(ctx)}, checking in`,
      paragraphs: [
        "Your Pupil account is set up, but you haven't finished the questions I use to find your mentor.",
        'Whenever you have 5 minutes, pick up where you left off.',
      ],
    },
  ],
}

const FOLLOW_UP_LEADS = ['Following up on my last email.', 'One last nudge for now.']

export function reminderCopy(
  key: ReminderKey,
  round: number,
  step: number,
  ctx: ReminderContext
): ReminderCopy {
  const variants = VARIANTS[key](ctx)
  const variant = variants[Math.min(Math.max(round, 1), variants.length) - 1]
  const lastStep = REMINDERS[key].cadence.length - 1
  const lead =
    step === 0 ? null : step === lastStep ? FOLLOW_UP_LEADS[1] : FOLLOW_UP_LEADS[0]

  const paragraphs = [...(lead ? [lead] : []), ...variant.paragraphs]
  if (ctx.ccParent) {
    paragraphs.push("I'm copying your parent so they're in the loop.")
  }

  return {
    subject: variant.subject,
    preview: variant.paragraphs[0],
    heading: variant.heading,
    paragraphs,
  }
}
