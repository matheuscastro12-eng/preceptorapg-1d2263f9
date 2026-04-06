// CRM client — uses the same Supabase instance but with separate auth storage
// This allows CRM auth to coexist with app auth without conflicts
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabaseCrm = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storageKey: 'sb-crm-auth-token',
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
