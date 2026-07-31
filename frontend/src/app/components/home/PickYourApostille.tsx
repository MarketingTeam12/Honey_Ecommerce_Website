import { motion } from 'motion/react';
import { Globe, FileCheck } from 'lucide-react';
import apostilleImage from 'figma:asset/a87130555bc7eab59ec95ad82c3a105db88bf0c1.png';

export function PickYourApostille() {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Simplifying the Apostille Process for Your Global Needs
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="rounded-2xl border-2 border-[#0a1247] shadow-2xl overflow-hidden group cursor-zoom-in">
              <img
                src={apostilleImage}
                alt="Apostille Services"
                className="w-full h-auto object-contain transition-transform duration-500 ease-out group-hover:scale-110"
              />
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
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p className="text-lg">
                Navigating international document legalization can be complex, but we make it simple and hassle-free. Our expert apostille services ensure that your documents meet global standards, making them legally recognized in countries that are part of the Hague Convention.
              </p>
              <p>
                Whether you need document authentication for higher education, employment, business expansion, or immigration, we handle the entire process with efficiency and accuracy.
              </p>
              <p>
                From verifying your documents with the appropriate authorities to obtaining the required apostille certification, our team ensures a smooth and timely experience. We understand the importance of precision in legal documentation and work diligently to ensure compliance with international regulations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-lg">
                <Globe className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Global Recognition</h4>
                  <p className="text-sm text-gray-700">Valid in 100+ Hague Convention countries</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-green-50 p-4 rounded-lg">
                <FileCheck className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Fast Processing</h4>
                  <p className="text-sm text-gray-700">Quick turnaround with certified quality</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
