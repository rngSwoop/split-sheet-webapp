// src/app/auth/signup/page.tsx (simplified version)
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import GlassButton from '@/components/ui/GlassButton';
import Spinner from '@/components/ui/Spinner';
import AuthBackground from '@/components/auth/AuthBackground';
import Link from 'next/link';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const router = useRouter();

  // Debounced username check function
  const debouncedUsernameCheck = useCallback(
    async (username: string) => {
      if (username.length === 0) {
        setUsernameAvailable(null);
        setUsernameError(null);
        return;
      }

      if (username.length < 4) {
        setUsernameError('Username must be at least 4 characters');
        setUsernameAvailable(false);
        return;
      }
      
      if (username.length > 30) {
        setUsernameError('Username must be less than 30 characters');
        setUsernameAvailable(false);
        return;
      }
      
      const reservedNames = ['admin', 'system', 'user', 'root', 'administrator', 'moderator', 'staff'];
      if (reservedNames.includes(username.toLowerCase())) {
        setUsernameError('This username is reserved and cannot be used');
        setUsernameAvailable(false);
        return;
      }
      
      if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
        setUsernameError('Username can only contain letters, numbers, dots, hyphens, and underscores');
        setUsernameAvailable(false);
        return;
      }
      
      setIsCheckingUsername(true);
      
      try {
        const response = await fetch('/api/auth/check-username', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        });
        
        if (!response.ok) {
          setUsernameError('Failed to check username availability');
          setUsernameAvailable(false);
          return;
        }
        
        const result = await response.json();
        console.log('Username validation result:', result);
        
        if (result.available) {
          setUsernameAvailable(true);
          setUsernameError(null);
        } else {
          setUsernameError(result.error || 'Username is not available');
          setUsernameAvailable(false);
        }
      } catch (error) {
        console.error('Username check error:', error);
        setUsernameError('Failed to check username availability');
        setUsernameAvailable(false);
      } finally {
        setIsCheckingUsername(false);
      }
    },
    []
  );

  // Debounce the username check
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      debouncedUsernameCheck(username);
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [username, debouncedUsernameCheck]);

  // Function for immediate username validation (used during signup)
  const validateUsernameImmediate = async (username: string) => {
    if (username.length < 4) {
      setUsernameError('Username must be at least 4 characters');
      return false;
    }
    
    if (username.length > 30) {
      setUsernameError('Username must be less than 30 characters');
      return false;
    }
    
    const reservedNames = ['admin', 'system', 'user', 'root', 'administrator', 'moderator', 'staff'];
    if (reservedNames.includes(username.toLowerCase())) {
      setUsernameError('This username is reserved and cannot be used');
      return false;
    }
    
    if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
      setUsernameError('Username can only contain letters, numbers, dots, hyphens, and underscores');
      return false;
    }
    
    try {
      const response = await fetch('/api/auth/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      
      if (!response.ok) {
        setUsernameError('Failed to check username availability');
        return false;
      }
      
      const result = await response.json();
      
      if (result.available) {
        setUsernameAvailable(true);
        setUsernameError(null);
        return true;
      } else {
        setUsernameError(result.error || 'Username is not available');
        setUsernameAvailable(false);
        return false;
      }
    } catch (error) {
      console.error('Username check error:', error);
      setUsernameError('Failed to check username availability');
      return false;
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate username first
    if (username.trim()) {
      const isAvailable = await validateUsernameImmediate(username.trim());
      if (!isAvailable) {
        setLoading(false);
        return;
      }
    }

    const { error: signUpError, data } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: { name, username: username.trim().toLowerCase() },
        emailRedirectTo: `${window.location.origin}/auth/confirm-success`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // After successful signup, sync the user to Prisma database
    if (data.user) {
      try {
        const syncResponse = await fetch('/api/profiles/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            supabaseUserId: data.user.id,
            email: data.user.email || email,
            name: name,
            username: username.trim().toLowerCase(),
          }),
        });

        if (!syncResponse.ok) {
          console.error('Failed to sync user to database:', await syncResponse.json());
          // Don't fail the signup, just log the error
        }
      } catch (syncError) {
        console.error('Sync error during signup:', syncError);
        // Don't fail the signup, just log the error
      }
    }

    setLoading(false);

    if (data.session) {
      // Email verification disabled — user is already authenticated, go straight to dashboard
      router.push('/dashboard');
      return;
    }

    // Email verification enabled — store credentials for confirm-success auto-login
    localStorage.setItem('pendingEmail', email);
    localStorage.setItem('pendingPassword', password);

    // Clear form and reset states
    setName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setError(null);
    setUsernameAvailable(null);
    setUsernameError(null);

    alert('Signup successful! Please check your email to confirm your account.');
    router.push('/auth/login');
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
              Join SplitSheet Pro
            </h1>
          </div>
        <form onSubmit={handleSignup} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2 opacity-90">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-4 bg-[var(--color-glass-dark)] backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-gray-400 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-glow)] focus:outline-none transition-all"
              placeholder="Your name"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-2 opacity-90">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
              className={`w-full p-4 bg-[var(--color-glass-dark)] backdrop-blur-sm border rounded-xl text-white placeholder-gray-400 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-glow)] focus:outline-none transition-all ${
                usernameError ? 'border-red-500' : 
                usernameAvailable === true ? 'border-green-500' : 
                'border-white/10'
              }`}
              placeholder="Choose a username"
              required
              disabled={loading}
            />
            {isCheckingUsername && username && (
              <p className="text-gray-400 text-sm mt-1">Checking username...</p>
            )}
            {usernameError && (
              <p className="text-red-400 text-sm mt-1">{usernameError}</p>
            )}
            {usernameAvailable === true && !isCheckingUsername && (
              <p className="text-green-400 text-sm mt-1">Username is available!</p>
            )}
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
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <GlassButton type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <Spinner size="sm" />
                <span>Creating Account...</span>
              </div>
            ) : (
              'Sign Up'
            )}
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
    </AuthBackground>
  );
}