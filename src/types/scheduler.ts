
import { Tables } from '@/integrations/supabase/types';

export type ScheduleStatus = 'active' | 'paused' | 'error';

export interface ScheduledWorkflow extends Tables<'scheduled_workflows'> {
  status: ScheduleStatus;
  config: {
    max_retries?: number;
    timeout?: number;
    notifications?: boolean;
  };
}

export interface CreateScheduleInput {
  workflow_id: string;
  name: string;
  description?: string;
  schedule: string;
  config?: ScheduledWorkflow['config'];
  metadata?: Record<string, unknown>;
}
