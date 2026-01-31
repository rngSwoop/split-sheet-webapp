// src/app/role-selection/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import GlassButton from '@/components/ui/GlassButton';

export default function RoleSelection() {
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // NEW: Loading state while checking role
  const router = useRouter();

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabaseClient.auth.getUser();

      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Fetch profile role from Prisma via API
      const response = await fetch('/api/profiles/get-role', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id }),
      });

      const { role } = await response.json();

      if (role !== 'ARTIST') {
        router.push('/dashboard'); // Skip if already upgraded
      } else {
        setLoading(false); // Show page if ARTIST
      }
    };

    checkRole();
  }, [router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const handleRoleSelect = async (role: 'ARTIST' | 'LABEL' | 'ADMIN') => {
    setLoading(true);
    setError(null);

    if (role === 'ARTIST') {
      router.push('/dashboard');
      return;
    }

    // For LABEL/ADMIN: validate code and upgrade
    try {
      const response = await fetch('/api/invite/validate-and-upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCode, requestedRole: role }),
      });

      if (!response.ok) {
        const errData = await response.json();
        setError(errData.error || 'Invalid code');
        setLoading(false);
        return;
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-4">
      <div className="glass-card w-full max-w-lg hover-glow text-center">
        <h1 className="text-3xl font-bold mb-8 gradient-text">Choose Your Role</h1>
        <p className="mb-10 opacity-80">
          Start as an Artist (no approval needed) or upgrade with a valid invite code.
        </p>

        <div className="grid gap-6 md:grid-cols-3 mb-12">
          <GlassButton onClick={() => handleRoleSelect('ARTIST')}>
            Artist
          </GlassButton>
          <GlassButton onClick={() => handleRoleSelect('LABEL')}>
            Label
          </GlassButton>
          <GlassButton onClick={() => handleRoleSelect('ADMIN')}>
            Admin
          </GlassButton>
        </div>

        <div className="mt-8">
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Enter invite code for Label/Admin"
            className="w-full p-4 bg-[var(--color-glass-dark)] backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-gray-400 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-glow)] focus:outline-none transition-all mb-4"
          />
          {error && <p className="text-red-400 mb-4 animate-pulse-slow">{error}</p>}
        </div>
      </div>
    </div>
  );
}