// src/app/dashboard/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import GlassButton from '@/components/ui/GlassButton';

export default function AdminDashboard() {
  const [accounts, setAccounts] = useState<Array<any>>([]);
  const [createdInvites, setCreatedInvites] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [inviteRole, setInviteRole] = useState<'LABEL' | 'ADMIN'>('LABEL');
  const [newInviteCode, setNewInviteCode] = useState('');
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [deletingInviteId, setDeletingInviteId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/overview');
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(`Failed to load admin overview: ${res.status} - ${errorData.error || 'Unknown error'}`);
        }
        const data = await res.json();
        setAccounts(data.users || []);
        setCreatedInvites(data.invites || []);
      } catch (err) {
        console.error('admin overview fetch error', err);
        if (err instanceof Error && err.message.includes('401')) {
          setAuthError(true);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleGenerateInvite = async () => {
    setGeneratingInvite(true);
    setNewInviteCode('');
    
    try {
      const response = await fetch('/api/invite/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: inviteRole }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate invite code');
      }

      const { invite } = await response.json();
      setNewInviteCode(invite.code);
      
      // Refresh the invites list
      await refreshInvites();
    } catch (err) {
      console.error('Generate invite error:', err);
      alert(err instanceof Error ? err.message : 'Failed to generate invite code');
    } finally {
      setGeneratingInvite(false);
    }
  };

  const refreshInvites = async () => {
    const res = await fetch('/api/admin/overview');
    if (res.ok) {
      const data = await res.json();
      setCreatedInvites(data.invites || []);
    }
  };

  const handleDeleteInvite = async (invite: any) => {
    const wasUsed = !!invite.usedAt;
    const userLabel = invite.usedByUser?.email || invite.usedBy || 'unknown user';

    const confirmed = wasUsed
      ? window.confirm(
          `This invite was used by ${userLabel}. Deleting it will revert their role back to ARTIST.\n\nAre you sure?`
        )
      : window.confirm('Delete this unused invite code?');

    if (!confirmed) return;

    setDeletingInviteId(invite.id);
    try {
      const res = await fetch('/api/invite/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId: invite.id }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete invite');
      }

      await refreshInvites();
    } catch (err) {
      console.error('Delete invite error:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete invite');
    } finally {
      setDeletingInviteId(null);
    }
  };

  return (
    <>
      {/* Dashboard Header */}
      <header className="glass-card p-6 mb-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold gradient-text">Admin Dashboard</h1>
      </header>

      {/* Dashboard Content */}
      <div className="glass-card p-8 max-w-6xl mx-auto space-y-6">
        <div>
          <p className="text-sm text-gray-300">Manage users, invites, and system settings.</p>
        </div>

      {authError ? (
        <div className="glass-card p-6 bg-yellow-500/10 border border-yellow-500/30">
          <h3 className="text-lg font-semibold text-yellow-400 mb-2">Access Restricted</h3>
          <p className="text-yellow-200">You don't have admin privileges to view this dashboard.</p>
          <p className="text-sm text-yellow-300 mt-2">This is a known issue that will be resolved in a future update.</p>
        </div>
      ) : (
        <>
          {/* Invite Code Generation */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold mb-4">Generate Invite Codes</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="inviteRole" className="block text-sm font-medium mb-2 opacity-90">
                  Role to Grant
                </label>
                <select
                  id="inviteRole"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'LABEL' | 'ADMIN')}
                  className="w-full p-3 bg-[var(--color-glass-dark)] backdrop-blur-sm border border-white/10 rounded-xl text-white focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-glow)] focus:outline-none transition-all"
                >
                  <option value="LABEL">Label</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="flex gap-2">
                <GlassButton 
                  onClick={handleGenerateInvite} 
                  disabled={generatingInvite}
                >
                  {generatingInvite ? 'Generating...' : 'Generate Code'}
                </GlassButton>
                {newInviteCode && (
                  <button
                    className="px-3 py-2 bg-white/10 rounded-md text-sm hover:bg-white/20 transition-colors"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(newInviteCode);
                        alert('Copied!');
                      } catch (e) {
                        alert('Copy failed');
                      }
                    }}
                  >
                    Copy
                  </button>
                )}
              </div>
              {newInviteCode && (
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-md">
                  <p className="text-green-400">Generated Code: <span className="font-mono font-bold">{newInviteCode}</span></p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-3">Active Accounts</h2>
        {loading ? (
          <div>Loading accounts...</div>
        ) : (
          <div className="overflow-x-auto bg-[var(--color-glass-dark)] rounded-md p-4">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-400">
                  <th className="py-2">Email</th>
                  <th className="py-2">Name</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map(acc => (
                  <tr key={acc.id} className="border-t border-white/5">
                    <td className="py-2">{acc.email}</td>
                    <td className="py-2">{acc.name || '—'}</td>
                    <td className="py-2">{acc.role}</td>
                    <td className="py-2">{new Date(acc.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Invites You Created (and who used them)</h2>
        {loading ? (
          <div>Loading invites...</div>
        ) : (
          <div className="grid gap-3">
            {createdInvites.length === 0 && <p className="text-sm text-gray-400">No invites created yet.</p>}
            {createdInvites.map((inv: any) => (
              <div key={inv.id} className="p-3 bg-[var(--color-glass-dark)] rounded-md flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-mono">{inv.code}</div>
                  <div className="text-xs text-gray-400">Role: {inv.role} • Created: {new Date(inv.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    {inv.usedAt ? (
                      <div className="text-sm">
                        Used by <span className="font-medium">{inv.usedByUser?.email || inv.usedBy}</span>
                        <div className="text-xs text-gray-400">Role: {inv.usedByUser?.role || '—'} • Redeemed: {new Date(inv.usedAt).toLocaleString()}</div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400">Unused</div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteInvite(inv)}
                    disabled={deletingInviteId === inv.id}
                    className="shrink-0 p-2 rounded-md text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete invite"
                  >
                    {deletingInviteId === inv.id ? (
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}