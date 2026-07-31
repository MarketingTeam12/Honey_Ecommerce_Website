import { motion } from 'motion/react';
import { Award, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import isoCertificate from 'figma:asset/a216a26c38b8e6c28e205fed28b8b38049b797db.png';

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
          {/* Left: ISO Certificate Image with Amazon-style zoom */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative flex items-center"
          >
            <div 
              className="relative overflow-hidden rounded-2xl shadow-2xl bg-white p-4 border-2 border-[#0a1247] cursor-zoom-in w-full"
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <div className="relative overflow-hidden rounded-xl">
                <img
                  src={isoCertificate}
                  alt="ISO 17100:2015 Certificate of Registration"
                  className={`w-full h-auto transition-transform duration-300 ${isHovering ? 'scale-150' : 'scale-100'}`}
                  style={isHovering ? {
                    transformOrigin: `${imagePosition.x}% ${imagePosition.y}%`
                  } : {}}
                />
              </div>
            </div>
          </motion.div>

          {/* Right: Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full">
              <Award className="w-5 h-5" />
              <span className="font-semibold">Quality Certified</span>
            </div>

            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              ISO 17100:2015 Certified Translation Services
            </h2>

            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p className="text-lg">
                <strong className="text-gray-900">Honey Universal Digital Private Limited</strong> is proud to be ISO 17100:2015 certified for Translation Services.
              </p>
              <p>
                This certification is specifically designed for translation service providers and reflects our commitment to delivering professional translation services for all Indian and over 100+ foreign languages.
              </p>
              <p>
                Through the ISO 17100:2015 standard, we ensure that every translation project—from initial assessment to final delivery—meets international requirements for translation quality, linguistic accuracy, and professional excellence. Our certified framework covers the complete translation process including translators' qualifications, project management, quality assurance, and client communications.
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <p><strong>Certificate Number:</strong> HUD/2023/23IFC</p>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <p><strong>Accredited By:</strong> International Conseil for Accrediting Services (ICAS) & IFCB</p>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <p><strong>Valid Until:</strong> 22.01.2026</p>
              </div>
            </div>

            <p className="text-gray-700 italic border-l-4 border-blue-600 pl-4">
              We take pride in maintaining the highest standards of professionalism and reliability, ensuring that every translation we deliver is precise, culturally appropriate, and quality-assured.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
