import { createClient } from '@supabase/supabase-js'

// Server-only Supabase client using the service role key.
// - NEVER import this file in any browser/client component.
// - The service role key bypasses RLS, so it works even after RLS is enabled.
// - Use the regular supabase client (anon key) only for client-side auth.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    'Missing SUPABASE_SERVICE_ROLE_KEY. Add it to .env.local (no NEXT_PUBLIC_ prefix).'
  )
}

export const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    // Disable auto session refresh — not needed server-side
    autoRefreshToken: false,
    persistSession: false,
  },
})

export default supabase
