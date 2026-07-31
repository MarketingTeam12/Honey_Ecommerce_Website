import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { MapPin, Plus, Tag, Trash2, Edit2 } from 'lucide-react';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useCart } from '@/app/context/CartContext';
import { sanitizePhoneForCountry, validatePhoneForCountry } from '@/app/utils/phoneValidation';

// Country codes with validation rules
const countryCodes = [
  { code: '+91', country: 'India', flag: 'IN', digits: 10, minDigits: 10, maxDigits: 10, pattern: /^[6-9]\d{9}$/, patternMessage: 'Indian mobile numbers must start with 6, 7, 8, or 9' },
  { code: '+1', country: 'USA', flag: 'US', digits: 10, minDigits: 10, maxDigits: 10, pattern: /^\d{10}$/ },
  { code: '+44', country: 'UK', flag: 'GB', digits: 10, minDigits: 10, maxDigits: 10, pattern: /^\d{10}$/ },
  { code: '+971', country: 'UAE', flag: 'AE', digits: 9, minDigits: 9, maxDigits: 9, pattern: /^\d{9}$/ },
  { code: '+65', country: 'Singapore', flag: '🇸🇬', digits: 8, minDigits: 8, maxDigits: 8, pattern: /^\d{8}$/ },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾', digits: 9, minDigits: 9, maxDigits: 9, pattern: /^\d{9}$/ },
  { code: '+61', country: 'Australia', flag: '🇦🇺', digits: 9, minDigits: 9, maxDigits: 9, pattern: /^\d{9}$/ },
];

// Valid Indian cities
const validCities = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur',
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
];

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

// UNIFIED STORAGE KEY - shared with admin panel
const STORAGE_KEY = 'honey_admin_coupons';

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

interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  description?: string;
}

