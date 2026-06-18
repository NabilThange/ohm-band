import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

// Singletons for both client and server
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null
let serverInstance: ReturnType<typeof createClient<Database>> | null = null
let hasLoggedServerInit = false // ponytail: log once, not per call

export function getSupabaseClient() {
    if (typeof window === 'undefined') {
        // Server-side: Use singleton to avoid recreating client on every call
        if (!serverInstance) {
            const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
            
            if (!hasLoggedServerInit) {
                if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
                    console.warn('[Supabase] ⚠️ No SERVICE_ROLE_KEY found, using ANON_KEY (RLS will be enforced)');
                } else {
                    console.log('[Supabase] ✅ Using SERVICE_ROLE_KEY for server-side operations');
                }
                hasLoggedServerInit = true
            }
            
            serverInstance = createClient<Database>(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                serviceKey!
            )
        }
        return serverInstance
    }

    // Client-side: Use singleton with ANON_KEY
    if (!supabaseInstance) {
        supabaseInstance = createClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
    }

    return supabaseInstance
}

// Export a getter that always calls getSupabaseClient() to ensure correct context
export const supabase = new Proxy({} as ReturnType<typeof createClient<Database>>, {
    get(target, prop) {
        const client = getSupabaseClient();
        return (client as any)[prop];
    }
})
