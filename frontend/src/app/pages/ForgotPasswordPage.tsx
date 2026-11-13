import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { authClient } from '@/app/utils/authClient';
import { Button } from '@/app/components/ui/button';
import logoImage from 'figma:asset/c63663e51387c858f000fbba9c714974dbc99e3e.png';

const NEUTRAL_RESET_MESSAGE = "If an account exists, we've sent a reset link.";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmittedMessage('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await authClient.auth.requestPasswordReset(trimmedEmail);
      setSubmittedMessage(NEUTRAL_RESET_MESSAGE);
    } catch {
      // Never disclose whether the address exists or leak backend delivery details.
      setSubmittedMessage(NEUTRAL_RESET_MESSAGE);
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
          <h1 className="text-3xl font-bold text-gray-900">Forgot Password</h1>
          <p className="text-gray-600 mt-2">
            Enter your email address and we&apos;ll send you a reset link
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {submittedMessage ? (
            <div className="space-y-6 text-center" role="status" aria-live="polite">
              <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">{submittedMessage}</p>
              <Link
                to="/signin"
                className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg bg-[#1a1f5c] hover:bg-[#252b70] text-white font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    id="forgot-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a1f5c] focus:border-[#1a1f5c] transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-auto py-3 px-4 rounded-lg bg-[#1a1f5c] hover:bg-[#252b70] text-white text-base font-medium"
              >
                {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
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

export default ForgotPasswordPage;
