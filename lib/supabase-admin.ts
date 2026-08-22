import "server-only";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  const missing = [
    !url && "NEXT_PUBLIC_SUPABASE_URL",
    !serviceRoleKey && "SUPABASE_SERVICE_ROLE_KEY",
  ]
    .filter(Boolean)
    .join(" and ");

  // Named individually, and pointing at the right place depending on where
  // this is running, because the first time anyone sees this message it will
  // be in a build log rather than a terminal.
  throw new Error(
    process.env.VERCEL
      ? `Missing ${missing}. Add it under Project Settings, Environment Variables, then redeploy.`
      : `Missing ${missing}. Copy .env.example to .env.local and fill it in.`,
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
