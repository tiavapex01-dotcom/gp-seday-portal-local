import { createClient } from "@supabase/supabase-js";

// Service-role client — exclusivamente server-side, nunca exposto ao browser
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export const STORAGE_BUCKET = "uploads";
