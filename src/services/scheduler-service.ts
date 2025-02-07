
import { supabase } from '@/integrations/supabase/client';
import { ScheduledWorkflow, CreateScheduleInput, ScheduleStatus } from '@/types/scheduler';

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
    .insert([{
      ...input,
      status: 'active',
      error_count: 0,
      config: input.config || {},
      metadata: input.metadata || {}
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateScheduleStatus(id: string, status: ScheduleStatus) {
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
