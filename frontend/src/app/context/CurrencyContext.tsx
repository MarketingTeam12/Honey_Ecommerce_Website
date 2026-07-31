import { createContext, useContext, useState, ReactNode } from 'react';
import indiaFlag from 'figma:asset/228ee291abea0b6ba19899d1fe32f9154eae11f0.png';
import usaFlag from 'figma:asset/da38930c8bd774c9c2eb9bfa779c34ecba9af49b.png';
import euFlag from 'figma:asset/880e6f8e6e11a0854953878d8f7fe9c4f68827d5.png';
import britishFlag from 'figma:asset/dbdee44402b090736b9bfca5ca3441b12debf25b.png';
import canadaFlag from 'figma:asset/90ef0a2c6dc8bd23a4dbc010c0326c08336e669e.png';

export interface Currency {
  code: string;
  symbol: string;
  flag: string;
  rate: number;
  name: string;
}

const currencies: Currency[] = [
  { code: 'INR', symbol: '₹', flag: indiaFlag, rate: 1, name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', flag: usaFlag, rate: 0.012, name: 'US Dollar' },
  { code: 'EUR', symbol: '€', flag: euFlag, rate: 0.011, name: 'Euro' },
  { code: 'GBP', symbol: '£', flag: britishFlag, rate: 0.0095, name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', flag: canadaFlag, rate: 0.017, name: 'Canadian Dollar' },
];

interface CurrencyContextType {
  currency: Currency;
  currencies: Currency[];
  setCurrency: (currency: Currency) => void;
  convertPrice: (price: number) => string;
  formatPrice: (price: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(currencies[0]);

  const convertPrice = (price: number): string => {
    if (!price || isNaN(price)) return `${currency.symbol}0.00`;
    const converted = price * currency.rate;
    return `${currency.symbol}${converted.toFixed(2)}`;
  };

  const formatPrice = (price: number): string => {
    if (!price || isNaN(price)) return `${currency.symbol}0.00`;
    const converted = price * currency.rate;
    return `${currency.symbol}${converted.toFixed(2)}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, currencies, setCurrency, convertPrice, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    // More helpful error message with troubleshooting steps
    console.error('useCurrency error: Component is being used outside CurrencyProvider');
    console.error('This usually happens when:');
    console.error('1. A component is rendered outside the provider tree');
    console.error('2. There is an error in a parent provider');
    console.error('3. The providers are not properly nested in App.tsx');
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
}