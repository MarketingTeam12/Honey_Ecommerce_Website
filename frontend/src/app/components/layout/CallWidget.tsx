import { PhoneCall } from 'lucide-react';

export function CallWidget() {
  const phoneNumber = '+917299005577';

  return (
    <div className="fixed left-5 bottom-6 z-50">
      <a
        href={`tel:${phoneNumber}`}
        aria-label="Call support"
        className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-white bg-[#39A9E8] text-white shadow-[0_3px_10px_rgba(0,0,0,0.25)] transition-colors hover:bg-[#2f9fdf] focus:outline-none focus:ring-2 focus:ring-white/70"
      >
        <PhoneCall className="h-6 w-6" />
      </a>
    </div>
  );
}
