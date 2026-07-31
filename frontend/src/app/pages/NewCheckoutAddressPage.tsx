import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus, Tag, ChevronRight, Trash2, Edit2 } from 'lucide-react';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useCart } from '@/app/context/CartContext';
import { useAuth } from '@/app/context/AuthContext';
import { sanitizePhoneForCountry, validatePhoneForCountry } from '@/app/utils/phoneValidation';

// Country codes with validation rules
const countryCodes = [
  { code: '+91', country: 'India', flag: 'IN', digits: 10 },
  { code: '+1', country: 'USA', flag: 'US', digits: 10 },
  { code: '+44', country: 'UK', flag: 'GB', digits: 10 },
  { code: '+971', country: 'UAE', flag: 'AE', digits: 9 },
  { code: '+65', country: 'Singapore', flag: 'SG', digits: 8 },
  { code: '+60', country: 'Malaysia', flag: 'MY', digits: 9 },
  { code: '+61', country: 'Australia', flag: 'AU', digits: 9 },
];

// Valid Indian cities
const validCities = [
  'Mumbai', 'Delhi', 'Bangalore', 'Bengaluru', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur',
  'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri', 'Patna', 'Vadodara',
  'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan', 'Vasai', 'Varanasi',
  'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar', 'Navi Mumbai', 'Allahabad', 'Ranchi', 'Howrah', 'Coimbatore',
  'Jabalpur', 'Gwalior', 'Vijayawada', 'Jodhpur', 'Madurai', 'Raipur', 'Kota', 'Guwahati', 'Chandigarh', 'Solapur',
  'Hubli', 'Tiruchirappalli', 'Bareilly', 'Mysore', 'Tiruppur', 'Gurgaon', 'Aligarh', 'Jalandhar', 'Bhubaneswar',
  'Salem', 'Mira', 'Warangal', 'Thiruvananthapuram', 'Guntur', 'Bhiwandi', 'Saharanpur', 'Gorakhpur', 'Bikaner',
  'Amravati', 'Noida', 'Jamshedpur', 'Bhilai', 'Cuttack', 'Firozabad', 'Kochi', 'Nellore', 'Bhavnagar', 'Dehradun',
  'Durgapur', 'Asansol', 'Rourkela', 'Nanded', 'Kolhapur', 'Ajmer', 'Akola', 'Gulbarga', 'Jamnagar', 'Ujjain',
  'Loni', 'Siliguri', 'Jhansi', 'Ulhasnagar', 'Jammu', 'Sangli', 'Mangalore', 'Erode', 'Belgaum', 'Ambattur',
  'Tirunelveli', 'Malegaon', 'Gaya', 'Jalgaon', 'Udaipur', 'Maheshtala', 'Pondicherry', 'Puducherry', 'Ooty',
  'Kodaikanal', 'Shimla', 'Manali', 'Darjeeling', 'Gangtok', 'Shillong', 'Imphal', 'Aizawl', 'Kohima', 'Itanagar',
  'Dispur', 'Agartala', 'Port Blair', 'Silvassa', 'Daman', 'Diu', 'Panaji', 'Kavaratti'
].sort(); // Sort alphabetically for better dropdown UX

// Valid Indian states and Union Territories
const validStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli', 'Daman and Diu', 'Delhi',
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

// Helper function to convert to proper case (Title Case)
const toProperCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Helper function to find matching city (case-insensitive)
const findMatchingCity = (input: string): string | null => {
  const trimmedInput = input.trim();
  const foundCity = validCities.find(city => 
    city.toLowerCase() === trimmedInput.toLowerCase()
  );
  return foundCity || null;
};

// Helper function to find matching state (case-insensitive)
const findMatchingState = (input: string): string | null => {
  const trimmedInput = input.trim();
  const foundState = validStates.find(state => 
    state.toLowerCase() === trimmedInput.toLowerCase()
  );
  return foundState || null;
};

interface Address {
  id: string;
  name: string;
  phone: string;
  phoneCountryCode: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

export function NewCheckoutAddressPage() {
  const { convertPrice } = useCurrency();
  const { 
    getCartTotal, 
    appliedCoupon, 
    getDiscountAmount, 
    getFinalTotal 
  } = useCart();
  const navigate = useNavigate();
  const { user } = useAuth(); // Add useAuth to get current user
  
  const [selectedAddressId, setSelectedAddressId] = useState<string>(''); // Empty by default - no pre-selection
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [selectedCountryCode, setSelectedCountryCode] = useState(countryCodes[0]); // Default to India
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null); // Track which address is being edited
  const [customerType, setCustomerType] = useState<'individual' | 'company'>('individual');
  const [gstNumber, setGstNumber] = useState('');
  const [paymentDetailsError, setPaymentDetailsError] = useState('');
  
