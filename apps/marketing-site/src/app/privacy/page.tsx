import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <>
      <Navbar />

      <section className="pt-28 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <span className="text-sm font-semibold text-brand-600 uppercase tracking-wider">Legal</span>
            <h1 className="mt-4 text-4xl font-extrabold text-gray-900">
              Privacy <span className="gradient-text">Policy</span>
            </h1>
            <p className="mt-4 text-gray-500">Last updated: February 2026</p>
          </div>

          <div className="prose prose-gray max-w-none space-y-8">
            {/* 1 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">1. Introduction</h2>
              <p className="text-gray-600 leading-relaxed">
                Zipybills (&ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) operates the FactoryOS platform. This Privacy
                Policy explains how we collect, use, store, and protect your information when you
                use our Service. We are committed to protecting your privacy and ensuring the
                security of your data. By using FactoryOS, you consent to the practices described
                in this policy.
              </p>
            </section>

            {/* 2 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">2. Information We Collect</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                We collect the following types of information:
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">2.1 Account Information</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1.5 ml-2">
                <li>Company name and workspace URL (slug)</li>
                <li>Administrator full name, username, and email address</li>
                <li>Password (stored securely using industry-standard hashing)</li>
                <li>Subscription plan and billing information</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">2.2 Manufacturing Data</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1.5 ml-2">
                <li>Machine configurations, production data, and cycle times</li>
                <li>Quality parameters (CTQ/CTP readings and checksheet data)</li>
                <li>Downtime events, reason codes, and maintenance records</li>
                <li>Energy consumption data</li>
                <li>Tool inventory, calibration, and usage records</li>
                <li>Work instruction content and operator acknowledgments</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">2.3 Usage Data</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1.5 ml-2">
                <li>Login timestamps, session duration, and feature usage patterns</li>
                <li>Browser type, device information, and IP address</li>
                <li>Pages visited within the application</li>
              </ul>
            </section>

            {/* 3 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">3. How We Use Your Information</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                We use the collected information for the following purposes:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1.5 ml-2">
                <li><strong>Service Delivery:</strong> To provide, maintain, and improve the FactoryOS platform</li>
                <li><strong>Account Management:</strong> To create and manage your workspace, authenticate users, and process subscriptions</li>
                <li><strong>Communication:</strong> To send important service updates, security alerts, and support responses</li>
                <li><strong>Analytics:</strong> To understand how the Service is used and improve features (aggregated, anonymized data only)</li>
                <li><strong>Security:</strong> To detect, prevent, and address technical issues and security threats</li>
                <li><strong>Compliance:</strong> To comply with legal obligations and enforce our Terms of Service</li>
              </ul>
            </section>

            {/* 4 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">4. Data Isolation & Multi-Tenancy</h2>
              <p className="text-gray-600 leading-relaxed">
                FactoryOS uses a multi-tenant architecture where each customer&apos;s data is completely
                isolated. Your manufacturing data, user information, and configurations are stored
                in your own dedicated database schema. No other customer or tenant can access your
                data. This isolation is enforced at the database level and cannot be bypassed through
                the application.
              </p>
            </section>

            {/* 5 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">5. Data Storage & Security</h2>
              <p className="text-gray-600 leading-relaxed mb-3">We implement the following security measures:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-1.5 ml-2">
                <li><strong>Encryption in Transit:</strong> All data transmitted between your browser and our servers uses TLS/SSL encryption</li>
                <li><strong>Encryption at Rest:</strong> Databases are encrypted at rest using AES-256 encryption</li>
                <li><strong>Password Security:</strong> User passwords are hashed using bcrypt with salt rounds</li>
                <li><strong>Access Controls:</strong> Role-based access control (RBAC) ensures users only access data relevant to their role</li>
                <li><strong>Audit Logging:</strong> All sensitive operations are logged for audit and compliance purposes</li>
                <li><strong>Regular Backups:</strong> Automated daily backups with point-in-time recovery capability</li>
              </ul>
            </section>

            {/* 6 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">6. Data Sharing</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                We do <strong>not</strong> sell, rent, or trade your personal or manufacturing data to third parties. We may share limited information only in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1.5 ml-2">
                <li><strong>With Your Consent:</strong> When you explicitly authorize us to share data with a third party</li>
                <li><strong>Service Providers:</strong> With trusted hosting providers (e.g., cloud infrastructure) who process data on our behalf under strict confidentiality agreements</li>
                <li><strong>Legal Requirements:</strong> When required by law, subpoena, or government request</li>
                <li><strong>Business Transfer:</strong> In connection with a merger, acquisition, or sale of assets (with prior notice)</li>
              </ul>
            </section>

            {/* 7 - Google API */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">7. Google API Services &amp; Google Drive Integration</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                FactoryOS offers an optional Google Drive integration for tenant administrators to back up their
                manufacturing data to their own Google Drive account. This section describes how we access,
                use, store, and share Google user data.
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">7.1 What We Access</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1.5 ml-2">
                <li><strong>drive.file scope:</strong> Permission to create and manage files that FactoryOS itself creates in your Google Drive (specifically, a &ldquo;FactoryOS Backups&rdquo; folder). We cannot access, read, or modify any other files in your Drive.</li>
                <li><strong>Email address:</strong> Your Google account email address, used only to display which account is connected in the app settings.</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">7.2 How We Use Google Data</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1.5 ml-2">
                <li>We use Drive access exclusively to upload encrypted backup files of your own manufacturing data to your connected Google Drive account.</li>
                <li>We store your Google OAuth refresh token securely in our database, encrypted at rest, solely to perform authorized backups on your behalf.</li>
                <li>Your Google email is stored to show you which account is connected — it is never used for marketing or shared with third parties.</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">7.3 What We Do NOT Do</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1.5 ml-2">
                <li>We do not read, download, or process any pre-existing files in your Google Drive.</li>
                <li>We do not share your Google account data or tokens with any third party.</li>
                <li>We do not use Google data for advertising, profiling, or any purpose beyond the backup feature you explicitly enable.</li>
                <li>We do not transfer your Google data to AI or machine learning systems.</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">7.4 Revoking Access</h3>
              <p className="text-gray-600 leading-relaxed">
                You can disconnect Google Drive at any time from <strong>Settings → Backup &amp; Data → Google Drive → Disconnect</strong>.
                This immediately deletes your stored OAuth tokens from our servers. You can also revoke access
                directly from your <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">Google Account permissions page</a>.
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">7.5 Compliance with Google API Services User Data Policy</h3>
              <p className="text-gray-600 leading-relaxed">
                FactoryOS&apos;s use and transfer of information received from Google APIs adheres to the{' '}
                <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
                  Google API Services User Data Policy
                </a>, including the Limited Use requirements.
              </p>
            </section>

            {/* 8 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">8. Data Retention</h2>
              <p className="text-gray-600 leading-relaxed">
                We retain your data for as long as your account is active or as needed to provide
                the Service. If you choose to terminate your account, we will retain your data for
                30 days to allow data export, after which it will be permanently deleted from our
                systems. Usage logs and anonymized analytics data may be retained for up to 12 months
                for service improvement purposes.
              </p>
            </section>

            {/* 9 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">9. Your Rights</h2>
              <p className="text-gray-600 leading-relaxed mb-3">You have the following rights regarding your data:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-1.5 ml-2">
                <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
                <li><strong>Correction:</strong> Request correction of inaccurate personal data</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data (subject to legal retention requirements)</li>
                <li><strong>Export:</strong> Export your manufacturing data in standard formats (CSV, JSON) at any time</li>
                <li><strong>Restriction:</strong> Request limitation of processing of your personal data</li>
                <li><strong>Objection:</strong> Object to processing of your personal data for specific purposes</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-3">
                To exercise any of these rights, please contact us at{' '}
                <a href="mailto:contact@factoryos.in" className="text-brand-600 font-semibold hover:underline">
                  contact@factoryos.in
                </a>.
              </p>
            </section>

            {/* 10 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">10. Cookies</h2>
              <p className="text-gray-600 leading-relaxed">
                We use essential cookies for authentication and session management. We do not use
                advertising or tracking cookies. Essential cookies are required for the Service to
                function and cannot be disabled. We may use anonymized analytics cookies to
                understand usage patterns — these do not collect personal information.
              </p>
            </section>

            {/* 11 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">11. On-Premise Deployments</h2>
              <p className="text-gray-600 leading-relaxed">
                For customers who choose on-premise deployment, all data resides on your own servers
                within your own network. In this case, Zipybills does not have access to your data
                unless you explicitly grant remote access for technical support purposes. The security
                of on-premise data is your organization&apos;s responsibility, and we provide guidelines
                and best practices for securing the deployment.
              </p>
            </section>

            {/* 12 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">12. Children&apos;s Privacy</h2>
              <p className="text-gray-600 leading-relaxed">
                FactoryOS is a business application designed for manufacturing operations. We do not
                knowingly collect personal information from children under the age of 18. If we
                become aware that a child has provided us with personal information, we will take
                steps to delete such information.
              </p>
            </section>

            {/* 13 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">13. Changes to This Policy</h2>
              <p className="text-gray-600 leading-relaxed">
                <strong>We reserve the right to update or replace this Privacy Policy at any time, at our sole discretion, with or without prior notice.</strong> Changes are effective immediately upon posting to this page. We may — but are not obligated to — notify you of material changes via email or an in-platform notice. We encourage you to review this page periodically. Your continued use of the Service after changes are posted constitutes your acceptance of the revised Privacy Policy.
              </p>
            </section>

            {/* 14 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">14. Contact Us</h2>
              <p className="text-gray-600 leading-relaxed">
                If you have questions or concerns about this Privacy Policy, please contact us at:{' '}
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
