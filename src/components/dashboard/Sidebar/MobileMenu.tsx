'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X, User, LogOut, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'ARTIST' | 'LABEL' | 'ADMIN' | 'PUBLISHER' | 'PRO';
  currentPage?: string;
}

// Reuse the same navigation logic from main sidebar
const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { id: 'profile', label: 'Profile', icon: '👤' },
];

const roleSpecificItems = {
  ARTIST: [
    { id: 'new-split', label: 'New Split Sheet', icon: '📝' },
    { id: 'my-splits', label: 'My Splits', icon: '📋' },
    { id: 'songs', label: 'Songs', icon: '🎵' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ],
  LABEL: [
    { id: 'artists', label: 'Artists', icon: '👥' },
    { id: 'catalog', label: 'Catalog', icon: '🎵' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'reports', label: 'Reports', icon: '📈' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ],
  ADMIN: [
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'overview', label: 'System Overview', icon: '📊' },
    { id: 'investigation', label: 'Account Investigation', icon: '🔍' },
    { id: 'admin-tools', label: 'Admin Tools', icon: '🔧' },
    { id: 'modify-splits', label: 'Modify Splits', icon: '📝' },
    { id: 'invite-codes', label: 'Invite Codes', icon: '🎫' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ],
  PUBLISHER: [
    { id: 'my-splits', label: 'Split Sheets', icon: '📝' },
    { id: 'artists', label: 'Artists', icon: '👥' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ],
  PRO: [
    { id: 'my-splits', label: 'Split Sheets', icon: '📝' },
    { id: 'artists', label: 'Artists', icon: '👥' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ],
};

export default function MobileMenu({ isOpen, onClose, userRole, currentPage = 'dashboard' }: MobileMenuProps) {
  const allItems = [
    ...navigationItems,
    ...(roleSpecificItems[userRole] || [])
  ];

  const handleItemClick = (item: { id: string; label: string; icon: string }) => {
    if (item.id === 'profile') {
      // Dispatch event for profile modal
      const event = new CustomEvent('openProfileModal');
      window.dispatchEvent(event);
    } else {
      // Handle navigation - for now just close menu
      console.log('Navigate to:', item.id);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Mobile Menu Container */}
          <motion.div
            className="fixed top-0 left-0 right-0 glass-card rounded-b-3xl z-50 max-h-[80vh] overflow-y-auto"
            initial={{ y: '-100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '-100%', opacity: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              mass: 0.8 
            }}
          >
            {/* Header */}
            <div className="sticky top-0 glass-card rounded-b-3xl border-b border-white/10 z-10">
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-lg font-bold">S</span>
                  </div>
                  <h1 className="text-xl font-bold text-white">SplitSheet</h1>
                </div>
                <motion.button
                  className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Navigation Items */}
            <div className="p-4 space-y-1">
              {allItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <motion.button
                    className={cn(
                      "w-full flex items-center px-4 py-3 rounded-xl text-left transition-all duration-200",
                      "hover:bg-white/8 border border-transparent",
                      currentPage === item.id && "bg-white/12 border-white/20 hover:bg-white/15"
                    )}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleItemClick(item)}
                  >
                    <span className="text-xl mr-3">{item.icon}</span>
                    <span className={cn(
                      "text-sm font-medium",
                      currentPage === item.id ? "text-violet-300" : "text-white/80"
                    )}>
                      {item.label}
                    </span>
                    {currentPage === item.id && (
                      <motion.div
                        className="ml-auto w-2 h-2 rounded-full bg-violet-400"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1 }}
                      />
                    )}
                  </motion.button>
                </motion.div>
              ))}
            </div>

            {/* Profile Quick Actions */}
            <div className="p-4 border-t border-white/10 space-y-2">
              <motion.div
                className="p-3 rounded-xl bg-[var(--color-glass-dark)] border border-white/10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium">Profile</div>
                    <div className="text-white/60 text-xs">Manage account settings</div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <motion.button
                    className="flex-1 flex items-center justify-center px-3 py-2 rounded-lg glass-btn border-white/20 text-xs"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const event = new CustomEvent('openProfileModal');
                      window.dispatchEvent(event);
                      onClose();
                    }}
                  >
                    <Settings className="w-3 h-3 mr-1" />
                    Settings
                  </motion.button>
                  <motion.button
                    className="flex-1 flex items-center justify-center px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-xs hover:bg-red-500/30 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      // Handle sign out
                      window.location.href = '/auth/login';
                    }}
                  >
                    <LogOut className="w-3 h-3 mr-1" />
                    Sign Out
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}