  // New address form state
  const [newAddressForm, setNewAddressForm] = useState({
    fullName: '',
    phone: '',
    phoneCountryCode: '+91',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    name: '',
  });
  
  // Load saved addresses from localStorage (safe for SSR) - USER SPECIFIC
  const loadAddressesFromStorage = (): Address[] => {
    if (typeof window === 'undefined') return [];
    if (!user?.id) return []; // Return empty array if no user
    
    try {
      // Use user-specific key for addresses (unified with MyAddressPage)
      const savedAddresses = localStorage.getItem(`honey_addresses_${user.id}`);
      if (savedAddresses) {
        const parsed = JSON.parse(savedAddresses);
        // Convert from MyAddressPage schema if needed
        return Array.isArray(parsed) ? parsed.map((addr: any) => {
          // If it has old schema (address field), convert it
          if (addr.address && !addr.addressLine1) {
            return {
              id: addr.id,
              name: addr.name,
              phone: addr.phone || '',
              phoneCountryCode: '+91',
              addressLine1: addr.address,
              addressLine2: '',
              city: addr.city,
              state: addr.state,
              pincode: addr.zipCode || '',
              country: 'India',
              isDefault: addr.isDefault || false
            };
          }
          // If it's already in new schema, return as-is
          return {
            id: addr.id,
            name: addr.name,
            phone: addr.phone || '',
            phoneCountryCode: addr.phoneCountryCode || '+91',
            addressLine1: addr.addressLine1 || '',
            addressLine2: addr.addressLine2 || '',
            city: addr.city || '',
            state: addr.state || '',
            pincode: addr.pincode || '',
            country: addr.country || 'India',
            isDefault: addr.isDefault || false
          };
        }) : [];
      }
    } catch (error) {
      console.error('Error loading addresses from storage:', error);
    }
    return [];
  };

  // Load selected address ID from localStorage (safe for SSR) - USER SPECIFIC
  const loadSelectedAddressId = (): string => {
    if (typeof window === 'undefined') return '';
    if (!user?.id) return ''; // Return empty if no user
    
    try {
      // Use user-specific key for selected address
      const savedSelectedId = localStorage.getItem(`honey_selected_address_id_${user.id}`);
      if (savedSelectedId) {
        return savedSelectedId;
      }
    } catch (error) {
      console.error('Error loading selected address ID from storage:', error);
    }
    return '';
  };
  
  // Saved addresses - Load from localStorage with lazy initialization
  const [addresses, setAddresses] = useState<Address[]>(() => loadAddressesFromStorage());

