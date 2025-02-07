
import { Json } from "@/integrations/supabase/types";
import { WorkflowStep } from "./workflow";

export interface WorkflowExecutionResult {
  workflow_status: 'completed' | 'error';
  output?: unknown;
  error?: string;
}

export interface WorkflowExecutionConfig {
  maxRetries?: number;
  timeout?: number;
  notifications?: boolean;
  onStepComplete?: (step: WorkflowStep, result: unknown) => Promise<void>;
  onError?: (error: Error, step?: WorkflowStep) => Promise<void>;
}

export interface PendingExecution {
  id: string;
  workflow_id: string;
  name: string;
  config: Json;
  next_run: string;
  steps: WorkflowStep[];
}

export interface WorkflowExecutionLog {
  workflow_id: string;
  step?: WorkflowStep;
  status: 'error' | 'pending' | 'running' | 'completed';
  result?: Json;
  error?: string;
  execution_time: string;
}
