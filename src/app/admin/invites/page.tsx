/* src/app/admin/invites/page.tsx */
'use client';

import { useEffect, useState } from 'react';
import GlassButton from '@/components/ui/GlassButton';

export default function AdminInvites() {
  const [role, setRole] = useState<'LABEL' | 'ADMIN'>('LABEL');
  const [code, setCode] = useState('');
  const [invites, setInvites] = useState<Array<any>>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInvites();
  }, []);

  async function fetchInvites() {
    try {
      const res = await fetch('/api/invite/list');
      if (!res.ok) return;
      const data = await res.json();
      setInvites(data.invites || []);
    } catch (e) {
      // ignore
    }
  }

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setCode('');

    try {
      const response = await fetch('/api/invite/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        const errData = await response.json();
        setError(errData.error || 'Failed to generate code');
        return;
      }

      const { invite } = await response.json();
      setCode(invite.code);
      // refresh list
      fetchInvites();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-4">
      <div className="glass-card w-full max-w-2xl hover-glow">
        <h1 className="text-3xl font-bold mb-8 text-center gradient-text">
          Generate Invite Code
        </h1>
        <div className="space-y-6">
          <div>
            <label htmlFor="role" className="block text-sm font-medium mb-2 opacity-90">
              Role to Grant
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'LABEL' | 'ADMIN')}
              className="w-full p-4 bg-[var(--color-glass-dark)] backdrop-blur-sm border border-white/10 rounded-xl text-white focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-glow)] focus:outline-none transition-all"
            >
              <option value="LABEL">Label</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <GlassButton onClick={handleGenerate} className="w-full" disabled={loading}>
            {loading ? 'Generating...' : 'Generate Code'}
          </GlassButton>
          {code && <p className="text-center text-green-400">Generated Code: {code}</p>}
          {error && <p className="text-red-400 text-center">{error}</p>}
        </div>

        {/* Active invites list */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Active Invite Codes</h2>
          {invites.length === 0 && <p className="text-sm text-gray-400">No active invites.</p>}
          <div className="grid gap-3">
            {invites.map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between p-3 bg-[var(--color-glass-dark)] rounded-md">
                <div>
                  <div className="font-mono text-sm">{inv.code}</div>
                  <div className="text-xs text-gray-400">Role: {inv.role} • Expires: {inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : 'Never'}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 bg-white/10 rounded-md text-sm"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(inv.code);
                        // small visual feedback
                        alert('Copied ' + inv.code);
                      } catch (e) {
                        alert('Copy failed');
                      }
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}