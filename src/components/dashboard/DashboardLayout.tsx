'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import ProfileSettingsPage from './ProfileSettingsPage';
import NotificationBell from './NotificationBell';
import UniversalBackground from '@/components/ui/UniversalBackground';
import { supabaseClient } from '@/lib/supabase/client';
import { getCurrentUserRoleClient } from '@/lib/auth-client';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage?: string;
}

export default function DashboardLayout({ children, currentPage = 'dashboard' }: DashboardLayoutProps) {
  const [userRole, setUserRole] = useState<'ARTIST' | 'LABEL' | 'ADMIN'>('ARTIST');
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'profile'>('dashboard');
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    
    const getUserRole = async () => {
      try {
        console.log('🔄 DashboardLayout: Starting optimized user role check');
        
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        if (!user) {
          console.log('🚪 DashboardLayout: No user found, redirecting to login');
          router.push('/auth/login');
          return;
        }

        // Use optimized client auth helper (fast path with caching)
        const role = await getCurrentUserRoleClient();
        
        if (isMounted) {
          setUserRole(role);
          console.log('✅ DashboardLayout: User role loaded successfully:', role);
        }
      } catch (error) {
        console.error('Error getting user role:', error);
        // Fallback to default role on error
        if (isMounted) {
          setUserRole('ARTIST');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          console.log('✅ DashboardLayout: Loading completed');
        }
      }
    };

    getUserRole();

    // Add safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('⚠️ DashboardLayout: Safety timeout triggered, clearing loading state');
        setLoading(false);
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
  }, [router]);

  if (loading) {
    return null; // Show nothing while loading - instant transition when ready
  }

  return (
    <UniversalBackground type="dashboard">
      {/* Sidebar - positioned immediately to prevent jump */}
      <div className="fixed left-0 top-0 h-full z-40">
        <Sidebar userRole={userRole} currentPage={currentPage} currentView={currentView} />
      </div>
      
      {/* Main Content Area - with consistent left margin */}
      <main className="relative z-10" style={{ marginLeft: '64px', minHeight: '100vh' }}>
        <div className="flex justify-end items-center px-6 pt-4">
          <NotificationBell />
        </div>
        <div className="container mx-auto px-6 pt-2 pb-6">
          {/* Dashboard or Profile Content */}
          {currentView === 'dashboard' ? (
            <div>
              {children}
            </div>
          ) : (
            <div>
              <ProfileSettingsPage userRole={userRole} />
            </div>
          )}
        </div>
      </main>
    </UniversalBackground>
  );
}