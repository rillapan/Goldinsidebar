import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton agar satu tab selalu pakai client yang sama.
// Ini penting: signInWithPassword() dan getSession() harus berbagi
// in-memory session cache yang sama agar token tersedia di interceptor.
let _client: ReturnType<typeof createBrowserClient> | null = null;

export const createClient = () => {
  if (!_client) {
    _client = createBrowserClient(supabaseUrl, supabaseKey);
  }
  return _client;
};
