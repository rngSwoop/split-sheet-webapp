// src/lib/auth-client.ts
// Client-side optimized auth utilities
import { supabaseClient } from '@/lib/supabase/client';

export async function getCurrentUserRoleClient(): Promise<'ARTIST' | 'LABEL' | 'ADMIN'> {
  try {
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      throw new Error('No authenticated user');
    }

    // Fast path: try cached user_metadata first
    const cachedRole = user.user_metadata?.role;
    if (cachedRole) {
      console.log('🎯 Client: Using cached role from user_metadata:', cachedRole);
      return cachedRole as 'ARTIST' | 'LABEL' | 'ADMIN';
    }

    // Fallback: fetch from API (slow path - should rarely happen)
    console.log('🔄 Client: No cached role, fetching from API');
    const response = await fetch('/api/profiles/get-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    });

    if (response.ok) {
      const { role } = await response.json();
      return role as 'ARTIST' | 'LABEL' | 'ADMIN';
    }

    // Default fallback
    return 'ARTIST';
  } catch (error) {
    console.error('Client: Error getting user role:', error);
    return 'ARTIST';
  }
}