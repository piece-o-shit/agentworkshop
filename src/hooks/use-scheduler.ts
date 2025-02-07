
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScheduledWorkflow, CreateScheduleInput, ScheduleStatus } from '@/types/scheduler';
import { useScheduleNotifications } from './use-schedule-notifications';
import {
  fetchScheduledWorkflows,
  createSchedule,
  updateScheduleStatus,
  deleteSchedule,
  executePendingWorkflows
} from '@/services/scheduler-service';

export function useScheduler() {
  const queryClient = useQueryClient();
  const notifications = useScheduleNotifications();

  // Fetch all scheduled workflows
  const {
    data: schedules,
    isLoading,
    error
  } = useQuery({
    queryKey: ['scheduled-workflows'],
    queryFn: fetchScheduledWorkflows
  });

  // Create new schedule
  const createScheduleMutation = useMutation({
    mutationFn: createSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-workflows'] });
      notifications.notifySuccess('Schedule Created', 'Workflow has been scheduled successfully');
    },
    onError: notifications.notifyError
  });

  // Update schedule status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ScheduleStatus }) => 
      updateScheduleStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-workflows'] });
      notifications.notifySuccess('Status Updated', 'Schedule status has been updated');
    },
    onError: notifications.notifyError
  });

  // Delete schedule
  const deleteScheduleMutation = useMutation({
    mutationFn: deleteSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-workflows'] });
      notifications.notifySuccess('Schedule Deleted', 'Schedule has been removed');
    },
    onError: notifications.notifyError
  });

  // Poll for pending executions
  useEffect(() => {
    const interval = setInterval(async () => {
      const pendingExecutions = await executePendingWorkflows();
      
      if (pendingExecutions?.length) {
        // Execute pending workflows
        for (const execution of pendingExecutions) {
          const event = new CustomEvent('workflow:execute', {
            detail: {
              workflowId: execution.workflow_id,
              config: execution.config
            }
          });
          window.dispatchEvent(event);
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return {
    schedules,
    isLoading,
    error,
    createSchedule: createScheduleMutation.mutate,
    updateStatus: updateStatusMutation.mutate,
    deleteSchedule: deleteScheduleMutation.mutate,
    isCreating: createScheduleMutation.isPending,
    isUpdating: updateStatusMutation.isPending,
    isDeleting: deleteScheduleMutation.isPending
  };
}
