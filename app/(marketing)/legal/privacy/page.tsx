import Link from "next/link"

export default function PrivacyPolicyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-gray-500">Last updated: May 1, 2026</p>
      </header>

      <div className="mt-12 space-y-10 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-2xl font-semibold text-gray-900">
            Information We Collect
          </h2>
          <p className="mt-4">
            We collect information to provide and improve the Pupil platform.
            This includes:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>
              <strong>Personal information</strong> &mdash; name, email address,
              date of birth, and demographic details you provide during
              onboarding (such as interests, identity, and academic goals).
            </li>
            <li>
              <strong>Usage data</strong> &mdash; pages visited, features used,
              session frequency, and device or browser information collected
              automatically when you interact with our platform.
            </li>
            <li>
              <strong>Session recordings</strong> &mdash; all video mentoring
              sessions are recorded and stored securely for safety, quality
              assurance, and dispute resolution purposes.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">
            How We Use Your Information
          </h2>
          <p className="mt-4">
            The information we collect is used for the following purposes:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>
              <strong>Matching</strong> &mdash; to pair students with mentors who
              share relevant backgrounds, interests, and goals.
            </li>
            <li>
              <strong>Platform improvement</strong> &mdash; to analyze usage
              patterns, improve features, and develop new tools that better serve
              our users.
            </li>
            <li>
              <strong>Safety</strong> &mdash; to monitor sessions and
              communications for policy violations, safeguarding concerns, and
              to maintain a trusted environment for all users.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">
            Information Sharing
          </h2>
          <p className="mt-4">
            We will never sell your personal data to third parties. Information
            is only shared in limited circumstances:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>
              With your matched mentor, so they can prepare for and conduct
              effective sessions.
            </li>
            <li>
              With Pupil administrators when necessary for safety reviews,
              dispute resolution, or platform operations.
            </li>
            <li>
              With law enforcement or legal authorities if required by applicable
              law or to protect the safety of our users.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">
            Student Privacy
          </h2>
          <p className="mt-4">
            Protecting student privacy is central to Pupil&rsquo;s mission. A
            student&rsquo;s identity data &mdash; including demographic details,
            matching preferences, and personal reflections &mdash; is treated as
            private by default. This information is never shared with schools,
            school districts, or any educational institution. Only the
            student&rsquo;s assigned mentor and authorized Pupil staff may access
            identity-related data, and only to the extent required to deliver and
            safeguard the mentoring experience.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">
            Data Security
          </h2>
          <p className="mt-4">
            All personal data is encrypted in transit and at rest. We use
            industry-standard secure storage practices, including encrypted
            databases, role-based access controls, and regular security audits.
            Session recordings are stored in secured, access-controlled
            environments and are only accessible to authorized personnel.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">
            Parental Rights
          </h2>
          <p className="mt-4">
            Parents or legal guardians who hold a parent account on Pupil have
            the ability to:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Manage billing and subscription details.</li>
            <li>
              View high-level usage information, including session dates and
              mentor assignments.
            </li>
          </ul>
          <p className="mt-3">
            To protect the trust between students and mentors, parent accounts
            cannot read messages, view session transcripts, or access the content
            of conversations between students and their mentors.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">Contact Us</h2>
          <p className="mt-4">
            If you have questions or concerns about this Privacy Policy or your
            personal data, please contact us at{" "}
            <Link
              href="mailto:privacy@getpupil.com"
              className="text-[#7A60E4] underline underline-offset-2 hover:text-[#6950d0]"
            >
              privacy@getpupil.com
            </Link>
            .
          </p>
        </section>
      </div>
    </article>
  )
}
