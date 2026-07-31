import { useNavigate } from 'react-router-dom';
import { FileText, Award, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import servicesImage from 'figma:asset/15aed9eb0e931fd6fc0dfd3f1878ffbf3d43bf49.png';

export function OurServices() {
  const services = [
    {
      icon: FileText,
      title: 'Document Translation',
      description: 'Accurate and reliable translation of certificates, legal papers, business documents, academic materials, and more.',
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      icon: Award,
      title: 'Certified Translation',
      description: 'Official translations for immigration, government, and academic purposes, accepted worldwide.',
      gradient: 'from-green-500 to-green-600',
    },
    {
      icon: MessageSquare,
      title: 'Personal Translation',
      description: 'From personal letters to marketing content, we adapt your message to resonate with German-speaking audiences.',
      gradient: 'from-purple-500 to-purple-600',
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Side: Heading, Description, and Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">
              WHY WE NEED HONEY TRANSLATION ?
            </h2>
            
            <div className="space-y-4">
              <p className="text-xl text-gray-700 leading-relaxed">
                We provide professional language solutions to help you communicate without barriers. Our services include document translation, website and app localization, and certified translations for official use. We also offer live interpretation support for meetings, conferences, and personal communication needs.
              </p>
              <p className="text-lg text-gray-700">
                From business documents to multimedia content such as subtitles and voiceovers, our expert team ensures accuracy and cultural relevance. Whether you need English to German, English to French, or English to any foreign language, Honey Translation makes your words clear, impactful, and globally understood.
              </p>
            </div>
          </motion.div>

          {/* Right Side: Service Cards */}
          <div className="space-y-6">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-600 hover:shadow-xl transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 bg-gradient-to-br ${service.gradient} rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <service.icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
                    <p className="text-gray-700 leading-relaxed">{service.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
