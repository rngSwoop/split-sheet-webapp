// src/app/auth/login/page.tsx
'use client';

import { useState } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import GlassButton from '@/components/ui/GlassButton';
import Spinner from '@/components/ui/Spinner';
import AuthBackground from '@/components/auth/AuthBackground';
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

    // 4. Login succeeded → get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      setError('Failed to retrieve user after login');
      setLoading(false);
      return;
    }

    // 5. Sync Prisma User + Profile (only runs if login is successful)
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

      // 6. Get the synced profile and redirect to dashboard
      const { profile } = await syncResponse.json();
      
      // All roles go to dashboard - middleware will handle role-based redirects
      router.push('/dashboard');
      console.log('🚀 Login successful: Redirecting to dashboard for role:', profile.role);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sync error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthBackground>
      <div className="w-full max-w-md">
        <div className="glass-card p-8 hover-glow">
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <span className="text-4xl">🎵</span>
            </div>
            <h1 className="text-3xl font-bold gradient-text">
              Welcome Back
            </h1>
            <p className="mt-2 text-gray-400">
              Sign in to access your split sheets
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium mb-2 opacity-90">
                Email or Username
              </label>
              <input
                id="identifier"
                type="text"
                autoFocus
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
            {error && (
              <div className="text-red-400 text-sm text-center bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                {error}
              </div>
            )}
            <GlassButton type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Spinner size="sm" />
                  <span>Signing In...</span>
                </div>
              ) : (
                'Log In'
              )}
            </GlassButton>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] hover-glow underline transition-all">
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </AuthBackground>
  );
}