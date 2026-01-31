// src/app/auth/confirm-success/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GlassButton from '@/components/ui/GlassButton';
import { supabaseClient } from '@/lib/supabase/client';

export default function ConfirmSuccess() {
  const router = useRouter();

  useEffect(() => {
    // Optional: Auto-attempt sign-in after confirmation (if you stored credentials)
    const autoSignIn = async () => {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email: localStorage.getItem('pendingEmail') || '',
        password: localStorage.getItem('pendingPassword') || '',
      });

      if (!error) {
        router.push('/role-selection');
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