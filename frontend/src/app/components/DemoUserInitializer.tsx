import { useEffect, useState } from 'react';
import { publicAnonKey } from '@/app/utils/backendInfo';
import { API_URL } from '@/app/utils/api';
import { buildHeaders } from '@/app/utils/buildHeaders';

/**
 * DemoUserInitializer - Auto-initializes demo users in Backend
 * This component runs once on app startup to ensure demo credentials work
 */
export function DemoUserInitializer() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initDemoUsers = async () => {
      // Check if already initialized in this session
      const alreadyInitialized = sessionStorage.getItem('demo_users_initialized');
      if (alreadyInitialized) {
        console.log('✅ Demo users already initialized in this session');
        setInitialized(true);
        return;
      }

      try {
        console.log('🚀 Initializing demo users...');
        
        const controller = new AbortController();
        const timeout = setTimeout(() => {
          controller.abort();
        }, 10000); // 10 second timeout
        
        const response = await fetch(
          `${API_URL}/init-demo-users`,
          {
            method: 'POST',
            headers: buildHeaders(null),
            signal: controller.signal
          }
        );
        
        clearTimeout(timeout);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Demo users initialization result:', data);
          
          // Mark as initialized for this session
          sessionStorage.setItem('demo_users_initialized', 'true');
          setInitialized(true);
          
          // Show success message
          if (data.results) {
            const created = data.results.filter(r => r.status === 'created');
            const existing = data.results.filter(r => r.status === 'already_exists');
            
            if (created.length > 0) {
              console.log(`✅ Created ${created.length} demo user(s):`);
              created.forEach(u => console.log(`   - ${u.email} (${u.role})`));
            }
            
            if (existing.length > 0) {
              console.log(`ℹ️ ${existing.length} demo user(s) already existed`);
            }
          }
        } else {
          const errorText = await response.text();
          
          // Check if it's a backend deployment issue - suppress detailed errors
          const isBackendIssue = errorText.includes('Missing authorization header') || 
                                 errorText.includes('Invalid JWT') || 
                                 errorText.includes('"code":401');
          
          if (isBackendIssue) {
            console.warn('⚠️ [DemoUserInitializer] Backend not available - this is expected if Edge Function is not deployed');
          } else {
            console.warn('⚠️ Demo users initialization failed (non-critical):', errorText);
          }
          
          setInitialized(true); // Don't block app if this fails
        }
      } catch (error: any) {
        // Handle AbortError separately (timeout scenario)
        if (error.name === 'AbortError') {
          console.log('ℹ️ Demo users initialization timed out - using local fallback mode');
          sessionStorage.setItem('demo_users_initialized', 'true'); // Mark as attempted
        } else {
          console.warn('⚠️ Demo users initialization error (non-critical):', error.message || error);
        }
        setInitialized(true); // Don't block app if this fails
      }
    };

    initDemoUsers();
  }, []);

  // This component doesn't render anything
  return null;
}

export default DemoUserInitializer;