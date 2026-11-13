import { createContext, useContext, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, LogIn } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';

interface AuthGateContextType {
  // Returns true if the user is signed in. If not, shows the sign-in
  // popup and returns false so the caller can bail out of the action.
  requireAuth: (reason?: string) => boolean;
}

const AuthGateContext = createContext<AuthGateContextType | undefined>(undefined);

const DEFAULT_MESSAGE = 'Please sign in to continue.';

export function AuthGateProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);

  const requireAuth = (reason?: string): boolean => {
    if (user) return true;
    setMessage(reason || DEFAULT_MESSAGE);
    setOpen(true);
    return false;
  };

  const goToSignIn = () => {
    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    sessionStorage.setItem('redirectAfterLogin', currentPath);
    setOpen(false);
    navigate('/signin');
  };

  return (
    <AuthGateContext.Provider value={{ requireAuth }}>
      {children}

      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 text-center relative">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-7 h-7 text-blue-600" />
            </div>

            <h2 className="text-lg font-bold text-gray-900 mb-2">Sign in required</h2>
            <p className="text-gray-600 mb-6">{message}</p>

            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={goToSignIn}
                className="flex-1 px-4 py-2 rounded-lg bg-[#1a1f5c] text-white hover:bg-[#252b70] transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthGateContext.Provider>
  );
}

export function useAuthGate() {
  const context = useContext(AuthGateContext);
  if (!context) {
    throw new Error('useAuthGate must be used within AuthGateProvider');
  }
  return context;
}
