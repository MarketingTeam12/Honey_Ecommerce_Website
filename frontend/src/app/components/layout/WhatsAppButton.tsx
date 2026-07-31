import { MessageCircle } from 'lucide-react';

export function WhatsAppButton() {
  const phoneNumber = '+917299005577';
  const message = 'Hello! I need help with translation services.';

  const handleClick = () => {
    window.open(
      `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`,
      '_blank'
    );
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-[5.1rem] right-3 h-11 sm:h-12 px-3 sm:px-4 bg-green-500 text-white rounded-lg shadow-lg hover:bg-green-600 transition-colors flex items-center gap-1.5 z-50"
      aria-label="Contact on WhatsApp"
    >
      <MessageCircle className="w-4 h-4" />
      <span className="text-[11px] sm:text-xs font-semibold leading-none">WhatsApp</span>
    </button>
  );
}
