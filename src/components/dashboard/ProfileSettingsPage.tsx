'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, LogOut, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabaseClient } from '@/lib/supabase/client';

interface ProfileSettingsPageProps {
  userRole: 'ARTIST' | 'LABEL' | 'ADMIN' | 'PUBLISHER' | 'PRO';
}

export default function ProfileSettingsPage({ userRole }: ProfileSettingsPageProps) {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingUsername, setIsChangingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [currentUsername, setCurrentUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [upgradeCode, setUpgradeCode] = useState('');
  const [upgradingRole, setUpgradingRole] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user?.user_metadata?.username) {
          setCurrentUsername(user.user_metadata.username);
        }
      } catch (error) {
        console.error('Error getting current username:', error);
      }
    };

    getCurrentUser();
  }, []);

  const handleUsernameChange = async () => {
    if (!newUsername.trim()) return;
    
    setIsChangingUsername(true);
    setUsernameError(null);

    try {
      // Get current user
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) return;

      // Update username via API
      const response = await fetch('/api/profiles/username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          newUsername: newUsername.trim().toLowerCase()
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update username');
      }

      // Update local state
      setCurrentUsername(result.user.username);
      setNewUsername('');
      
      // Show success message
      alert('Username updated successfully!');
      
    } catch (error: any) {
      console.error('Username change error:', error);
      setUsernameError(error.message || 'Failed to update username');
    } finally {
      setIsChangingUsername(false);
    }
  };

  const handleRoleUpgrade = async () => {
    if (!upgradeCode.trim()) return;
    
    setUpgradingRole(true);
    setUpgradeError(null);
    
    try {
      // Get current user
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) return;

      // Upgrade role via API
      const response = await fetch('/api/profiles/upgrade-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          code: upgradeCode.trim()
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Invalid invite code');
      }

      // Success - redirect to appropriate dashboard
      alert('Role upgraded successfully! Redirecting to your new dashboard...');
      
      // Small delay before redirect
      setTimeout(() => {
        window.location.href = result.redirectUrl || '/dashboard/artist';
      }, 1500);
      
    } catch (error: any) {
      console.error('Role upgrade error:', error);
      setUpgradeError(error.message || 'Failed to upgrade role');
    } finally {
      setUpgradingRole(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabaseClient.auth.signOut();
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== 'DELETE') return;
    
    setIsDeleting(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) return;

      // Delete account via API
      const response = await fetch('/api/profiles/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          confirmation: 'DELETE'
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete account');
      }

      alert('Account permanently deleted. You will be redirected to the home page.');
      
      // Small delay before redirect
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
      
    } catch (error: any) {
      console.error('Delete account error:', error);
      setIsDeleting(false);
    }
  };



  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-4xl mx-auto"
    >
      {/* Profile Header */}
      <header className="glass-card p-6 mb-8">
        <h1 className="text-3xl font-bold gradient-text">Profile Settings</h1>
      </header>

      {/* Profile Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl">
        {/* Left Column - Profile Info */}
        <div className="glass-card p-8">
          <div className="flex flex-col items-center space-y-6">
            {/* Profile Icon */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6">
              <User className="w-10 h-10 text-white" />
            </div>

            {/* Current Info */}
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">
                {currentUsername || 'User'}
              </h3>
              <p className="text-white/60 text-sm">
                {userRole.charAt(0) + userRole.slice(1).toLowerCase()}
              </p>
            </div>

            {/* Profile Picture (Placeholder) */}
            <div className="w-full">
              <button className="w-full p-4 rounded-xl glass-btn border-white/20 text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-white/60" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white mb-1">Profile Picture</div>
                    <div className="text-xs text-white/60">Change your profile picture (Coming soon)</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Settings */}
        <div className="space-y-6">
          {/* Username Change */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Change Username</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Current Username</label>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-white">
                  {currentUsername || 'Not set'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">New Username</label>
                <div className="relative">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.replace(/\s/g, ''))}
                    placeholder="Enter new username"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/40 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-all"
                    disabled={isChangingUsername}
                  />
                  {usernameError && (
                    <p className="text-red-400 text-sm mt-2">{usernameError}</p>
                  )}
                </div>
              </div>

              <motion.button
                className="w-full glass-btn"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUsernameChange}
                disabled={isChangingUsername || !newUsername.trim()}
              >
                {isChangingUsername ? 'Updating Username...' : 'Update Username'}
              </motion.button>
            </div>
          </div>

          {/* Permissions */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Permissions</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-white/60 text-sm mb-3">Current Role</p>
                <div className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white font-medium">
                  {userRole.charAt(0) + userRole.slice(1).toLowerCase()}
                </div>
              </div>

              {userRole === 'ARTIST' && (
                <div>
                  <p className="text-white/60 text-sm mb-3">Upgrade Permissions</p>
                  <div className="p-3 bg-violet-500/10 border border-violet-500/30 rounded-lg mb-3">
                    <p className="text-violet-200 text-xs">
                      Enter an invite code to upgrade your account permissions
                    </p>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={upgradeCode}
                      onChange={(e) => setUpgradeCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                      placeholder="Enter invite code"
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/40 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-all"
                      disabled={upgradingRole}
                    />
                    {upgradeError && (
                      <p className="text-red-400 text-sm">{upgradeError}</p>
                    )}
                    <motion.button
                      className="w-full glass-btn"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleRoleUpgrade}
                      disabled={upgradingRole || !upgradeCode.trim()}
                    >
                      {upgradingRole ? 'Upgrading...' : 'Upgrade Permissions'}
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Account Actions */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Account Actions</h3>
            
            <div className="space-y-3">
              {/* Sign Out */}
              <motion.button
                className="w-full flex items-center justify-center px-4 py-3 rounded-xl glass-btn border-white/20"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </motion.button>

              {/* Delete Account */}
              {!showDeleteConfirmation ? (
                <motion.button
                  className="w-full flex items-center justify-center px-4 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeleteConfirmation(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </motion.button>
              ) : (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                  <p className="text-red-400 text-sm font-medium mb-2">⚠️ This action cannot be undone</p>
                  <p className="text-white/60 text-xs mb-3">
                    Type &quot;DELETE&quot; to confirm permanent account deletion
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmationText}
                    onChange={(e) => setDeleteConfirmationText(e.target.value.toUpperCase())}
                    placeholder="Type DELETE"
                    className="w-full px-3 py-2 rounded-lg bg-red-900/20 border border-red-500/30 text-white placeholder-red-300/50 text-sm focus:outline-none focus:border-red-400 mb-4"
                  />
                  <div className="flex space-x-2">
                    <motion.button
                      className="flex-1 px-3 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: deleteConfirmationText === 'DELETE' ? 1.02 : 1 }}
                      whileTap={{ scale: deleteConfirmationText === 'DELETE' ? 0.98 : 1 }}
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmationText !== 'DELETE' || isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Permanently Delete Account'}
                    </motion.button>
                    <motion.button
                      className="flex-1 px-3 py-2 rounded-lg bg-white/10 text-white border border-white/20 text-sm hover:bg-white/20 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setShowDeleteConfirmation(false);
                        setDeleteConfirmationText('');
                      }}
                    >
                      Cancel
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}