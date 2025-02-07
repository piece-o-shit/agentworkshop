
import { supabase } from '@/integrations/supabase/client';
import { executeWorkflow } from '@/lib/langchain/workflow-graph';
import { Tables } from '@/integrations/supabase/types';
import type { Workflow, WorkflowStep } from '@/types/workflow';

interface IncrementErrorCountResponse {
  error_count: number;
}

interface WorkflowConfig {
  maxRetries?: number;
  timeout?: number;
  notifications?: boolean;
  [key: string]: unknown;
}

type ScheduledWorkflow = Tables<'scheduled_workflows'>;

class WorkflowScheduler {
  private checkInterval: number = 60000; // Check every minute
  private isRunning: boolean = false;
  private intervalId?: NodeJS.Timeout;

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    // Initial check
    await this.checkPendingExecutions();
    
    // Set up interval for subsequent checks
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

      for (const execution of pendingExecutions || []) {
        await this.executeWorkflow(execution);
      }
    } catch (error) {
      console.error('Error checking pending executions:', error);
    }
  }

  private async executeWorkflow(execution: Tables<'pending_workflow_executions'>) {
    try {
      // Create workflow object from execution data
      // Parse workflow steps from JSON
      const steps = (execution.steps as any[]).map(step => ({
        id: step.id as string,
        name: step.name as string,
        action: step.action as string,
        parameters: step.parameters as Record<string, unknown>
      }));

      const workflow: Workflow = {
        id: execution.workflow_id!,
        name: execution.name!,
        description: "Scheduled workflow execution",
        created_by: "scheduler",
        steps,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        config: execution.config as Record<string, unknown>
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

      // Execute the workflow with config from the schedule
      const result = await executeWorkflow(workflow, [], {
        ...(execution.config as WorkflowConfig),
        onStepComplete: async (step, result) => {
          // Log step completion
          const { error } = await supabase
            .from('workflow_execution_logs')
            .insert({
              workflow_id: workflow.id,
              step: step,
              status: 'completed',
              result: result,
              execution_time: new Date().toISOString()
            });
          
          if (error) throw error;
        },
        onError: async (error, step) => {
          // Log error
          const { error: insertError } = await supabase
            .from('workflow_execution_logs')
            .insert({
              workflow_id: workflow.id,
              step: step,
              status: 'error',
              error: error.message,
              execution_time: new Date().toISOString()
            });

          if (insertError) throw insertError;

          // Update error count using RPC function
          const { data } = await supabase
            .rpc('increment_error_count', { schedule_id: execution.id })
            .single();

          const updatedCount = data as IncrementErrorCountResponse;
          await supabase
            .from('scheduled_workflows')
            .update({
              error_count: updatedCount.error_count,
              last_error: error.message
            })
            .eq('id', execution.id);
        }
      });

      // Handle completion
      if (result.workflow_status === 'completed') {
        // Log successful completion
        const { error } = await supabase
          .from('workflow_execution_logs')
          .insert({
            workflow_id: workflow.id,
            status: 'completed',
            result: result,
            execution_time: new Date().toISOString()
          });
        
        if (error) throw error;
      }
    } catch (error) {
      console.error(`Error executing workflow ${execution.workflow_id}:`, error);
      
      // Update error status using RPC function
      const { data } = await supabase
        .rpc('increment_error_count', { schedule_id: execution.id })
        .single();

      const updatedCount = data as IncrementErrorCountResponse;
      await supabase
        .from('scheduled_workflows')
        .update({
          error_count: updatedCount.error_count,
          last_error: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', execution.id);
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
window.addEventListener('beforeunload', () => {
  workflowScheduler.stop();
});
