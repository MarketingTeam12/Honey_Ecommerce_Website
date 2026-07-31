import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Copy, CheckCircle, Tag, Calendar, Percent, Package, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/context/AuthContext';
import { copyToClipboard } from '@/app/utils/clipboard';
import { AdminLayout } from '@/app/components/admin/AdminLayout';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { canAccessRoleAction } from '@/app/utils/roleAccess';
import { Badge } from '@/app/components/ui/badge';
import { API_URL } from '@/app/utils/api';
import { buildHeaders } from '@/app/utils/buildHeaders';

interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  description?: string;
}

export default function CouponsPage() {
  const { user, accessToken } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingCoupon, setIsAddingCoupon] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const canEditCoupons = canAccessRoleAction(user?.role, 'coupons', 'edit');
  const canDeleteCoupons = canAccessRoleAction(user?.role, 'coupons', 'delete');

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    minOrderValue: '',
    maxDiscount: '',
    usageLimit: '',
    validFrom: '',
    validUntil: '',
    isActive: true,
    description: ''
  });

  // UNIFIED STORAGE KEY - shared with frontend
  const STORAGE_KEY = 'honey_admin_coupons';

  // Load coupons from localStorage
  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      const response = await fetch(`${API_URL}/coupons`, { headers: buildHeaders(accessToken) });
      if (response.ok) {
        const data = await response.json();
        const serverCoupons: Coupon[] = (data.coupons || []).map((c: any) => ({
          id: String(c.id),
          code: c.code,
          discountType: c.discountType,
          discountValue: Number(c.discountValue),
          minOrderValue: c.minOrderValue != null ? Number(c.minOrderValue) : undefined,
          maxDiscount: c.maxDiscount != null ? Number(c.maxDiscount) : undefined,
          usageLimit: c.usageLimit != null ? Number(c.usageLimit) : undefined,
          usedCount: Number(c.usedCount || 0),
          validFrom: c.validFrom,
          validUntil: c.validUntil,
          isActive: c.isActive !== false && c.status !== 'inactive',
          description: c.description,
        }));
        setCoupons(serverCoupons);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serverCoupons));
        return;
      }
      console.warn('⚠️ [Admin] Backend returned status', response.status, '- falling back to local coupons');
    } catch (error) {
      console.warn('⚠️ [Admin] Failed to load coupons from backend, falling back to local coupons:', error);
    }

    try {
      const savedCoupons = localStorage.getItem(STORAGE_KEY);
      if (savedCoupons) {
        setCoupons(JSON.parse(savedCoupons));
      } else {
        // Initialize with some demo coupons
        const demoCoupons: Coupon[] = [
          {
            id: '1',
            code: 'WELCOME10',
            discountType: 'percentage',
            discountValue: 10,
            minOrderValue: 1000,
            maxDiscount: 500,
            usageLimit: 100,
            usedCount: 0,
            validFrom: '2026-01-01',
            validUntil: '2026-12-31',
            isActive: true,
            description: 'Welcome discount for new customers'
          },
          {
            id: '2',
            code: 'SAVE500',
            discountType: 'fixed',
            discountValue: 500,
            minOrderValue: 5000,
            usageLimit: 50,
            usedCount: 0,
            validFrom: '2026-01-01',
            validUntil: '2026-12-31',
            isActive: true,
            description: 'Flat ₹500 off on orders above ₹5000'
          },
          {
            id: '3',
            code: 'SPRING20',
            discountType: 'percentage',
            discountValue: 20,
            minOrderValue: 2000,
            maxDiscount: 1000,
            usageLimit: 200,
            usedCount: 0,
            validFrom: '2026-03-01',
            validUntil: '2026-06-30',
            isActive: true,
            description: 'Spring special - 20% off'
          }
        ];
        setCoupons(demoCoupons);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(demoCoupons));
      }
    } catch (error) {
      console.error('Error loading coupons:', error);
      toast.error('Failed to load coupons');
    }
  };

  const saveCoupons = (updatedCoupons: Coupon[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCoupons));
      setCoupons(updatedCoupons);
      console.log('✅ [Admin] Coupons saved to localStorage:', STORAGE_KEY);
    } catch (error) {
      console.error('Error saving coupons:', error);
      toast.error('Failed to save coupons');
    }
  };

  const handleAddCoupon = async () => {
    if (!formData.code || !formData.discountValue) {
      toast.error('Please fill in required fields');
      return;
    }

    // Check for duplicate code
    if (coupons.some(c => c.code.toLowerCase() === formData.code.toLowerCase())) {
      toast.error('Coupon code already exists');
      return;
    }

    const newCoupon: Coupon = {
      id: Date.now().toString(),
      code: formData.code.toUpperCase(),
      discountType: formData.discountType,
      discountValue: parseFloat(formData.discountValue),
      minOrderValue: formData.minOrderValue ? parseFloat(formData.minOrderValue) : undefined,
      maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : undefined,
      usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
      usedCount: 0,
      validFrom: formData.validFrom,
      validUntil: formData.validUntil,
      isActive: formData.isActive,
      description: formData.description
    };

    try {
      const response = await fetch(`${API_URL}/coupons`, {
        method: 'POST',
        headers: buildHeaders(accessToken),
        body: JSON.stringify(newCoupon),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.coupon?.id) newCoupon.id = String(data.coupon.id);
      } else {
        toast.error('Coupon saved locally, but failed to sync to the server. Customers may not see it yet.');
      }
    } catch (error) {
      console.error('Failed to save coupon to backend:', error);
      toast.error('Coupon saved locally, but failed to sync to the server. Customers may not see it yet.');
    }

    const updatedCoupons = [...coupons, newCoupon];
    saveCoupons(updatedCoupons);
    setIsAddingCoupon(false);
    resetForm();
    toast.success('Coupon created successfully');
  };

  const handleUpdateCoupon = async () => {
    if (!editingCoupon || !formData.code || !formData.discountValue) {
      toast.error('Please fill in required fields');
      return;
    }

    const updatedCoupon: Coupon = {
      ...editingCoupon,
      code: formData.code.toUpperCase(),
      discountType: formData.discountType,
      discountValue: parseFloat(formData.discountValue),
      minOrderValue: formData.minOrderValue ? parseFloat(formData.minOrderValue) : undefined,
      maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : undefined,
      usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
      validFrom: formData.validFrom,
      validUntil: formData.validUntil,
      isActive: formData.isActive,
      description: formData.description
    };

    try {
      const response = await fetch(`${API_URL}/coupons/${editingCoupon.id}`, {
        method: 'PUT',
        headers: buildHeaders(accessToken),
        body: JSON.stringify(updatedCoupon),
      });
      if (!response.ok) {
        toast.error('Coupon updated locally, but failed to sync to the server.');
      }
    } catch (error) {
      console.error('Failed to update coupon on backend:', error);
      toast.error('Coupon updated locally, but failed to sync to the server.');
    }

    const updatedCoupons = coupons.map(c => (c.id === editingCoupon.id ? updatedCoupon : c));

    saveCoupons(updatedCoupons);
    setEditingCoupon(null);
    resetForm();
    toast.success('Coupon updated successfully');
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const response = await fetch(`${API_URL}/coupons/${id}`, {
        method: 'DELETE',
        headers: buildHeaders(accessToken),
      });
      if (!response.ok) {
        toast.error('Coupon removed locally, but failed to sync to the server.');
      }
    } catch (error) {
      console.error('Failed to delete coupon on backend:', error);
      toast.error('Coupon removed locally, but failed to sync to the server.');
    }

    const updatedCoupons = coupons.filter(c => c.id !== id);
    saveCoupons(updatedCoupons);
    toast.success('Coupon deleted successfully');
  };

  const handleToggleActive = async (id: string) => {
    const target = coupons.find(c => c.id === id);
    const updatedCoupons = coupons.map(c =>
      c.id === id ? { ...c, isActive: !c.isActive } : c
    );

    if (target) {
      try {
        const response = await fetch(`${API_URL}/coupons/${id}`, {
          method: 'PUT',
          headers: buildHeaders(accessToken),
          body: JSON.stringify({ ...target, isActive: !target.isActive, status: !target.isActive ? 'active' : 'inactive' }),
        });
        if (!response.ok) {
          toast.error('Status updated locally, but failed to sync to the server.');
        }
      } catch (error) {
        console.error('Failed to toggle coupon status on backend:', error);
        toast.error('Status updated locally, but failed to sync to the server.');
      }
    }

    saveCoupons(updatedCoupons);
    toast.success('Coupon status updated');
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toString(),
      minOrderValue: coupon.minOrderValue?.toString() || '',
      maxDiscount: coupon.maxDiscount?.toString() || '',
      usageLimit: coupon.usageLimit?.toString() || '',
      validFrom: coupon.validFrom,
      validUntil: coupon.validUntil,
      isActive: coupon.isActive,
      description: coupon.description || ''
    });
    setIsAddingCoupon(true);
  };

  const handleCopyCode = async (code: string) => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopiedCode(code);
      toast.success('Coupon code copied to clipboard');
      setTimeout(() => setCopiedCode(null), 2000);
    } else {
      toast.error('Failed to copy coupon code');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discountType: 'percentage',
      discountValue: '',
      minOrderValue: '',
      maxDiscount: '',
      usageLimit: '',
      validFrom: '',
      validUntil: '',
      isActive: true,
      description: ''
    });
  };

  const filteredCoupons = coupons.filter(coupon =>
    coupon.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coupon.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Coupon Management</h1>
            <p className="text-gray-600 mt-1">Create and manage discount coupons</p>
          </div>
          <Button
            onClick={() => {
              setIsAddingCoupon(true);
              setEditingCoupon(null);
              resetForm();
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Coupon
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search coupons by code or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Add/Edit Form */}
        {isAddingCoupon && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">
              {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Coupon Code *
                </label>
                <Input
                  type="text"
                  placeholder="e.g., SAVE20"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="uppercase"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Type *
                </label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'fixed' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Value *
                </label>
                <Input
                  type="number"
                  placeholder={formData.discountType === 'percentage' ? '10' : '500'}
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Order Value (₹)
                </label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={formData.minOrderValue}
                  onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                />
              </div>

              {formData.discountType === 'percentage' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Discount (₹)
                  </label>
                  <Input
                    type="number"
                    placeholder="500"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usage Limit
                </label>
                <Input
                  type="number"
                  placeholder="100"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid From
                </label>
                <Input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid Until
                </label>
                <Input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Input
                  type="text"
                  placeholder="Brief description of this coupon"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Active
                </label>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                onClick={editingCoupon ? handleUpdateCoupon : handleAddCoupon}
              >
                {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingCoupon(false);
                  setEditingCoupon(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Coupons List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Validity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCoupons.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No coupons found
                    </td>
                  </tr>
                ) : (
                  filteredCoupons.map((coupon) => (
                    <tr key={coupon.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-blue-600" />
                          <span className="font-mono font-semibold text-blue-600">{coupon.code}</span>
                          <button
                            onClick={() => handleCopyCode(coupon.code)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            {copiedCode === coupon.code ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                        {coupon.description && (
                          <p className="text-sm text-gray-500 mt-1">{coupon.description}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {coupon.discountType === 'percentage' ? (
                            <>
                              <Percent className="w-4 h-4 text-green-600" />
                              <span className="font-semibold">{coupon.discountValue}%</span>
                            </>
                          ) : (
                            <>
                              <Package className="w-4 h-4 text-green-600" />
                              <span className="font-semibold">₹{coupon.discountValue}</span>
                            </>
                          )}
                        </div>
                        {coupon.minOrderValue && (
                          <p className="text-xs text-gray-500 mt-1">Min: ₹{coupon.minOrderValue}</p>
                        )}
                        {coupon.maxDiscount && (
                          <p className="text-xs text-gray-500">Max: ₹{coupon.maxDiscount}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <span className="font-semibold">{coupon.usedCount}</span>
                          {coupon.usageLimit && (
                            <span className="text-gray-500"> / {coupon.usageLimit}</span>
                          )}
                        </div>
                        {coupon.usageLimit && (
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full"
                              style={{ width: `${Math.min((coupon.usedCount / coupon.usageLimit) * 100, 100)}%` }}
                            ></div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            {coupon.validFrom && <div className="text-gray-600">{coupon.validFrom}</div>}
                            {coupon.validUntil && (
                              <div className={isExpired(coupon.validUntil) ? 'text-red-600' : 'text-gray-600'}>
                                to {coupon.validUntil}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant={coupon.isActive ? 'default' : 'secondary'}
                            className="w-fit"
                          >
                            {coupon.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {isExpired(coupon.validUntil) && (
                            <Badge variant="destructive" className="w-fit">
                              Expired
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleActive(coupon.id)}
                            className={`p-2 rounded hover:bg-gray-100 ${
                              coupon.isActive ? 'text-yellow-600' : 'text-green-600'
                            }`}
                            title={coupon.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {coupon.isActive ? <X className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                          {canEditCoupons ? (
                            <button
                              onClick={() => handleEditCoupon(coupon)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="p-2 text-gray-300 rounded cursor-not-allowed"
                              title="Edit access denied"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {canDeleteCoupons ? (
                            <button
                              onClick={() => handleDeleteCoupon(coupon.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="p-2 text-gray-300 rounded cursor-not-allowed"
                              title="Delete access denied"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Coupons</div>
            <div className="text-2xl font-bold text-gray-900">{coupons.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Active Coupons</div>
            <div className="text-2xl font-bold text-green-600">
              {coupons.filter(c => c.isActive && !isExpired(c.validUntil)).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Expired Coupons</div>
            <div className="text-2xl font-bold text-red-600">
              {coupons.filter(c => isExpired(c.validUntil)).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Usage</div>
            <div className="text-2xl font-bold text-blue-600">
              {coupons.reduce((sum, c) => sum + c.usedCount, 0)}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
