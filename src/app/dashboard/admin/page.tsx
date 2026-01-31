// src/app/dashboard/[role]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase/client';
import GlassButton from '@/components/ui/GlassButton';

const roleComponents: Record<string, React.FC> = {
  artist: ArtistDashboard,
  label: LabelDashboard,
  admin: AdminDashboard,
};

function DefaultDashboard() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-3xl font-bold gradient-text">Welcome</h1>
      <p className="mt-4">Your dashboard is loading...</p>
    </div>
  );
}

export default function Dashboard() {
  const params = useParams();
  const pathname = usePathname();
  const roleFromParams = (params.role as string)?.toLowerCase();
  const roleFromPath = pathname ? pathname.split('/')[2] : undefined;
  const role = roleFromParams || roleFromPath || 'artist';
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkRole = async () => {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }

        // Fetch actual role from Prisma
        const response = await fetch('/api/profiles/get-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });

        if (!response.ok) {
          console.error('get-role failed', response.status);
          router.push('/auth/login');
          return;
        }

        const data = await response.json();
        const fetchedRole = String(data.role || '').toLowerCase();

        // Redirect if URL role doesn't match actual role (only when params were used)
        if (fetchedRole && roleFromParams && fetchedRole !== role) {
          router.replace(`/dashboard/${fetchedRole}`);
          return;
        }

        setUserRole(fetchedRole || role);
      } catch (err) {
        console.error('role check error', err);
        router.push('/auth/login');
      }
    };

    checkRole();
  }, [router, params.role]);

  if (!userRole) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const activeRole = (userRole || role).toLowerCase();
  const DashboardComponent = roleComponents[activeRole] || DefaultDashboard;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-8">
      <DashboardComponent />
    </div>
  );
}

// Stub dashboards (expand these later)
function ArtistDashboard() {
  return (
    <div className="glass-card p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold gradient-text mb-6">Artist Dashboard</h1>
      <p>Create and manage your split sheets here.</p>
      <GlassButton className="mt-6" onClick={() => (window.location.href = '/splits/new')}>New Split Sheet</GlassButton>
    </div>
  );
}

function LabelDashboard() {
  return (
    <div className="glass-card p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold gradient-text mb-6">Label Dashboard</h1>
      <p>Review and approve artist submissions.</p>
    </div>
  );
}

function AdminDashboard() {
  const [accounts, setAccounts] = useState<Array<any>>([]);
  const [createdInvites, setCreatedInvites] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/overview');
        if (!res.ok) throw new Error('Failed to load admin overview');
        const data = await res.json();
        setAccounts(data.users || []);
        setCreatedInvites(data.invites || []);
      } catch (err) {
        console.error('admin overview fetch error', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="glass-card p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text mb-2">Admin Dashboard</h1>
        <p className="text-sm text-gray-300">Manage users, invites, and system settings.</p>
      </div>

      <div className="flex gap-4">
        <GlassButton onClick={() => (window.location.href = '/admin/invites')}>Manage Invite Codes</GlassButton>
      </div>

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
  );
}