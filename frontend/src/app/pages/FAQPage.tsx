import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FAQ_CATEGORIES } from '@/app/data/faqData';

export function FAQPage() {
  const [activeCategory, setActiveCategory] = useState('order-delivery');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(0);
  const [searchTerm, setSearchTerm] = useState('');

  const categories = FAQ_CATEGORIES;

  const currentCategory = categories.find(cat => cat.id === activeCategory);

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section 
        className="relative bg-gradient-to-r from-[#0a1247] to-[#1a2457] text-white py-16"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1920&h=400&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1247]/90 to-[#1a2457]/90"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <h1 className="text-5xl font-bold mb-4">FAQ</h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            Find answers to frequently asked questions about our translation services, apostille, payments, and more.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              {/* Search Box */}
              <div className="mb-6">
                <label htmlFor="faq-search" className="block text-sm font-medium text-gray-700 mb-2">
                  Search FAQs
                </label>
                <input
                  id="faq-search"
                  type="text"
                  placeholder="Search.."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0a1247] focus:border-transparent"
                />
              </div>

              {/* Category Navigation */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
                <nav aria-label="FAQ categories">
                  <ul className="flex flex-col gap-3">
                    {categories.map((category) => (
                      <li key={category.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveCategory(category.id);
                            setExpandedFAQ(null);
                          }}
                          className={`block w-full text-left px-4 py-3 rounded-md border transition-colors ${
                            activeCategory === category.id
                              ? 'bg-[#0a1247] text-white border-[#0a1247] font-medium'
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-[#0a1247]/10'
                          }`}
                        >
                          {category.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 uppercase tracking-wide">
                {currentCategory?.title}
              </h2>

              {/* FAQ Questions List */}
              <div className="space-y-4">
                {currentCategory?.faqs.map((faq, index) => (
                  <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <button
                      type="button"
                      aria-expanded={expandedFAQ === index}
                      onClick={() => toggleFAQ(index)}
                      className="w-full min-h-[44px] py-2 flex items-start justify-between text-left group"
                    >
                      <span className="text-[#0a1247] hover:text-[#1a2457] font-medium pr-4">
                        {faq.question}
                      </span>
                      {expandedFAQ === index ? (
                        <ChevronUp className="w-5 h-5 text-gray-600 flex-shrink-0 mt-1" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600 flex-shrink-0 mt-1" aria-hidden="true" />
                      )}
                    </button>

                    {/* Expanded Answer */}
                    {expandedFAQ === index && (
                      <div className="mt-4 text-gray-700">
                        {Array.isArray(faq.answer) ? (
                          <div className="space-y-2">
                            <p className="mb-3">Here we have created a complete guide to how you can place your order:-</p>
                            <ol className="list-decimal list-inside space-y-2 ml-2">
                              {faq.answer.map((step, stepIndex) => (
                                <li key={stepIndex} className="leading-relaxed">{step}</li>
                              ))}
                            </ol>
                          </div>
                        ) : (
                          <p className="leading-relaxed">{faq.answer}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default FAQPage;