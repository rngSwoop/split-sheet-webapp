// src/app/auth/signup/page.tsx (updated)
'use client';

import { useState } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import GlassButton from '@/components/ui/GlassButton';
import Link from 'next/link';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signUpError } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/auth/confirm-success`, // ← NEW: Redirect to confirmation success page
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    alert('Signup successful! Please check your email to confirm your account.');
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-4">
      <div className="glass-card w-full max-w-md hover-glow">
        <h1 className="text-3xl font-bold mb-8 text-center gradient-text">
          Join SplitSheet Pro
        </h1>
        <form onSubmit={handleSignup} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2 opacity-90">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-4 bg-[var(--color-glass-dark)] backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-gray-400 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-glow)] focus:outline-none transition-all"
              placeholder="Your name"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2 opacity-90">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 bg-[var(--color-glass-dark)] backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-gray-400 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-glow)] focus:outline-none transition-all"
              placeholder="Enter your email"
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
              placeholder="Create a password"
              required
              disabled={loading}
            />
          </div>
          {error && <p className="text-red-400 text-sm text-center animate-pulse-slow">{error}</p>}
          <GlassButton type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </GlassButton>
        </form>
        <p className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] hover-glow underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}