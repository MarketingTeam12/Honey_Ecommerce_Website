import fastPricesIcon from 'figma:asset/7688dc32f3361430c5fbfcf8c74e98d43bce6b73.png';
import worldwideIcon from 'figma:asset/ae8b1fcc1aafe1496918e42f9123f7f42da77e2a.png';
import professionalTeamIcon from 'figma:asset/1a655a0d4fe4abe35e1ed68caf5ec6376ac8095d.png';

export function ProfessionalAgencySection() {
  const features = [
    {
      iconImage: fastPricesIcon,
      title: 'Fast & Competitive Prices',
      description: 'Premium translations at cost-effective rates',
    },
    {
      iconImage: worldwideIcon,
      title: 'Worldwide Translation Services',
      description: 'Services in over 200 languages worldwide',
    },
    {
      iconImage: professionalTeamIcon,
      title: 'Dedicated Professional Team',
      description: 'Experienced translators ensuring accuracy',
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
          HIGH PROFESSIONAL TRANSLATION AGENCY
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            return (
              <div
                key={index}
                className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition-shadow text-center"
              >
                <div className="inline-flex items-center justify-center w-64 h-40 mb-6 p-4">
                  <img src={feature.iconImage} alt={feature.title} className="w-full h-full object-contain" />
                </div>
                <h3 className="text-xl font-bold text-blue-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}