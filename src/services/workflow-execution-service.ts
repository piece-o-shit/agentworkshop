
import { supabase } from '@/integrations/supabase/client';
import { WorkflowExecutionLog } from '@/types/workflow-execution';
import { Json } from '@/integrations/supabase/types';

export async function logWorkflowExecution(log: WorkflowExecutionLog) {
  const { error } = await supabase
    .from('workflow_execution_logs')
    .insert({
      workflow_id: log.workflow_id,
      status: log.status,
      result: log.result ? JSON.parse(JSON.stringify(log.result)) as Json : null,
      error: log.error,
      execution_time: log.execution_time,
      step: typeof log.step === 'object' ? log.step.id : log.step
    });

  if (error) throw error;
}

export async function updateWorkflowError(scheduleId: string, errorMessage: string) {
  const { data } = await supabase
    .rpc('increment_error_count', { schedule_id: scheduleId })
    .single();

  const updatedCount = data as { error_count: number };
  
  const { error } = await supabase
    .from('scheduled_workflows')
    .update({
      error_count: updatedCount.error_count,
      last_error: errorMessage
    })
    .eq('id', scheduleId);

  if (error) throw error;
  return updatedCount;
}
