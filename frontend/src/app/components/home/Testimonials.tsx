import { motion } from 'motion/react';
import { Star, ShieldCheck, CheckCircle } from 'lucide-react';

export function Testimonials() {
  return (
    <section className="py-8 md:py-10 bg-white" aria-label="Customer Trust & Verified Reviews">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          className="text-center max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-800 px-4 py-1.5 rounded-full text-xs font-semibold mb-3">
            <ShieldCheck className="w-4 h-4 text-blue-700" />
            <span>Verified Customer Feedback</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Trusted by Individuals &amp; Enterprises
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-6">
            We prioritize real, independent customer reviews. Visit our verified Google Business Profile to view over 580+ live customer experiences.
          </p>
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span>★ 4.6 · 582 Google Reviews (Vadapalani, Chennai)</span>
            <CheckCircle className="w-4 h-4 text-green-600 ml-1" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Testimonials;
