import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { authClient } from '@/app/utils/authClient';
import { validatePasswordPolicy } from '@/app/utils/passwordValidation';
import { PasswordRulesChecklist } from '@/app/components/auth/PasswordRulesChecklist';
import { Button } from '@/app/components/ui/button';
import logoImage from 'figma:asset/c63663e51387c858f000fbba9c714974dbc99e3e.png';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const passwordCheck = validatePasswordPolicy(password);
  const passwordsMatch = password === confirmPassword;
  const canSubmit = Boolean(token) && passwordCheck.isValid && Boolean(confirmPassword) && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Reset link is missing or invalid. Please request a new password reset.');
      return;
    }

    if (!passwordCheck.isValid) {
      setError(passwordCheck.message);
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error: resetError } = await authClient.auth.resetPassword(token, password);
      if (resetError) {
        setError(resetError.message || 'Unable to reset password. Please request a new link.');
        return;
      }

      setCompleted(true);
      toast.success('Password updated successfully! Please sign in.');
      window.setTimeout(() => navigate('/signin', { replace: true }), 1800);
    } catch {
      setError('Unable to reach the server to reset your password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4">
            <img src={logoImage} alt="Honey Translations Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Set New Password</h1>
          <p className="text-gray-600 mt-2">Choose a strong password for your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {completed ? (
            <div className="space-y-6 text-center" role="status" aria-live="polite">
              <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
              </div>
              <p className="text-gray-700 text-sm">Your password has been updated. Redirecting to Sign In...</p>
              <Link
                to="/signin"
                className="inline-flex items-center justify-center w-full py-3 px-4 rounded-lg bg-[#1a1f5c] hover:bg-[#252b70] text-white font-medium transition-colors"
              >
                Continue to Sign In
              </Link>
            </div>
          ) : !token ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                This password reset link is missing a token or has expired. Please request a new link.
              </p>
              <Link
                to="/forgot-password"
                className="inline-flex items-center justify-center w-full py-3 px-4 rounded-lg bg-[#1a1f5c] hover:bg-[#252b70] text-white font-medium transition-colors"
              >
                Request New Reset Link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="reset-password" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    id="reset-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    aria-describedby="reset-password-rules"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a1f5c] focus:border-[#1a1f5c] transition-colors"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" aria-hidden="true" />
                    ) : (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" aria-hidden="true" />
                    )}
                  </button>
                </div>
                <PasswordRulesChecklist id="reset-password-rules" password={password} />
              </div>

              <div>
                <label htmlFor="reset-confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    id="reset-confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a1f5c] focus:border-[#1a1f5c] transition-colors"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    aria-pressed={showConfirmPassword}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" aria-hidden="true" />
                    ) : (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !canSubmit}
                className="w-full h-auto py-3 px-4 rounded-lg bg-[#1a1f5c] hover:bg-[#252b70] text-white text-base font-medium"
              >
                {loading ? 'Updating Password...' : 'Update Password'}
              </Button>

              <div className="text-center">
                <Link to="/signin" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1a1f5c] hover:underline">
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
