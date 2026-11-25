import { useState } from 'react';
import { motion } from 'motion/react';
import { Award, CheckCircle, Download, ExternalLink, ShieldCheck, FileCheck } from 'lucide-react';
import iso9001Certificate from '@/assets/iso-9001-certificate.png';

export function ISOCertificationSection() {
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setImagePosition({ x, y });
  };

  return (
    <section className="py-12 md:py-14 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
          {/* Left: Official Certificate Presentation Card with Real Certificate Image */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="flex flex-col justify-between w-full bg-white rounded-2xl shadow-xl border-2 border-[#0a1247]/10 p-6 sm:p-8"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0a1247] flex items-center justify-center font-bold">
                    <ShieldCheck className="w-7 h-7 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base sm:text-lg">Certificate of Registration</h3>
                    <p className="text-xs text-gray-500 font-medium">Assurance Quality Certification LLC · EGAC Accredited</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold border border-green-200">
                  <FileCheck className="w-3.5 h-3.5" />
                  Verified
                </span>
              </div>

              {/* Certificate Image Preview with Zoom */}
              <div
                className="relative overflow-hidden rounded-xl border-2 border-amber-400/40 bg-white p-2 shadow-inner cursor-zoom-in mb-4"
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              >
                <div className="relative overflow-hidden rounded-lg flex items-center justify-center bg-gray-50 max-h-[460px]">
                  <img
                    src={iso9001Certificate}
                    alt="ISO 9001:2015 Certificate of Registration - Honey Universal Digital Private Limited"
                    width={800}
                    height={1130}
                    loading="lazy"
                    decoding="async"
                    className={`w-full max-w-[380px] h-auto object-contain transition-transform duration-300 ${isHovering ? 'scale-150' : 'scale-100'}`}
                    style={isHovering ? {
                      transformOrigin: `${imagePosition.x}% ${imagePosition.y}%`
                    } : {}}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href="/ISO_new_HUDPL_1.pdf"
                download="ISO_new_HUDPL_1.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#0a1247] hover:bg-[#1a2457] text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                aria-label="Download ISO 9001:2015 Certificate PDF"
              >
                <Download className="w-4 h-4" />
                <span>View / Download PDF</span>
              </a>
              <a
                href="https://aqcworld.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-white hover:bg-gray-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                aria-label="Verify Certificate on Assurance Quality Certification (AQC)"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Verify on aqcworld.com</span>
              </a>
            </div>
          </motion.div>

          {/* Right: Content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="flex flex-col justify-center space-y-6"
          >
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full w-fit">
              <Award className="w-5 h-5" />
              <span className="font-semibold text-sm">Quality Management Certified</span>
            </div>

            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
              ISO 9001:2015 Certified Translation Services
            </h2>

            <div className="space-y-4 text-gray-700 leading-relaxed text-base">
              <p>
                <strong>Honey Universal Digital Private Limited</strong> is ISO 9001:2015 certified – Quality Management System for language translation services (all Indian &amp; 50+ foreign languages). Certificate No. 25EQQO18, issued by Assurance Quality Certification LLC (EGAC accredited). Valid until 18/11/2028.
              </p>
              <p>
                This certification confirms that our translation workflows, project management, and quality control systems comply with international quality benchmarks. We ensure that every document undergoes structured linguistic assessment, native subject-matter translation, and rigorous proofreading before certification.
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white space-y-3 shadow-md">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <p><strong>Standard:</strong> ISO 9001:2015 (Quality Management System)</p>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <p><strong>Scope:</strong> Language translation services (all Indian &amp; 50+ foreign languages)</p>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <p><strong>Certificate No:</strong> 25EQQO18</p>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <p><strong>Issued By:</strong> Assurance Quality Certification LLC (EGAC accredited)</p>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <p><strong>Validity:</strong> Valid until 18/11/2028</p>
              </div>
            </div>

            <p className="text-gray-700 italic border-l-4 border-blue-600 pl-4 text-sm leading-relaxed">
              Our ISO 9001:2015 certified management system guarantees that your certified translations are accurate, confidential, and accepted globally by visa authorities, embassies, courts, and corporate entities.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
