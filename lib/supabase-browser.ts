"use client";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Anon client. Used for exactly one thing: subscribing to the room broadcast
 * channel. Every table denies anon under RLS, so this client cannot read a
 * single row, and the broadcasts it receives carry no data of their own.
 */
export const browserSupabase = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { params: { eventsPerSecond: 5 } },
});
