'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import ProfileSettingsPage from './ProfileSettingsPage';
import { supabaseClient } from '@/lib/supabase/client';

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
    const getUserRole = async () => {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        if (!user) {
          router.push('/auth/login');
          return;
        }

        // Get user role from our API
        const response = await fetch('/api/profiles/get-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });

        if (response.ok) {
          const { role } = await response.json();
          setUserRole(role);
        }
      } catch (error) {
        console.error('Error getting user role:', error);
      } finally {
        setLoading(false);
      }
    };

    getUserRole();

    // Listen for view switching events
    const handleSwitchToDashboard = () => {
      setCurrentView('dashboard');
    };

    const handleSwitchToProfile = () => {
      setCurrentView('profile');
    };

    window.addEventListener('switchToDashboard', handleSwitchToDashboard);
    window.addEventListener('switchToProfile', handleSwitchToProfile);

    return () => {
      window.removeEventListener('switchToDashboard', handleSwitchToDashboard);
      window.removeEventListener('switchToProfile', handleSwitchToProfile);
    };
  }, [router]);

  if (loading) {
    return (
      <div className="relative min-h-screen text-white">
        {/* Full viewport background with gradient and subtle texture */}
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900">
          {/* Subtle texture pattern */}
          <div 
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M0 0h60v60H0z' fill='%23ffffff' fill-opacity='0.02'/%3E%3Cpath d='M30 30l-2-2v4l2 2 2 2v-4l-2-2zm6 0l-2-2v4l2 2 2 2v-4l-2-2zm6 0l-2-2v4l2 2 2 2v-4l-2-2zm6 0l-2-2v4l2 2 2 2v-4l-2-2z' fill='%23ffffff' fill-opacity='0.03'/%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="glass-card p-8">
            <div className="animate-pulse-slow">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 text-white">🎵</div>
              </div>
              <div className="text-white text-center">Loading dashboard...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-white">
      {/* Full viewport background with gradient and subtle texture */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        {/* Subtle texture pattern */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M0 0h60v60H0z' fill='%23ffffff' fill-opacity='0.02'/%3E%3Cpath d='M30 30l-2-2v4l2 2 2 2v-4l-2-2zm6 0l-2-2v4l2 2 2 2v-4l-2-2zm6 0l-2-2v4l2 2 2 2v-4l-2-2zm6 0l-2-2v4l2 2 2 2v-4l-2-2z' fill='%23ffffff' fill-opacity='0.03'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>
      
      <Sidebar userRole={userRole} currentPage={currentPage} currentView={currentView} />
      
      {/* Main Content Area */}
      <main className="relative transition-all duration-300 md:ml-16 z-10">
        <div className="container mx-auto px-6 pt-4 pb-6">
          {/* Dashboard or Profile Content */}
          {currentView === 'dashboard' ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          ) : (
            <ProfileSettingsPage userRole={userRole} />
          )}
        </div>
      </main>
    </div>
  );
}