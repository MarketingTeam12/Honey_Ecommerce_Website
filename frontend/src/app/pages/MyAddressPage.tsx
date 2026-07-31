import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { MapPin, Plus, Edit2, Trash2 } from 'lucide-react';

interface Address {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  isDefault: boolean;
}

export function MyAddressPage() {
  const { user } = useAuth();
  
  // Load addresses from localStorage or start with empty array - USER SPECIFIC
  // Using unified key so it matches NewCheckoutAddressPage
  const loadAddresses = (): Address[] => {
    if (!user?.id) return []; // Return empty if no user
    
    try {
      // Check both old and new key for backwards compatibility
      const saved = localStorage.getItem(`honey_addresses_${user.id}`) || localStorage.getItem(`my_addresses_${user.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert between different address schemas if needed
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    } catch (e) {
      console.error('Failed to load addresses:', e);
      return [];
    }
  };

  const [addresses, setAddresses] = useState<Address[]>(loadAddresses());

  // Reload addresses when user changes
  useEffect(() => {
    if (user?.id) {
      setAddresses(loadAddresses());
    } else {
      setAddresses([]);
    }
  }, [user?.id]);

  // Save addresses to localStorage whenever they change - USER SPECIFIC
  // Using unified key so it matches NewCheckoutAddressPage
  const updateAddresses = (newAddresses: Address[]) => {
    if (!user?.id) return; // Don't save if no user
    
    setAddresses(newAddresses);
    try {
      localStorage.setItem(`honey_addresses_${user.id}`, JSON.stringify(newAddresses));
      // Also remove old key if it exists for clean migration
      localStorage.removeItem(`my_addresses_${user.id}`);
    } catch (e) {
      console.error('Failed to save addresses:', e);
    }
  };

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      // Update existing address
      updateAddresses(addresses.map(addr => 
        addr.id === editingId 
          ? { ...addr, ...formData }
          : addr
      ));
      setEditingId(null);
    } else {
      // Add new address
      const newAddress: Address = {
        id: Date.now().toString(),
        ...formData,
        isDefault: addresses.length === 0
      };
      updateAddresses([...addresses, newAddress]);
    }
    setFormData({ name: '', address: '', city: '', state: '', zipCode: '', phone: '' });
    setShowAddForm(false);
  };

  const handleEdit = (address: Address) => {
    setFormData({
      name: address.name,
      address: address.address,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      phone: address.phone
    });
    setEditingId(address.id);
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this address?')) {
      updateAddresses(addresses.filter(addr => addr.id !== id));
    }
  };

  const setDefault = (id: string) => {
    updateAddresses(addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === id
    })));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6 text-gray-700" />
            <h1 className="text-2xl font-semibold text-gray-900">My Addresses</h1>
          </div>
          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingId(null);
              setFormData({ name: '', address: '', city: '', state: '', zipCode: '', phone: '' });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New Address
          </button>
        </div>

        {/* Add/Edit Address Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingId ? 'Edit Address' : 'Add New Address'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingId ? 'Update Address' : 'Add Address'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingId(null);
                    setFormData({ name: '', address: '', city: '', state: '', zipCode: '', phone: '' });
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Address List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`bg-white rounded-lg shadow-sm border-2 p-6 relative ${
                address.isDefault ? 'border-blue-500' : 'border-gray-200'
              }`}
            >
              {address.isDefault && (
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 bg-orange-500 text-white text-xs rounded-full font-medium">
                    Default
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">{address.name}</h3>
                <p className="text-gray-600 text-sm">{address.address}</p>
                <p className="text-gray-600 text-sm">{address.city}</p>
                <p className="text-gray-600 text-sm">{address.state}</p>
                <p className="text-gray-600 text-sm">India</p>
                <p className="text-gray-600 text-sm">{address.zipCode}</p>
                <p className="text-gray-600 text-sm mt-2">{address.phone}</p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleEdit(address)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(address.id)}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                {!address.isDefault && (
                  <button
                    onClick={() => setDefault(address.id)}
                    className="ml-auto text-gray-600 hover:text-gray-700 text-sm font-medium"
                  >
                    Set as Default
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {addresses.length === 0 && !showAddForm && (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses saved</h3>
            <p className="text-gray-600 mb-6">Add your first address to get started</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Add New Address
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyAddressPage;