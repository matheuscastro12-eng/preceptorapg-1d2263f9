// Re-export CRM supabase client for use in CRM hooks
// This client has its own auth session (service account) separate from the main app
export { supabaseCrm as supabase } from "@/integrations/supabase/crm-client";
