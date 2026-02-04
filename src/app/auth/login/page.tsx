// src/app/auth/login/page.tsx
'use client';

import { useState } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import GlassButton from '@/components/ui/GlassButton';
import AnimatedLogo from '@/components/auth/AnimatedLogo';
import AuthBackground from '@/components/auth/AuthBackground';
import { useLoading } from '@/contexts/LoadingContext';
import Link from 'next/link';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLoadingState, setShowLoadingState] = useState(false);
  const { setLoading: setGlobalLoading, clearLoading } = useLoading();
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

  // 2. Transition to loading state with animation
  setShowLoadingState(true);
  setGlobalLoading(true, 'Authenticating');
  await new Promise(resolve => setTimeout(resolve, 300)); // Allow form to fade out

  // 3. Attempt login with Supabase using email
  const { error: loginError } = await supabaseClient.auth.signInWithPassword({
    email: emailToUse,
    password,
  });

  // 4. Handle login errors immediately
  if (loginError) {
    setError(loginError.message);
    setShowLoadingState(false);
    clearLoading();
    setLoading(false);
    return;
  }

  // 4. Login succeeded → get the current user
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    setError('Failed to retrieve user after login');
    setShowLoadingState(false);
    clearLoading();
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
      setShowLoadingState(false);
      clearLoading();
      setLoading(false);
      return;
    }

    // 6. Get the synced profile and redirect to dashboard
    const { profile } = await syncResponse.json();
    
    // Wait a bit more for smooth transition
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // All roles go to dashboard - middleware will handle role-based redirects
    router.push('/dashboard');
    console.log('🚀 Login successful: Redirecting to dashboard for role:', profile.role);
  } catch (err: unknown) {
    setError(err instanceof Error ? err.message : 'Sync error');
    setShowLoadingState(false);
    clearLoading();
  } finally {
    setLoading(false);
  }
};

  return showLoadingState ? null : (
    <AuthBackground>
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key="login-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="glass-card p-8"
          >
            <div className="text-center mb-8">
              <AnimatedLogo size="md" />
              <h1 className="mt-6 text-3xl font-bold gradient-text">
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
                {loading ? 'Signing In...' : 'Log In'}
              </GlassButton>
            </form>

            <p className="mt-6 text-center text-sm text-gray-400">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] hover-glow underline transition-all">
                Sign up here
              </Link>
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </AuthBackground>
  );
}