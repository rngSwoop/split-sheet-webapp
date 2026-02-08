// src/app/auth/confirm-success/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GlassButton from '@/components/ui/GlassButton';
import { supabaseClient } from '@/lib/supabase/client';
import { getDashboardRoute } from '@/lib/utils';

export default function ConfirmSuccess() {
  const router = useRouter();

  useEffect(() => {
    // Optional: Auto-attempt sign-in after confirmation (if you stored credentials)
    const autoSignIn = async () => {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email: localStorage.getItem('pendingEmail') || '',
        password: localStorage.getItem('pendingPassword') || '',
      });

      // Clean up stored credentials regardless of outcome
      localStorage.removeItem('pendingEmail');
      localStorage.removeItem('pendingPassword');

      if (!error) {
        // Get user role after login and route to appropriate dashboard
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user) {
          // Get user role from API
          const roleResponse = await fetch('/api/profiles/get-role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id }),
          });

          if (roleResponse.ok) {
            const { role } = await roleResponse.json();
            router.push(getDashboardRoute(role));
            return;
          }
        }
        router.push('/dashboard/artist'); // fallback
      } else {
        alert('Email confirmed! Please log in manually.');
        router.push('/auth/login');
      }
    };

    autoSignIn();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <div className="glass-card p-10 text-center">
        <h1 className="text-3xl font-bold mb-6 gradient-text">Email Confirmed!</h1>
        <p className="mb-8">Your account is now active. Logging you in...</p>
        <GlassButton onClick={() => router.push('/auth/login')}>
          Log In Manually
        </GlassButton>
      </div>
    </div>
  );
}