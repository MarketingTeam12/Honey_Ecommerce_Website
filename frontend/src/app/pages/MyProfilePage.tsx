import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/app/context/AuthContext';
import { User, Eye, EyeOff, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAuthClient } from '@/app/utils/authClient';
import { API_URL } from '@/app/utils/api';
import { buildHeaders } from '@/app/utils/buildHeaders';
import { validatePasswordPolicy } from '@/app/utils/passwordValidation';
import { PasswordRulesChecklist } from '@/app/components/auth/PasswordRulesChecklist';

function normalizeIndianPhone(input: string): { valid: boolean; value: string } {
  const raw = input.trim();
  if (!raw) return { valid: true, value: 'N/A' };
  const digits = raw.replace(/\D/g, '');
  const tenDigits = digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits;
  if (!/^[6-9]\d{9}$/.test(tenDigits)) {
    return { valid: false, value: raw };
  }
  return { valid: true, value: `+91${tenDigits}` };
}

export function MyProfilePage() {
  const { user, accessToken, loading: authLoading } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    dateOfBirth: '',
    gender: '',
    email: user?.email || '',
    phoneNumber: '',
    companyName: '',
    jobTitle: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zipCode: ''
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Password visibility states
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [deletionConfirmed, setDeletionConfirmed] = useState(false);
  const [isRequestingDeletion, setIsRequestingDeletion] = useState(false);
  const [deletionRequestRecord, setDeletionRequestRecord] = useState<{ id: string; requested_at: string } | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!accessToken || !user?.id) return;

      try {
        const response = await fetch(
          `${API_URL}/auth/me`,
          {
            headers: buildHeaders(accessToken)
          }
        );

        if (!response.ok) return;

        const data = await response.json();
        const profile = data?.user || {};
        const details = profile.profile_details || {};
        const nameParts = (profile.name || user.name || '').trim().split(' ');

        setFormData(prev => ({
          ...prev,
          firstName: nameParts[0] || prev.firstName,
          lastName: nameParts.slice(1).join(' ') || prev.lastName,
          email: profile.email || user.email || prev.email,
          phoneNumber: profile.phone && profile.phone !== 'N/A' ? profile.phone : prev.phoneNumber,
          dateOfBirth: details.dateOfBirth || prev.dateOfBirth,
          gender: details.gender || prev.gender,
          companyName: details.companyName || prev.companyName,
          jobTitle: details.jobTitle || prev.jobTitle,
          address: details.address || prev.address,
          city: details.city || prev.city,
          state: details.state || prev.state,
          country: details.country || prev.country,
          zipCode: details.zipCode || prev.zipCode
        }));
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    };

    loadProfile();
  }, [accessToken, user?.id, user?.name, user?.email]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accessToken) {
      toast.error('You must be logged in to update profile');
      return;
    }

    const name = `${formData.firstName} ${formData.lastName}`.trim();
    if (!name) {
      toast.error('Please enter your name');
      return;
    }

    const phoneCheck = normalizeIndianPhone(formData.phoneNumber);
    if (!phoneCheck.valid) {
      toast.error('Please enter a valid 10-digit Indian mobile number (with +91)');
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/auth/profile`,
        {
          method: 'PUT',
          headers: buildHeaders(accessToken),
          body: JSON.stringify({
            name,
            phone: phoneCheck.value,
            dateOfBirth: formData.dateOfBirth,
            gender: formData.gender,
            companyName: formData.companyName,
            jobTitle: formData.jobTitle,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            country: formData.country,
            zipCode: formData.zipCode
          })
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error || 'Failed to update profile');
      }

      if (phoneCheck.value !== 'N/A') {
        setFormData(prev => ({ ...prev, phoneNumber: phoneCheck.value }));
      }

      toast.success('Profile updated successfully');
      setIsEditMode(false);
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error?.message || 'Failed to update profile');
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }
    
    const policy = validatePasswordPolicy(passwordData.newPassword);
    if (!policy.valid) {
      toast.error('New password must be at least 8 characters with at least one letter and one number');
      return;
    }
    
    if (!accessToken) {
      toast.error('You must be logged in to change your password');
      return;
    }
    
    // Update password
    updatePassword();
  };

  const updatePassword = async () => {
    setIsUpdatingPassword(true);
    
    try {
      const authClient = getAuthClient();
      const { error: updateError } = await authClient.auth.changePassword(
        passwordData.oldPassword,
        passwordData.newPassword
      );
      
      if (updateError) {
        console.error('Password update error:', updateError);
        toast.error(updateError.message || 'Failed to update password');
        setIsUpdatingPassword(false);
        return;
      }
      
      // Success!
      toast.success('Password updated successfully!');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setShowOldPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      
    } catch (error: any) {
      console.error('Password update error:', error);
      toast.error('Failed to update password. Please try again.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleRequestDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      toast.error('You must be logged in to request account deletion');
      return;
    }
    if (!deletionConfirmed) {
      toast.error('Please confirm that you want to request account deletion');
      return;
    }

    setIsRequestingDeletion(true);
    try {
      const response = await fetch(`${API_URL}/auth/request-deletion`, {
        method: 'POST',
        headers: buildHeaders(accessToken),
        body: JSON.stringify({ reason: deletionReason.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Failed to submit deletion request');
      }
      setDeletionRequestRecord({
        id: data?.request?.id || 'submitted',
        requested_at: data?.request?.requested_at || new Date().toISOString(),
      });
      setDeletionReason('');
      setDeletionConfirmed(false);
      toast.success('Account deletion request submitted for review.');
    } catch (error: any) {
      console.error('Account deletion request error:', error);
      toast.error(error?.message || 'Failed to submit deletion request');
    } finally {
      setIsRequestingDeletion(false);
    }
  };

  const handleCancel = () => {
    setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
  };

  if (!authLoading && !user) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-6">
          <User className="w-6 h-6 text-gray-700" />
          <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">My Profile</h2>
                {!isEditMode && (
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      disabled={!isEditMode}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      disabled={!isEditMode}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleInputChange}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                {isEditMode && (
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditMode(false)}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Change Password Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Change Password</h2>
              
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Old Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showOldPassword ? 'text' : 'password'}
                      name="oldPassword"
                      autoComplete="current-password"
                      value={passwordData.oldPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter current password"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                    >
                      {showOldPassword ? <Eye className="w-5 h-5 text-gray-500" /> : <EyeOff className="w-5 h-5 text-gray-500" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      name="newPassword"
                      autoComplete="new-password"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter new password"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                    >
                      {showNewPassword ? <Eye className="w-5 h-5 text-gray-500" /> : <EyeOff className="w-5 h-5 text-gray-500" />}
                    </button>
                  </div>
                  <div className="mt-2">
                    <PasswordRulesChecklist password={passwordData.newPassword} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      autoComplete="new-password"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Confirm new password"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <Eye className="w-5 h-5 text-gray-500" /> : <EyeOff className="w-5 h-5 text-gray-500" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm disabled:bg-blue-400 disabled:cursor-not-allowed"
                  >
                    {isUpdatingPassword ? 'Updating...' : 'Submit'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isUpdatingPassword}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>

            {/* Request Account Deletion */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-red-200 mt-6">
              <div className="flex items-center gap-2 mb-2">
                <Trash2 className="w-5 h-5 text-red-600" />
                <h2 className="text-xl font-bold text-gray-900">Request Account Deletion</h2>
              </div>
              <p className="text-xs text-gray-600 mb-4">
                Submit a deletion request to our support team. Your account and order records are not deleted automatically; our team reviews and processes requests manually.
              </p>

              {deletionRequestRecord ? (
                <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
                  <p className="font-semibold">Deletion request submitted</p>
                  <p className="mt-1">Reference ID: <span className="font-mono">{deletionRequestRecord.id}</span></p>
                </div>
              ) : (
                <form onSubmit={handleRequestDeletion} className="space-y-3">
                  <div>
                    <label htmlFor="deletion-reason" className="block text-xs font-medium text-gray-700 mb-1">
                      Reason (optional)
                    </label>
                    <textarea
                      id="deletion-reason"
                      rows={2}
                      value={deletionReason}
                      onChange={(e) => setDeletionReason(e.target.value)}
                      placeholder="Optional note for our team"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <label className="flex items-start gap-2 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deletionConfirmed}
                      onChange={(e) => setDeletionConfirmed(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span>I confirm I want to request deletion of my Honey Translations account.</span>
                  </label>
                  <button
                    type="submit"
                    disabled={isRequestingDeletion || !deletionConfirmed}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRequestingDeletion ? 'Submitting...' : 'Request Account Deletion'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyProfilePage;
