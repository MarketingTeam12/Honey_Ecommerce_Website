import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { publicAnonKey } from '@/app/utils/backendInfo';
import { API_URL } from '@/app/utils/api';
import { useCookieConsent } from '@/app/context/CookieConsentContext';

export function FooterNew() {
  const { openSettings } = useCookieConsent();
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lastSubscribeAtRef = useRef<number>(0);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const nowMs = Date.now();
    if (nowMs - lastSubscribeAtRef.current < 5_000) {
      toast.error('Please wait a few seconds before trying again.');
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch(
        `${API_URL}/subscribe-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
            'apikey': publicAnonKey
          },
          body: JSON.stringify({ email: email.trim(), website })
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        lastSubscribeAtRef.current = Date.now();
        if (data.alreadySubscribed) {
          toast.info(data.message || 'You are already subscribed to our newsletter.');
        } else {
          toast.success(data.message || 'Successfully subscribed to our newsletter!');
        }
        setEmail(''); // Clear the input
        setWebsite('');
        
        // Dispatch event for admin panel notification
        window.dispatchEvent(new CustomEvent('notificationsUpdated'));
      } else {
        toast.error(data.message || data.error || 'Failed to subscribe. Please try again.');
      }
    } catch (error) {
      console.error('❌ Subscribe error:', error);
      toast.error('Failed to subscribe. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-gray-900 text-white pt-8 pb-36">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-6">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-3">Company Info</h3>
            <ul className="space-y-1 md:space-y-2">
              <li>
                <Link
                  to="/about"
                  onClick={scrollToTop}
                  className="text-gray-300 hover:text-white transition-colors inline-flex items-center gap-2 text-left min-h-[44px] md:min-h-0 py-1 md:py-0"
                >
                  About Company
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  onClick={scrollToTop}
                  className="text-gray-300 hover:text-white transition-colors inline-flex items-center gap-2 text-left min-h-[44px] md:min-h-0 py-1 md:py-0"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  to="/blog"
                  onClick={scrollToTop}
                  className="text-gray-300 hover:text-white transition-colors inline-flex items-center gap-2 text-left min-h-[44px] md:min-h-0 py-1 md:py-0"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  to="/refund-cancellation-policy"
                  onClick={scrollToTop}
                  className="text-gray-300 hover:text-white transition-colors inline-flex items-center gap-2 text-left min-h-[44px] md:min-h-0 py-1 md:py-0"
                >
                  Refund & Cancellation Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy-policy"
                  onClick={scrollToTop}
                  className="text-gray-300 hover:text-white transition-colors inline-flex items-center gap-2 text-left min-h-[44px] md:min-h-0 py-1 md:py-0"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms-and-conditions"
                  onClick={scrollToTop}
                  className="text-gray-300 hover:text-white transition-colors inline-flex items-center gap-2 text-left min-h-[44px] md:min-h-0 py-1 md:py-0"
                >
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link
                  to="/terms-of-service"
                  onClick={scrollToTop}
                  className="text-gray-300 hover:text-white transition-colors inline-flex items-center gap-2 text-left min-h-[44px] md:min-h-0 py-1 md:py-0"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-xl font-bold mb-3">Services</h3>
            <ul className="space-y-1 md:space-y-2">
              <li>
                <Link
                  to="/apostille"
                  onClick={scrollToTop}
                  className="text-gray-300 hover:text-white transition-colors inline-flex items-center text-left min-h-[44px] md:min-h-0 py-1 md:py-0"
                >
                  Apostille Services
                </Link>
              </li>
              <li>
                <Link
                  to="/language"
                  onClick={scrollToTop}
                  className="text-gray-300 hover:text-white transition-colors inline-flex items-center text-left min-h-[44px] md:min-h-0 py-1 md:py-0"
                >
                  Translation Services
                </Link>
              </li>
              <li>
                <Link
                  to="/attestation"
                  onClick={scrollToTop}
                  className="text-gray-300 hover:text-white transition-colors inline-flex items-center text-left min-h-[44px] md:min-h-0 py-1 md:py-0"
                >
                  Attestation Services
                </Link>
              </li>
              <li>
                <Link
                  to="/startup"
                  onClick={scrollToTop}
                  className="text-gray-300 hover:text-white transition-colors inline-flex items-center text-left min-h-[44px] md:min-h-0 py-1 md:py-0"
                >
                  Startup Packages
                </Link>
              </li>
              <li>
                <Link
                  to="/work-sample"
                  onClick={scrollToTop}
                  className="text-gray-300 hover:text-white transition-colors inline-flex items-center text-left min-h-[44px] md:min-h-0 py-1 md:py-0"
                >
                  Work Sample
                </Link>
              </li>
            </ul>
          </div>

          {/* Get in Touch */}
          <div>
            <h3 className="text-xl font-bold mb-3">Get in Touch</h3>
            <ul className="space-y-2 md:space-y-3">
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-green-400" aria-hidden="true" />
                <a href="tel:+917299005577" className="text-gray-300 hover:text-white transition-colors min-h-[44px] md:min-h-0 inline-flex items-center">
                  +91 72990 05577
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-red-400" aria-hidden="true" />
                <a href="mailto:salesteam@honeytranslations.com" className="text-gray-300 hover:text-white transition-colors min-h-[44px] md:min-h-0 inline-flex items-center">
                  salesteam@honeytranslations.com
                </a>
              </li>
            </ul>

            <div className="flex flex-wrap gap-3 mt-4">
              <a
                href="https://www.facebook.com/honeytranslationservices"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 min-w-[44px] min-h-[44px] bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" aria-hidden="true" />
              </a>
              <a
                href="https://twitter.com/honeytranslations"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 min-w-[44px] min-h-[44px] bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" aria-hidden="true" />
              </a>
              <a
                href="https://www.linkedin.com/company/53401447/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 min-w-[44px] min-h-[44px] bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" aria-hidden="true" />
              </a>
              <a
                href="https://www.instagram.com/honey_translation_services_/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 min-w-[44px] min-h-[44px] bg-gray-800 rounded-full flex items-center justify-center hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 transition-all"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" aria-hidden="true" />
              </a>
              <a
                href="https://www.youtube.com/channel/UCXv7v7v7v7v7v7v7v7v7v7"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 min-w-[44px] min-h-[44px] bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-5 h-5" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-xl font-bold mb-3">Subscribe & Stay Informed</h3>
            <p className="text-gray-300 mb-2">
              Get updates on our latest services and special offers.
            </p>
            <form className="space-y-2" onSubmit={handleSubscribe}>
              <div className="hidden" aria-hidden="true">
                <label htmlFor="footer-newsletter-website">Website</label>
                <input
                  id="footer-newsletter-website"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
              <label htmlFor="footer-newsletter-email" className="sr-only">
                Email address for newsletter
              </label>
              <input
                id="footer-newsletter-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Your email address"
                className="w-full min-h-[44px] px-4 py-3 rounded-lg bg-gray-800 text-white placeholder:text-gray-400 border border-gray-600 focus:border-blue-400 transition-colors"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                type="submit"
                className="w-full min-h-[44px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-4 text-center flex flex-col sm:flex-row items-center justify-center gap-3">
          <p className="text-gray-300">
            &copy; {new Date().getFullYear()} Honey Universal Digital Private Limited. All rights reserved.
          </p>
          <button
            type="button"
            onClick={openSettings}
            className="min-h-[44px] px-2 text-sm text-gray-300 underline hover:text-white transition-colors"
          >
            Cookie settings
          </button>
        </div>
      </div>
    </footer>
  );
}

