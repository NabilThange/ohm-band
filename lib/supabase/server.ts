import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from './types'

// ponytail: server-only client, no cookie handling needed for API routes
export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createSupabaseClient<Database>(supabaseUrl, supabaseKey)
}
