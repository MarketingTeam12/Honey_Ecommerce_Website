import { useEffect, useState } from 'react';
import { publicAnonKey } from '@/app/utils/backendInfo';
import { API_URL } from '@/app/utils/api';

/**
 * DatabaseSetup Component
 * 
 * This component runs on app initialization to check and configure the database.
 * It diagnoses JWT/RLS issues and attempts to fix them automatically.
 */
export default function DatabaseSetup() {
  const [status, setStatus] = useState<'checking' | 'success' | 'error' | 'idle'>('idle');
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [message, setMessage] = useState<string>('');
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        setStatus('checking');
        console.log('🔍 [DatabaseSetup] Running diagnostics...');

        // Add timeout controller
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        // Run diagnostics first
        const diagResponse = await fetch(
          `${API_URL}/diagnostics`,
          {
            headers: {
              'Content-Type': 'application/json',
              'apikey': publicAnonKey,
              'Authorization': `Bearer ${publicAnonKey}`
            },
            signal: controller.signal
          }
        );

        clearTimeout(timeout);

        if (diagResponse.ok) {
          const diagData = await diagResponse.json();
          setDiagnostics(diagData.diagnostics);
          console.log('📊 [DatabaseSetup] Diagnostics:', diagData.diagnostics);

          // Check if database has connection issues
          if (diagData.diagnostics?.database?.connection === 'error') {
            console.log('⚠️ [DatabaseSetup] Database connection error detected');
            setMessage('Database configuration issue detected. Click here to fix.');
            setStatus('error');
            setShowBanner(true);
            
            // Auto-attempt setup
            console.log('🔧 [DatabaseSetup] Attempting automatic setup...');
            const setupResponse = await fetch(
              `${API_URL}/setup-database`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': publicAnonKey,
                  'Authorization': `Bearer ${publicAnonKey}`
                }
              }
            );

            if (setupResponse.ok) {
              const setupData = await setupResponse.json();
              console.log('✅ [DatabaseSetup] Database setup completed:', setupData.message);
              setMessage('Database issue auto-fixed!');
              setStatus('success');
              // Hide banner after 5 seconds
              setTimeout(() => setShowBanner(false), 5000);
            } else {
              const errorData = await setupResponse.json().catch(() => ({ error: 'Unknown error' }));
              console.error('❌ [DatabaseSetup] Setup failed:', errorData);
              setMessage('Database needs manual configuration. Click to view instructions.');
            }
          } else if (diagData.diagnostics?.database?.connection === 'success') {
            console.log('✅ [DatabaseSetup] Database is working correctly');
            setMessage('Database is healthy');
            setStatus('success');
          } else {
            console.log('⚠️ [DatabaseSetup] Unknown database status');
            setMessage('Database status unknown');
            setStatus('error');
            setShowBanner(false); // Don't show banner for unknown status
          }
        } else {
          console.log('ℹ️ [DatabaseSetup] Diagnostics failed (status:', diagResponse.status, ') - Backend may not be deployed');
          setMessage(`Backend unavailable`);
          setStatus('error');
          setShowBanner(false); // Don't show banner if backend is unavailable
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('ℹ️ [DatabaseSetup] Request timed out - Backend may not be deployed');
        } else {
          console.log('ℹ️ [DatabaseSetup] Error:', error.message, '- Backend may not be deployed');
        }
        // Don't show banner or set error status for network issues
        setMessage('Backend unavailable (working in offline mode)');
        setStatus('idle');
        setShowBanner(false);
      }
    };

    setupDatabase();
  }, []);

  // Show a banner if there's an error
  if (showBanner && status === 'error') {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <span className="font-medium">{message}</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/debug/database"
              className="bg-white text-red-600 px-4 py-2 rounded font-medium hover:bg-red-50"
            >
              Fix Now
            </a>
            <button
              onClick={() => setShowBanner(false)}
              className="text-white hover:text-red-200"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    );
  }

  // This component doesn't render anything in success state
  return null;
}