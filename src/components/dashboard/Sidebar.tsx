'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  FileText,
  Music,
  BarChart3,
  Settings,
  Users,
  Package,
  TrendingUp,
  Shield,
  Ticket,
  Search,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import SidebarItem from './Sidebar/SidebarItem';
import ProfileSection from './Sidebar/ProfileSection';
import MobileMenu from './Sidebar/MobileMenu';

interface SidebarProps {
  userRole: 'ARTIST' | 'LABEL' | 'ADMIN';
  currentPage?: string;
  currentView?: 'dashboard' | 'profile';
}

export default function Sidebar({ userRole, currentPage = 'dashboard', currentView = 'dashboard' }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Navigation items based on role
  const navigationItems = [
    // Common items for all users (profile handled by bottom section)
    { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/dashboard' },
  ];

  // Role-specific navigation items
  const roleSpecificItems = {
    ARTIST: [
      { id: 'new-split', label: 'New Split Sheet', icon: FileText, href: '/splits/new' },
      { id: 'my-splits', label: 'My Splits', icon: Package, href: '/splits' },
      { id: 'songs', label: 'Songs', icon: Music, href: '/songs' },
      { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/analytics' },
      { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
    ],
    LABEL: [
      { id: 'artists', label: 'Artists', icon: Users, href: '/dashboard/artists' },
      { id: 'catalog', label: 'Catalog', icon: Music, href: '/dashboard/catalog' },
      { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/dashboard/analytics' },
      { id: 'reports', label: 'Reports', icon: TrendingUp, href: '/dashboard/reports' },
      { id: 'settings', label: 'Settings', icon: Settings, href: '/dashboard/settings' },
    ],
    ADMIN: [
      { id: 'users', label: 'Users', icon: Users, href: '/dashboard/admin' },
      { id: 'overview', label: 'System Overview', icon: BarChart3, href: '/admin/overview' },
      { id: 'investigation', label: 'Investigate', icon: Search, href: '/dashboard/admin/investigation' },
      { id: 'admin-tools', label: 'Admin Tools', icon: Shield, href: '/admin/tools' },
      { id: 'invite-codes', label: 'Invite Codes', icon: Ticket, href: '/admin/invites' },
      { id: 'analytics', label: 'Analytics', icon: TrendingUp, href: '/admin/analytics' },
      { id: 'settings', label: 'Settings', icon: Settings, href: '/admin/settings' },
    ]
  };

  const allItems = [
    ...navigationItems,
    ...(roleSpecificItems[userRole] || [])
  ];

  const handleMouseEnter = useCallback(() => {
    setIsExpanded(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsExpanded(false);
  }, []);

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.nav
        className={cn(
          "fixed left-0 top-0 h-full glass-sidebar border-r border-white/12 z-40 hidden md:block",
          "transition-all duration-300 ease-out"
        )}
        style={{ width: '64px' }}
        animate={{ width: isExpanded ? '256px' : '64px' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Gradient accent border - no corners */}
        <div className="absolute inset-0 glow-border opacity-30 pointer-events-none" />
        
        <div className="relative h-full flex flex-col">
          {/* Logo/Brand Area */}
          <div className="p-4 border-b border-white/8">
            <div className="flex items-center space-x-3">
              <motion.div
                className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0"
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <Music className="w-4 h-4 text-white" />
              </motion.div>
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="text-white font-semibold text-lg gradient-text"
                  >
                    SplitSheet
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 py-4 px-2">
            <div className="space-y-1">
              {allItems.map((item) => (
                <SidebarItem
                  key={item.id}
                  label={item.label}
                  icon={item.icon}
                  href={item.href}
                  isExpanded={isExpanded}
                  isActive={currentPage === item.id && currentView === 'dashboard'}
                  onClick={item.id === 'dashboard' && currentView === 'profile' ? () => {
                    const event = new CustomEvent('switchToDashboard');
                    window.dispatchEvent(event);
                  } : undefined}
                />
              ))}
            </div>
          </div>

          {/* Profile Section */}
          <ProfileSection isExpanded={isExpanded} isActive={currentView === 'profile'} />
        </div>
      </motion.nav>

      {/* Mobile Menu Button (Hot Dog) */}
      <motion.button
        className="fixed top-4 left-4 z-50 p-3 glass-btn rounded-xl md:hidden"
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <AnimatePresence mode="wait">
          {isMobileMenuOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 180, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-5 h-5 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -180, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Menu className="w-5 h-5 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Mobile Menu Overlay */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        userRole={userRole}
        currentPage={currentPage}
      />

      {/* Main Content Margin */}
      <div className="hidden md:block w-64" />
    </>
  );
}