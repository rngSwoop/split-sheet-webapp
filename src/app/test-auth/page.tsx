import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function TestAuth() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div>
      <h1>Server-Side Auth Test</h1>
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </div>
  );
}