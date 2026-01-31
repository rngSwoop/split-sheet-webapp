// src/app/auth/login/page.tsx
'use client';

import { useState } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import GlassButton from '@/components/ui/GlassButton';
import Link from 'next/link';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setLoading(true);

  // 1. Determine if identifier is email or username
  let emailToUse = identifier;
  
  // If not an email, lookup user by username to get email
  if (!identifier.includes('@') || !identifier.includes('.')) {
    try {
      const lookupResponse = await fetch('/api/auth/lookup-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });

      if (!lookupResponse.ok) {
        const errorData = await lookupResponse.json();
        setError(errorData.error || 'Username lookup failed');
        setLoading(false);
        return;
      }

      const { email } = await lookupResponse.json();
      emailToUse = email;
    } catch {
      setError('Username lookup failed');
      setLoading(false);
      return;
    }
  }

  // 2. Attempt login with Supabase using email
  const { error: loginError } = await supabaseClient.auth.signInWithPassword({
    email: emailToUse,
    password,
  });

  // 3. Handle login errors immediately
  if (loginError) {
    setError(loginError.message);
    setLoading(false);
    return;
  }

  // 3. Login succeeded → get the current user
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    setError('Failed to retrieve user after login');
    setLoading(false);
    return;
  }

  // 4. Sync Prisma User + Profile (only runs if login is successful)
  try {
    const syncResponse = await fetch('/api/profiles/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supabaseUserId: user.id,
        email: user.email,
        name: user.user_metadata?.name || 'User',
      }),
    });

    if (!syncResponse.ok) {
      const errData = await syncResponse.json();
      setError(errData.error || 'Failed to sync profile');
      setLoading(false);
      return;
    }

    // 5. Get the synced profile and redirect based on role
    const { profile } = await syncResponse.json();

    if (profile.role === 'LABEL' || profile.role === 'ADMIN') {
      router.push('/dashboard'); // Higher roles go directly to dashboard
    } else {
      router.push('/role-selection'); // ARTIST goes to role selection
    }
  } catch (err: any) {
    setError(err.message || 'Sync error');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-4">
      <div className="glass-card w-full max-w-md hover-glow">
        <h1 className="text-3xl font-bold mb-8 text-center gradient-text">
          Welcome Back
        </h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="identifier" className="block text-sm font-medium mb-2 opacity-90">
              Email or Username
            </label>
            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full p-4 bg-[var(--color-glass-dark)] backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-gray-400 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-glow)] focus:outline-none transition-all"
              placeholder="Enter your email or username"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2 opacity-90">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-[var(--color-glass-dark)] backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-gray-400 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-glow)] focus:outline-none transition-all"
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>
          {error && <p className="text-red-400 text-sm text-center animate-pulse-slow">{error}</p>}
          <GlassButton type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing In...' : 'Log In'}
          </GlassButton>
        </form>
        <p className="mt-6 text-center text-sm text-gray-400">
          Don't have an account?{' '}
          <Link href="/auth/signup" className="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] hover-glow underline">
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  );
}