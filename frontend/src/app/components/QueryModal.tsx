import React, { useState } from 'react';
import { X, MessageSquare, User, Phone, Mail, Send, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { publicAnonKey } from '@/app/utils/backendInfo';
import { API_URL } from '@/app/utils/api';
import { sanitizePhoneForCountry, validatePhoneForCountry } from '@/app/utils/phoneValidation';

interface QueryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const countries = [
  { code: 'IN', name: 'India', dialCode: '+91', minDigits: 10, maxDigits: 10, pattern: /^[6-9]\d{9}$/, patternMessage: 'Indian mobile numbers must start with 6, 7, 8, or 9' },
  { code: 'US', name: 'United States', dialCode: '+1', minDigits: 10, maxDigits: 10, pattern: /^\d{10}$/ },
  { code: 'CA', name: 'Canada', dialCode: '+1', minDigits: 10, maxDigits: 10, pattern: /^\d{10}$/ },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', minDigits: 10, maxDigits: 10, pattern: /^\d{10}$/ },
  { code: 'AE', name: 'UAE', dialCode: '+971', minDigits: 9, maxDigits: 9, pattern: /^\d{9}$/ },
  { code: 'SG', name: 'Singapore', dialCode: '+65', minDigits: 8, maxDigits: 8, pattern: /^\d{8}$/ },
  { code: 'AU', name: 'Australia', dialCode: '+61', minDigits: 9, maxDigits: 9, pattern: /^\d{9}$/ },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', minDigits: 8, maxDigits: 9, pattern: /^\d{8,9}$/ },
  { code: 'DE', name: 'Germany', dialCode: '+49', minDigits: 10, maxDigits: 11, pattern: /^\d{10,11}$/ },
  { code: 'FR', name: 'France', dialCode: '+33', minDigits: 9, maxDigits: 9, pattern: /^\d{9}$/ },
  { code: 'IT', name: 'Italy', dialCode: '+39', minDigits: 9, maxDigits: 10, pattern: /^\d{9,10}$/ },
  { code: 'ES', name: 'Spain', dialCode: '+34', minDigits: 9, maxDigits: 9, pattern: /^\d{9}$/ },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', minDigits: 9, maxDigits: 9, pattern: /^\d{9}$/ },
  { code: 'IE', name: 'Ireland', dialCode: '+353', minDigits: 9, maxDigits: 9, pattern: /^\d{9}$/ },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', minDigits: 9, maxDigits: 9, pattern: /^\d{9}$/ },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', minDigits: 9, maxDigits: 10, pattern: /^\d{9,10}$/ },
  { code: 'TH', name: 'Thailand', dialCode: '+66', minDigits: 8, maxDigits: 9, pattern: /^\d{8,9}$/ },
  { code: 'JP', name: 'Japan', dialCode: '+81', minDigits: 9, maxDigits: 10, pattern: /^\d{9,10}$/ },
  { code: 'KR', name: 'South Korea', dialCode: '+82', minDigits: 9, maxDigits: 10, pattern: /^\d{9,10}$/ },
  { code: 'CN', name: 'China', dialCode: '+86', minDigits: 11, maxDigits: 11, pattern: /^\d{11}$/ },
  { code: 'HK', name: 'Hong Kong', dialCode: '+852', minDigits: 8, maxDigits: 8, pattern: /^\d{8}$/ },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', minDigits: 9, maxDigits: 9, pattern: /^\d{9}$/ },
  { code: 'QA', name: 'Qatar', dialCode: '+974', minDigits: 8, maxDigits: 8, pattern: /^\d{8}$/ },
  { code: 'KW', name: 'Kuwait', dialCode: '+965', minDigits: 8, maxDigits: 8, pattern: /^\d{8}$/ },
  { code: 'OM', name: 'Oman', dialCode: '+968', minDigits: 8, maxDigits: 8, pattern: /^\d{8}$/ },
];

