
import { supabase } from '@/integrations/supabase/client';
import { ScheduledWorkflow, CreateScheduleInput } from '@/types/scheduler';
import { Json } from '@/integrations/supabase/types';

export async function fetchScheduledWorkflows(): Promise<ScheduledWorkflow[]> {
  const { data, error } = await supabase
    .from('scheduled_workflows')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as ScheduledWorkflow[];
}

export async function createSchedule(input: CreateScheduleInput) {
  const { data, error } = await supabase
    .from('scheduled_workflows')
    .insert({
      workflow_id: input.workflow_id,
      name: input.name,
      description: input.description,
      schedule: input.schedule,
      status: 'active',
      error_count: 0,
      config: input.config ? JSON.parse(JSON.stringify(input.config)) as Json : {},
      metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) as Json : {}
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateScheduleStatus(id: string, status: 'active' | 'paused' | 'error') {
  const { data, error } = await supabase
    .from('scheduled_workflows')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSchedule(id: string) {
  const { error } = await supabase
    .from('scheduled_workflows')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function executePendingWorkflows() {
  const { data: pendingExecutions } = await supabase
    .from('pending_workflow_executions')
    .select('*');

  return pendingExecutions;
}
