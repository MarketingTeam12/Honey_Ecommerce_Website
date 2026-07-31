import { useState } from 'react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { Phone, Mail, Send } from 'lucide-react';
import { API_URL } from '@/app/utils/api';

function ContactUsPage() {
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    message: '',
    verification: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verify the captcha
    if (formData.verification !== '10') {
      toast.error('Incorrect verification code. 7 + 3 = 10');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      
      const response = await fetch(`${API_URL}/customer-queries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          mobile: formData.mobile,
          email: formData.email || '',
          message: formData.message || ''
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit message');
      }
      
      toast.success('Message sent successfully! We will contact you soon.');
      
      // Reset form
      setFormData({
        name: '',
        mobile: '',
        email: '',
        message: '',
        verification: '',
      });
    } catch (error) {
      console.error('Error submitting message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-16">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <div className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-2xl shadow-lg mb-6">
            <h2 className="text-2xl font-bold">Get Free Quote</h2>
            <p className="text-blue-100 mt-2">We Are the Leading Translation Service for Indian and Foreign Languages.</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl p-8"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Send Us a Message</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 outline-none transition-colors"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Mobile <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 outline-none transition-colors"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Email <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 outline-none transition-colors"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Message <span className="text-gray-400">(Optional)</span>
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 outline-none transition-colors resize-none"
                  placeholder="Tell us about your translation needs..."
                ></textarea>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Verification Code
                </label>
                <div className="flex items-center gap-4">
                  <div className="bg-gray-200 px-6 py-3 rounded-lg font-bold text-2xl select-none">
                    7 + 3 = ?
                  </div>
                  <input
                    type="number"
                    required
                    value={formData.verification}
                    onChange={(e) => setFormData({ ...formData, verification: e.target.value })}
                    className="w-24 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 outline-none transition-colors"
                    placeholder="10"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                disabled={isSubmitting}
              >
                <Send className="w-5 h-5" />
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-8"
          >
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
              <h3 className="text-2xl font-bold mb-6">Get in Touch</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">Phone</h4>
                    <a href="tel:+917299005577" className="text-blue-100 hover:text-white transition-colors">
                      +91 72990 05577
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">Email</h4>
                    <a href="mailto:salesteam@honeytranslations.com" className="text-blue-100 hover:text-white transition-colors">
                      salesteam@honeytranslations.com
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Business Hours</h3>
              <div className="space-y-3 text-gray-700">
                <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                  <span className="font-medium">Monday - Saturday</span>
                  <span className="text-blue-600 font-bold">9:30 AM - 6:30 PM</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Sunday</span>
                  <span className="text-red-600 font-bold">Closed</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl p-8 text-white shadow-2xl">
              <h3 className="text-2xl font-bold mb-3">Quick Response Guaranteed</h3>
              <p className="text-green-100 leading-relaxed">
                We strive to respond to all inquiries within 2-4 hours during business hours. For urgent matters, please call us directly or contact via WhatsApp.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default ContactUsPage;
