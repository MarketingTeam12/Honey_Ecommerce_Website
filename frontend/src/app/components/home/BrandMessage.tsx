import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export function BrandMessage() {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    navigate(path);
  };

  return (
    <section id="about-company" className="py-12 bg-gradient-to-br from-amber-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              At Honey Translations, every word matters—
              <span className="text-gray-900">naturally and perfectly.</span>
            </h2>
            <p className="text-xl text-gray-700">
              Just like honey is pure and refined, our translations are crafted with precision and authenticity.
            </p>
            <button 
              onClick={() => handleNavigate('/services')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-full font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 animate-blink"
            >
              Explore Our Services
            </button>
          </motion.div>

          <motion.div 
            className="aspect-video rounded-2xl overflow-hidden shadow-2xl"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/6UT1UkizejQ"
              title="Brand Message"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

