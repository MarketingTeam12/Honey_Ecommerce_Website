import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { PublicPageSkeleton } from '@/app/components/layout/PageSkeleton';
import { useAuth } from '@/app/context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <PublicPageSkeleton />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
          <a href="/" className="text-blue-600 hover:text-blue-700 font-medium">
            Go to Homepage
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
