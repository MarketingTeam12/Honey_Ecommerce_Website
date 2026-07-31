import { useState } from 'react';
import { toast } from 'sonner';
import { publicAnonKey } from '@/app/utils/backendInfo';
import { API_URL } from '@/app/utils/api';
import { motion } from 'motion/react';
import { Phone, Mail, Send } from 'lucide-react';
import { sanitizePhoneForCountry, validatePhoneForCountry } from '@/app/utils/phoneValidation';

// Country configurations with flags and validation
const countries = [
  { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91', maxDigits: 10, minDigits: 10, pattern: /^[6-9]\d{9}$/, patternMessage: 'Indian mobile numbers must start with 6, 7, 8, or 9' },
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1', maxDigits: 10, minDigits: 10, pattern: /^\d{10}$/ },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44', maxDigits: 10, minDigits: 10, pattern: /^\d{10}$/ },
  { code: 'AE', name: 'UAE', flag: '🇦🇪', dialCode: '+971', maxDigits: 9, minDigits: 9, pattern: /^\d{9}$/ },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', dialCode: '+65', maxDigits: 8, minDigits: 8, pattern: /^\d{8}$/ },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61', maxDigits: 9, minDigits: 9, pattern: /^\d{9}$/ },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1', maxDigits: 10, minDigits: 10, pattern: /^\d{10}$/ },
];

export function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    country: 'IN', // Default to India
    mobile: '',
    email: '',
    message: '',
    verification: '',
  });

  const [errors, setErrors] = useState({
    mobile: '',
    email: '',
    message: '',
  });

  const selectedCountry = countries.find(c => c.code === formData.country) || countries[0];

  const validateMobile = (mobile: string) => {
    const result = validatePhoneForCountry(mobile, selectedCountry);
    return result.isValid ? '' : (result.error || `Invalid mobile number format for ${selectedCountry.name}`);
  };

  const validateEmail = (email: string) => {
    if (!email) {
      return 'Email is required';
    }
    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return 'Please enter a valid email address';
    }
    
    return '';
  };

  const validateMessage = (message: string) => {
    if (!message || message.trim() === '') {
      return 'Message is required';
    }
    
    if (message.trim().length < 10) {
      return 'Message must be at least 10 characters';
    }
    
    return '';
  };

  const handleMobileChange = (value: string) => {
    const cleaned = sanitizePhoneForCountry(value, selectedCountry);
    const mobileError = cleaned ? validateMobile(cleaned) : '';
    setFormData({ ...formData, mobile: cleaned });
    setErrors({ ...errors, mobile: mobileError });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const mobileError = validateMobile(formData.mobile);
    const emailError = validateEmail(formData.email);
    const messageError = validateMessage(formData.message);
    
    setErrors({
      mobile: mobileError,
      email: emailError,
      message: messageError,
    });
    
    if (mobileError || emailError || messageError) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    // Verify math captcha
    if (formData.verification !== '10') {
      toast.error('Incorrect verification code. 7 + 3 = 10');
      return;
    }
    
    try {
      
      const response = await fetch(`${API_URL}/customer-queries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          mobile: `${selectedCountry.dialCode} ${formData.mobile}`,
          email: formData.email,
          message: formData.message,
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit query');
      }
      
      toast.success('Message sent successfully! We will contact you soon.');
      
      // Reset form
      setFormData({
        name: '',
        country: 'IN',
        mobile: '',
        email: '',
        message: '',
        verification: '',
      });
      setErrors({ mobile: '', email: '', message: '' });
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to send message. Please try again.');
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
            <p className="text-blue-100 mt-2">We are the Leading Translation Service for Indian and Foreign Languages</p>
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
                  Country <span className="text-red-600">*</span>
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => {
                    const nextCountry = countries.find(c => c.code === e.target.value) || countries[0];
                    const sanitizedMobile = sanitizePhoneForCountry(formData.mobile, nextCountry);
                    const mobileError = sanitizedMobile ? (validatePhoneForCountry(sanitizedMobile, nextCountry).error || '') : '';
                    setFormData({ ...formData, country: e.target.value, mobile: sanitizedMobile });
                    setErrors({ ...errors, mobile: mobileError });
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 outline-none transition-colors"
                >
                  {countries.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.flag} {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Mobile <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-0 top-0 h-full flex items-center pl-4 pointer-events-none">
                    <span className="text-2xl mr-2">{selectedCountry.flag}</span>
                    <span className="text-gray-600 font-medium">{selectedCountry.dialCode}</span>
                  </div>
                  <input
                    type="tel"
                    required
                    value={formData.mobile}
                    onChange={(e) => handleMobileChange(e.target.value)}
                    onBlur={() => setErrors({ ...errors, mobile: validateMobile(formData.mobile) })}
                    className={`w-full pl-28 pr-4 py-3 border-2 ${errors.mobile ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:border-blue-600 outline-none transition-colors`}
                    placeholder={`${selectedCountry.maxDigits} digits`}
                  />
                </div>
                {errors.mobile && <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>}
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Email <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    setErrors({ ...errors, email: '' });
                  }}
                  className={`w-full px-4 py-3 border-2 ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:border-blue-600 outline-none transition-colors`}
                  placeholder="your.email@example.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Message <span className="text-red-600">*</span>
                </label>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) => {
                    setFormData({ ...formData, message: e.target.value });
                    setErrors({ ...errors, message: '' });
                  }}
                  rows={5}
                  className={`w-full px-4 py-3 border-2 ${errors.message ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:border-blue-600 outline-none transition-colors resize-none`}
                  placeholder="Tell us about your translation needs... (minimum 10 characters)"
                ></textarea>
                {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message}</p>}
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Verification Code <span className="text-red-600">*</span>
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
              >
                <Send className="w-5 h-5" />
                Send Message
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

export default ContactPage;

