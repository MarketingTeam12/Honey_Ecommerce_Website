import { Star, ShieldCheck, Clock, Award, Globe, CheckCircle } from 'lucide-react';

export function ReviewsSlider() {
  const servicePillars = [
    {
      icon: Award,
      title: 'ISO 9001:2015 Certified',
      description: 'Standardized Quality Management System ensuring translation accuracy and consistency.',
    },
    {
      icon: ShieldCheck,
      title: 'Official Legal Acceptance',
      description: 'Accepted by USCIS, IRCC, MEA India, foreign embassies, and judicial courts worldwide.',
    },
    {
      icon: Globe,
      title: 'All Indian & 50+ Foreign Languages',
      description: 'Native subject-matter translators and sworn linguists across major international languages.',
    },
    {
      icon: Clock,
      title: 'Fast Turnaround & Express Delivery',
      description: '24-48 hour standard turnaround with 12-hour express delivery for urgent requirements.',
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-blue-50/60 via-white to-slate-50" aria-label="Why Choose Honey Universal">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold mb-3">
            <Star className="w-3.5 h-3.5 fill-blue-700 text-blue-700" />
            <span>Excellence In Language Services</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900">
            Why Thousands Trust Honey Universal
          </h2>
          <p className="text-gray-600 text-sm sm:text-base mt-2">
            Certified translation, MEA apostille, and embassy attestation delivered with precision and speed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {servicePillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{pillar.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{pillar.description}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Verified Standard</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
