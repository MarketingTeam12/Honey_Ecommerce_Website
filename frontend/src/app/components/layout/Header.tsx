import { Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Header() {
  return (
    <>
      {/* Top bar */}
      <div className="bg-[#1a1f5c] text-white px-6 py-2">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-sm">
          <div className="flex items-center gap-6">
            <a href="mailto:salesteam@honeytranslations.com" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Mail className="w-4 h-4" />
              <span>salesteam@honeytranslations.com</span>
            </a>
            <a href="tel:+917299005577" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Phone className="w-4 h-4" />
              <span>+91 7299005577</span>
            </a>
          </div>
          <div className="flex items-center gap-4">
            <span>Hi, sunandha</span>
            <button className="hover:opacity-80 transition-opacity">Sign Out</button>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="bg-white shadow-md px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#1a1f5c] rounded-full flex items-center justify-center">
              <div className="w-6 h-6 bg-white rounded-full"></div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[#1a1f5c]">HONEY</span>
              <span className="text-xs text-gray-600">TRANSLATION SERVICES</span>
            </div>
          </Link>

          <div className="flex items-center gap-6">
            <Link to="/" className="bg-[#1a1f5c] text-white px-6 py-2 rounded-full hover:bg-[#252b70] transition-colors">
              Home
            </Link>
            <button className="text-gray-700 hover:text-[#1a1f5c] transition-colors">
              Language ?
            </button>
            <button className="text-gray-700 hover:text-[#1a1f5c] transition-colors">
              Apostille ?
            </button>
            <button className="text-gray-700 hover:text-[#1a1f5c] transition-colors">
              Attestation
            </button>
            <button className="text-gray-700 hover:text-[#1a1f5c] transition-colors">
              More ?
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
