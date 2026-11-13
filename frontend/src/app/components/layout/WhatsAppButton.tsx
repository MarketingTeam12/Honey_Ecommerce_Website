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
      type="button"
      onClick={handleClick}
      className="fixed bottom-[5.75rem] right-4 min-h-[44px] min-w-[44px] h-11 px-3.5 bg-green-700 text-white rounded-lg shadow-lg hover:bg-green-800 transition-colors flex items-center gap-1.5 z-50"
      aria-label="Contact on WhatsApp"
    >
      <MessageCircle className="w-4 h-4" />
      <span className="text-xs font-semibold leading-none">WhatsApp</span>
    </button>
  );
}
