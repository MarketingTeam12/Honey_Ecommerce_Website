import { useState } from 'react';
import { Lock, ExternalLink, CreditCard } from 'lucide-react';

interface ZohoPayNowButtonProps {
  /**
   * Button size variant
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Full width button
   */
  fullWidth?: boolean;
  /**
   * Custom class names
   */
  className?: string;
  /**
   * Button text
   */
  text?: string;
  /**
   * Show icon
   */
  showIcon?: boolean;
  /**
   * Disabled state
   */
  disabled?: boolean;
  /**
   * Optional callback before opening Zoho
   */
  onBeforeOpen?: () => void | Promise<void>;
  /**
   * Optional callback after opening Zoho
   */
  onAfterOpen?: () => void;
}

/**
 * Secure Pay Now button that redirects to Razorpay
 * Opens in a new tab with security best practices
 */
export function ZohoPayNowButton({
  size = 'md',
  fullWidth = false,
  className = '',
  text = 'Pay Now',
  showIcon = true,
  disabled = false,
  onBeforeOpen,
  onAfterOpen
}: ZohoPayNowButtonProps) {
  const [isOpening, setIsOpening] = useState(false);
  const ZOHO_PAYMENTS_URL = 'https://www.zoho.com/us/payments/';

  const handlePayNow = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    if (disabled || isOpening) return;

    try {
      setIsOpening(true);

      // Execute before open callback if provided
      if (onBeforeOpen) {
        await onBeforeOpen();
      }

      // Open Razorpay in new tab with security parameters
      const paymentWindow = window.open(
        ZOHO_PAYMENTS_URL,
        '_blank',
        'noopener,noreferrer'
      );

      // Check if popup was blocked
      if (!paymentWindow) {
        alert('Please allow popups for this website to proceed with payment.');
        setIsOpening(false);
        return;
      }

      // Execute after open callback if provided
      if (onAfterOpen) {
        onAfterOpen();
      }

      console.log('✅ Razorpay page opened successfully');
    } catch (error) {
      console.error('❌ Error opening Razorpay:', error);
      alert('Unable to open payment page. Please try again.');
    } finally {
      setIsOpening(false);
    }
  };

  // Size variants
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  // Icon size variants
  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  return (
    <button
      onClick={handlePayNow}
      disabled={disabled || isOpening}
      className={`
        group relative
        inline-flex items-center justify-center gap-2
        font-semibold rounded-xl
        bg-gradient-to-r from-blue-600 to-indigo-600
        hover:from-blue-700 hover:to-indigo-700
        text-white
        shadow-lg shadow-blue-500/30
        hover:shadow-xl hover:shadow-blue-500/40
        active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed
        disabled:hover:shadow-lg
        transition-all duration-200 ease-out
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      type="button"
      aria-label={`${text} - Opens Razorpay in new tab`}
      title="Secure payment via Razorpay"
    >
      {/* Shine effect on hover */}
      <span className="absolute inset-0 rounded-xl overflow-hidden">
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-out" />
      </span>

      {/* Security badge indicator */}
      <div className="relative flex items-center gap-2">
        {showIcon && (
          <Lock 
            size={iconSizes[size]} 
            className="flex-shrink-0 animate-pulse" 
            aria-hidden="true"
          />
        )}
        
        <span className="font-bold tracking-wide">
          {isOpening ? 'Opening...' : text}
        </span>

        <ExternalLink 
          size={iconSizes[size] - 4} 
          className="flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" 
          aria-hidden="true"
        />
      </div>

      {/* Subtle border glow */}
      <span className="absolute inset-0 rounded-xl ring-1 ring-white/20 group-hover:ring-white/30 transition-all" />
    </button>
  );
}

/**
 * Alternative minimal variant
 */
export function ZohoPayNowButtonMinimal({
  className = '',
  text = 'Proceed to Payment',
  disabled = false,
  onBeforeOpen,
  onAfterOpen
}: ZohoPayNowButtonProps) {
  const [isOpening, setIsOpening] = useState(false);
  const ZOHO_PAYMENTS_URL = 'https://www.zoho.com/us/payments/';

  const handlePayNow = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    if (disabled || isOpening) return;

    try {
      setIsOpening(true);

      if (onBeforeOpen) {
        await onBeforeOpen();
      }

      const paymentWindow = window.open(
        ZOHO_PAYMENTS_URL,
        '_blank',
        'noopener,noreferrer'
      );

      if (!paymentWindow) {
        alert('Please allow popups for this website to proceed with payment.');
        setIsOpening(false);
        return;
      }

      if (onAfterOpen) {
        onAfterOpen();
      }

      console.log('✅ Razorpay page opened successfully');
    } catch (error) {
      console.error('❌ Error opening Razorpay:', error);
      alert('Unable to open payment page. Please try again.');
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <button
      onClick={handlePayNow}
      disabled={disabled || isOpening}
      className={`
        group
        inline-flex items-center justify-center gap-2
        px-6 py-3
        font-semibold text-blue-600
        bg-white
        border-2 border-blue-600
        rounded-lg
        hover:bg-blue-50
        active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200
        ${className}
      `}
      type="button"
      aria-label={`${text} - Opens Razorpay in new tab`}
    >
      <CreditCard size={20} aria-hidden="true" />
      <span>{isOpening ? 'Opening...' : text}</span>
      <ExternalLink size={16} className="opacity-70" aria-hidden="true" />
    </button>
  );
}

/**
 * Compact icon-only variant
 */
export function ZohoPayNowIconButton({
  className = '',
  disabled = false,
  onBeforeOpen,
  onAfterOpen
}: Omit<ZohoPayNowButtonProps, 'text' | 'showIcon' | 'size'>) {
  const [isOpening, setIsOpening] = useState(false);
  const ZOHO_PAYMENTS_URL = 'https://www.zoho.com/us/payments/';

  const handlePayNow = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    if (disabled || isOpening) return;

    try {
      setIsOpening(true);

      if (onBeforeOpen) {
        await onBeforeOpen();
      }

      const paymentWindow = window.open(
        ZOHO_PAYMENTS_URL,
        '_blank',
        'noopener,noreferrer'
      );

      if (!paymentWindow) {
        alert('Please allow popups for this website to proceed with payment.');
        setIsOpening(false);
        return;
      }

      if (onAfterOpen) {
        onAfterOpen();
      }

      console.log('✅ Razorpay page opened successfully');
    } catch (error) {
      console.error('❌ Error opening Razorpay:', error);
      alert('Unable to open payment page. Please try again.');
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <button
      onClick={handlePayNow}
      disabled={disabled || isOpening}
      className={`
        group
        flex items-center justify-center
        w-12 h-12
        bg-gradient-to-br from-blue-600 to-indigo-600
        hover:from-blue-700 hover:to-indigo-700
        text-white
        rounded-full
        shadow-lg shadow-blue-500/30
        hover:shadow-xl hover:shadow-blue-500/50
        active:scale-90
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200
        ${className}
      `}
      type="button"
      aria-label="Pay Now - Opens Razorpay in new tab"
      title="Secure payment via Zoho"
    >
      <Lock size={20} className={isOpening ? 'animate-pulse' : ''} aria-hidden="true" />
    </button>
  );
}

export default ZohoPayNowButton;
