import Link from "next/link"

export default function TermsOfServicePage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Terms of Service
        </h1>
        <p className="mt-4 text-sm text-gray-500">Last updated: May 1, 2026</p>
      </header>

      <div className="mt-12 space-y-10 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-2xl font-semibold text-gray-900">
            Acceptance of Terms
          </h2>
          <p className="mt-4">
            By accessing or using the Pupil platform, you agree to be bound by
            these Terms of Service and our{" "}
            <Link
              href="/legal/privacy"
              className="text-[#7A60E4] underline underline-offset-2 hover:text-[#6950d0]"
            >
              Privacy Policy
            </Link>
            . If you do not agree to these terms, you may not use the platform.
            We reserve the right to update these terms at any time, and
            continued use of the platform after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">Eligibility</h2>
          <p className="mt-4">
            Pupil is designed for students aged 14 and older. Users under 18
            must have a parent or legal guardian create an account and provide
            consent before accessing the platform. By registering, you confirm
            that you meet the minimum age requirement or that you are the parent
            or guardian of a minor who will be using the service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">
            User Accounts
          </h2>
          <p className="mt-4">
            You are responsible for maintaining the confidentiality of your
            account credentials and for all activity that occurs under your
            account. You agree to provide accurate and complete information
            during registration and to update your information as needed. Pupil
            reserves the right to suspend or terminate accounts that violate
            these terms or that are used fraudulently.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">
            Subscription &amp; Payment
          </h2>
          <p className="mt-4">
            Access to Pupil&rsquo;s mentoring services requires a paid
            subscription of <strong>$900 per year</strong>. Payment is collected
            at the time of enrollment and covers a full year of access, including
            mentor matching, scheduled sessions, messaging, and all platform
            features.
          </p>
          <p className="mt-3">
            We offer a <strong>90-day refund guarantee</strong>. If you are not
            satisfied with the service within the first 90 days of your
            subscription, you may request a full refund by contacting our
            support team. Refund requests made after the 90-day window will be
            reviewed on a case-by-case basis.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">
            Mentor Guidelines
          </h2>
          <p className="mt-4">
            Mentors on Pupil are vetted near-peer college students or recent
            graduates. Mentors agree to conduct themselves professionally,
            respect student boundaries, and follow all Pupil safety and conduct
            policies. Mentors may not solicit students for outside services,
            share personal contact information, or engage in any activity that
            compromises the integrity of the mentoring relationship.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">
            Student Safety
          </h2>
          <p className="mt-4">
            The safety of our students is our highest priority. All video
            sessions are recorded and may be reviewed by authorized Pupil staff.
            In-app messaging is monitored for policy violations and safeguarding
            concerns. If we identify a safety risk, we may take immediate action,
            including suspending accounts and notifying parents or legal
            authorities as required.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">
            Prohibited Conduct
          </h2>
          <p className="mt-4">
            You agree not to engage in any of the following while using Pupil:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Harassment, bullying, or abusive behavior toward any user.</li>
            <li>
              Sharing explicit, violent, or otherwise inappropriate content.
            </li>
            <li>
              Attempting to contact mentors or students outside of the Pupil
              platform.
            </li>
            <li>
              Impersonating another person or misrepresenting your identity.
            </li>
            <li>
              Using the platform for any commercial, political, or fraudulent
              purpose.
            </li>
            <li>
              Interfering with or attempting to compromise the security of the
              platform.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">
            Intellectual Property
          </h2>
          <p className="mt-4">
            All content, branding, software, and materials on the Pupil platform
            are the property of Pupil or its licensors and are protected by
            applicable intellectual property laws. You may not copy, reproduce,
            distribute, or create derivative works from any part of the platform
            without prior written consent.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">Termination</h2>
          <p className="mt-4">
            Pupil reserves the right to suspend or terminate your account at any
            time, with or without notice, if we believe you have violated these
            Terms of Service or any applicable law. Upon termination, your right
            to use the platform ceases immediately. Any provisions of these terms
            that by their nature should survive termination will remain in
            effect.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">
            Limitation of Liability
          </h2>
          <p className="mt-4">
            To the fullest extent permitted by law, Pupil and its officers,
            directors, employees, and agents shall not be liable for any
            indirect, incidental, special, consequential, or punitive damages
            arising from or related to your use of the platform. Our total
            liability for any claim arising under these terms shall not exceed
            the amount you paid for your subscription in the 12 months preceding
            the claim.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">Contact</h2>
          <p className="mt-4">
            For questions about these Terms of Service, please contact us at{" "}
            <Link
              href="mailto:legal@getpupil.com"
              className="text-[#7A60E4] underline underline-offset-2 hover:text-[#6950d0]"
            >
              legal@getpupil.com
            </Link>
            .
          </p>
        </section>
      </div>
    </article>
  )
}
