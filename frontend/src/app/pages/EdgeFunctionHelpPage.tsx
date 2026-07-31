import { Link } from 'react-router-dom';
import { ArrowLeft, Database, Server, Shield } from 'lucide-react';
import { API_URL } from '@/app/utils/api';

export default function EdgeFunctionHelpPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link to="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Backend Troubleshooting</h1>
          <p className="text-gray-600 mt-2">
            This project now uses the local Node backend, Passport.js authentication, and MySQL storage.
          </p>
        </div>

        <div className="grid gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <Server className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-gray-900">Backend URL</h2>
            </div>
            <p className="text-sm text-gray-700">
              Frontend requests are routed to <code className="bg-gray-100 px-2 py-1 rounded">{API_URL}</code>.
              Set <code className="bg-gray-100 px-2 py-1 rounded">VITE_API_BASE_URL</code> if your backend runs elsewhere.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <Database className="w-5 h-5 text-green-600" />
              <h2 className="font-semibold text-gray-900">MySQL</h2>
            </div>
            <p className="text-sm text-gray-700">
              Configure <code className="bg-gray-100 px-2 py-1 rounded">MYSQL_HOST</code>,
              <code className="bg-gray-100 px-2 py-1 rounded ml-1">MYSQL_USER</code>,
              <code className="bg-gray-100 px-2 py-1 rounded ml-1">MYSQL_PASSWORD</code>, and
              <code className="bg-gray-100 px-2 py-1 rounded ml-1">MYSQL_DATABASE</code> in <code>backend/.env</code>.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-5 h-5 text-purple-600" />
              <h2 className="font-semibold text-gray-900">Passport.js Auth</h2>
            </div>
            <p className="text-sm text-gray-700">
              Email/password sign-in uses Passport Local, bcrypt password hashes, and JWT bearer tokens.
              Set <code className="bg-gray-100 px-2 py-1 rounded ml-1">JWT_SECRET</code> before production.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
