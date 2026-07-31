// Maps a country name (as stored on the shipping address) to its currency symbol.
// Falls back to the Indian Rupee symbol (₹) since the store's base pricing is in INR
// and orders are always charged in INR — only the DISPLAY symbol changes per the
// customer's shipping country.

const COUNTRY_TO_CURRENCY_SYMBOL: Record<string, string> = {
  'india': '₹',
  'united arab emirates': 'AED ',
  'uae': 'AED ',
  'united states': '$',
  'united states of america': '$',
  'usa': '$',
  'united kingdom': '£',
  'uk': '£',
  'saudi arabia': 'SAR ',
  'qatar': 'QAR ',
  'kuwait': 'KD ',
  'oman': 'OMR ',
  'bahrain': 'BD ',
  'singapore': 'S$',
  'malaysia': 'RM ',
  'australia': 'A$',
  'canada': 'C$',
  'germany': '€',
  'france': '€',
  'italy': '€',
  'spain': '€',
  'netherlands': '€',
  'ireland': '€',
  'nepal': 'NRs ',
  'sri lanka': 'Rs ',
  'bangladesh': '৳',
  'pakistan': 'Rs ',
};

export function getCurrencySymbolForCountry(country?: string | null): string {
  if (!country) return '₹';
  const key = country.trim().toLowerCase();
  return COUNTRY_TO_CURRENCY_SYMBOL[key] || '₹';
}
