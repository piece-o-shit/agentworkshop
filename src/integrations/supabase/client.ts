// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://lmzcghgwlnqposgryvrh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtemNnaGd3bG5xcG9zZ3J5dnJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg5MTgzNDIsImV4cCI6MjA1NDQ5NDM0Mn0.RN-L4oG8otJrm5LL1haRWEX0SV4b0S3OZJ6Oz2nrj0w";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);