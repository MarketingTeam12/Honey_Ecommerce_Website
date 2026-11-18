// Country currency mapping and updated conversion rates against INR.
// Honey Universal charges in INR via Razorpay; foreign currencies are converted
// using current reference exchange rates.

export interface CountryCurrencyRate {
  symbol: string;
  code: string;
  rate: number; // multiplier from INR to target currency
}

export const COUNTRY_CURRENCY_RATES: Record<string, CountryCurrencyRate> = {
  'india': { symbol: '₹', code: 'INR', rate: 1.0 },
  'united arab emirates': { symbol: 'AED ', code: 'AED', rate: 0.043 },
  'uae': { symbol: 'AED ', code: 'AED', rate: 0.043 },
  'united states': { symbol: '$', code: 'USD', rate: 0.0118 },
  'united states of america': { symbol: '$', code: 'USD', rate: 0.0118 },
  'usa': { symbol: '$', code: 'USD', rate: 0.0118 },
  'united kingdom': { symbol: '£', code: 'GBP', rate: 0.00935 },
  'uk': { symbol: '£', code: 'GBP', rate: 0.00935 },
  'saudi arabia': { symbol: 'SAR ', code: 'SAR', rate: 0.044 },
  'qatar': { symbol: 'QAR ', code: 'QAR', rate: 0.043 },
  'kuwait': { symbol: 'KD ', code: 'KWD', rate: 0.0036 },
  'oman': { symbol: 'OMR ', code: 'OMR', rate: 0.0045 },
  'bahrain': { symbol: 'BD ', code: 'BHD', rate: 0.0044 },
  'singapore': { symbol: 'S$', code: 'SGD', rate: 0.0158 },
  'malaysia': { symbol: 'RM ', code: 'MYR', rate: 0.052 },
  'australia': { symbol: 'A$', code: 'AUD', rate: 0.018 },
  'canada': { symbol: 'C$', code: 'CAD', rate: 0.0164 },
  'germany': { symbol: '€', code: 'EUR', rate: 0.0109 },
  'france': { symbol: '€', code: 'EUR', rate: 0.0109 },
  'italy': { symbol: '€', code: 'EUR', rate: 0.0109 },
  'spain': { symbol: '€', code: 'EUR', rate: 0.0109 },
  'netherlands': { symbol: '€', code: 'EUR', rate: 0.0109 },
  'ireland': { symbol: '€', code: 'EUR', rate: 0.0109 },
  'nepal': { symbol: 'NRs ', code: 'NPR', rate: 1.6 },
  'sri lanka': { symbol: 'LKR ', code: 'LKR', rate: 3.45 },
  'bangladesh': { symbol: '৳', code: 'BDT', rate: 1.42 },
  'pakistan': { symbol: 'PKR ', code: 'PKR', rate: 3.28 },
};

export function getCurrencySymbolForCountry(country?: string | null): string {
  if (!country) return '₹';
  const key = country.trim().toLowerCase();
  return COUNTRY_CURRENCY_RATES[key]?.symbol || '₹';
}

export function formatPriceForCountry(amount: unknown, country?: string | null): string {
  const inrAmount = typeof amount === 'number' ? amount : parseFloat(String(amount || '0'));
  if (isNaN(inrAmount)) return '₹0.00';

  if (!country) {
    return `₹${inrAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  const key = country.trim().toLowerCase();
  const info = COUNTRY_CURRENCY_RATES[key];

  if (!info || info.code === 'INR') {
    return `₹${inrAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  const converted = inrAmount * info.rate;
  return `${info.symbol}${converted.toFixed(2)} (₹${inrAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
}
