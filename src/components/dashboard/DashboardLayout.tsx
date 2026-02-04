'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import ProfileSettingsPage from './ProfileSettingsPage';
import { supabaseClient } from '@/lib/supabase/client';
import { useLoading } from '@/contexts/LoadingContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage?: string;
}

export default function DashboardLayout({ children, currentPage = 'dashboard' }: DashboardLayoutProps) {
  const [userRole, setUserRole] = useState<'ARTIST' | 'LABEL' | 'ADMIN'>('ARTIST');
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'profile'>('dashboard');
  const loadingContext = useLoading();
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    
    const getUserRole = async () => {
      try {
        console.log('🔄 DashboardLayout: Starting user role check');
        
        // Set loading state with consistent message
        loadingContext.ensureLoading('Authenticating');
        
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        if (!user) {
          console.log('🚪 DashboardLayout: No user found, redirecting to login');
          router.push('/auth/login');
          return;
        }

        // Get user role from our API with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch('/api/profiles/get-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        if (response.ok) {
          const { role } = await response.json();
          if (isMounted) {
            setUserRole(role);
            console.log('✅ DashboardLayout: User role loaded successfully:', role);
          }
        } else {
          console.error('Failed to get role:', response.status);
          // Don't set fallback role - let the error propagate
        }
      } catch (error) {
        console.error('Error getting user role:', error);
        // Don't set fallback role - let the error propagate
      } finally {
        if (isMounted) {
          setLoading(false);
          // Clear loading immediately - no delay needed since dashboard is ready
          loadingContext.clearLoading();
          console.log('✅ DashboardLayout: Loading cleared');
        }
      }
    };

    getUserRole();

    // Add safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('⚠️ DashboardLayout: Safety timeout triggered, clearing loading state');
        setLoading(false);
        loadingContext.clearLoading();
      }
    }, 15000); // 15 second safety timeout

    // Listen for view switching events
    const handleSwitchToDashboard = () => {
      if (isMounted) {
        setCurrentView('dashboard');
      }
    };

    const handleSwitchToProfile = () => {
      if (isMounted) {
        setCurrentView('profile');
      }
    };

    window.addEventListener('switchToDashboard', handleSwitchToDashboard);
    window.addEventListener('switchToProfile', handleSwitchToProfile);

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      window.removeEventListener('switchToDashboard', handleSwitchToDashboard);
      window.removeEventListener('switchToProfile', handleSwitchToProfile);
    };
  }, [router]); // Removed loading context functions to prevent infinite loops

  if (loading) {
    return null; // Loading is handled by GlobalLoadingOverlay
  }

  return (
    <div className="relative min-h-screen text-white">
      {/* Full viewport background with gradient and subtle texture - matching loading screen */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900" />
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/10 via-transparent to-purple-900/10" />
        
        {/* Subtle texture pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>
      
      {/* Sidebar - positioned immediately to prevent jump */}
      <div className="fixed left-0 top-0 h-full z-40">
        <Sidebar userRole={userRole} currentPage={currentPage} currentView={currentView} />
      </div>
      
      {/* Main Content Area - with consistent left margin */}
      <main className="relative z-10" style={{ marginLeft: '64px', minHeight: '100vh' }}>
        <div className="container mx-auto px-6 pt-4 pb-6">
          {/* Dashboard or Profile Content */}
          {currentView === 'dashboard' ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
            >
              {children}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
            >
              <ProfileSettingsPage userRole={userRole} />
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}