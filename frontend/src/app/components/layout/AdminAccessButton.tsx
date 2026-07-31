import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { hasAdminAccess } from '@/app/utils/roleAccess';

export function AdminAccessButton() {
  const { user } = useAuth();
  const canAccessAdmin = hasAdminAccess(user?.email, user?.role);

  return (
    <Link
      to={canAccessAdmin ? '/admin' : '/signin?role=admin'}
      className="fixed bottom-24 left-6 z-50 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-full shadow-2xl hover:shadow-purple-500/50 hover:scale-110 transition-all duration-300 group"
      title="Admin Panel"
    >
      <Settings className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
      <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-purple-900 text-white px-3 py-1 rounded-lg text-sm font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
        Admin Panel
      </span>
    </Link>
  );
}
