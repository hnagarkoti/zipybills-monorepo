import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <>
      <Navbar />

      <section className="pt-28 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <span className="text-sm font-semibold text-brand-600 uppercase tracking-wider">Legal</span>
            <h1 className="mt-4 text-4xl font-extrabold text-gray-900">
              Terms of <span className="gradient-text">Service</span>
            </h1>
            <p className="mt-4 text-gray-500">Last updated: January 2025</p>
          </div>

          <div className="prose prose-gray max-w-none space-y-8">
            {/* 1 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
              <p className="text-gray-600 leading-relaxed">
                By accessing or using the FactoryOS platform (&ldquo;Service&rdquo;), operated by Zipybills
                (&ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;), you agree to be bound by these Terms of Service. If you do
                not agree to these terms, please do not use the Service. These terms apply to all
                users of the platform including administrators, operators, and viewers.
              </p>
            </section>

            {/* 2 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">2. Description of Service</h2>
              <p className="text-gray-600 leading-relaxed">
                FactoryOS is a manufacturing operations platform that provides production monitoring,
                OEE tracking, quality management (CTQ/CTP), digital work instructions, downtime
                analysis, traceability, energy management, IIoT integration, tools management,
                and related manufacturing digitization solutions. The Service is available as a
                cloud-hosted SaaS application or as an on-premise deployment.
              </p>
            </section>

            {/* 3 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">3. Account Registration</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                To use the Service, you must create an account by providing accurate and complete
                information including your company name, administrator details, and contact information.
                You are responsible for:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1.5 ml-2">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use of your account</li>
                <li>Ensuring that all users added to your workspace comply with these terms</li>
              </ul>
            </section>

            {/* 4 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">4. Free Trial & Subscription Plans</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                We offer a 14-day free trial that includes access to core features. After the trial
                period, you may choose a paid subscription plan to continue using the Service.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1.5 ml-2">
                <li>Trial accounts are limited to 2 machines and 3 users</li>
                <li>Paid plans are billed monthly or annually as selected during purchase</li>
                <li>You may upgrade or downgrade your plan at any time</li>
                <li>If you do not upgrade after the trial, your account becomes read-only — no data is deleted</li>
                <li>Refunds are provided on a case-by-case basis at the Company&apos;s discretion</li>
              </ul>
            </section>

            {/* 5 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">5. Data Ownership & Privacy</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                You retain full ownership of all data you enter into the Service, including
                production data, machine data, quality records, and employee information
                (&ldquo;Your Data&rdquo;).
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1.5 ml-2">
                <li>Your Data is stored in isolated, tenant-specific databases</li>
                <li>We will not access, share, or sell Your Data to third parties</li>
                <li>We may access Your Data only for technical support when explicitly requested by you</li>
                <li>You may export Your Data at any time in standard formats (CSV, JSON)</li>
                <li>Upon account termination, Your Data will be retained for 30 days before permanent deletion</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-3">
                For full details on how we handle your data, please review our{' '}
                <a href="/privacy" className="text-brand-600 font-semibold hover:underline">Privacy Policy</a>.
              </p>
            </section>

            {/* 6 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">6. Acceptable Use</h2>
              <p className="text-gray-600 leading-relaxed mb-3">You agree not to:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-1.5 ml-2">
                <li>Use the Service for any unlawful or unauthorized purpose</li>
                <li>Attempt to reverse engineer, decompile, or disassemble the Service</li>
                <li>Interfere with the security or integrity of the Service</li>
                <li>Upload malicious code, viruses, or harmful content</li>
                <li>Share your account credentials with unauthorized individuals</li>
                <li>Resell or redistribute the Service without prior written consent</li>
              </ul>
            </section>

            {/* 7 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">7. Service Availability & SLA</h2>
              <p className="text-gray-600 leading-relaxed">
                We strive to maintain 99.9% uptime for cloud-hosted deployments. Scheduled
                maintenance windows will be communicated at least 48 hours in advance. We are
                not liable for downtime caused by factors beyond our reasonable control, including
                internet outages, third-party service failures, or force majeure events. Enterprise
                customers receive a separate SLA agreement with guaranteed response times.
              </p>
            </section>

            {/* 8 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">8. Intellectual Property</h2>
              <p className="text-gray-600 leading-relaxed">
                The Service, its original content (excluding Your Data), features, and functionality
                are owned by Zipybills and are protected by intellectual property laws. The
                FactoryOS name, logo, and branding are trademarks of Zipybills. You may not use
                our trademarks without prior written consent.
              </p>
            </section>

            {/* 9 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">9. Limitation of Liability</h2>
              <p className="text-gray-600 leading-relaxed">
                To the maximum extent permitted by applicable law, Zipybills shall not be liable
                for any indirect, incidental, special, consequential, or punitive damages resulting
                from your use of or inability to use the Service. Our total liability for any claims
                arising from the Service shall not exceed the amount paid by you in the 12 months
                preceding the claim.
              </p>
            </section>

            {/* 10 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">10. Termination</h2>
              <p className="text-gray-600 leading-relaxed">
                You may terminate your account at any time by contacting our support team. We may
                suspend or terminate your account if you violate these Terms. Upon termination,
                your right to use the Service ceases immediately, but Your Data will be available
                for export for 30 days. After 30 days, Your Data will be permanently deleted from
                our systems.
              </p>
            </section>

            {/* 11 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">11. Changes to Terms</h2>
              <p className="text-gray-600 leading-relaxed">
                We reserve the right to modify these Terms at any time. Material changes will be
                communicated via email or a prominent notice on the Service. Your continued use
                of the Service after changes constitutes acceptance of the updated Terms.
              </p>
            </section>

            {/* 12 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">12. Governing Law</h2>
              <p className="text-gray-600 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of India.
                Any disputes arising from these Terms shall be subject to the exclusive jurisdiction
                of the courts in India.
              </p>
            </section>

            {/* 13 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">13. Contact Us</h2>
              <p className="text-gray-600 leading-relaxed">
                If you have questions about these Terms of Service, please contact us at:{' '}
                <a href="mailto:contact@factoryos.in" className="text-brand-600 font-semibold hover:underline">
                  contact@factoryos.in
                </a>
              </p>
            </section>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
