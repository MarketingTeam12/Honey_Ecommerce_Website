import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authClient } from '@/app/utils/authClient';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Completing Google sign-in...');

  useEffect(() => {
    let isMounted = true;

    const finalizeOAuth = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');

        if (code) {
          const { error } = await authClient.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('[OAuth Callback] exchangeCodeForSession failed:', error);
          }
        }

        let sessionData: Awaited<ReturnType<typeof authClient.auth.getSession>>['data'] | null = null;
        for (let attempt = 0; attempt < 6; attempt += 1) {
          const { data, error } = await authClient.auth.getSession();
          if (error) {
            console.error('[OAuth Callback] getSession failed:', error);
          }
          sessionData = data;
          if (data.session?.user) {
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 400));
        }

        if (sessionData?.session?.user) {
          if (isMounted) {
            setMessage('Signed in successfully. Redirecting...');
          }
          const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
          if (redirectUrl) {
            sessionStorage.removeItem('redirectAfterLogin');
            navigate(redirectUrl, { replace: true });
            return;
          }
          navigate('/', { replace: true });
          return;
        }

        if (isMounted) {
          setMessage('Sign-in could not be completed. Please try again.');
        }
        navigate('/signin', { replace: true });
      } catch (err) {
        console.error('[OAuth Callback] Unexpected error:', err);
        if (isMounted) {
          setMessage('Sign-in failed. Please try again.');
        }
        navigate('/signin', { replace: true });
      }
    };

    finalizeOAuth();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Google Sign-In</h1>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}

export default AuthCallbackPage;

