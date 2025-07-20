import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qtnqndckdxizhykquxpw.supabase.co';
// Allow either variable name for compatibility with common guides
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0bnFuZGNrZHhpemh5a3F1eHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MTMxNjAsImV4cCI6MjA2ODM4OTE2MH0.-lg_gy0XPgaMpdTXq81PYje--YdWuW0AGa-EZ_64hVQ';

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
