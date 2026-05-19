/**
 * @context supabase.ts
 * @what    Supabase service-role client for server-side Storage operations
 * @purpose Create/delete/download files in the private "uploads" and "content" buckets
 * @depends SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars
 * @usedby  file.service.ts, content.service.ts
 * @rules   NEVER import supabaseAdmin in client components or expose the key to the browser
 * @layer   lib
 */
import { createClient } from "@supabase/supabase-js";

// Service-role client — exclusivamente server-side, nunca exposto ao browser
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export const STORAGE_BUCKET = "uploads";

// Bucket para a Central de Conteúdo — deve ser criado MANUALMENTE no Supabase Dashboard
// Tipo: privado · Policies: mesmas do bucket "uploads"
export const CONTENT_BUCKET = "content";
