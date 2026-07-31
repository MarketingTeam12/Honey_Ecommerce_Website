import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string | string[];
}

interface FAQCategory {
  id: string;
  title: string;
  faqs: FAQItem[];
}

export function FAQPage() {
  const [activeCategory, setActiveCategory] = useState('order-delivery');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(0);
  const [searchTerm, setSearchTerm] = useState('');

  const categories: FAQCategory[] = [
    {
      id: 'order-delivery',
      title: 'Order and delivery',
      faqs: [
        {
          question: 'How do I place my order for translation?',
          answer: [
            'First of all, go to "Order a translation" (Menu)',
            'Then choose the service you want to receive.',
            'Select your source/target language.',
            'Select the number of pages all the documents contain.',
            'Select the document type, and delivery option, in the delivery option choose "Yes" if it is an urgent delivery.',
            'Generally people requiring translation also need MEA Apostille so choose the option accordingly.',
            'Verify/edit the details we ask for - Pay - Place the order.'
          ]
        },
        {
          question: 'Can I place an order without creating an account?',
          answer: 'Yes, you can place an order as a guest without creating an account. However, creating an account allows you to track your orders and access order history.'
        },
        {
          question: 'Where is my order confirmation?',
          answer: 'Your order confirmation will be sent to your registered email address immediately after placing the order. Please check your spam folder if you don\'t see it in your inbox.'
        },
        {
          question: 'How do I cancel my order?',
          answer: 'To cancel your order, please contact our support team via email or phone within 24 hours of placing the order. Cancellation requests after work has begun may be subject to cancellation fees.'
        },
        {
          question: 'Will I receive soft copy or hard copy?',
          answer: 'You will receive both soft copy (PDF) via email and hard copy via courier delivery, depending on the service option you selected during checkout.'
        },
        {
          question: 'Will there be any delivery charges?',
          answer: 'Delivery charges depend on your location and delivery option. Standard delivery within India is usually free for orders above a certain amount. Express delivery and international shipping may have additional charges.'
        },
        {
          question: 'Do you courier all kind of translated documents?',
          answer: 'Yes, we courier all types of translated documents including certified translations, sworn translations, and regular document translations to your specified address.'
        }
      ]
    },
    {
      id: 'general-questions',
      title: 'Questions generally asked by people',
      faqs: [
        {
          question: 'What is Honey Universal Translation Services?',
          answer: 'Honey Universal is a professional translation service provider offering accurate and reliable translations for legal, personal, academic, and business documents. We focus on delivering high-quality translations that meet international standards.'
        },
        {
          question: 'Where is Honey Universal based?',
          answer: 'Honey Universal operates from India and serves customers across the country and internationally through our online platform at store.honeyuniversal.com.'
        },
        {
          question: 'When is a certified translation required?',
          answer: 'Certified translations are commonly required for visa, immigration, PR, education, and legal purposes. Many authorities require official documents to be translated into their approved language and certified for authenticity and acceptance.'
        },
        {
          question: 'What kind of documents can you translate?',
          answer: 'We handle all types of documents, including birth certificates, marriage certificates, passports, academic records, legal papers, business documents, and more.'
        },
        {
          question: 'Which languages are supported on your platform?',
          answer: 'We provide translation services in multiple international languages. Available language options can be viewed while placing an order. If your required language is not listed, our support team will assist you.'
        },
        {
          question: 'Who works on the translations?',
          answer: 'All translations are completed by qualified professional translators, supported by editors and proofreaders. Each translation follows the linguistic and formatting standards required by the target country.'
        },
        {
          question: 'Do you offer only certified translations?',
          answer: 'No. Honey Universal provides certified, non-certified, and sworn translations, depending on the purpose of your document.'
        },
        {
          question: 'Are your translations accepted for international use?',
          answer: 'Yes. Our certified translations are accepted by embassies, immigration authorities, universities, and legal institutions in India and abroad.'
        },
        {
          question: 'Is notarization necessary for translated documents?',
          answer: 'Notarization is mandatory for certain countries, such as Canada. For other destinations, it may be optional but is often recommended as an additional level of authentication.'
        },
        {
          question: 'How can I submit documents for translation?',
          answer: 'You can place your order completely online through store.honeyuniversal.com: Go to Order a Translation, Select the required service and language pair, Upload your documents, Complete checkout. If you need help, you can contact us via email or WhatsApp, and our team will assist you.'
        },
        {
          question: 'Do I need to submit original documents?',
          answer: 'No. Scanned copies or clear photographs of your documents are sufficient for translation.'
        },
        {
          question: 'Do I need to visit your office to collect my documents?',
          answer: 'No visit is required. You will receive the soft copy by email, and if you opt for hard copies, they will be delivered to your address by courier.'
        },
        {
          question: 'My birth certificate does not mention a name. Can you include it?',
          answer: 'No. We translate documents exactly as per the original. We do not add, remove, or alter any information. This format is commonly accepted by authorities.'
        },
        {
          question: 'Do you offer discounts for bulk translations?',
          answer: 'Yes. Bulk discounts may be applied based on page count, word volume, or repetition across documents.'
        },
        {
          question: 'What is the usual turnaround time?',
          answer: '1–7 pages: 2–3 working days, 8–20 pages: 3–5 working days, 21–40 pages: 5–7 working days (Sundays and public holidays are excluded). Hard copies are dispatched the next working day after email delivery.'
        },
        {
          question: 'Is Honey Universal a government-authorized agency?',
          answer: 'Currently, India does not have government-authorized translation agencies. However, we strictly follow international guidelines required by embassies, immigration offices, and legal authorities.'
        },
        {
          question: 'Should I select notarization while placing an order?',
          answer: 'Notarization is mandatory for Canada and optional for other countries. Many customers choose it for additional assurance during visa and legal submissions.'
        }
      ]
    },
    {
      id: 'payment',
      title: 'Payment',
      faqs: [
        {
          question: 'Which payment options can I use on store.honeyuniversal.com?',
          answer: 'Currently, we accept Razorpay only for all transactions on our website. You can safely complete your order using Zoho\'s secure payment gateway.'
        },
        {
          question: 'Is my payment information safe when I pay online?',
          answer: 'Yes. All payments are processed through Razorpay, which uses secure encryption and industry-standard security protocols. Your card or banking details are never stored on our website.'
        },
        {
          question: 'Can I get my money back if I am not satisfied with the service?',
          answer: 'Yes. Refunds are possible under our refund policy. If you are unsatisfied with the service, please contact us at salesteam@honeytranslations.com within the stipulated time, and our team will guide you through the refund process.'
        },
        {
          question: 'Do you accept international payments?',
          answer: 'Yes. Razorpay supports multiple currencies, allowing international customers to pay securely through the same platform.'
        },
        {
          question: 'Can I pay in installments or partial payments?',
          answer: 'No. At the moment, full payment is required upfront via Razorpay to process your order.'
        }
      ]
    },
    {
      id: 'whatsapp-translation',
      title: 'Questions related to WhatsApp chat translation',
      faqs: [
        {
          question: 'How can I share my documents via WhatsApp?',
          answer: 'You can easily send your documents to us using WhatsApp. Simply click on the WhatsApp button on store.honeyuniversal.com or save our official number and send the scanned copies or clear photos of your documents. Our team will confirm once we receive them.'
        },
        {
          question: 'Can I request a price quote through WhatsApp?',
          answer: 'Yes! You can get an instant quotation by sending your document details via WhatsApp. Our support team will review your documents and provide a quote promptly.'
        },
        {
          question: 'Is it safe to send documents over WhatsApp?',
          answer: 'Yes. We take privacy and security seriously. Documents sent via WhatsApp are accessed only by our authorized team and are used solely for processing your order.'
        },
        {
          question: 'Can I place an order completely through WhatsApp?',
          answer: 'Yes, you can start your order via WhatsApp, but payment and final confirmation will still be completed securely through store.honeyuniversal.com using Razorpay.'
        },
        {
          question: 'Will I receive updates about my order on WhatsApp?',
          answer: 'Absolutely! Our team can send status updates, draft approvals, and delivery notifications through WhatsApp for your convenience.'
        }
      ]
    },
    {
      id: 'mea-apostille',
      title: 'Queries about MEA Apostille',
      faqs: [
        {
          question: 'Can I apply for MEA Apostille services online?',
          answer: 'Yes. You can easily place an order for MEA Apostille services online through store.honeyuniversal.com. Simply select the MEA Apostille option on our website and complete the order process.'
        },
        {
          question: 'What should I do if my document type is not listed on the Apostille page?',
          answer: 'If your document is not available on the Apostille product page, please email your requirement along with the document to salesteam@honeytranslations.com. Our support team will review your request and contact you with the next steps.'
        },
        {
          question: 'How long does the MEA Apostille process usually take?',
          answer: 'The Apostille process currently takes around 20–22 working days after we receive your documents. Processing timelines may vary depending on MEA regulations and workload.'
        },
        {
          question: 'How can I submit my documents for Apostille?',
          answer: 'You can send your documents via any reliable courier service to our office address, or hand-deliver them if you are nearby. Once we receive the documents, we will begin the Apostille process immediately.'
        },
        {
          question: 'Is Apostille possible on a color photocopy of the document?',
          answer: 'Yes. Color photocopies of original documents can be accepted for MEA Apostille, depending on the document type and requirements.'
        },
        {
          question: 'My documents are in India, but I am living abroad. Can you still help?',
          answer: 'Yes. If your documents were issued in India and are currently located in India, we can complete the Apostille process and dispatch the documents to any Indian or international address as per your preference.'
        },
        {
          question: 'Do I need to courier digitally issued or QR-code-based documents?',
          answer: 'No. If your document is digitally issued, downloadable, or contains a QR code, there is no need to courier the physical document. You can simply upload or share the file online, and we will process it accordingly.'
        },
        {
          question: 'Will my Apostilled documents be returned safely?',
          answer: 'Yes. Once the Apostille process is completed, we securely dispatch the documents to the address you provide using trusted courier partners.'
        }
      ]
    }
  ];

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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search FAQs
                </label>
                <input
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
                <nav className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setActiveCategory(category.id);
                        setExpandedFAQ(null);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-md transition-colors ${
                        activeCategory === category.id
                          ? 'bg-[#0a1247] text-white font-medium'
                          : 'bg-gray-50 text-gray-700 hover:bg-[#0a1247]/10'
                      }`}
                    >
                      {category.title}
                    </button>
                  ))}
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
                      onClick={() => toggleFAQ(index)}
                      className="w-full flex items-start justify-between text-left group"
                    >
                      <span className="text-[#0a1247] hover:text-[#1a2457] font-medium pr-4">
                        {faq.question}
                      </span>
                      {expandedFAQ === index ? (
                        <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
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