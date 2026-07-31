import { Facebook, Linkedin, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import { publicAnonKey } from '@/app/utils/backendInfo';
import { API_URL } from '@/app/utils/api';

export function Footer() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">Company Info</h3>
            <ul className="space-y-2">
              <li><Link to="/#about-company" className="text-gray-400 hover:text-white transition-colors">About Company</Link></li>
              <li><Link to="/faq" className="text-gray-400 hover:text-white transition-colors">FAQ</Link></li>
              <li><Link to="/pricing-plan" className="text-gray-400 hover:text-white transition-colors">Pricing Plan</Link></li>
              <li><Link to="/refund-cancellation-policy" className="text-gray-400 hover:text-white transition-colors">Refund & Cancellation Policy</Link></li>
              <li><Link to="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-and-conditions" className="text-gray-400 hover:text-white transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/terms-of-service" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-xl font-bold mb-4">Services</h3>
            <ul className="space-y-2">
              <li><Link to="/all-apostille-products" className="text-gray-400 hover:text-white transition-colors">Apostille Translation</Link></li>
              <li><Link to="/sworn-translations" className="text-gray-400 hover:text-white transition-colors">Sworn Translation</Link></li>
              <li><Link to="/work-sample" className="text-gray-400 hover:text-white transition-colors">Work Sample</Link></li>
            </ul>
          </div>

          {/* Get in Touch */}
          <div>
            <h3 className="text-xl font-bold mb-4">Get in Touch</h3>
            <ul className="space-y-2 text-gray-400">
              <li>123 Translation Street</li>
              <li>Mumbai, India 400001</li>
              <li>+91 7299005577</li>
              <li>salesteam@honeytranslations.com</li>
            </ul>
            <div className="flex gap-4 mt-6">
              <a 
                href="https://www.facebook.com/honeytranslationservices" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                aria-label="Visit our Facebook page"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="https://www.linkedin.com/uas/login?session_redirect=https%3A%2F%2Fwww.linkedin.com%2Fcompany%2F53401447%2Fadmin%2Fdashboard%2F" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                aria-label="Visit our LinkedIn page"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a 
                href="https://www.instagram.com/honey_translation_services_/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors"
                aria-label="Visit our Instagram page"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-xl font-bold mb-4">Newsletter Subscription</h3>
            <form className="space-y-3" onSubmit={handleSubscribe}>
              <input
                type="email"
                placeholder="Your email"
                className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-blue-600 outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors" disabled={isSubmitting}>
                {isSubmitting ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
          <p>&copy; 2024 Honey Universal Digital Private Limited. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
