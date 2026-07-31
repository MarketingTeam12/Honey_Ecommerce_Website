import { CheckCircle, Globe, Mic } from 'lucide-react';

export function PricingPlanPage() {
  return (
    <main className="max-w-7xl mx-auto px-6 py-12 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Our Pricing Plans</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Premium – Translation for Indian Languages */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Globe className="w-8 h-8" />
              <h2 className="text-3xl font-bold">Premium</h2>
            </div>
            <p className="text-xl">Translation for Indian Languages</p>
          </div>
          
          <div className="p-8">
            <p className="text-gray-700 leading-relaxed mb-6">
              Delivering excellence in every word, our Indian language translation services combine linguistic expertise with cultural sensitivity. Whether it's business, legal, academic, or creative content, we ensure that your message is clear, accurate, and resonates with your target audience.
            </p>

            <h3 className="font-semibold text-gray-900 text-lg mb-4">Key Features:</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Cultural Authenticity</h4>
                  <p className="text-gray-600">Translations that preserve meaning and local tone.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Industry-Specific Precision</h4>
                  <p className="text-gray-600">Tailored to your business sector and terminology.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Fast & Scalable Solutions</h4>
                  <p className="text-gray-600">Quick delivery for projects of any size.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Seamless Multi-Format Delivery</h4>
                  <p className="text-gray-600">Receive your content in your preferred format.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Premium – Translation for Foreign Languages */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Globe className="w-8 h-8" />
              <h2 className="text-3xl font-bold">Premium</h2>
            </div>
            <p className="text-xl">Translation for Foreign Languages</p>
          </div>
          
          <div className="p-8">
            <p className="text-gray-700 leading-relaxed mb-6">
              Reach global markets with confidence. Our professional translators deliver precise, culturally adapted translations for international audiences. Perfect for businesses, legal documents, marketing, and technical projects.
            </p>

            <h3 className="font-semibold text-gray-900 text-lg mb-4">Key Features:</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Global Market Adaptation</h4>
                  <p className="text-gray-600">Localization for international appeal.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Certified Quality Assurance</h4>
                  <p className="text-gray-600">Each project reviewed by expert linguists.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Localization Excellence</h4>
                  <p className="text-gray-600">Content tailored for language and culture.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Multi-Platform Integration</h4>
                  <p className="text-gray-600">Compatible formats for websites, apps, and print.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Premium – Transcription for Indian Languages */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Mic className="w-8 h-8" />
              <h2 className="text-3xl font-bold">Premium</h2>
            </div>
            <p className="text-xl">Transcription for Indian Languages</p>
          </div>
          
          <div className="p-8">
            <p className="text-gray-700 leading-relaxed mb-6">
              Convert your Indian language audio and video content into accurate, readable text. Our skilled transcribers ensure perfect timing, dialect precision, and confidentiality throughout the process.
            </p>

            <h3 className="font-semibold text-gray-900 text-lg mb-4">Key Features:</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Dialect-Specific Accuracy</h4>
                  <p className="text-gray-600">Supports multiple regional variations.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Time-Synced Output</h4>
                  <p className="text-gray-600">Perfect alignment with your recordings.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Multiple Format Support</h4>
                  <p className="text-gray-600">Receive transcripts in any required file format.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Expert Human Transcribers</h4>
                  <p className="text-gray-600">100% manual transcription for best accuracy.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Premium – Transcription for Foreign Languages */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow">
          <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Mic className="w-8 h-8" />
              <h2 className="text-3xl font-bold">Premium</h2>
            </div>
            <p className="text-xl">Transcription for Foreign Languages</p>
          </div>
          
          <div className="p-8">
            <p className="text-gray-700 leading-relaxed mb-6">
              Enhance accessibility and understanding with precise transcription services for global languages. Ideal for corporate, academic, media, and technical industries worldwide.
            </p>

            <h3 className="font-semibold text-gray-900 text-lg mb-4">Key Features:</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Native Language Expertise</h4>
                  <p className="text-gray-600">Transcribers fluent in native and target languages.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Industry-Specific Customization</h4>
                  <p className="text-gray-600">Tailored for your professional needs.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Multi-Language Capability</h4>
                  <p className="text-gray-600">Support for over 50 international languages.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Confidential & Secure Processing</h4>
                  <p className="text-gray-600">Data handled with strict privacy standards.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default PricingPlanPage;