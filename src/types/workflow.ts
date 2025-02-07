
import { Json } from "@/integrations/supabase/types";

// Database types
export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: Json;
  config: Json;
  status: 'draft' | 'active' | 'archived';
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface CreateWorkflowInput {
  name: string;
  description: string;
  steps: Json;
  status: 'draft' | 'active' | 'archived';
  created_by: string;
  config: Json;
}

// Frontend types
export interface WorkflowStep {
  id: string;
  name: string;
  action: string;
  parameters: Record<string, Json>;
}

export interface FormattedWorkflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  config: Record<string, Json>;
  status: 'draft' | 'active' | 'archived';
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface WorkflowFormValues {
  name: string;
  description?: string;
  steps: WorkflowStep[];
  status?: 'draft' | 'active' | 'archived';
  config?: Record<string, Json>;
}

export interface UpdateWorkflowInput extends Partial<WorkflowFormValues> {
  id: string;
}
