import "server-only";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Copy .env.example to .env.local and fill both in.",
  );
}

/**
 * Service role client. Bypasses RLS, so this is the only path to room data,
 * and it must never be imported from a client component. Every handler that
 * uses it authorizes the caller by participant token first.
 */
export const admin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const supabaseUrl = url;
export const supabaseServiceRoleKey = serviceRoleKey;
