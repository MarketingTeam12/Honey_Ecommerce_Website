import { motion } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { FileText, Shield, HelpCircle, DollarSign, Scale, Info } from 'lucide-react';

export function ContentPage() {
  const location = useLocation();
  const type = location.pathname.replace('/', '');

  const contentMap: Record<string, { title: string; icon: any; content: JSX.Element }> = {
    'terms-conditions': {
      title: 'Terms & Conditions',
      icon: Scale,
      content: (
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing and using Honey Translations services, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Service Description</h2>
            <p className="text-gray-700 leading-relaxed">
              Honey Translations provides professional translation, apostille, attestation, and related language services. We reserve the right to modify, suspend, or discontinue any aspect of our services at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Responsibilities</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Provide accurate and complete information</li>
              <li>Submit documents in readable format</li>
              <li>Respect intellectual property rights</li>
              <li>Use services for lawful purposes only</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Payment Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              Payment is required before commencement of translation work. We accept various payment methods including bank transfer, credit cards, and online payment gateways. All prices are subject to applicable taxes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Delivery Timeline</h2>
            <p className="text-gray-700 leading-relaxed">
              Delivery timelines are estimates and may vary based on document complexity, language pair, and volume. We strive to meet all deadlines but are not liable for delays caused by circumstances beyond our control.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Confidentiality</h2>
            <p className="text-gray-700 leading-relaxed">
              We maintain strict confidentiality of all client documents and information. Our translators and staff are bound by non-disclosure agreements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              Honey Translations is not liable for any indirect, incidental, or consequential damages arising from the use of our services. Our maximum liability is limited to the amount paid for the specific service.
            </p>
          </section>
        </div>
      ),
    },
    'privacy-policy': {
      title: 'Privacy Policy',
      icon: Shield,
      content: (
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Information We Collect</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Personal identification information (Name, email, phone number, address)</li>
              <li>Documents submitted for translation</li>
              <li>Payment and billing information</li>
              <li>Communication preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Provide translation and related services</li>
              <li>Process payments and send transaction confirmations</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Send updates about your orders</li>
              <li>Improve our services and develop new features</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Security</h2>
            <p className="text-gray-700 leading-relaxed">
              We implement appropriate technical and organizational security measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. All documents are stored securely and accessed only by authorized personnel.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your information for as long as necessary to fulfill the purposes outlined in this privacy policy, unless a longer retention period is required by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Access your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about this privacy policy, please contact us at:<br />
              Email: salesteam@honeytranslations.com<br />
              Phone: +91 72990 05577
            </p>
          </section>
        </div>
      ),
    },
    'refund-cancellation': {
      title: 'Refund & Cancellation Policy',
      icon: DollarSign,
      content: (
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Cancellation Policy</h2>
            <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-lg mb-4">
              <h3 className="font-bold text-gray-900 mb-2">Before Work Commences</h3>
              <p className="text-gray-700">
                Orders can be cancelled with a full refund if cancelled before translation work has begun.
              </p>
            </div>
            <div className="bg-amber-50 border-l-4 border-amber-600 p-6 rounded-r-lg mb-4">
              <h3 className="font-bold text-gray-900 mb-2">Work in Progress</h3>
              <p className="text-gray-700">
                If work has commenced, cancellation will result in charges for work completed up to that point. Refund will be issued for the remaining amount.
              </p>
            </div>
            <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-r-lg">
              <h3 className="font-bold text-gray-900 mb-2">After Delivery</h3>
              <p className="text-gray-700">
                Once the translation has been delivered, cancellation is not possible. However, we offer free revisions for any errors in translation.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Refund Policy</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Refunds will be processed under the following conditions:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Service not delivered within agreed timeline (unless delay is customer-caused)</li>
              <li>Translation contains significant errors (subject to review)</li>
              <li>Service does not meet agreed specifications</li>
              <li>Duplicate payment made by error</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Refund Processing Time</h2>
            <p className="text-gray-700 leading-relaxed">
              Approved refunds will be processed within 7-10 business days. The refund will be credited to the original payment method used for the transaction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Non-Refundable Services</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              The following are non-refundable:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Government fees for apostille/attestation</li>
              <li>Courier and delivery charges</li>
              <li>Express/rush service fees</li>
              <li>Third-party certification fees</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Request Cancellation/Refund</h2>
            <p className="text-gray-700 leading-relaxed">
              To request a cancellation or refund, please contact us at:<br />
              Email: salesteam@honeytranslations.com<br />
              Phone: +91 72990 05577<br /><br />
              Please include your order number and reason for cancellation/refund.
            </p>
          </section>
        </div>
      ),
    },
    'faq': {
      title: 'Frequently Asked Questions',
      icon: HelpCircle,
      content: (
        <div className="space-y-6">
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-600 transition-all">
            <h3 className="text-xl font-bold text-gray-900 mb-3">What languages do you support?</h3>
            <p className="text-gray-700 leading-relaxed">
              We provide translation services for all major Indian languages (Hindi, Tamil, Telugu, Malayalam, Kannada, Bengali, etc.) and over 50 foreign languages including English, French, German, Spanish, Italian, Arabic, Chinese, Japanese, and many more.
            </p>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-600 transition-all">
            <h3 className="text-xl font-bold text-gray-900 mb-3">How long does translation take?</h3>
            <p className="text-gray-700 leading-relaxed">
              Standard translation typically takes 1-3 business days depending on document length and complexity. Express services are available for urgent requirements at additional cost.
            </p>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-600 transition-all">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Are your translations certified?</h3>
            <p className="text-gray-700 leading-relaxed">
              Yes, we provide certified translations that are accepted by government authorities, universities, and organizations worldwide. All translations come with official certification, stamp, and signature.
            </p>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-600 transition-all">
            <h3 className="text-xl font-bold text-gray-900 mb-3">What is apostille and do I need it?</h3>
            <p className="text-gray-700 leading-relaxed">
              Apostille is a form of authentication for documents to be used in countries that are part of the Hague Convention. It's required for educational, employment, or legal purposes in foreign countries. We can help determine if you need apostille for your specific situation.
            </p>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-600 transition-all">
            <h3 className="text-xl font-bold text-gray-900 mb-3">How much do your services cost?</h3>
            <p className="text-gray-700 leading-relaxed">
              Pricing varies based on language pair, document type, and turnaround time. Indian language translations start from ₹400 per page, while foreign language translations start from ₹800 per page. Contact us for a detailed quote.
            </p>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-600 transition-all">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Is my information confidential?</h3>
            <p className="text-gray-700 leading-relaxed">
              Absolutely. We maintain strict confidentiality with all client documents. All our translators and staff sign non-disclosure agreements, and we use secure systems for document handling and storage.
            </p>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-600 transition-all">
            <h3 className="text-xl font-bold text-gray-900 mb-3">What payment methods do you accept?</h3>
            <p className="text-gray-700 leading-relaxed">
              We accept bank transfers, credit/debit cards, UPI, and major online payment platforms. Payment is required before work commences.
            </p>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-600 transition-all">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Do you offer revisions?</h3>
            <p className="text-gray-700 leading-relaxed">
              Yes, we offer free revisions if there are any errors in the translation. Customer satisfaction is our priority, and we ensure the final product meets your requirements.
            </p>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-600 transition-all">
            <h3 className="text-xl font-bold text-gray-900 mb-3">How do I submit my documents?</h3>
            <p className="text-gray-700 leading-relaxed">
              You can upload documents directly through our website, email them to salesteam@honeytranslations.com, or send via WhatsApp. We accept PDF, Word, JPG, and most common file formats.
            </p>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-600 transition-all">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Do you deliver internationally?</h3>
            <p className="text-gray-700 leading-relaxed">
              Yes, we deliver both digital copies (via email) and hard copies worldwide. Delivery charges apply based on destination and urgency.
            </p>
          </div>
        </div>
      ),
    },
    'terms-of-service': {
      title: 'Terms of Service',
      icon: FileText,
      content: (
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Agreement</h2>
            <p className="text-gray-700 leading-relaxed">
              This Terms of Service agreement governs your use of Honey Translations' professional translation, apostille, and attestation services. By engaging our services, you agree to these terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Quality Assurance</h2>
            <p className="text-gray-700 leading-relaxed">
              We are ISO 17100:2015 certified and maintain the highest quality standards. All translations are performed by qualified professionals and undergo quality checks before delivery.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Accuracy Guarantee</h2>
            <p className="text-gray-700 leading-relaxed">
              We guarantee accurate translation of your documents. If any errors are found, we will provide corrections free of charge. However, we are not responsible for errors in the source document.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Document Handling</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We handle all documents with care and confidentiality:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Secure storage systems</li>
              <li>Encrypted transmission</li>
              <li>Limited access to authorized personnel only</li>
              <li>Proper disposal after project completion</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed">
              You retain all rights to your original documents. The translated documents are provided for your use. We retain the right to use anonymized project data for quality improvement purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Modifications to Service</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify or discontinue services with or without notice. We will not be liable for any modification, suspension, or discontinuation of services.
            </p>
          </section>
        </div>
      ),
    },
    'pricing': {
      title: 'Pricing Plan',
      icon: DollarSign,
      content: (
        <div className="space-y-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-4">Transparent Pricing</h2>
            <p className="text-blue-100 text-lg">
              No hidden fees. Pay only for what you need. Volume discounts available.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white border-2 border-blue-200 rounded-2xl p-8 hover:border-blue-600 hover:shadow-xl transition-all">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Indian Languages</h3>
              <div className="text-4xl font-bold text-blue-600 mb-4">₹400 - ₹900</div>
              <p className="text-gray-600 mb-6">per page</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-green-600"></span>
                  <span className="text-gray-700">English, Hindi, Tamil, Telugu</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600"></span>
                  <span className="text-gray-700">Certified translation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600"></span>
                  <span className="text-gray-700">1-3 days turnaround</span>
                </li>
              </ul>
            </div>

            <div className="bg-white border-2 border-purple-200 rounded-2xl p-8 hover:border-purple-600 hover:shadow-xl transition-all">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Foreign Languages</h3>
              <div className="text-4xl font-bold text-purple-600 mb-4">₹800 - ₹1,800</div>
              <p className="text-gray-600 mb-6">per page</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-green-600"></span>
                  <span className="text-gray-700">200+ languages supported</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600"></span>
                  <span className="text-gray-700">Certified translation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600"></span>
                  <span className="text-gray-700">2-5 days turnaround</span>
                </li>
              </ul>
            </div>

            <div className="bg-white border-2 border-green-200 rounded-2xl p-8 hover:border-green-600 hover:shadow-xl transition-all">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Apostille Services</h3>
              <div className="text-4xl font-bold text-green-600 mb-4">₹2,500 - ₹3,500</div>
              <p className="text-gray-600 mb-6">per document</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span className="text-gray-700">MEA apostille included</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span className="text-gray-700">Translation + Apostille</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span className="text-gray-700">7-10 days turnaround</span>
                </li>
              </ul>
            </div>

            <div className="bg-white border-2 border-amber-200 rounded-2xl p-8 hover:border-amber-600 hover:shadow-xl transition-all">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Attestation Services</h3>
              <div className="text-4xl font-bold text-amber-600 mb-4">₹3,000 - ₹5,000</div>
              <p className="text-gray-600 mb-6">per document</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span className="text-gray-700">Embassy attestation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span className="text-gray-700">HRD, MEA, Embassy</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span className="text-gray-700">10-15 days turnaround</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-lg">
            <h3 className="font-bold text-gray-900 mb-2">Volume Discounts Available</h3>
            <p className="text-gray-700">
              Contact us for special rates on bulk orders and corporate packages. We offer customized pricing for long-term partnerships.
            </p>
          </div>
        </div>
      ),
    },
    'about': {
      title: 'About Company',
      icon: Info,
      content: (
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">About Honey Translations</h2>
            <p className="text-gray-700 leading-relaxed">
              Honey Universal Digital Private Limited, operating as Honey Translations, is a leading provider of professional translation, apostille, and attestation services. Based in Chennai, India, we serve clients worldwide with our comprehensive language solutions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-700 leading-relaxed">
              To break language barriers and facilitate seamless global communication through accurate, culturally appropriate, and timely translation services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">ISO 17100:2015 Certification</h2>
            <p className="text-gray-700 leading-relaxed">
              We are proud to be  certified for our Quality Management System. This certification, awarded by AQC Middle East LLC and accredited by IAS and IAF, demonstrates our commitment to maintaining the highest quality standards in all our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Services</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Document translation for all Indian and 200+ foreign languages</li>
              <li>Certified translations accepted worldwide</li>
              <li>Apostille services for Hague Convention countries</li>
              <li>Embassy attestation services</li>
              <li>Sworn translation services</li>
              <li>Business and legal document translation</li>
              <li>Academic transcript translation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Choose Us</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Expert team of certified translators</li>
              <li>Fast turnaround times</li>
              <li>Competitive pricing with no hidden fees</li>
              <li>Strict confidentiality and data security</li>
              <li>24/7 customer support</li>
              <li>Worldwide delivery</li>
            </ul>
          </section>
        </div>
      ),
    },
  };

  const content = type ? contentMap[type] : contentMap['terms-conditions'];
  const Icon = content?.icon || FileText;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-16">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full mb-6">
            <Icon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900">{content?.title || 'Content'}</h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl p-8 lg:p-12"
        >
          {content?.content || <p className="text-gray-700">Content not found.</p>}
        </motion.div>
      </div>
    </div>
  );
}

export default ContentPage;
