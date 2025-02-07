
import { supabase } from '@/integrations/supabase/client';
import { executeWorkflow } from '@/lib/langchain/workflow-graph';
import { PendingExecution, WorkflowExecutionConfig } from '@/types/workflow-execution';
import { Workflow, WorkflowStep } from '@/types/workflow';
import { logWorkflowExecution, updateWorkflowError } from '@/services/workflow-execution-service';
import { Json } from '@/integrations/supabase/types';

export class WorkflowScheduler {
  private checkInterval: number = 60000; // Check every minute
  private isRunning: boolean = false;
  private intervalId?: NodeJS.Timeout;

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    await this.checkPendingExecutions();
    this.intervalId = setInterval(
      () => this.checkPendingExecutions(),
      this.checkInterval
    );
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.isRunning = false;
  }

  private async checkPendingExecutions() {
    try {
      const { data: pendingExecutions, error } = await supabase
        .from('pending_workflow_executions')
        .select('*');

      if (error) throw error;

      for (const execution of (pendingExecutions || []) as PendingExecution[]) {
        await this.executeWorkflow(execution);
      }
    } catch (error) {
      console.error('Error checking pending executions:', error);
    }
  }

  private async executeWorkflow(execution: PendingExecution) {
    try {
      const { data: workflowData, error: workflowError } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', execution.workflow_id)
        .single();

      if (workflowError) throw workflowError;

      const workflow: Workflow = {
        id: execution.workflow_id,
        name: execution.name,
        description: "Scheduled workflow execution",
        created_by: "scheduler",
        // Convert JSON to typed WorkflowStep[] safely
        steps: JSON.parse(JSON.stringify(workflowData.steps)) as WorkflowStep[],
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        config: JSON.parse(JSON.stringify(execution.config)) as Record<string, unknown>
      };

      // Update last_run time
      await supabase
        .from('scheduled_workflows')
        .update({
          last_run: new Date().toISOString(),
          error_count: 0,
          last_error: null
        })
        .eq('id', execution.id);

      const config: WorkflowExecutionConfig = {
        ...(execution.config as WorkflowExecutionConfig),
        onStepComplete: async (step, result) => {
          await logWorkflowExecution({
            workflow_id: workflow.id,
            step: step.id,
            status: 'completed',
            result: JSON.parse(JSON.stringify(result)) as Json,
            execution_time: new Date().toISOString()
          });
        },
        onError: async (error, step) => {
          await logWorkflowExecution({
            workflow_id: workflow.id,
            step: step ? step.id : undefined,
            status: 'error',
            error: error.message,
            execution_time: new Date().toISOString()
          });

          const updatedCount = await updateWorkflowError(execution.id, error.message);
          console.log('Updated error count:', updatedCount);
        }
      };

      const result = await executeWorkflow(workflow, [], config);

      if (result.workflow_status === 'completed') {
        await logWorkflowExecution({
          workflow_id: workflow.id,
          status: 'completed',
          result: JSON.parse(JSON.stringify(result)) as Json,
          execution_time: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error(`Error executing workflow ${execution.workflow_id}:`, error);
      await updateWorkflowError(
        execution.id, 
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
}

// Create singleton instance
export const workflowScheduler = new WorkflowScheduler();

// Start scheduler when the app initializes
if (typeof window !== 'undefined') {
  workflowScheduler.start().catch(console.error);
}

// Clean up on app shutdown
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    workflowScheduler.stop();
  });
}
