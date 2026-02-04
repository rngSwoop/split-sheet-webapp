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
      const res = await fetch('/api/admin/overview');
      if (res.ok) {
        const data = await res.json();
        setCreatedInvites(data.invites || []);
      }
    } catch (err) {
      console.error('Generate invite error:', err);
      alert(err instanceof Error ? err.message : 'Failed to generate invite code');
    } finally {
      setGeneratingInvite(false);
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
              <div key={inv.id} className="p-3 bg-[var(--color-glass-dark)] rounded-md flex items-center justify-between">
                <div>
                  <div className="font-mono">{inv.code}</div>
                  <div className="text-xs text-gray-400">Role: {inv.role} • Created: {new Date(inv.createdAt).toLocaleString()}</div>
                </div>
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}