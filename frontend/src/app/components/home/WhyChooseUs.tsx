import fastTranslationImg from 'figma:asset/6eeb26f37300eb81d0806d49f85f830a369b55ca.png';
import certifiedQualityImg from 'figma:asset/9a5f80b4ced84c897e104ede7131fbdd4bcb1211.png';
import expertTranslatorsImg from 'figma:asset/3ef55548c809358d6f3bf8544cc506437eb809d2.png';

export function WhyChooseUs() {
  const reasons = [
    { image: fastTranslationImg, title: 'Fast Translation', description: 'Quick turnaround times without compromising quality' },
    { image: certifiedQualityImg, title: 'Certified Quality', description: 'ISO certified translations recognized worldwide' },
    { image: expertTranslatorsImg, title: 'Expert Translators', description: 'Native speakers with industry expertise' },
  ];

  return (
    <section className="py-12 bg-gradient-to-br from-indigo-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-10">
          Why Choose Our Translation Services
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reasons.map((reason, index) => (
            <div
              key={index}
              className={`bg-white rounded-lg p-8 shadow-lg text-center ${reason.title === 'Certified Quality' ? 'border-2 border-[#0a1247]' : ''}`}
            >
              <div className="flex items-center justify-center mb-6">
                <img 
                  src={reason.image} 
                  alt={reason.title}
                  className="w-40 h-40 object-contain"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{reason.title}</h3>
              <p className="text-gray-600">{reason.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
