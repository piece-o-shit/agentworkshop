import { useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export type ScheduleStatus = 'active' | 'paused' | 'error';

export interface ScheduledWorkflow {
  id: string;
  workflow_id: string;
  name: string;
  description?: string;
  schedule: string;
  last_run?: string;
  next_run?: string;
  status: ScheduleStatus;
  config: {
    max_retries?: number;
    timeout?: number;
    notifications?: boolean;
  };
  error_count: number;
  last_error?: string;
  metadata: Record<string, unknown>;
}

export interface CreateScheduleInput {
  workflow_id: string;
  name: string;
  description?: string;
  schedule: string;
  config?: ScheduledWorkflow['config'];
  metadata?: Record<string, unknown>;
}

export function useScheduler() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all scheduled workflows
  const {
    data: schedules,
    isLoading,
    error
  } = useQuery({
    queryKey: ['scheduled-workflows'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_workflows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ScheduledWorkflow[];
    }
  });

  // Create new schedule
  const createSchedule = useMutation({
    mutationFn: async (input: CreateScheduleInput) => {
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-workflows'] });
      toast({
        title: 'Schedule Created',
        description: 'Workflow has been scheduled successfully'
      });
    },
    onError: (error) => {
      console.error('Failed to create schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to create schedule',
        variant: 'destructive'
      });
    }
  });

  // Update schedule status
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ScheduleStatus }) => {
      const { data, error } = await supabase
        .from('scheduled_workflows')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-workflows'] });
      toast({
        title: 'Status Updated',
        description: 'Schedule status has been updated'
      });
    },
    onError: (error) => {
      console.error('Failed to update status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update schedule status',
        variant: 'destructive'
      });
    }
  });

  // Delete schedule
  const deleteSchedule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('scheduled_workflows')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-workflows'] });
      toast({
        title: 'Schedule Deleted',
        description: 'Schedule has been removed'
      });
    },
    onError: (error) => {
      console.error('Failed to delete schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete schedule',
        variant: 'destructive'
      });
    }
  });

  // Poll for pending executions
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data: pendingExecutions } = await supabase
        .from('pending_workflow_executions')
        .select('*');

      if (pendingExecutions?.length) {
        // Execute pending workflows
        for (const execution of pendingExecutions) {
          try {
            // Update last_run and next_run
            await supabase
              .from('scheduled_workflows')
              .update({
                last_run: new Date().toISOString(),
                error_count: 0,
                last_error: null
              })
              .eq('id', execution.id);

            // Execute the workflow
            // This will be handled by the workflow execution system
            const event = new CustomEvent('workflow:execute', {
              detail: {
                workflowId: execution.workflow_id,
                config: execution.config
              }
            });
            window.dispatchEvent(event);
          } catch (error) {
            console.error('Failed to execute workflow:', error);
            await supabase
              .from('scheduled_workflows')
              .update({
                error_count: supabase.sql`error_count + 1`,
                last_error: error instanceof Error ? error.message : 'Unknown error'
              })
              .eq('id', execution.id);
          }
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return {
    schedules,
    isLoading,
    error,
    createSchedule: createSchedule.mutate,
    updateStatus: updateStatus.mutate,
    deleteSchedule: deleteSchedule.mutate,
    isCreating: createSchedule.isPending,
    isUpdating: updateStatus.isPending,
    isDeleting: deleteSchedule.isPending
  };
}
