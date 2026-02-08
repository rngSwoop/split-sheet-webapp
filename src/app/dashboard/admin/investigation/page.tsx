'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  AlertTriangle,
  RefreshCw,
  Users,
  Clock,
  AtSign,
  Trash2,
  UserSearch,
  BarChart3,
  Shield,
  Key,
  Wrench,
  ChevronDown,
} from 'lucide-react';
import GlassButton from '@/components/ui/GlassButton';

// ── Types ──────────────────────────────────────────────────────────────

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

interface DeletionStepData {
  id: string;
  stepName: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  failureReason: string | null;
  retryCount: number;
  itemsProcessed: number;
  totalItems: number | null;
  durationMs: number | null;
}

interface DeletionJobData {
  id: string;
  jobId: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  failureReason: string | null;
  stepCount: number;
  steps: DeletionStepData[];
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

interface OverviewData {
  users: Array<{ id: string; email: string; role: string; name: string | null; createdAt: string }>;
  invites: Array<{
    id: string;
    code: string;
    role: string;
    createdAt: string;
    usedAt: string | null;
    usedByUser: { email: string; role: string } | null;
  }>;
}

interface InactivityData {
  inactiveUsers: Array<{ id: string; email: string; username: string | null; lastActiveAt: string; createdAt: string }>;
  approachingInactiveUsers: Array<{ id: string; email: string; lastActiveAt: string }>;
  totalInactive: number;
  totalApproachingInactive: number;
  reportGeneratedAt: string;
}

interface UsernameResult {
  message: string;
  count: number;
  users?: Array<{ id: string; name: string | null; email: string; username: string }>;
}

type MainTab = 'user-lookup' | 'overview' | 'inactivity' | 'username-tools' | 'cleanup';
type SubTab = 'account' | 'history' | 'auth' | 'integrity';

// ── Helpers ────────────────────────────────────────────────────────────

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleString();
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

// ── Main Component ─────────────────────────────────────────────────────

export default function InvestigationPage() {
  // Top-level tab state
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('user-lookup');

  // ── User Lookup state ──
  const [searchTerm, setSearchTerm] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [investigationData, setInvestigationData] = useState<InvestigationData | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('account');
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());

