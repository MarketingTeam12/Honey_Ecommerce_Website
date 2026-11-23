import { Link } from 'react-router-dom';
import { Shield, Lock, FileText, Clock, Trash2, Mail, MapPin, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';

export function PrivacyPolicyPage() {
  return (
    <main className="bg-gradient-to-b from-[#0a1247]/5 to-gray-50 min-h-screen py-8 sm:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-10 md:p-12">
          {/* Header */}
          <div className="border-b border-gray-100 pb-6 mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold mb-3">
              <Shield className="w-3.5 h-3.5" />
              DPDP Act 2023 Compliant &bull; ISO 9001:2015 Certified
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#0a1247] mb-3">Privacy Policy</h1>
            <p className="text-sm text-gray-500">
              <strong>Last Updated:</strong> 18 November 2026 &bull; <strong>Website:</strong>{' '}
              <a href="https://honeyuniversal.com" className="text-blue-600 underline">https://honeyuniversal.com</a>
            </p>
          </div>

          <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-8">
            Honey Universal Digital Private Limited (&ldquo;Company&rdquo;, &ldquo;We&rdquo;, &ldquo;Us&rdquo;, or &ldquo;Our&rdquo;) is committed to safeguarding the privacy and confidentiality of our clients&rsquo; personal information and sensitive documents. This Privacy Policy outlines our data protection practices in accordance with the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong>, Information Technology Act 2000, and international data protection standards.
          </p>

          {/* Section 1: Data Controller */}
          <section className="mb-10 pb-8 border-b border-gray-100">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0a1247] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#0a1247] rounded-full inline-block flex-shrink-0"></span>
              1. Data Fiduciary &amp; Corporate Information
            </h2>
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200/60 text-sm sm:text-base text-gray-700 space-y-2">
              <p><strong>Legal Entity:</strong> Honey Universal Digital Private Limited</p>
              <p><strong>Brand / Platform:</strong> Honey Universal Services (<a href="https://honeyuniversal.com" className="text-blue-600 underline">honeyuniversal.com</a>)</p>
              <p><strong>Registered &amp; Corporate Office:</strong> 184/3, 2nd floor, Arcot Rd, opposite to Hotel Aadithya, near Viveks, Vadapalani, Chennai, Tamil Nadu 600026, India</p>
              <p><strong>Quality Certifications:</strong> ISO 9001:2015 certified – Quality Management System for language translation services (Certificate No. 25EQQO18, Assurance Quality Certification LLC, EGAC accredited, valid until 18/11/2028)</p>
              <p><strong>Contact Email:</strong> <a href="mailto:support@honeyuniversal.com" className="text-blue-600 underline">support@honeyuniversal.com</a></p>
            </div>
          </section>

          {/* Section 2: Data Collected */}
          <section className="mb-10 pb-8 border-b border-gray-100">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0a1247] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#0a1247] rounded-full inline-block flex-shrink-0"></span>
              2. Personal Data We Collect
            </h2>
            <p className="text-gray-700 text-sm sm:text-base mb-4 leading-relaxed">
              We collect personal data solely to provide certified translation, attestation, apostille, and business localization services requested by you:
            </p>
            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-600" /> Account &amp; Identity Data
                </h3>
                <p className="text-gray-600">Full name, billing and delivery addresses, verified email address, mobile number, and Google OAuth profile information when signing in with Google.</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" /> Document Content for Services
                </h3>
                <p className="text-gray-600">Certificates, affidavits, commercial deeds, educational transcripts, and legal filings uploaded by you strictly for linguistic translation, sworn notary, or MEA apostille certification.</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600" /> Transaction &amp; Payment Data
                </h3>
                <p className="text-gray-600">Order IDs, transaction receipts, invoice numbers, and payment status. Card and UPI credentials are encrypted directly through Razorpay without touching our application servers.</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" /> Technical &amp; Usage Telemetry
                </h3>
                <p className="text-gray-600">IP addresses, browser client fingerprints, chosen currency preferences, and anonymous session telemetry to ensure site reliability and prevent fraudulent queries.</p>
              </div>
            </div>
          </section>

          {/* Section 3: Document Security & Retention Policy */}
          <section className="mb-10 pb-8 border-b border-gray-100">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0a1247] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#0a1247] rounded-full inline-block flex-shrink-0"></span>
              3. Document Security &amp; 30-Day Retention Policy
            </h2>
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-5 mb-4 text-sm sm:text-base text-gray-800 space-y-3">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-blue-950">AES-256 Storage Encryption &amp; NDA Protection</h4>
                  <p className="text-gray-700 text-sm mt-1">All uploaded source documents and translated deliverables are transmitted over TLS 1.3 and stored with industry-standard AES-256 encryption. Our accredited linguists and case managers operate under binding Non-Disclosure Agreements (NDAs).</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-blue-950">Standard 30-Day Retention Period</h4>
                  <p className="text-gray-700 text-sm mt-1">Uploaded documents and completed certification drafts are retained for <strong>30 calendar days</strong> following order delivery. This retention window allows clients to re-download copies, request adjustments, or produce certified duplicates for visa authorities.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Trash2 className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-blue-950">Automated Permanent Purge &amp; Right to Immediate Deletion</h4>
                  <p className="text-gray-700 text-sm mt-1">Upon expiration of the 30-day window, uploaded source files are automatically purged from our servers. Clients may also request an <em>immediate manual purge</em> immediately upon order delivery by contacting <a href="mailto:support@honeyuniversal.com" className="text-blue-700 font-medium underline">support@honeyuniversal.com</a>.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Rights under DPDP Act 2023 */}
          <section className="mb-10 pb-8 border-b border-gray-100">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0a1247] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#0a1247] rounded-full inline-block flex-shrink-0"></span>
              4. Your Rights under the DPDP Act, 2023
            </h2>
            <p className="text-gray-700 text-sm sm:text-base mb-4 leading-relaxed">
              As a Data Principal under India&rsquo;s Digital Personal Data Protection Act, you are entitled to exercise the following rights:
            </p>
            <ul className="space-y-3 text-sm sm:text-base text-gray-700">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Right to Access:</strong> You may request a summary of the personal data processed by us and the identities of any third parties with whom it was shared.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Right to Correction &amp; Erasure:</strong> You have the right to correct inaccurate or outdated information and request erasure of personal data that is no longer necessary for the purpose it was collected.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Right of Grievance Redressal:</strong> You have the right to readily accessible grievance redressal mechanisms regarding our data processing policies.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Right to Nominate:</strong> You have the right to nominate any individual to exercise your rights under the Act in the event of death or incapacity.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Consent Withdrawal:</strong> You may withdraw your consent for future data processing at any time, subject to legal or contractual obligations.</span>
              </li>
            </ul>
          </section>

          {/* Section 5: Third-Party Processors */}
          <section className="mb-10 pb-8 border-b border-gray-100">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0a1247] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#0a1247] rounded-full inline-block flex-shrink-0"></span>
              5. Authorized Third-Party Processors
            </h2>
            <p className="text-gray-700 text-sm sm:text-base mb-4 leading-relaxed">
              We share minimum required data strictly with certified technology partners necessary to execute payments, identity verification, and client communications:
            </p>
            <div className="grid gap-3 sm:grid-cols-3 text-sm">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-1">Razorpay Software Pvt Ltd</h4>
                <p className="text-gray-600 text-xs">Payment Gateway (PCI-DSS compliant). Handles cards, NetBanking, UPI, and wallets securely.</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-1">Google LLC</h4>
                <p className="text-gray-600 text-xs">Google OAuth sign-in, Google Business reviews display, and transactional email infrastructure.</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-1">Zoho Corporation</h4>
                <p className="text-gray-600 text-xs">Customer live-chat support infrastructure and case ticketing management.</p>
              </div>
            </div>
          </section>

          {/* Section 6: Cookies & Tracking */}
          <section className="mb-10 pb-8 border-b border-gray-100">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0a1247] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#0a1247] rounded-full inline-block flex-shrink-0"></span>
              6. Cookies &amp; Consent Management
            </h2>
            <p className="text-gray-700 text-sm sm:text-base mb-3 leading-relaxed">
              We employ essential cookies to keep you signed in, remember your cart, and preserve your currency selection. Optional performance cookies and chat widgets are governed by your consent preferences, which can be modified at any time via the <strong>Cookie settings</strong> button in our website footer.
            </p>
          </section>

          {/* Section 7: Grievance Officer */}
          <section className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0a1247] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#0a1247] rounded-full inline-block flex-shrink-0"></span>
              7. Grievance Redressal &amp; Data Protection Officer
            </h2>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 text-gray-800">
              <p className="text-sm sm:text-base mb-4 leading-relaxed">
                In compliance with Section 10 of the DPDP Act, 2023 and Rule 3(2) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, the details of our designated <strong>Grievance Redressal Officer</strong> are as follows:
              </p>
              <div className="grid sm:grid-cols-2 gap-4 text-sm font-medium">
                <div>
                  <p className="text-gray-600">Officer Name:</p>
                  <p className="text-gray-900 font-bold">Mano Rakshahan</p>
                  <p className="text-gray-600 mt-2">Designation:</p>
                  <p className="text-gray-900 font-bold">Data Protection &amp; Legal Compliance Officer</p>
                </div>
                <div>
                  <p className="text-gray-600">Email Address:</p>
                  <p><a href="mailto:grievance@honeyuniversal.com" className="text-blue-600 font-bold underline">grievance@honeyuniversal.com</a> / <a href="mailto:support@honeyuniversal.com" className="text-blue-600 underline">support@honeyuniversal.com</a></p>
                  <p className="text-gray-600 mt-2">Office Address:</p>
                  <p className="text-gray-900">184/3, 2nd floor, Arcot Rd, opposite to Hotel Aadithya, near Viveks, Vadapalani, Chennai, Tamil Nadu 600026, India</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                <em>All privacy grievances will be acknowledged within 24 business hours and redressed within a maximum of 15 calendar days from receipt.</em>
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default PrivacyPolicyPage;
