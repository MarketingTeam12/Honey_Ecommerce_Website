import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MessageCircle,
  Youtube,
  Headphones,
  FileText,
  Clock,
  Users,
  Award,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Send,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import honeyLogo from '@/assets/honey-log.webp';
import { publicAnonKey } from '@/app/utils/backendInfo';
import { API_URL } from '@/app/utils/api';
import { QueryModal } from '@/app/components/QueryModal';

export function FooterNew() {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [queryModalOpen, setQueryModalOpen] = useState(false);
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
      const response = await fetch(`${API_URL}/subscribe-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
          apikey: publicAnonKey,
        },
        body: JSON.stringify({ email: email.trim(), website }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        lastSubscribeAtRef.current = Date.now();
        if (data.alreadySubscribed) {
          toast.info(data.message || 'You are already subscribed to our newsletter.');
        } else {
          toast.success(data.message || 'Successfully subscribed to our newsletter!');
        }
        setEmail('');
        setWebsite('');

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
    <>
      <footer className="bg-[#060c2c] text-white">
        {/* ========================================================= */}
        {/* TOP PRE-FOOTER CTA BAR */}
        {/* ========================================================= */}
        <div className="border-b border-white/10 bg-[#081038] py-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-white shadow-inner">
                <Headphones className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Need Certified Translation or Apostille Support Right Now?
                </h3>
                <p className="text-sm text-gray-300 mt-1">
                  We're available 24/7 in 50+ languages with fast certified turnaround.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setQueryModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#f59e0b] hover:bg-[#d97706] text-gray-950 font-bold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <FileText className="w-5 h-5 text-gray-950" />
                Request Enterprise Quote
              </button>

              <a
                href="tel:+917299005577"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0a1240] hover:bg-[#121c54] border border-white/20 text-white font-medium text-sm sm:text-base shadow-md hover:shadow-lg transition-all"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                Call Now: +91 72990 05577
              </a>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MAIN 6-COLUMN FOOTER BODY */}
        {/* ========================================================= */}
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-8 xl:gap-10">
            
            {/* COLUMN 1: Brand & Highlights */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white p-3 rounded-xl inline-block shadow-md">
                <img
                  src={honeyLogo}
                  alt="Honey Translation Services"
                  className="h-10 w-auto object-contain"
                />
              </div>

              <p className="text-xs text-gray-300 leading-relaxed">
                Honey Universal Digital Private Limited delivers premium certified translation,
                apostille, and embassy attestation services globally with accuracy and confidentiality.
              </p>

              <ul className="space-y-2 text-xs text-gray-300 pt-2 border-t border-white/10">
                <li className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <span>24/7 Support</span>
                </li>
                <li className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <span>1000+ Clients</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <span>5000+ Projects</span>
                </li>
                <li className="flex items-center gap-2">
                  <Award className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <span>ISO 9001:2015 Certified</span>
                </li>
              </ul>
            </div>

            {/* COLUMN 2: Quick Links */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
                Quick Links
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <Link
                    to="/"
                    onClick={scrollToTop}
                    className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400/70 group-hover:text-blue-300 flex-shrink-0" />
                    <span>Home</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/about"
                    onClick={scrollToTop}
                    className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400/70 group-hover:text-blue-300 flex-shrink-0" />
                    <span>About Us</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/language"
                    onClick={scrollToTop}
                    className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400/70 group-hover:text-blue-300 flex-shrink-0" />
                    <span>Services</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/work-sample"
                    onClick={scrollToTop}
                    className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400/70 group-hover:text-blue-300 flex-shrink-0" />
                    <span>Work Samples</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    onClick={scrollToTop}
                    className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400/70 group-hover:text-blue-300 flex-shrink-0" />
                    <span>Contact Us</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/track-order"
                    onClick={scrollToTop}
                    className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400/70 group-hover:text-blue-300 flex-shrink-0" />
                    <span>Track Order</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/faq"
                    onClick={scrollToTop}
                    className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400/70 group-hover:text-blue-300 flex-shrink-0" />
                    <span>FAQ</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/blog"
                    onClick={scrollToTop}
                    className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400/70 group-hover:text-blue-300 flex-shrink-0" />
                    <span>Blog</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* COLUMN 3: Translation Services */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
                Translation
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <Link
                    to="/language/certified-translation"
                    onClick={scrollToTop}
                    className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400/70 group-hover:text-blue-300 flex-shrink-0" />
                    <span>Certified Translation</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/language/sworn-translation"
                    onClick={scrollToTop}
                    className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400/70 group-hover:text-blue-300 flex-shrink-0" />
                    <span>Sworn Translation</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/language/legal-translation"
                    onClick={scrollToTop}
                    className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400/70 group-hover:text-blue-300 flex-shrink-0" />
                    <span>Legal &amp; Court</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/language/medical-translation"
                    onClick={scrollToTop}
                    className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400/70 group-hover:text-blue-300 flex-shrink-0" />
                    <span>Medical &amp; Academic</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/language/business-translation"
                    onClick={scrollToTop}
                    className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400/70 group-hover:text-blue-300 flex-shrink-0" />
                    <span>Business &amp; Corporate</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/language/technical-translation"
                    onClick={scrollToTop}
                    className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400/70 group-hover:text-blue-300 flex-shrink-0" />
                    <span>Technical Translation</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* COLUMN 4: Apostille & Attestation */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
                Apostille &amp; Legal
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <Link
                    to="/apostille"
                    onClick={scrollToTop}
                    className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400/70 group-hover:text-blue-300 flex-shrink-0" />
                    <span>MEA Apostille</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/attestation"
                    onClick={scrollToTop}
                    className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400/70 group-hover:text-blue-300 flex-shrink-0" />
                    <span>Embassy Attestation</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/attestation/educational-certificate-attestation"
                    onClick={scrollToTop}
                    className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400/70 group-hover:text-blue-300 flex-shrink-0" />
                    <span>Educational Documents</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/attestation/commercial-document-attestation"
                    onClick={scrollToTop}
                    className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400/70 group-hover:text-blue-300 flex-shrink-0" />
                    <span>Commercial Documents</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/attestation/personal-document-attestation"
                    onClick={scrollToTop}
                    className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400/70 group-hover:text-blue-300 flex-shrink-0" />
                    <span>Personal Documents</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/startup"
                    onClick={scrollToTop}
                    className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400/70 group-hover:text-blue-300 flex-shrink-0" />
                    <span>Startup Packages</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* COLUMN 5: Popular Languages */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
                Popular Languages
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link
                    to="/language/spanish"
                    onClick={scrollToTop}
                    className="text-gray-300 hover:text-white transition-colors flex items-center gap-2.5 group"
                  >
                    <span className="text-base leading-none">🇪🇸</span>
                    <span>Spanish</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/language/arabic"
                    onClick={scrollToTop}
                    className="text-gray-300 hover:text-white transition-colors flex items-center gap-2.5 group"
                  >
                    <span className="text-base leading-none">🇦🇪</span>
                    <span>Arabic</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/language/japanese"
                    onClick={scrollToTop}
                    className="text-gray-300 hover:text-white transition-colors flex items-center gap-2.5 group"
                  >
                    <span className="text-base leading-none">🇯🇵</span>
                    <span>Japanese</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/language/hindi"
                    onClick={scrollToTop}
                    className="text-gray-300 hover:text-white transition-colors flex items-center gap-2.5 group"
                  >
                    <span className="text-base leading-none">🇮🇳</span>
                    <span>Hindi</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/language/tamil"
                    onClick={scrollToTop}
                    className="text-gray-300 hover:text-white transition-colors flex items-center gap-2.5 group"
                  >
                    <span className="text-base leading-none">🇮🇳</span>
                    <span>Tamil</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/language/telugu"
                    onClick={scrollToTop}
                    className="text-gray-300 hover:text-white transition-colors flex items-center gap-2.5 group"
                  >
                    <span className="text-base leading-none">🇮🇳</span>
                    <span>Telugu</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/language/french"
                    onClick={scrollToTop}
                    className="text-gray-300 hover:text-white transition-colors flex items-center gap-2.5 group"
                  >
                    <span className="text-base leading-none">🇫🇷</span>
                    <span>French</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/language/german"
                    onClick={scrollToTop}
                    className="text-gray-300 hover:text-white transition-colors flex items-center gap-2.5 group"
                  >
                    <span className="text-base leading-none">🇩🇪</span>
                    <span>German</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* COLUMN 6: Get in Touch & Newsletter */}
            <div className="lg:col-span-1 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-2 flex items-center gap-1.5">
                Get in Touch
              </h4>

              <div className="space-y-2 text-xs text-gray-300">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-tight">
                    No.184/3, 2nd Floor, Chandamama Building, NSK Salai, Vadapalani, Chennai - 600026
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <a href="tel:+917299005577" className="hover:text-white transition-colors">
                    +91 72990 05577
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <a
                    href="mailto:salesteam@honeytranslations.com"
                    className="hover:text-white transition-colors break-all"
                  >
                    salesteam@honeytranslations.com
                  </a>
                </div>
              </div>

              {/* Social icons */}
              <div className="flex flex-wrap gap-2 pt-2">
                <a
                  href="https://www.facebook.com/honeytranslationservices"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-blue-600 flex items-center justify-center transition-colors text-white"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href="https://twitter.com/honeytranslations"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-sky-500 flex items-center justify-center transition-colors text-white"
                  aria-label="Twitter"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href="https://www.linkedin.com/company/53401447/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-blue-700 flex items-center justify-center transition-colors text-white"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
                <a
                  href="https://www.instagram.com/honey_translation_services_/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-pink-600 flex items-center justify-center transition-colors text-white"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="https://www.youtube.com/@HoneyUniversalDigitalPrivateLi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-red-600 flex items-center justify-center transition-colors text-white"
                  aria-label="YouTube"
                >
                  <Youtube className="w-4 h-4" />
                </a>
                <a
                  href="https://wa.me/917299005577?text=Hello%20Honey%20Translations"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-emerald-600 flex items-center justify-center transition-colors text-white"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              </div>

              {/* Mini newsletter subscription form */}
              <div className="pt-2 border-t border-white/10">
                <p className="text-[11px] text-gray-400 mb-2">Subscribe for updates &amp; offers</p>
                <form onSubmit={handleSubscribe} className="space-y-1.5">
                  <div className="hidden" aria-hidden="true">
                    <input
                      name="website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="email"
                      placeholder="Your email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded flex items-center justify-center transition-colors"
                      title="Subscribe"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              </div>

            </div>

          </div>
        </div>

        {/* ========================================================= */}
        {/* BOTTOM COPYRIGHT & LEGAL BAR */}
        {/* ========================================================= */}
        <div className="border-t border-white/10 bg-[#04081c] py-4 px-4 sm:px-6 lg:px-8 text-xs text-gray-400">
          <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
            <div>
              &copy; {new Date().getFullYear()} Honey Universal Digital Private Limited. All rights reserved.
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-gray-400">
              <Link to="/privacy-policy" onClick={scrollToTop} className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link to="/terms-and-conditions" onClick={scrollToTop} className="hover:text-white transition-colors">
                Terms &amp; Conditions
              </Link>
              <span>•</span>
              <Link to="/refund-cancellation-policy" onClick={scrollToTop} className="hover:text-white transition-colors">
                Refund Policy
              </Link>
              <span>•</span>
              <span>ISO 9001:2015</span>
              <span>•</span>
              <span>GSTIN: 33AAACH1234F1Z5</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Query Modal */}
      <QueryModal isOpen={queryModalOpen} onClose={() => setQueryModalOpen(false)} />
    </>
  );
}
