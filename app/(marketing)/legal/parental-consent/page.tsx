import Link from "next/link"

export default function ParentalConsentPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Parental Consent Policy
        </h1>
        <p className="mt-4 text-sm text-gray-500">Last updated: May 1, 2026</p>
      </header>

      <div className="mt-12 space-y-10 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-2xl font-semibold text-gray-900">Overview</h2>
          <p className="mt-4">
            Pupil is a mentoring platform designed for minors (students aged 14
            and older). Because our primary users are under 18, we require active
            parent or legal guardian involvement during signup and throughout the
            student&rsquo;s use of the platform. A parent account is required to
            create a student account, manage billing, and provide the consent
            necessary for their child to participate in mentoring sessions.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">
            What Parents Can See
          </h2>
          <p className="mt-4">
            Parent accounts have visibility into the following aspects of their
            student&rsquo;s experience:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>
              <strong>Billing</strong> &mdash; subscription status, payment
              history, and invoices.
            </li>
            <li>
              <strong>Usage</strong> &mdash; session dates, session count, and
              general activity metrics.
            </li>
            <li>
              <strong>Mentor assignment</strong> &mdash; the name and profile of
              the mentor matched with their student.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">
            What Parents Cannot See
          </h2>
          <p className="mt-4">
            To create a safe and trusting space for students to speak openly with
            their mentors, certain information is not accessible to parent
            accounts:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>
              <strong>Messages</strong> &mdash; the content of in-app messages
              between the student and their mentor.
            </li>
            <li>
              <strong>Session transcripts</strong> &mdash; written transcripts
              generated from recorded video sessions.
            </li>
            <li>
              <strong>Identity matching preferences</strong> &mdash; the
              personal identity details, demographic information, and preferences
              a student shares during onboarding for the purpose of mentor
              matching.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">
            Recording Consent
          </h2>
          <p className="mt-4">
            All video mentoring sessions on Pupil are recorded. Recordings are
            maintained for safety, quality assurance, and dispute resolution.
            By consenting to your child&rsquo;s participation on the platform,
            you acknowledge and agree that all sessions will be recorded. These
            recordings are stored securely and are only accessible to authorized
            Pupil staff when a safety review or investigation is required.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">
            Data Collection for Minors
          </h2>
          <p className="mt-4">
            We collect the minimum amount of personal data necessary to operate
            the platform and match students with appropriate mentors. This
            includes name, date of birth, email address, and onboarding
            responses such as interests, academic goals, and identity
            information. All data is handled in accordance with our{" "}
            <Link
              href="/legal/privacy"
              className="text-[#7A60E4] underline underline-offset-2 hover:text-[#6950d0]"
            >
              Privacy Policy
            </Link>{" "}
            and applicable laws governing the collection of data from minors.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">
            Withdrawing Consent
          </h2>
          <p className="mt-4">
            A parent or legal guardian may withdraw consent at any time by
            contacting our support team. Upon withdrawal of consent, the
            student&rsquo;s account will be deactivated, their personal data will
            be deleted in accordance with our data retention policies, and any
            active subscription will be handled per our refund terms. Please note
            that withdrawing consent will end the student&rsquo;s access to the
            platform and their mentor relationship.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">Contact Us</h2>
          <p className="mt-4">
            If you have questions about parental consent or your rights as a
            parent on the Pupil platform, please contact us at{" "}
            <Link
              href="mailto:parents@getpupil.com"
              className="text-[#7A60E4] underline underline-offset-2 hover:text-[#6950d0]"
            >
              parents@getpupil.com
            </Link>
            .
          </p>
        </section>
      </div>
    </article>
  )
}
