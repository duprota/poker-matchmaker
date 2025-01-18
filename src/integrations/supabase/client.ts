import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://hvsrrjnlghvjbowoknze.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c3Jyam5sZ2h2amJvd29rbnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NzQ0OTUsImV4cCI6MjA1MjU1MDQ5NX0.eLNhLcJ0zrv3w7mw_fIhiWvr1iOpTPk6ZOxxNhJ-P0Q";

// Initialize the Supabase client with additional options
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});