  // ── Overview state ──
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewLoaded, setOverviewLoaded] = useState(false);

  // ── Inactivity state ──
  const [inactivityData, setInactivityData] = useState<InactivityData | null>(null);
  const [inactivityLoading, setInactivityLoading] = useState(false);
  const [inactivityLoaded, setInactivityLoaded] = useState(false);

  // ── Username Tools state ──
  const [usernameGenResult, setUsernameGenResult] = useState<UsernameResult | null>(null);
  const [usernameMigResult, setUsernameMigResult] = useState<UsernameResult | null>(null);
  const [usernameLoading, setUsernameLoading] = useState<'generate' | 'migrate' | null>(null);

  // ── Cleanup state ──
  const [cleanupLoading, setCleanupLoading] = useState<string | null>(null);
  const [cleanupResult, setCleanupResult] = useState<{ success: boolean; message: string } | null>(null);

  // ── Tab switching with lazy-load ──
  const handleMainTabChange = useCallback((tab: MainTab) => {
    setActiveMainTab(tab);
    setError('');

    if (tab === 'overview' && !overviewLoaded) {
      loadOverview();
    } else if (tab === 'inactivity' && !inactivityLoaded) {
      loadInactivity();
    }
  }, [overviewLoaded, inactivityLoaded]);

  // ── User Lookup handlers ──

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/investigation/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: searchTerm.trim(), includeAuth: true, includeIntegrity: true })
      });

      if (!response.ok) throw new Error(`Investigation failed: ${response.status}`);

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
      if (!response.ok) throw new Error(`Auth check failed: ${response.status}`);
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
      if (!response.ok) throw new Error(`Integrity check failed: ${response.status}`);
      const integrityData = await response.json();
      setInvestigationData(prev => prev ? { ...prev, integrityIssues: integrityData.issues } : null);
    } catch (err) {
      console.error('Integrity check error:', err);
      setError(err instanceof Error ? err.message : 'Failed to check data integrity');
    }
  };

  const handleUserCleanup = async (action: string) => {
    if (!userId) return;
    if (!confirm('Are you sure you want to perform this cleanup action? This is destructive.')) return;
    setLoading(true);
    try {
      const response = await fetch('/api/admin/investigation/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
      });
      if (!response.ok) throw new Error(`Cleanup failed: ${response.status}`);
      await handleSearch();
    } catch (err) {
      console.error('Cleanup error:', err);
      setError(err instanceof Error ? err.message : 'Failed to perform cleanup');
    } finally {
      setLoading(false);
    }
  };

  // ── Overview handlers ──

  const loadOverview = async () => {
    setOverviewLoading(true);
    try {
      const res = await fetch('/api/admin/overview');
      if (!res.ok) throw new Error(`Overview failed: ${res.status}`);
      const data = await res.json();
      setOverviewData(data);
      setOverviewLoaded(true);
    } catch (err) {
      console.error('Overview error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load overview');
    } finally {
      setOverviewLoading(false);
    }
  };

  // ── Inactivity handlers ──

  const loadInactivity = async () => {
    setInactivityLoading(true);
    try {
      const res = await fetch('/api/admin/check-inactivity', { method: 'POST' });
      if (!res.ok) throw new Error(`Inactivity check failed: ${res.status}`);
      const data = await res.json();
      setInactivityData(data);
      setInactivityLoaded(true);
    } catch (err) {
      console.error('Inactivity error:', err);
      setError(err instanceof Error ? err.message : 'Failed to check inactivity');
    } finally {
      setInactivityLoading(false);
    }
  };

  // ── Username tools handlers ──

  const handleGenerateUsernames = async () => {
    if (!confirm('Generate usernames for all users without one?')) return;
    setUsernameLoading('generate');
    try {
      const res = await fetch('/api/admin/generate-usernames', { method: 'POST' });
      if (!res.ok) throw new Error(`Generate failed: ${res.status}`);
      setUsernameGenResult(await res.json());
    } catch (err) {
      console.error('Generate usernames error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate usernames');
    } finally {
      setUsernameLoading(null);
    }
  };

  const handleMigrateUsernames = async () => {
    if (!confirm('Migrate usernames for all users without one?')) return;
    setUsernameLoading('migrate');
    try {
      const res = await fetch('/api/admin/migrate-usernames', { method: 'POST' });
      if (!res.ok) throw new Error(`Migrate failed: ${res.status}`);
      setUsernameMigResult(await res.json());
    } catch (err) {
      console.error('Migrate usernames error:', err);
      setError(err instanceof Error ? err.message : 'Failed to migrate usernames');
    } finally {
      setUsernameLoading(null);
    }
  };

  // ── Global cleanup handlers ──

  const refreshInvestigation = async () => {
    if (!userId) return;
    try {
      const response = await fetch('/api/admin/investigation/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, includeAuth: true, includeIntegrity: true })
      });
      if (response.ok) {
        setInvestigationData(await response.json());
      }
    } catch (err) {
      console.error('Refresh investigation error:', err);
    }
  };

  const handleGlobalCleanup = async (action: string) => {
    if (!confirm(`Are you sure? Action: "${action}" — this is destructive.`)) return;
    setCleanupLoading(action);
    setCleanupResult(null);
    try {
      const res = await fetch('/api/admin/investigation/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'global', action })
      });
      if (!res.ok) throw new Error(`Cleanup failed: ${res.status}`);
      const data = await res.json();
      setCleanupResult({ success: data.success, message: data.message || JSON.stringify(data.cleanup || data) });
      await refreshInvestigation();
    } catch (err) {
      console.error('Cleanup error:', err);
      setCleanupResult({ success: false, message: err instanceof Error ? err.message : 'Failed' });
    } finally {
      setCleanupLoading(null);
    }
  };

  // ── Top-level tab config ──

  const mainTabs: Array<{ id: MainTab; label: string; icon: React.ReactNode }> = [
    { id: 'user-lookup', label: 'User Lookup', icon: <UserSearch className="w-4 h-4" /> },
    { id: 'overview', label: 'System Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'inactivity', label: 'Inactivity', icon: <Clock className="w-4 h-4" /> },
    { id: 'username-tools', label: 'Username Tools', icon: <AtSign className="w-4 h-4" /> },
    { id: 'cleanup', label: 'Cleanup', icon: <Trash2 className="w-4 h-4" /> },
  ];

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-6xl mx-auto"
    >
      {/* Header */}
      <header className="glass-card p-6 mb-8">
        <h1 className="text-3xl font-bold gradient-text">Investigate</h1>
        <p className="text-sm text-gray-300 mt-1">All admin tools in one place — user lookup, system overview, inactivity, usernames, and cleanup.</p>
      </header>

      {/* Top-level tab bar */}
      <div className="glass-card p-2 mb-6">
        <div className="flex flex-wrap gap-2">
          {mainTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleMainTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeMainTab === tab.id
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="glass-card p-4 mb-6 bg-red-500/10 border border-red-500/30">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB: User Lookup                                              */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeMainTab === 'user-lookup' && (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="glass-card p-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 text-white/50 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Enter User ID, email, or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-12 pr-4 py-3 bg-[var(--color-glass-dark)] text-white rounded-xl border border-white/10 focus:border-violet-500/50 focus:outline-none transition-all"
                />
              </div>
              <GlassButton onClick={handleSearch} disabled={loading} className="px-6 py-3">
                {loading ? 'Searching...' : 'Investigate'}
              </GlassButton>
            </div>
          </div>

          {/* Results */}
          {investigationData && (
            <div className="space-y-6">
              {/* Sub-tab navigation */}
              <div className="glass-card p-2">
                <div className="flex gap-2">
                  {([
                    { id: 'account' as SubTab, label: 'Account', icon: <Users className="w-4 h-4" /> },
                    { id: 'history' as SubTab, label: 'History', icon: <Clock className="w-4 h-4" /> },
                    { id: 'auth' as SubTab, label: 'Auth', icon: <Key className="w-4 h-4" /> },
                    { id: 'integrity' as SubTab, label: 'Integrity', icon: <Shield className="w-4 h-4" /> },
                  ]).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveSubTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
                        activeSubTab === tab.id
                          ? 'bg-violet-600 text-white'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-tab content */}
              <div className="glass-card p-6">
                {/* ── Account sub-tab ── */}
                {activeSubTab === 'account' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-white">Account Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-white/90">User Details</h4>
                        <div className="space-y-2 text-sm">
                          {[
                            ['ID', investigationData.user.id, 'font-mono'],
                            ['Email', investigationData.user.email],
                            ['Username', investigationData.user.username || '(cleared)', !investigationData.user.username ? 'text-white/40' : ''],
                            ['Role', investigationData.user.role, getStatusColor(investigationData.user.role)],
                          ].map(([label, value, cls]) => (
                            <div key={label as string} className="flex justify-between">
                              <span className="text-white/60">{label}:</span>
                              <span className={`text-white ${cls || ''}`}>{value}</span>
                            </div>
                          ))}
                          <div className="flex justify-between">
                            <span className="text-white/60">Username Available:</span>
                            <span className={investigationData.usernameAvailable ? 'text-green-400' : 'text-red-400'}>
                              {investigationData.usernameAvailable ? 'YES' : 'NO'}
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

                    <div className="flex gap-4 pt-6 border-t border-white/10">
                      <GlassButton onClick={handleAuthCheck} className="px-4 py-2">Check Auth Status</GlassButton>
                      <GlassButton onClick={handleIntegrityCheck} className="px-4 py-2">Check Integrity</GlassButton>
                    </div>
                  </div>
                )}

                {/* ── History sub-tab ── */}
                {activeSubTab === 'history' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-white">Deletion History</h3>
                    {investigationData.deletionJobs.length > 0 ? (
                      <div className="space-y-4">
                        {investigationData.deletionJobs.map((job) => {
                          const isExpanded = expandedJobs.has(job.id);
                          return (
                            <div key={job.id} className="glass-card p-4">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-white/60">Job ID:</span>
                                  <div className="text-white font-mono text-xs">{job.jobId}</div>
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
                                <div className="mt-3 p-3 bg-red-500/20 rounded-xl text-red-400 text-sm">
                                  <span className="text-white/60">Failure: </span>{job.failureReason}
                                </div>
                              )}

                              {/* Expandable steps */}
                              <button
                                onClick={() => {
                                  setExpandedJobs(prev => {
                                    const next = new Set(prev);
                                    if (next.has(job.id)) next.delete(job.id);
                                    else next.add(job.id);
                                    return next;
                                  });
                                }}
                                className="mt-3 w-full p-3 bg-violet-500/10 rounded-xl text-violet-400 text-sm flex items-center justify-between hover:bg-violet-500/20 transition-colors"
                              >
                                <span>
                                  <span className="text-white/60">Steps: </span>{job.stepCount} steps tracked
                                </span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </button>

                              {isExpanded && job.steps.length > 0 && (
                                <div className="mt-2 space-y-2">
                                  {job.steps.map((step) => (
                                    <div key={step.id} className="p-3 bg-black/20 rounded-lg border border-white/5 text-sm">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="font-mono text-white/90 text-xs">
                                          {step.stepName.replace(/_/g, ' ')}
                                        </span>
                                        <span className={`text-xs font-medium ${getStatusColor(step.status)}`}>
                                          {step.status}
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-white/50">
                                        <div>
                                          <span>Started: </span>
                                          <span className="text-white/70">{formatDate(step.startedAt)}</span>
                                        </div>
                                        <div>
                                          <span>Completed: </span>
                                          <span className="text-white/70">{formatDate(step.completedAt)}</span>
                                        </div>
                                        {step.durationMs !== null && (
                                          <div>
                                            <span>Duration: </span>
                                            <span className="text-white/70">{step.durationMs}ms</span>
                                          </div>
                                        )}
                                        {(step.itemsProcessed > 0 || step.totalItems !== null) && (
                                          <div>
                                            <span>Items: </span>
                                            <span className="text-white/70">
                                              {step.itemsProcessed}{step.totalItems !== null ? `/${step.totalItems}` : ''}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      {step.retryCount > 0 && (
                                        <div className="mt-1 text-xs text-yellow-400">
                                          Retried {step.retryCount} time{step.retryCount > 1 ? 's' : ''}
                                        </div>
                                      )}
                                      {step.failureReason && (
                                        <div className="mt-1 text-xs text-red-400">
                                          {step.failureReason}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-white/50 text-center py-8">No deletion jobs found for this user.</p>
                    )}
                  </div>
                )}

                {/* ── Auth sub-tab ── */}
                {activeSubTab === 'auth' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-white">Supabase Auth Status</h3>
                    {investigationData.authStatus ? (
                      <>
                        <div className="glass-card p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-white/60">Auth User Exists:</span>
                              <div className={investigationData.authStatus.existsInAuth ? 'text-green-400' : 'text-red-400'}>
                                {investigationData.authStatus.existsInAuth ? 'YES' : 'NO'}
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
                        {investigationData.authStatus.existsInAuth && (
                          <GlassButton
                            onClick={() => handleUserCleanup('delete-auth-user')}
                            className="px-4 py-2 bg-red-500/20 border-red-500/30 hover:bg-red-500/30"
                          >
                            Delete Auth User
                          </GlassButton>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-white/50 mb-4">Auth status not loaded yet.</p>
                        <GlassButton onClick={handleAuthCheck} className="px-4 py-2">Load Auth Status</GlassButton>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Integrity sub-tab ── */}
                {activeSubTab === 'integrity' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-white">Data Integrity</h3>
                    {investigationData.integrityIssues ? (
                      investigationData.integrityIssues.length > 0 ? (
                        <div className="space-y-4">
                          {investigationData.integrityIssues.map((issue, index) => (
                            <div key={index} className="glass-card p-4">
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
                                    onClick={() => handleUserCleanup('cleanup-orphaned')}
                                    className="px-4 py-2 bg-yellow-500/20 border-yellow-500/30 hover:bg-yellow-500/30"
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
                      )
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-white/50 mb-4">Integrity not checked yet.</p>
                        <GlassButton onClick={handleIntegrityCheck} className="px-4 py-2">Run Integrity Check</GlassButton>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!investigationData && !loading && (
            <div className="glass-card p-12 text-center">
              <UserSearch className="w-12 h-12 mx-auto mb-4 text-white/30" />
              <p className="text-white/50">Enter a User ID, email, or username above to begin investigating.</p>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB: System Overview                                           */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeMainTab === 'overview' && (
        <div className="space-y-6">
          {overviewLoading ? (
            <div className="glass-card p-12 text-center">
              <RefreshCw className="w-8 h-8 mx-auto mb-4 text-violet-400 animate-spin" />
              <p className="text-white/50">Loading system overview...</p>
            </div>
          ) : overviewData ? (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-card p-5">
                  <div className="text-sm text-white/60 mb-1">Total Users</div>
                  <div className="text-3xl font-bold gradient-text">{overviewData.users.length}</div>
                </div>
                <div className="glass-card p-5">
                  <div className="text-sm text-white/60 mb-1">Total Invites</div>
                  <div className="text-3xl font-bold gradient-text">{overviewData.invites.length}</div>
                </div>
                <div className="glass-card p-5">
                  <div className="text-sm text-white/60 mb-1">Invites Used</div>
                  <div className="text-3xl font-bold gradient-text">
                    {overviewData.invites.filter(i => i.usedAt).length}
                  </div>
                </div>
              </div>

              {/* Users table */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">All Users</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-white/50 border-b border-white/10">
                        <th className="py-2 pr-4">Email</th>
                        <th className="py-2 pr-4">Name</th>
                        <th className="py-2 pr-4">Role</th>
                        <th className="py-2">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overviewData.users.map((u) => (
                        <tr key={u.id} className="border-t border-white/5 text-white/80">
                          <td className="py-2 pr-4">{u.email}</td>
                          <td className="py-2 pr-4">{u.name || '—'}</td>
                          <td className="py-2 pr-4">{u.role}</td>
                          <td className="py-2">{formatDate(u.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Invites table */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Invites</h3>
                <div className="space-y-3">
                  {overviewData.invites.length === 0 ? (
                    <p className="text-sm text-white/50">No invites found.</p>
                  ) : (
                    overviewData.invites.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between p-3 bg-[var(--color-glass-dark)] rounded-xl">
                        <div>
                          <div className="font-mono text-white">{inv.code}</div>
                          <div className="text-xs text-white/50">Role: {inv.role} &bull; Created: {formatDate(inv.createdAt)}</div>
                        </div>
                        <div className="text-right text-sm">
                          {inv.usedAt ? (
                            <div>
                              <span className="text-green-400">Used</span>
                              {inv.usedByUser && <span className="text-white/60"> by {inv.usedByUser.email}</span>}
                            </div>
                          ) : (
                            <span className="text-white/40">Unused</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Refresh */}
              <div className="text-center">
                <GlassButton onClick={loadOverview} className="px-4 py-2">
                  <RefreshCw className="w-4 h-4 inline mr-2" />Refresh
                </GlassButton>
              </div>
            </>
          ) : (
            <div className="glass-card p-12 text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-white/30" />
              <p className="text-white/50">Failed to load overview data.</p>
              <GlassButton onClick={loadOverview} className="mt-4 px-4 py-2">Retry</GlassButton>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB: Inactivity                                                */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeMainTab === 'inactivity' && (
        <div className="space-y-6">
          {inactivityLoading ? (
            <div className="glass-card p-12 text-center">
              <RefreshCw className="w-8 h-8 mx-auto mb-4 text-violet-400 animate-spin" />
              <p className="text-white/50">Checking inactivity...</p>
            </div>
          ) : inactivityData ? (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="glass-card p-5 border-red-500/20">
                  <div className="text-sm text-white/60 mb-1">Inactive (&gt;1 year)</div>
                  <div className="text-3xl font-bold text-red-400">{inactivityData.totalInactive}</div>
                </div>
                <div className="glass-card p-5 border-yellow-500/20">
                  <div className="text-sm text-white/60 mb-1">Approaching (&gt;6 months)</div>
                  <div className="text-3xl font-bold text-yellow-400">{inactivityData.totalApproachingInactive}</div>
                </div>
              </div>

              {/* Inactive users */}
              {inactivityData.inactiveUsers.length > 0 && (
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-red-400 mb-4">Inactive Users (&gt;1 Year)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-white/50 border-b border-white/10">
                          <th className="py-2 pr-4">Email</th>
                          <th className="py-2 pr-4">Username</th>
                          <th className="py-2 pr-4">Last Active</th>
                          <th className="py-2">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inactivityData.inactiveUsers.map((u) => (
                          <tr key={u.id} className="border-t border-white/5 text-white/80">
                            <td className="py-2 pr-4">{u.email}</td>
                            <td className="py-2 pr-4">{u.username || '—'}</td>
                            <td className="py-2 pr-4 text-red-400">{formatDate(u.lastActiveAt)}</td>
                            <td className="py-2">{formatDate(u.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Approaching inactive */}
              {inactivityData.approachingInactiveUsers.length > 0 && (
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-yellow-400 mb-4">Approaching Inactive (&gt;6 Months)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-white/50 border-b border-white/10">
                          <th className="py-2 pr-4">Email</th>
                          <th className="py-2">Last Active</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inactivityData.approachingInactiveUsers.map((u) => (
                          <tr key={u.id} className="border-t border-white/5 text-white/80">
                            <td className="py-2 pr-4">{u.email}</td>
                            <td className="py-2 text-yellow-400">{formatDate(u.lastActiveAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {inactivityData.totalInactive === 0 && inactivityData.totalApproachingInactive === 0 && (
                <div className="glass-card p-12 text-center text-white/50">
                  <RefreshCw className="w-8 h-8 mx-auto mb-4 text-green-400" />
                  <p>No inactive or approaching-inactive users found.</p>
                </div>
              )}

              <div className="text-center text-xs text-white/40">
                Report generated: {formatDate(inactivityData.reportGeneratedAt)}
              </div>

              <div className="text-center">
                <GlassButton onClick={() => { setInactivityLoaded(false); loadInactivity(); }} className="px-4 py-2">
                  <RefreshCw className="w-4 h-4 inline mr-2" />Refresh
                </GlassButton>
              </div>
            </>
          ) : (
            <div className="glass-card p-12 text-center">
              <Clock className="w-12 h-12 mx-auto mb-4 text-white/30" />
              <p className="text-white/50">Failed to load inactivity data.</p>
              <GlassButton onClick={loadInactivity} className="mt-4 px-4 py-2">Retry</GlassButton>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB: Username Tools                                            */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeMainTab === 'username-tools' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Generate panel */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <AtSign className="w-5 h-5 text-violet-400" />
              <h3 className="text-lg font-semibold text-white">Generate Usernames</h3>
            </div>
            <p className="text-sm text-white/60">
              Auto-generate usernames for all users who don&apos;t have one. Uses name or email as the base.
            </p>
            <GlassButton
              onClick={handleGenerateUsernames}
              disabled={usernameLoading === 'generate'}
              className="px-4 py-2"
            >
              {usernameLoading === 'generate' ? 'Generating...' : 'Generate Usernames'}
            </GlassButton>
            {usernameGenResult && (
              <div className={`p-4 rounded-xl text-sm ${usernameGenResult.count > 0 ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-white/5 border border-white/10 text-white/60'}`}>
                <p className="font-medium">{usernameGenResult.message}</p>
                {usernameGenResult.users && usernameGenResult.users.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {usernameGenResult.users.map(u => (
                      <li key={u.id} className="font-mono text-xs">{u.email} → {u.username}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Migrate panel */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Wrench className="w-5 h-5 text-violet-400" />
              <h3 className="text-lg font-semibold text-white">Migrate Usernames</h3>
            </div>
            <p className="text-sm text-white/60">
              Migrate usernames for users without one. Similar to generate but uses a different algorithm.
            </p>
            <GlassButton
              onClick={handleMigrateUsernames}
              disabled={usernameLoading === 'migrate'}
              className="px-4 py-2"
            >
              {usernameLoading === 'migrate' ? 'Migrating...' : 'Migrate Usernames'}
            </GlassButton>
            {usernameMigResult && (
              <div className={`p-4 rounded-xl text-sm ${usernameMigResult.count > 0 ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-white/5 border border-white/10 text-white/60'}`}>
                <p className="font-medium">{usernameMigResult.message}</p>
                {usernameMigResult.users && usernameMigResult.users.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {usernameMigResult.users.map(u => (
                      <li key={u.id} className="font-mono text-xs">{u.email} → {u.username}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB: Cleanup                                                   */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeMainTab === 'cleanup' && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Global Cleanup Actions</h3>
            <p className="text-sm text-white/60 mb-6">
              These actions operate system-wide. Each requires confirmation before executing.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Delete Auth User */}
              <div className="glass-card p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-red-400" />
                  <h4 className="font-medium text-white">Delete Auth User</h4>
                </div>
                <p className="text-xs text-white/60">Remove a user from Supabase Auth. Requires a user ID — use User Lookup first to find the ID.</p>
                <GlassButton
                  onClick={async () => {
                    const id = prompt('Enter the User ID to delete from Auth:');
                    if (!id) return;
                    setCleanupLoading('delete-auth-user');
                    setCleanupResult(null);
                    try {
                      const r = await fetch('/api/admin/investigation/cleanup', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: id, action: 'delete-auth-user' })
                      });
                      const data = await r.json();
                      setCleanupResult({ success: data.success, message: data.message || JSON.stringify(data) });
                      await refreshInvestigation();
                    } catch (err) {
                      setCleanupResult({ success: false, message: err instanceof Error ? err.message : 'Failed' });
                    } finally {
                      setCleanupLoading(null);
                    }
                  }}
                  disabled={cleanupLoading === 'delete-auth-user'}
                  className="px-4 py-2 bg-red-500/20 border-red-500/30 hover:bg-red-500/30 w-full"
                >
                  {cleanupLoading === 'delete-auth-user' ? 'Deleting...' : 'Delete Auth User'}
                </GlassButton>
              </div>

              {/* Cleanup Orphaned */}
              <div className="glass-card p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-yellow-400" />
                  <h4 className="font-medium text-white">Cleanup Orphaned</h4>
                </div>
                <p className="text-xs text-white/60">Remove orphaned contributors, signatures, and profiles from soft-deleted users.</p>
                <GlassButton
                  onClick={() => handleGlobalCleanup('cleanup-orphaned')}
                  disabled={cleanupLoading === 'cleanup-orphaned'}
                  className="px-4 py-2 bg-yellow-500/20 border-yellow-500/30 hover:bg-yellow-500/30 w-full"
                >
                  {cleanupLoading === 'cleanup-orphaned' ? 'Cleaning...' : 'Cleanup Orphaned Data'}
                </GlassButton>
              </div>

              {/* Fix Stuck Jobs */}
              <div className="glass-card p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-blue-400" />
                  <h4 className="font-medium text-white">Fix Stuck Jobs</h4>
                </div>
                <p className="text-xs text-white/60">Mark deletion jobs stuck for &gt;24h as &ldquo;needs manual review&rdquo;.</p>
                <GlassButton
                  onClick={() => handleGlobalCleanup('complete-stuck-job')}
                  disabled={cleanupLoading === 'complete-stuck-job'}
                  className="px-4 py-2 bg-blue-500/20 border-blue-500/30 hover:bg-blue-500/30 w-full"
                >
                  {cleanupLoading === 'complete-stuck-job' ? 'Fixing...' : 'Fix Stuck Jobs'}
                </GlassButton>
              </div>
            </div>
          </div>

          {/* Cleanup result */}
          {cleanupResult && (
            <div className={`glass-card p-4 ${cleanupResult.success ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <div className={`flex items-center gap-2 ${cleanupResult.success ? 'text-green-400' : 'text-red-400'}`}>
                {cleanupResult.success ? <RefreshCw className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                <span>{cleanupResult.message}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
