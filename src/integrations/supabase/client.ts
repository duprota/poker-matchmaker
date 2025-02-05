import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hvsrrjnlghvjbowoknze.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c3Jyam5sZ2h2amJvd29rbnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk2NTg0NDAsImV4cCI6MjAyNTIzNDQ0MH0.PGOHb1jKF4GtBxUZwmk3f3GnDpYcKD7wZEBPGPEh2Yk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage
  }
});