export function CheckoutAddressPage() {
  const { formatPrice } = useCurrency();
  const { getCartTotal, appliedCoupon, applyCoupon, removeCoupon, getDiscountAmount, getFinalTotal } = useCart();
  const navigate = useNavigate();
  
  const [selectedAddressId, setSelectedAddressId] = useState<string>(''); // Empty by default - no pre-selection
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [selectedCountryCode, setSelectedCountryCode] = useState(countryCodes[0]); // Default to India
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null); // Track which address is being edited
  
  // Tip state management
  const [showTipSupport, setShowTipSupport] = useState(false);
  const [selectedTipPercentage, setSelectedTipPercentage] = useState<number | null>(null);
  const [customTipAmount, setCustomTipAmount] = useState<number>(0);
  const [tipAmount, setTipAmount] = useState<number>(0);
  
  // New address form state
  const [newAddressForm, setNewAddressForm] = useState({
    name: '',
    phone: '',
    phoneCountryCode: '+91',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India'
  });
  
  // Saved addresses - EMPTY by default, customer must add their own
  const [addresses, setAddresses] = useState<Address[]>([]);

  useEffect(() => {
    const storedCoupons = localStorage.getItem(STORAGE_KEY);
    if (storedCoupons) {
      setCoupons(JSON.parse(storedCoupons));
    }
  }, []);

  const subtotal = getCartTotal();
  const discount = appliedCoupon ? getDiscountAmount() : 0;
  const tax = (subtotal - discount) * 0.18;
  const total = getFinalTotal();

  // Handle tip selection
  const handleTipPercentageSelect = (percentage: number) => {
    setSelectedTipPercentage(percentage);
    setCustomTipAmount(0);
    const calculatedTip = Math.round((subtotal * percentage) / 100);
    setTipAmount(calculatedTip);
  };

  const handleNoneTip = () => {
    setSelectedTipPercentage(null);
    setCustomTipAmount(0);
    setTipAmount(0);
  };

  const handleCustomTipChange = (amount: number) => {
    setSelectedTipPercentage(null);
    setCustomTipAmount(amount);
    setTipAmount(amount);
  };

  const handleAddTip = () => {
    if (tipAmount > 0) {
      alert(`Tip of ${formatPrice(tipAmount)} added successfully!`);
    }
  };

  const handleApplyCoupon = () => {
    const coupon = coupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase());
    if (coupon) {
      if (!coupon.isActive) {
        setCouponError('Coupon is not active');
        return;
      }
      if (coupon.usageLimit && coupon.usageLimit <= coupon.usedCount) {
        setCouponError('Coupon usage limit reached');
        return;
      }
      if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
        setCouponError(`Minimum order value is ${formatPrice(coupon.minOrderValue)}`);
        return;
      }
      
      // Apply coupon with maxDiscount if applicable
      let finalDiscountValue = coupon.discountValue;
      if (coupon.discountType === 'percentage' && coupon.maxDiscount) {
        const calculatedDiscount = (subtotal * coupon.discountValue) / 100;
        if (calculatedDiscount > coupon.maxDiscount) {
          finalDiscountValue = coupon.maxDiscount;
        }
      }
      
      applyCoupon(coupon.code, finalDiscountValue, coupon.discountType);
      setCouponError('');
      setCouponCode('');
    } else {
      setCouponError('Invalid coupon code');
    }
  };

  const handleContinue = () => {
    if (!selectedAddressId) {
      alert('Please select a billing address');
      return;
    }
    navigate('/checkout/review');
  };

  const handleRemoveAddress = (addressId: string) => {
    if (window.confirm('Are you sure you want to remove this address?')) {
      setAddresses(addresses.filter(addr => addr.id !== addressId));
      // If the removed address was selected, clear selection
      if (selectedAddressId === addressId) {
        setSelectedAddressId('');
      }
      console.log(`🗑 [CheckoutAddressPage] Address removed: ${addressId}`);
    }
  };

  const handleEditAddress = (address: Address) => {
    // Extract phone number without country code
    const phoneParts = address.phone.split(' ');
    const phoneNumber = phoneParts[phoneParts.length - 1];
    
    setNewAddressForm({
      name: address.name,
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
    console.log(`✏ [CheckoutAddressPage] Editing address: ${address.id}`);
  };

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const countryConfig = countryCodes.find(c => c.code === newAddressForm.phoneCountryCode) || countryCodes[0];
    const cleaned = sanitizePhoneForCountry(value, { dialCode: countryConfig.code, maxDigits: countryConfig.maxDigits });
    setNewAddressForm({ ...newAddressForm, phone: cleaned });
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
    
    console.log('📍 [CheckoutAddressPage] Validating new address...');
    
    // Comprehensive validation
    const errors: {[key: string]: string} = {};
    
    // Name validation
    if (!newAddressForm.name.trim()) {
      errors.name = 'Name is required';
    } else if (newAddressForm.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    
    // Phone validation with dynamic digit count
    const countryConfig = countryCodes.find(c => c.code === newAddressForm.phoneCountryCode) || countryCodes[0];
    const phoneValidation = validatePhoneForCountry(newAddressForm.phone, {
      code: countryConfig.code,
      name: countryConfig.country,
      dialCode: countryConfig.code,
      minDigits: countryConfig.minDigits,
      maxDigits: countryConfig.maxDigits,
      pattern: countryConfig.pattern,
      patternMessage: countryConfig.patternMessage,
    });

    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.error || `Invalid phone number format for ${countryConfig.country}`;
    }
    
    // Address Line 1 validation
    if (!newAddressForm.addressLine1.trim()) {
      errors.addressLine1 = 'Address Line 1 is required';
    } else if (newAddressForm.addressLine1.trim().length < 5) {
      errors.addressLine1 = 'Address must be at least 5 characters';
    }
    
    // City validation - manual text entry, without restricting to a dropdown list
    if (!newAddressForm.city.trim()) {
      errors.city = 'City is required';
    } else if (newAddressForm.city.trim().length < 4) {
      errors.city = 'Please enter the complete city name (e.g., Chennai, Pondicherry). Abbreviations like "chn", "cbe" are not allowed';
    } else if (!/^[a-zA-Z\s]+$/.test(newAddressForm.city.trim())) {
      errors.city = 'City name should contain only letters';
    }
    
    // State validation - manual text entry, without restricting to a dropdown list
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
      console.log('❌ [CheckoutAddressPage] Validation failed:', errors);
      return;
    }

    console.log('✅ [CheckoutAddressPage] Validation passed, creating address...');

    // Normalize user-entered city/state names for consistent storage
    const formattedCity = toProperCase(newAddressForm.city.trim());
    const formattedState = toProperCase(newAddressForm.state.trim());

    if (editingAddressId) {
      // Update existing address
      const updatedAddress: Address = {
        id: editingAddressId,
        name: newAddressForm.name.trim(),
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
      console.log('✅ [CheckoutAddressPage] Address updated successfully:', updatedAddress);
      alert('Address updated successfully!');
      setEditingAddressId(null);
    } else {
      // Create new address object
      const newAddress: Address = {
        id: `addr${Date.now()}`,
        name: newAddressForm.name.trim(),
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

      console.log('✅ [CheckoutAddressPage] New address created:', newAddress);

      // Add to addresses list
      setAddresses([...addresses, newAddress]);
      
      // Auto-select the newly added address
      setSelectedAddressId(newAddress.id);
      console.log('✅ [CheckoutAddressPage] Address saved successfully');
      alert('Address added successfully!');
    }
    
    // Reset form and errors
    setNewAddressForm({
      name: '',
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center">
                ✓
              </div>
              <span className="ml-2 text-sm">Cart</span>
            </div>
            <div className="w-16 h-0.5 bg-blue-600"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center">
                2
              </div>
              <span className="ml-2 text-sm font-medium">Address</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center">
                3
              </div>
              <span className="ml-2 text-sm text-gray-500">Review</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center">
                4
              </div>
              <span className="ml-2 text-sm text-gray-500">Payment</span>
            </div>
          </div>
          <h1 className="text-3xl text-center">Select Billing Address</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Address Selection */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl mb-4">Saved Addresses</h2>
              
              {addresses.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-1">No saved addresses yet</p>
                  <p className="text-sm text-gray-500">Click "Add New Address" below to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className={`p-4 border-2 rounded-lg transition-all relative ${
                        selectedAddressId === address.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <input
                          type="radio"
                          name="address"
                          value={address.id}
                          checked={selectedAddressId === address.id}
                          onChange={(e) => setSelectedAddressId(e.target.value)}
                          className="mt-1 cursor-pointer"
                        />
                        <div className="flex-grow">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">{address.name}</span>
                            {address.isDefault && (
                              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            {address.addressLine1}
                            {address.addressLine2 && `, ${address.addressLine2}`}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            {address.city}, {address.state} - {address.pincode}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">{address.country}</p>
                          <p className="text-sm text-gray-600">Phone: {address.phone}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveAddress(address.id)}
                          className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded transition-colors"
                          title="Remove address"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEditAddress(address)}
                          className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded transition-colors"
                          title="Edit address"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Address */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <button
                onClick={() => setShowAddressForm(!showAddressForm)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-5 h-5" />
                Add New Address
              </button>

              {showAddressForm && (
                <form className="mt-6 space-y-4" onSubmit={handleSaveAddress}>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={newAddressForm.name}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-600 outline-none"
                      />
                      {validationErrors.name && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <PhoneInput
                        country={'in'}
                        value={newAddressForm.phone ? `${newAddressForm.phoneCountryCode}${newAddressForm.phone}` : ''}
                        onChange={(phone, country: any) => {
                          // Extract country code and phone number
                          const countryCode = '+' + country.dialCode;
                          const mappedCountry = countryCodes.find(c => c.code === countryCode) || countryCodes[0];
                          const phoneWithoutCode = sanitizePhoneForCountry(phone, { dialCode: countryCode, maxDigits: mappedCountry.maxDigits });
                          setNewAddressForm({ 
                            ...newAddressForm, 
                            phoneCountryCode: countryCode,
                            phone: phoneWithoutCode
                          });
                          setSelectedCountryCode(countryCodes.find(c => c.code === countryCode) || countryCodes[0]);
                          const validation = validatePhoneForCountry(phoneWithoutCode, {
                            code: mappedCountry.code,
                            name: mappedCountry.country,
                            dialCode: mappedCountry.code,
                            minDigits: mappedCountry.minDigits,
                            maxDigits: mappedCountry.maxDigits,
                            pattern: mappedCountry.pattern,
                            patternMessage: mappedCountry.patternMessage,
                          });
                          setValidationErrors(prev => ({ ...prev, phone: validation.isValid ? '' : (validation.error || '') }));
                        }}
                        enableSearch={true}
                        countryCodeEditable={false}
                        inputProps={{
                          name: 'phone',
                          required: true,
                          autoFocus: false
                        }}
                        containerClass="phone-input-container"
                        inputClass="phone-input-field"
                        buttonClass="phone-input-button"
                        dropdownClass="phone-input-dropdown"
                        searchClass="phone-input-search"
                        containerStyle={{
                          width: '100%'
                        }}
                        inputStyle={{
                          width: '100%',
                          height: '42px',
                          fontSize: '14px',
                          paddingLeft: '48px',
                          border: validationErrors.phone ? '1px solid #ef4444' : '1px solid #d1d5db',
                          borderRadius: '0.5rem'
                        }}
                        buttonStyle={{
                          border: '1px solid #d1d5db',
                          borderRight: 'none',
                          borderRadius: '0.5rem 0 0 0.5rem',
                          backgroundColor: 'white'
                        }}
                      />
                      {validationErrors.phone && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.phone}</p>
                      )}
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-600 outline-none"
                    />
                    {validationErrors.addressLine1 && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.addressLine1}</p>
                    )}
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-600 outline-none"
                    />
                  </div>
                  
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        placeholder="Chennai"
                        value={newAddressForm.city}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, city: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-600 outline-none"
                      />
                      {validationErrors.city && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.city}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State *
                      </label>
                      <input
                        type="text"
                        placeholder="Tamil Nadu"
                        value={newAddressForm.state}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, state: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-600 outline-none"
                      />
                      {validationErrors.state && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.state}</p>
                      )}
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-600 outline-none"
                      />
                      {validationErrors.pincode && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.pincode}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      placeholder="India"
                      value={newAddressForm.country}
                      onChange={(e) => setNewAddressForm({ ...newAddressForm, country: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-600 outline-none"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
                          name: '',
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
                      className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors ml-2"
                    >
                      Cancel
                    </button>
                  )}
                </form>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              {/* Coupon Section */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Apply Coupon</h3>
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-600 outline-none"
                    />
                  </div>
                  <button
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {appliedCoupon && (
                  <div className="mt-2 text-sm text-green-600 flex items-center gap-1">
                    ✓ Coupon "{appliedCoupon.code}" applied successfully
                  </div>
                )}
                {couponError && (
                  <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    ✗ {couponError}
                  </div>
                )}
                <div className="mt-2 text-xs text-gray-500">
                  Try: HONEY10 (10% off) or FIRST20 (20% off)
                </div>
              </div>

              {/* Add Tip Section */}
              <div className="mb-6 border-t pt-6">
                <h3 className="font-medium mb-3">Add tip</h3>
                
                {/* Checkbox for showing support */}
                <label className="flex items-start gap-2 mb-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showTipSupport}
                    onChange={(e) => {
                      setShowTipSupport(e.target.checked);
                      if (!e.target.checked) {
                        handleNoneTip();
                      }
                    }}
                    className="mt-1 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">
                    Show your support for the team at Honey Translation Services
                  </span>
                </label>

                {showTipSupport && (
                  <div className="space-y-4">
                    {/* Tip percentage buttons */}
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={() => handleTipPercentageSelect(10)}
                        className={`py-3 px-2 rounded-lg border-2 transition-all ${
                          selectedTipPercentage === 10
                            ? 'border-blue-600 bg-blue-50 text-blue-600'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="text-sm font-medium">10%</div>
                        <div className="text-xs text-gray-600">{formatPrice(Math.round(subtotal * 0.10))}</div>
                      </button>
                      <button
                        onClick={() => handleTipPercentageSelect(15)}
                        className={`py-3 px-2 rounded-lg border-2 transition-all ${
                          selectedTipPercentage === 15
                            ? 'border-blue-600 bg-blue-50 text-blue-600'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="text-sm font-medium">15%</div>
                        <div className="text-xs text-gray-600">{formatPrice(Math.round(subtotal * 0.15))}</div>
                      </button>
                      <button
                        onClick={() => handleTipPercentageSelect(20)}
                        className={`py-3 px-2 rounded-lg border-2 transition-all ${
                          selectedTipPercentage === 20
                            ? 'border-blue-600 bg-blue-50 text-blue-600'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="text-sm font-medium">20%</div>
                        <div className="text-xs text-gray-600">{formatPrice(Math.round(subtotal * 0.20))}</div>
                      </button>
                      <button
                        onClick={handleNoneTip}
                        className={`py-3 px-2 rounded-lg border-2 transition-all ${
                          selectedTipPercentage === null && customTipAmount === 0
                            ? 'border-blue-600 bg-blue-50 text-blue-600'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="text-sm font-medium">None</div>
                      </button>
                    </div>

                    {/* Custom tip input */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Custom tip</label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCustomTipChange(Math.max(0, customTipAmount - 10))}
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={customTipAmount}
                          onChange={(e) => handleCustomTipChange(Math.max(0, parseInt(e.target.value) || 0))}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-600 outline-none text-center"
                          placeholder="0"
                          min="0"
                        />
                        <button
                          onClick={() => handleCustomTipChange(customTipAmount + 10)}
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Add tip button */}
                    <button
                      onClick={handleAddTip}
                      disabled={tipAmount === 0}
                      className={`w-full py-2 rounded-lg transition-colors ${
                        tipAmount > 0
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Add tip
                    </button>

                    {/* Thank you message */}
                    {tipAmount > 0 && (
                      <p className="text-sm text-gray-600 italic text-center">
                        Thank you, we appreciate it.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <h2 className="text-xl mb-4">Order Summary</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>- {formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (GST 18%)</span>
                  <span className="font-medium">{formatPrice(tax)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="text-lg">Total</span>
                  <span className="text-xl text-blue-600 font-medium">{formatPrice(total)}</span>
                </div>
              </div>

              <button
                onClick={handleContinue}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue to Review
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

