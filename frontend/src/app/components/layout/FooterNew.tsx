import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, Youtube } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import { publicAnonKey } from '@/app/utils/backendInfo';
import { API_URL } from '@/app/utils/api';

export function FooterNew() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleLinkClick = (path: string) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    navigate(path);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('📧 Subscribing email:', email);
      
      const response = await fetch(
        `${API_URL}/subscribe-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
            'apikey': publicAnonKey
          },
          body: JSON.stringify({ email })
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Successfully subscribed to our newsletter!');
        setEmail(''); // Clear the input
        
        // Dispatch event for admin panel notification
        window.dispatchEvent(new CustomEvent('notificationsUpdated'));
        
        console.log('✅ Email subscription successful');
      } else {
        toast.error(data.message || 'Failed to subscribe. Please try again.');
        console.error('❌ Subscription failed:', data.message);
      }
    } catch (error) {
      console.error('❌ Subscribe error:', error);
      toast.error('Failed to subscribe. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-gray-900 text-white pt-8 pb-4">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-6">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-3">Company Info</h3>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => handleLinkClick('/#about-company')} 
                  className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-left"
                >
                  About Company
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleLinkClick('/faq')} 
                  className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-left"
                >
                  FAQ
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleLinkClick('/blog')} 
                  className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-left"
                >
                  Blog
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleLinkClick('/refund-cancellation-policy')} 
                  className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-left"
                >
                  Refund & Cancellation Policy
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleLinkClick('/privacy-policy')} 
                  className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleLinkClick('/terms-and-conditions')} 
                  className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-left"
                >
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleLinkClick('/terms-of-service')} 
                  className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-left"
                >
                  Terms of Service
                </button>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-xl font-bold mb-3">Services</h3>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => handleLinkClick('/apostille')} 
                  className="text-gray-400 hover:text-white transition-colors text-left"
                >
                  Apostille Translation
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleLinkClick('/language')} 
                  className="text-gray-400 hover:text-white transition-colors text-left"
                >
                  Language
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleLinkClick('/attestation')} 
                  className="text-gray-400 hover:text-white transition-colors text-left"
                >
                  Attestation
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleLinkClick('/startup')} 
                  className="text-gray-400 hover:text-white transition-colors text-left"
                >
                  Startup Package
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleLinkClick('/work-sample')} 
                  className="text-gray-400 hover:text-white transition-colors text-left"
                >
                  Work Sample
                </button>
              </li>
            </ul>
          </div>

          {/* Get in Touch */}
          <div>
            <h3 className="text-xl font-bold mb-3">Get in Touch</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-green-400" />
                <a href="tel:+917299005577" className="text-gray-400 hover:text-white transition-colors">
                  +91 72990 05577
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-red-400" />
                <a href="mailto:salesteam@honeytranslations.com" className="text-gray-400 hover:text-white transition-colors">
                  salesteam@honeytranslations.com
                </a>
              </li>
            </ul>

            <div className="flex gap-3 mt-4">
              <a
                href="https://www.facebook.com/honeytranslationservices"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com/honeytranslations"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://www.linkedin.com/company/53401447/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="https://www.instagram.com/honey_translation_services_/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 transition-all"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.youtube.com/channel/UCXv7v7v7v7v7v7v7v7v7v7"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-xl font-bold mb-3">Subscribe & Stay Informed</h3>
            <p className="text-gray-400 mb-2">
              Get updates on our latest services and special offers.
            </p>
            <form className="space-y-2" onSubmit={handleSubscribe}>
              <input
                type="email"
                placeholder="Your email address"
                className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-blue-600 outline-none transition-colors"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-4 text-center">
          <p className="text-gray-400">
            &copy; {new Date().getFullYear()} Honey Universal Digital Private Limited. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

