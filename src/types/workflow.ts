
import { Json } from "@/integrations/supabase/types";

export interface WorkflowStep {
  id: string;
  name: string;
  action: string;
  parameters: Record<string, Json>;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  config?: Record<string, Json>;
  status: 'draft' | 'active' | 'archived';
  created_at?: string;
  updated_at?: string;
}