  // Load selected address on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      const savedSelectedId = loadSelectedAddressId();
      if (savedSelectedId) {
        setSelectedAddressId(savedSelectedId);
      }
      // Reload addresses when user changes
      setAddresses(loadAddressesFromStorage());
    } else {
      // Clear addresses if no user
      setAddresses([]);
      setSelectedAddressId('');
    }
  }, [user?.id]);

  // Persist addresses to localStorage whenever they change - USER SPECIFIC
  useEffect(() => {
    if (!user?.id) return; // Don't save if no user
    
    try {
      localStorage.setItem(`honey_addresses_${user.id}`, JSON.stringify(addresses));
    } catch (error) {
      console.error('Error saving addresses to storage:', error);
    }
  }, [addresses, user?.id]);

  // Persist selected address ID to localStorage whenever it changes - USER SPECIFIC
  useEffect(() => {
    if (!user?.id) return; // Don't save if no user
    
    try {
      if (selectedAddressId) {
        localStorage.setItem(`honey_selected_address_id_${user.id}`, selectedAddressId);
      } else {
        localStorage.removeItem(`honey_selected_address_id_${user.id}`);
      }
    } catch (error) {
      console.error('Error saving selected address ID to storage:', error);
    }
  }, [selectedAddressId, user?.id]);

  const subtotal = getCartTotal();
  const discount = getDiscountAmount();
  const tax = (subtotal - discount) * 0.18;
  const total = subtotal - discount + tax;

  const handleContinue = () => {
    if (!selectedAddressId) {
      alert('Please select a billing address');
      return;
    }

    if (customerType === 'company' && !gstNumber.trim()) {
      setPaymentDetailsError('Please enter your GST Number for company billing.');
      return;
    }
    
    // Save selected address to localStorage for use in payment
    const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
    if (selectedAddress) {
      localStorage.setItem('shipping_address', JSON.stringify(selectedAddress));
    }

    const paymentDetails = {
      customerType,
      gstNumber: customerType === 'company' ? gstNumber.trim().toUpperCase() : '',
    };
    localStorage.setItem('paymentCustomerDetails', JSON.stringify(paymentDetails));
    
    navigate('/checkout/review');
  };

  const handleRemoveAddress = (addressId: string) => {
    if (window.confirm('Are you sure you want to remove this address?')) {
      setAddresses(addresses.filter(addr => addr.id !== addressId));
      // If the removed address was selected, clear selection
      if (selectedAddressId === addressId) {
        setSelectedAddressId('');
      }
      console.log(`🗑 [NewCheckoutAddressPage] Address removed: ${addressId}`);
    }
  };

  const handleEditAddress = (address: Address) => {
    // Extract phone number without country code
    const phoneParts = address.phone.split(' ');
    const phoneNumber = phoneParts[phoneParts.length - 1];
    
    setNewAddressForm({
      fullName: address.name,
      phone: phoneNumber,
      phoneCountryCode: address.phoneCountryCode,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      country: address.country
    });
    
    setEditingAddressId(address.id);
    setShowAddressForm(true);
    setSelectedCountryCode(countryCodes.find(c => c.code === address.phoneCountryCode) || countryCodes[0]);
    console.log(`✏ [NewCheckoutAddressPage] Editing address: ${address.id}`);
  };

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const countryConfig = countryCodes.find(c => c.code === newAddressForm.phoneCountryCode) || countryCodes[0];
    const cleaned = sanitizePhoneForCountry(value, { dialCode: countryConfig.code, maxDigits: countryConfig.digits || 10 });
    setNewAddressForm({ ...newAddressForm, phone: cleaned });
    const requiredDigits = countryConfig?.digits || 10;
    const phoneValidation = validatePhoneForCountry(cleaned, {
      code: countryConfig.code,
      name: countryConfig.country,
      dialCode: countryConfig.code,
      minDigits: requiredDigits,
      maxDigits: requiredDigits,
      pattern: countryConfig.code === '+91' ? /^[6-9]\d{9}$/ : new RegExp(`^\\d{${requiredDigits}}$`),
      patternMessage: countryConfig.code === '+91' ? 'Indian mobile numbers must start with 6, 7, 8, or 9' : undefined,
    });
    setValidationErrors(prev => ({ ...prev, phone: cleaned ? (phoneValidation.isValid ? '' : (phoneValidation.error || '')) : '' }));
  };

  const handlePincodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numeric input and max 6 digits
    if (value === '' || (/^\d+$/.test(value) && value.length <= 6)) {
      setNewAddressForm({ ...newAddressForm, pincode: value });
    }
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page refresh
    
    console.log('📍 [NewCheckoutAddressPage] Validating new address...');
    
    // Comprehensive validation
    const errors: {[key: string]: string} = {};
    
    // Name validation
    if (!newAddressForm.fullName.trim()) {
      errors.fullName = 'Name is required';
    } else if (newAddressForm.fullName.trim().length < 2) {
      errors.fullName = 'Name must be at least 2 characters';
    }
    
    // Phone validation with dynamic digit count
    const countryConfig = countryCodes.find(c => c.code === newAddressForm.phoneCountryCode) || countryCodes[0];
    const requiredDigits = countryConfig?.digits || 10;
    const phoneValidation = validatePhoneForCountry(newAddressForm.phone, {
      code: countryConfig.code,
      name: countryConfig.country,
      dialCode: countryConfig.code,
      minDigits: requiredDigits,
      maxDigits: requiredDigits,
      pattern: countryConfig.code === '+91' ? /^[6-9]\d{9}$/ : new RegExp(`^\\d{${requiredDigits}}$`),
      patternMessage: countryConfig.code === '+91' ? 'Indian mobile numbers must start with 6, 7, 8, or 9' : undefined,
    });

    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.error || `Invalid phone number format for ${countryConfig?.country}`;
    }
    
    // Address Line 1 validation
    if (!newAddressForm.addressLine1.trim()) {
      errors.addressLine1 = 'Address Line 1 is required';
    } else if (newAddressForm.addressLine1.trim().length < 5) {
      errors.addressLine1 = 'Address must be at least 5 characters';
    }
    
    // City validation - manual text entry, normalize without forcing a dropdown list
    if (!newAddressForm.city.trim()) {
      errors.city = 'City is required';
    } else if (newAddressForm.city.trim().length < 4) {
      errors.city = 'Please enter the complete city name (e.g., Chennai, Pondicherry). Abbreviations like "chn", "cbe" are not allowed';
    } else if (!/^[a-zA-Z\s]+$/.test(newAddressForm.city.trim())) {
      errors.city = 'City name should contain only letters';
    }
    
    // State validation - manual text entry, normalize without forcing a dropdown list
    if (!newAddressForm.state.trim()) {
      errors.state = 'State is required';
    } else if (newAddressForm.state.trim().length < 4) {
      errors.state = 'Please enter the full state name (e.g., Tamil Nadu, Kerala). Abbreviations like "TN", "KL" are not allowed';
    } else if (!/^[a-zA-Z\s]+$/.test(newAddressForm.state.trim())) {
      errors.state = 'State name should contain only letters';
    }
    
    // Pincode validation - must be exactly 6 digits numeric for India
    if (!newAddressForm.pincode.trim()) {
      errors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(newAddressForm.pincode.trim())) {
      errors.pincode = 'Pincode must be exactly 6 digits';
    }
    
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      // Display first error
      const firstError = Object.values(errors)[0];
      alert('Validation Error: ' + firstError);
      console.log('❌ [NewCheckoutAddressPage] Validation failed:', errors);
      return;
    }

    console.log('✅ [NewCheckoutAddressPage] Validation passed...');

    // Normalize user-entered city/state names for consistent storage
    const formattedCity = toProperCase(newAddressForm.city.trim());
    const formattedState = toProperCase(newAddressForm.state.trim());

    if (editingAddressId) {
      // Update existing address
      const updatedAddress: Address = {
        id: editingAddressId,
        name: newAddressForm.fullName.trim(),
        phone: `${newAddressForm.phoneCountryCode} ${newAddressForm.phone.trim()}`,
        phoneCountryCode: newAddressForm.phoneCountryCode,
        addressLine1: newAddressForm.addressLine1.trim(),
        addressLine2: newAddressForm.addressLine2.trim(),
        city: formattedCity,
        state: formattedState,
        pincode: newAddressForm.pincode.trim(),
        country: newAddressForm.country,
        isDefault: addresses.find(a => a.id === editingAddressId)?.isDefault || false
      };

      setAddresses(addresses.map(addr => addr.id === editingAddressId ? updatedAddress : addr));
      setSelectedAddressId(editingAddressId);
      console.log('✅ [NewCheckoutAddressPage] Address updated successfully:', updatedAddress);
      alert('Address updated successfully!');
      setEditingAddressId(null);
    } else {
      // Create new address object
      const newAddress: Address = {
        id: `addr${Date.now()}`,
        name: newAddressForm.fullName.trim(),
        phone: `${newAddressForm.phoneCountryCode} ${newAddressForm.phone.trim()}`,
        phoneCountryCode: newAddressForm.phoneCountryCode,
        addressLine1: newAddressForm.addressLine1.trim(),
        addressLine2: newAddressForm.addressLine2.trim(),
        city: formattedCity,
        state: formattedState,
        pincode: newAddressForm.pincode.trim(),
        country: newAddressForm.country,
        isDefault: addresses.length === 0 // First address becomes default
      };

      console.log('✅ [NewCheckoutAddressPage] New address created:', newAddress);

      // Add to addresses list
      setAddresses([...addresses, newAddress]);
      
      // Auto-select the newly added address
      setSelectedAddressId(newAddress.id);
      console.log('✅ [NewCheckoutAddressPage] Address saved successfully');
      alert('Address added successfully!');
    }
    
    // Reset form and errors
    setNewAddressForm({
      fullName: '',
      phone: '',
      phoneCountryCode: '+91',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    });
    setSelectedCountryCode(countryCodes[0]);
    setValidationErrors({});
    
    // Hide form
    setShowAddressForm(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-8 py-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                1
              </div>
              <span className="font-medium text-blue-600">Address</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center font-semibold">
                2
              </div>
              <span className="text-gray-500">Review Order & Make Payment</span>
            </div>
          </div>
          
          <h1 className="text-3xl text-center">Select Billing Address</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-3 gap-8">
          {/* LEFT COLUMN - Address Selection */}
          <div className="col-span-2 space-y-6">
            {/* Saved Addresses */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Saved Addresses</h2>
              
              {addresses.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg text-gray-700 font-medium mb-2">No saved addresses yet</p>
                  <p className="text-sm text-gray-500">Click "Add New Address" below to add your billing address</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className={`border-2 rounded-xl p-5 transition-all relative ${
                        selectedAddressId === address.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <input
                          type="radio"
                          name="address"
                          value={address.id}
                          checked={selectedAddressId === address.id}
                          onChange={(e) => setSelectedAddressId(e.target.value)}
                          className="mt-1 w-5 h-5 text-blue-600 cursor-pointer"
                        />
                        <div className="flex-grow">
                          <div className="flex items-center gap-3 mb-3">
                            <MapPin className="w-5 h-5 text-gray-500" />
                            <span className="font-semibold text-gray-900 text-lg">{address.name}</span>
                            {address.isDefault && (
                              <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="text-gray-700 space-y-1 ml-8">
                            <p>
                              {address.addressLine1}
                              {address.addressLine2 && `, ${address.addressLine2}`}
                            </p>
                            <p>
                              {address.city}, {address.state} - {address.pincode}
                            </p>
                            <p>{address.country}</p>
                            <p className="text-gray-600">Phone: {address.phone}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleEditAddress(address)}
                          className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded transition-colors"
                          title="Edit address"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleRemoveAddress(address.id)}
                          className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded transition-colors"
                          title="Remove address"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Address */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6">
              <button
                onClick={() => setShowAddressForm(!showAddressForm)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <Plus className="w-5 h-5" />
                Add New Address
              </button>

              {showAddressForm && (
                <form className="mt-6 space-y-4" onSubmit={handleSaveAddress}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={newAddressForm.fullName}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, fullName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      />
                      {validationErrors.fullName && <p className="text-red-500 text-xs mt-1">{validationErrors.fullName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={newAddressForm.phoneCountryCode}
                          onChange={(e) => {
                            const code = e.target.value;
                            const nextCountry = countryCodes.find(c => c.code === code) || countryCodes[0];
                            const cleaned = sanitizePhoneForCountry(newAddressForm.phone, { dialCode: nextCountry.code, maxDigits: nextCountry.digits || 10 });
                            const requiredDigits = nextCountry?.digits || 10;
                            const phoneValidation = validatePhoneForCountry(cleaned, {
                              code: nextCountry.code,
                              name: nextCountry.country,
                              dialCode: nextCountry.code,
                              minDigits: requiredDigits,
                              maxDigits: requiredDigits,
                              pattern: nextCountry.code === '+91' ? /^[6-9]\d{9}$/ : new RegExp(`^\\d{${requiredDigits}}$`),
                              patternMessage: nextCountry.code === '+91' ? 'Indian mobile numbers must start with 6, 7, 8, or 9' : undefined,
                            });
                            setNewAddressForm({ ...newAddressForm, phoneCountryCode: code, phone: cleaned });
                            setSelectedCountryCode(nextCountry);
                            setValidationErrors(prev => ({ ...prev, phone: cleaned ? (phoneValidation.isValid ? '' : (phoneValidation.error || '')) : '' }));
                          }}
                          className={`px-3 py-3 border ${validationErrors.phone ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none bg-white transition-all`}
                        >
                          {countryCodes.map(country => (
                            <option key={country.code} value={country.code}>
                              {country.flag} {country.code}
                            </option>
                          ))}
                        </select>
                        <input
                          type="tel"
                          placeholder={`${selectedCountryCode.digits} digits`}
                          value={newAddressForm.phone}
                          onChange={handlePhoneInput}
                          onBlur={() => {
                            const countryConfig = countryCodes.find(c => c.code === newAddressForm.phoneCountryCode) || countryCodes[0];
                            const requiredDigits = countryConfig?.digits || 10;
                            const phoneValidation = validatePhoneForCountry(newAddressForm.phone, {
                              code: countryConfig.code,
                              name: countryConfig.country,
                              dialCode: countryConfig.code,
                              minDigits: requiredDigits,
                              maxDigits: requiredDigits,
                              pattern: countryConfig.code === '+91' ? /^[6-9]\d{9}$/ : new RegExp(`^\\d{${requiredDigits}}$`),
                              patternMessage: countryConfig.code === '+91' ? 'Indian mobile numbers must start with 6, 7, 8, or 9' : undefined,
                            });
                            setValidationErrors(prev => ({ ...prev, phone: phoneValidation.isValid ? '' : (phoneValidation.error || '') }));
                          }}
                          maxLength={selectedCountryCode.digits}
                          className={`flex-1 px-4 py-3 border ${validationErrors.phone ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all`}
                        />
                      </div>
                      {validationErrors.phone && <p className="text-red-500 text-xs mt-1">{validationErrors.phone}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address Line 1 *
                    </label>
                    <input
                      type="text"
                      placeholder="House/Flat No., Building Name"
                      value={newAddressForm.addressLine1}
                      onChange={(e) => setNewAddressForm({ ...newAddressForm, addressLine1: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                    {validationErrors.addressLine1 && <p className="text-red-500 text-xs mt-1">{validationErrors.addressLine1}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      placeholder="Street, Landmark (Optional)"
                      value={newAddressForm.addressLine2}
                      onChange={(e) => setNewAddressForm({ ...newAddressForm, addressLine2: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        placeholder="Enter city name"
                        value={newAddressForm.city}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, city: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white"
                      />
                      {validationErrors.city && <p className="text-red-500 text-xs mt-1">{validationErrors.city}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State *
                      </label>
                      <input
                        type="text"
                        placeholder="Enter state name"
                        value={newAddressForm.state}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, state: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white"
                      />
                      {validationErrors.state && <p className="text-red-500 text-xs mt-1">{validationErrors.state}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        placeholder="600001"
                        value={newAddressForm.pincode}
                        onChange={handlePincodeInput}
                        maxLength={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      />
                      {validationErrors.pincode && <p className="text-red-500 text-xs mt-1">{validationErrors.pincode}</p>}
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    {editingAddressId ? 'Update Address' : 'Save Address'}
                  </button>
                  {editingAddressId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAddressId(null);
                        setShowAddressForm(false);
                        setNewAddressForm({
                          fullName: '',
                          phone: '',
                          phoneCountryCode: '+91',
                          addressLine1: '',
                          addressLine2: '',
                          city: '',
                          state: '',
                          pincode: '',
                          country: 'India'
                        });
                        setValidationErrors({});
                      }}
                      className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium ml-2"
                    >
                      Cancel
                    </button>
                  )}
                </form>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN - Order Summary */}
          <div className="col-span-1">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 sticky top-8 space-y-6">
              {/* Payment Details */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    customerType === 'individual'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="customerType"
                      value="individual"
                      checked={customerType === 'individual'}
                      onChange={() => {
                        setCustomerType('individual');
                        setPaymentDetailsError('');
                      }}
                      className="mt-1 w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">Individual</p>
                      <p className="text-sm text-gray-600">Continue without GST details.</p>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    customerType === 'company'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="customerType"
                      value="company"
                      checked={customerType === 'company'}
                      onChange={() => {
                        setCustomerType('company');
                        setPaymentDetailsError('');
                      }}
                      className="mt-1 w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">Company</p>
                      <p className="text-sm text-gray-600">Add GST number for company billing.</p>
                    </div>
                  </label>
                </div>

                {customerType === 'company' && (
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">GST Number</label>
                    <input
                      type="text"
                      value={gstNumber}
                      onChange={(e) => {
                        setGstNumber(e.target.value.toUpperCase());
                        setPaymentDetailsError('');
                      }}
                      placeholder="Enter GST Number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none uppercase"
                    />
                  </div>
                )}

                {paymentDetailsError && (
                  <p className="mt-3 text-sm text-red-600 font-medium">{paymentDetailsError}</p>
                )}
              </div>

              {/* Applied Coupon Display (Read-only) */}
              {appliedCoupon && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-green-900">Coupon Applied</h3>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono font-bold text-green-800 text-lg">{appliedCoupon.code}</p>
                      <p className="text-sm text-green-700">
                        {appliedCoupon.discountType === 'percentage' 
                          ? `${appliedCoupon.discountValue}% discount` 
                          : `?${appliedCoupon.discountValue} discount`}
                      </p>
                    </div>
                    <div className="bg-green-100 p-2 rounded-full">
                      <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <div>
                <h3 className="font-semibold mb-4">Order Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span className="font-medium">{convertPrice(subtotal)}</span>
                  </div>
                  {appliedCoupon && discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({appliedCoupon.code})</span>
                      <span className="font-medium">- {convertPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-700">
                    <span>Tax (GST 18%)</span>
                    <span className="font-medium">{convertPrice(tax)}</span>
                  </div>
                  <div className="h-px bg-gray-300"></div>
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-blue-600 text-2xl">
                      {convertPrice(total)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleContinue}
                className="w-full bg-blue-600 text-white py-4 rounded-lg font-medium hover:bg-blue-700 transition-colors text-lg"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewCheckoutAddressPage;

