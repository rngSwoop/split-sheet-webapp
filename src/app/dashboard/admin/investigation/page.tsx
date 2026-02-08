'use client';

import { useState } from 'react';
import GlassButton from '@/components/ui/GlassButton';
import { Search, Database, Shield, AlertTriangle, Trash2, RefreshCw } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  username: string | null;
  role: string;
  deletedAt: string | null;
  anonymizedName: string | null;
  deletedReason: string | null;
  dataRetentionUntil: string | null;
  deletionRequestOrigin: string | null;
}

interface ProfileData {
  id: string;
  userId: string;
  deletedAt: string | null;
  role: string;
  name: string | null;
}

interface DeletionJobData {
  id: string;
  jobId: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  failureReason: string | null;
  stepCount: number;
}

interface InvestigationData {
  user: UserData;
  profile: ProfileData | null;
  usernameAvailable: boolean;
  deletionJobs: DeletionJobData[];
  authStatus?: {
    existsInAuth: boolean;
    createdAt?: string;
    lastSignIn?: string;
  };
  integrityIssues?: Array<{
    type: string;
    count: number;
    description: string;
  }>;
}

export default function AccountInvestigation() {
  const [userId, setUserId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [investigationData, setInvestigationData] = useState<InvestigationData | null>(null);
  const [activeTab, setActiveTab] = useState<'account' | 'history' | 'integrity' | 'auth'>('account');

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/admin/investigation/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: searchTerm.trim(),
          includeAuth: true,
          includeIntegrity: true 
        })
      });

      if (!response.ok) {
        throw new Error(`Investigation failed: ${response.status}`);
      }

      const data = await response.json();
      setInvestigationData(data);
      setUserId(searchTerm.trim());
    } catch (err) {
      console.error('Investigation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to investigate user');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthCheck = async () => {
    if (!userId) return;
    
    try {
      const response = await fetch('/api/admin/investigation/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error(`Auth check failed: ${response.status}`);
      }

      const authData = await response.json();
      setInvestigationData(prev => prev ? { ...prev, authStatus: authData } : null);
    } catch (err) {
      console.error('Auth check error:', err);
      setError(err instanceof Error ? err.message : 'Failed to check auth status');
    }
  };

  const handleIntegrityCheck = async () => {
    if (!userId) return;
    
    try {
      const response = await fetch('/api/admin/investigation/integrity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error(`Integrity check failed: ${response.status}`);
      }

      const integrityData = await response.json();
      setInvestigationData(prev => prev ? { ...prev, integrityIssues: integrityData.issues } : null);
    } catch (err) {
      console.error('Integrity check error:', err);
      setError(err instanceof Error ? err.message : 'Failed to check data integrity');
    }
  };

  const handleCleanup = async (action: string) => {
    if (!userId) return;
    
    if (!confirm(`Are you sure you want to perform this cleanup action? This is a destructive action.`)) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/admin/investigation/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
      });

      if (!response.ok) {
        throw new Error(`Cleanup failed: ${response.status}`);
      }

      // Refresh investigation data after cleanup
      await handleSearch();
    } catch (err) {
      console.error('Cleanup error:', err);
      setError(err instanceof Error ? err.message : 'Failed to perform cleanup');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'text-green-400';
      case 'failed': 
      case 'needs_manual_review': return 'text-red-400';
      case 'in_progress': return 'text-blue-400';
      case 'cancelled': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Account Investigation</h1>
          <p className="text-white/70">
            Investigate user accounts, deletion status, and data integrity
          </p>
        </div>

        {/* Search Section */}
        <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/10">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-white/50 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Enter User ID, email, or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-12 pr-4 py-3 bg-black/50 text-white rounded-xl border border-white/20 focus:border-violet-500/50 focus:outline-none transition-all"
                />
              </div>
            </div>
            <GlassButton
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3"
            >
              {loading ? 'Searching...' : 'Investigate'}
            </GlassButton>
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        {investigationData && (
          <div className="space-y-8">
            {/* Tab Navigation */}
            <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-2 border border-white/10">
              <div className="flex gap-2">
                {[
                  { id: 'account', label: 'Account Status', icon: '📊' },
                  { id: 'history', label: 'Deletion History', icon: '🗑️' },
                  { id: 'auth', label: 'Auth Status', icon: '🔐' },
                  { id: 'integrity', label: 'Data Integrity', icon: '⚠️' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      activeTab === tab.id
                        ? 'bg-violet-600 text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              {/* Account Status Tab */}
              {activeTab === 'account' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Account Information</h3>
                  
                  {/* User Data */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-white/90">User Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-white/60">ID:</span>
                          <span className="text-white font-mono">{investigationData.user.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Email:</span>
                          <span className="text-white">{investigationData.user.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Username:</span>
                          <span className={investigationData.user.username ? "text-white" : "text-white/40"}>
                            {investigationData.user.username || "(cleared)"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Role:</span>
                          <span className={getStatusColor(investigationData.user.role)}>
                            {investigationData.user.role}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Username Available:</span>
                          <span className={investigationData.usernameAvailable ? "text-green-400" : "text-red-400"}>
                            {investigationData.usernameAvailable ? "YES" : "NO"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-white/90">Deletion Status</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-white/60">Deleted At:</span>
                          <span className="text-white">{formatDate(investigationData.user.deletedAt)}</span>
                        </div>
                        {investigationData.user.anonymizedName && (
                          <div className="flex justify-between">
                            <span className="text-white/60">Anonymized Name:</span>
                            <span className="text-white">{investigationData.user.anonymizedName}</span>
                          </div>
                        )}
                        {investigationData.user.deletedReason && (
                          <div className="flex justify-between">
                            <span className="text-white/60">Deletion Reason:</span>
                            <span className="text-white">{investigationData.user.deletedReason}</span>
                          </div>
                        )}
                        {investigationData.user.dataRetentionUntil && (
                          <div className="flex justify-between">
                            <span className="text-white/60">Data Retention Until:</span>
                            <span className="text-white">{formatDate(investigationData.user.dataRetentionUntil)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-6 border-t border-white/10">
                    <GlassButton onClick={handleAuthCheck} className="px-4 py-2">
                      Check Auth Status
                    </GlassButton>
                    <GlassButton onClick={handleIntegrityCheck} className="px-4 py-2">
                      Check Integrity
                    </GlassButton>
                  </div>
                </div>
              )}

              {/* Deletion History Tab */}
              {activeTab === 'history' && investigationData.deletionJobs.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Deletion History</h3>
                  <div className="space-y-4">
                    {investigationData.deletionJobs.map((job) => (
                      <div key={job.id} className="bg-black/30 p-4 rounded-xl border border-white/10">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-white/60">Job ID:</span>
                            <div className="text-white font-mono">{job.jobId}</div>
                          </div>
                          <div>
                            <span className="text-white/60">Status:</span>
                            <div className={`font-medium ${getStatusColor(job.status)}`}>
                              {job.status.replace(/_/g, ' ').toUpperCase()}
                            </div>
                          </div>
                          <div>
                            <span className="text-white/60">Started:</span>
                            <div className="text-white">{formatDate(job.startedAt)}</div>
                          </div>
                          <div>
                            <span className="text-white/60">Completed:</span>
                            <div className="text-white">{formatDate(job.completedAt)}</div>
                          </div>
                        </div>
                        {job.failureReason && (
                          <div className="mt-3 p-3 bg-red-500/20 rounded-lg text-red-400 text-sm">
                            <span className="text-white/60">Failure Reason: </span>
                            {job.failureReason}
                          </div>
                        )}
                        <div className="mt-3 p-3 bg-violet-500/20 rounded-lg text-violet-400 text-sm">
                          <span className="text-white/60">Steps: </span>
                          {job.stepCount} steps tracked
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Auth Status Tab */}
              {activeTab === 'auth' && investigationData.authStatus && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Supabase Auth Status</h3>
                  <div className="space-y-4">
                    <div className="bg-black/30 p-4 rounded-xl border border-white/10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-white/60">Auth User Exists:</span>
                          <div className={investigationData.authStatus.existsInAuth ? "text-green-400" : "text-red-400"}>
                            {investigationData.authStatus.existsInAuth ? "YES" : "NO"}
                          </div>
                        </div>
                        {investigationData.authStatus.createdAt && (
                          <div>
                            <span className="text-white/60">Auth Created:</span>
                            <div className="text-white">{formatDate(investigationData.authStatus.createdAt)}</div>
                          </div>
                        )}
                        {investigationData.authStatus.lastSignIn && (
                          <div>
                            <span className="text-white/60">Last Sign In:</span>
                            <div className="text-white">{formatDate(investigationData.authStatus.lastSignIn)}</div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                  {!investigationData.authStatus.existsInAuth && (
                    <div className="mt-4">
                      <GlassButton 
                        onClick={() => handleCleanup('delete-auth-user')}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700"
                      >
                        Delete Auth User
                      </GlassButton>
                    </div>
                  )}
                </div>
              )}

              {/* Data Integrity Tab */}
              {activeTab === 'integrity' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Data Integrity</h3>
                  {investigationData.integrityIssues && investigationData.integrityIssues.length > 0 ? (
                    <div className="space-y-4">
                      {investigationData.integrityIssues.map((issue, index) => (
                        <div key={index} className="bg-black/30 p-4 rounded-xl border border-white/10">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-white">{issue.type}</div>
                              <div className="text-sm text-white/60">{issue.description}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-red-400">{issue.count}</div>
                              <div className="text-sm text-white/60">items</div>
                            </div>
                          </div>
                          {issue.type.includes('orphaned') && (
                            <div className="mt-3">
                              <GlassButton 
                                onClick={() => handleCleanup('cleanup-orphaned')}
                                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700"
                              >
                                Cleanup Orphaned Data
                              </GlassButton>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-white/50">
                      <RefreshCw className="w-8 h-8 mx-auto mb-4 text-green-400" />
                      <div>No data integrity issues found</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}