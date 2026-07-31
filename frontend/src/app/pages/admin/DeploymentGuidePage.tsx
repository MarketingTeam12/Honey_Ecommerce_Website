import { useEffect, useState } from 'react';
import { CheckCircle, Database, Server, Shield, XCircle } from 'lucide-react';
import { AdminLayout } from '@/app/components/admin/AdminLayout';
import { API_URL } from '@/app/utils/api';

export function DeploymentGuidePage() {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/setup/status`)
      .then((response) => setIsOnline(response.ok))
      .catch(() => setIsOnline(false));
  }, []);

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Backend Deployment Guide</h1>
          <p className="text-gray-600 mt-1">
            Configure the Node backend with Passport.js and MySQL.
          </p>
        </div>

        <div className={`rounded-lg border p-4 ${isOnline ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-center gap-2">
            {isOnline ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-yellow-600" />}
            <span className="font-semibold">
              {isOnline ? 'Backend is reachable' : 'Backend is not reachable yet'}
            </span>
          </div>
          <p className="text-sm mt-2">
            Health checks use <code className="bg-white px-2 py-1 rounded">{API_URL}</code>.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <section className="bg-white border border-gray-200 rounded-lg p-5">
            <Server className="w-6 h-6 text-blue-600 mb-3" />
            <h2 className="font-semibold text-gray-900 mb-2">1. Backend</h2>
            <p className="text-sm text-gray-700">
              Run <code className="bg-gray-100 px-2 py-1 rounded">npm install</code> in <code>backend</code>, then start with <code>npm start</code>.
            </p>
          </section>

          <section className="bg-white border border-gray-200 rounded-lg p-5">
            <Database className="w-6 h-6 text-green-600 mb-3" />
            <h2 className="font-semibold text-gray-900 mb-2">2. MySQL</h2>
            <p className="text-sm text-gray-700">
              Create the configured database. The backend creates required <code>users</code> and <code>app_kv</code> tables on startup.
            </p>
          </section>

          <section className="bg-white border border-gray-200 rounded-lg p-5">
            <Shield className="w-6 h-6 text-purple-600 mb-3" />
            <h2 className="font-semibold text-gray-900 mb-2">3. Auth</h2>
            <p className="text-sm text-gray-700">
              Set a strong <code>JWT_SECRET</code>. Passport Local handles login and Passport JWT protects admin APIs.
            </p>
          </section>
        </div>

        <div className="bg-gray-900 text-green-300 rounded-lg p-4 text-sm overflow-x-auto">
          <pre>{`PORT=3000
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=honey_translations
JWT_SECRET=replace-with-a-long-random-secret`}</pre>
        </div>
      </div>
    </AdminLayout>
  );
}