const getFlagUrl = (countryCode: string) =>
  `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;

export function QueryModal({ isOpen, onClose }: QueryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    country: 'IN',
    mobile: '',
    email: '',
    message: ''
  });
  const [errors, setErrors] = useState({
    mobile: '',
    email: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const selectedCountry = countries.find(country => country.code === formData.country) || countries[0];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateMobile = (mobile: string) => {
    const result = validatePhoneForCountry(mobile, selectedCountry);
    return result.isValid ? '' : (result.error || `Invalid mobile number format for ${selectedCountry.name}`);
  };

  const validateEmail = (email: string) => {
    if (!email.trim()) return '';
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email.trim()) ? '' : 'Please enter a valid email address';
  };

  const handleMobileChange = (value: string) => {
    const cleaned = sanitizePhoneForCountry(value, selectedCountry);
    const mobileError = cleaned ? validateMobile(cleaned) : '';
    setFormData(prev => ({ ...prev, mobile: cleaned }));
    setErrors(prev => ({ ...prev, mobile: mobileError }));
  };

  const handleCountryChange = (countryCode: string) => {
    const nextCountry = countries.find(country => country.code === countryCode) || countries[0];
    const sanitizedMobile = sanitizePhoneForCountry(formData.mobile, nextCountry);
    const mobileError = sanitizedMobile ? (validatePhoneForCountry(sanitizedMobile, nextCountry).error || '') : '';
    setFormData(prev => ({ ...prev, country: countryCode, mobile: sanitizedMobile }));
    setErrors(prev => ({ ...prev, mobile: mobileError }));
    setShowCountryDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    const mobileError = validateMobile(formData.mobile);
    const emailError = validateEmail(formData.email);

    setErrors({
      mobile: mobileError,
      email: emailError,
    });

    if (mobileError) {
      toast.error(mobileError);
      return;
    }
    if (emailError) {
      toast.error(emailError);
      return;
    }
    if (!formData.message.trim()) {
      toast.error('Please enter your message');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/customer-queries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          'apikey': publicAnonKey
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          mobile: `${selectedCountry.dialCode} ${formData.mobile.trim()}`,
          email: formData.email.trim() || undefined,
          message: formData.message.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit query');
      }

      toast.success('Your query has been submitted successfully! We will contact you soon.', {
        duration: 4000
      });

      setFormData({
        name: '',
        country: 'IN',
        mobile: '',
        email: '',
        message: ''
      });
      setErrors({
        mobile: '',
        email: '',
      });

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error submitting query:', error);
      toast.error('Failed to submit query. Please try again or contact us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-[#1a1f5c] to-[#252b70] text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Submit Your Query</h2>
              <p className="text-blue-100 text-sm">We'll get back to you soon</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Name <span className="text-red-500">*</span>
              </div>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a1f5c] focus:border-transparent outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Mobile Number <span className="text-red-500">*</span>
              </div>
            </label>
            <div className="grid grid-cols-[120px_1fr] gap-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCountryDropdown(prev => !prev)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a1f5c] focus:border-transparent outline-none transition-all bg-white"
                  title={selectedCountry.name}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <img
                      src={getFlagUrl(selectedCountry.code)}
                      alt={selectedCountry.name}
                      className="w-5 h-4 rounded-sm object-cover flex-shrink-0"
                    />
                    <span className="text-sm font-medium text-gray-700 truncate">{selectedCountry.dialCode}</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showCountryDropdown && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl">
                    {countries.map((country) => (
                      <button
                        key={country.code}
                        type="button"
                        onClick={() => handleCountryChange(country.code)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-blue-50 transition-colors ${
                          formData.country === country.code ? 'bg-blue-50' : ''
                        }`}
                      >
                        <img
                          src={getFlagUrl(country.code)}
                          alt={country.name}
                          className="w-5 h-4 rounded-sm object-cover flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800 truncate">{country.name}</p>
                          <p className="text-xs text-gray-500">{country.dialCode}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={(e) => handleMobileChange(e.target.value)}
                onBlur={() => setErrors(prev => ({ ...prev, mobile: validateMobile(formData.mobile) }))}
                placeholder={`${selectedCountry.minDigits === selectedCountry.maxDigits ? selectedCountry.maxDigits : `${selectedCountry.minDigits}-${selectedCountry.maxDigits}`} digits`}
                maxLength={selectedCountry.maxDigits}
                inputMode="numeric"
                className={`w-full px-4 py-3 border ${errors.mobile ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-[#1a1f5c] focus:border-transparent outline-none transition-all`}
                required
              />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 text-xs text-gray-500">
              <span className="flex items-center gap-2">
                <img
                  src={getFlagUrl(selectedCountry.code)}
                  alt={selectedCountry.name}
                  className="w-4 h-3 rounded-sm object-cover"
                />
                {selectedCountry.dialCode}
              </span>
              <span>{selectedCountry.minDigits === selectedCountry.maxDigits ? selectedCountry.maxDigits : `${selectedCountry.minDigits}-${selectedCountry.maxDigits}`} digits</span>
            </div>
            {errors.mobile && (
              <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address <span className="text-gray-400 text-xs">(Optional)</span>
              </div>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={(e) => {
                handleChange(e);
                setErrors(prev => ({ ...prev, email: '' }));
              }}
              placeholder="Enter your email address"
              className={`w-full px-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-[#1a1f5c] focus:border-transparent outline-none transition-all`}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Your Message <span className="text-red-500">*</span>
              </div>
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Please describe your query in detail..."
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a1f5c] focus:border-transparent outline-none transition-all resize-none"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-[#1a1f5c] to-[#252b70] text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Query
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
