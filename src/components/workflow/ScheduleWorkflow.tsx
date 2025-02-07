import { useState } from 'react';
import { useScheduler } from '@/hooks/use-scheduler';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Calendar, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tables } from '@/integrations/supabase/types';

const scheduleFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  schedule: z.string().min(1, 'Schedule is required'),
  config: z.object({
    max_retries: z.number().min(0).max(10).optional(),
    timeout: z.number().min(0).max(3600).optional(),
    notifications: z.boolean().optional()
  }).optional()
});

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

interface ScheduleWorkflowProps {
  workflowId: string;
}

export function ScheduleWorkflow({ workflowId }: ScheduleWorkflowProps) {
  const {
    schedules,
    isLoading,
    createSchedule,
    updateStatus,
    deleteSchedule,
    isCreating,
    isUpdating,
    isDeleting
  } = useScheduler();

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      name: '',
      description: '',
      schedule: '0 * * * *', // Default to hourly
      config: {
        max_retries: 3,
        timeout: 300,
        notifications: true
      }
    }
  });

  const onSubmit = async (data: ScheduleFormValues) => {
    await createSchedule({
      workflow_id: workflowId,
      name: data.name,
      description: data.description,
      schedule: data.schedule,
      config: data.config || {
        max_retries: 3,
        timeout: 300,
        notifications: true
      }
    });
    form.reset();
  };

  const workflowSchedules = schedules?.filter(
    schedule => schedule.workflow_id === workflowId
  ) || [];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Schedule Workflow</h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Schedule Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Daily Execution" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Schedule description..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="schedule"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cron Schedule</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="0 * * * *" />
                  </FormControl>
                  <FormDescription>
                    Cron expression (e.g., "0 * * * *" for hourly)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <h4 className="font-medium">Configuration</h4>
              
              <FormField
                control={form.control}
                name="config.max_retries"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Retries</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="config.timeout"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timeout (seconds)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="config.notifications"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel>Enable Notifications</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Schedule'
              )}
            </Button>
          </form>
        </Form>
      </Card>

      {workflowSchedules.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Active Schedules</h3>
          <div className="space-y-4">
            {workflowSchedules.map((schedule) => (
              <Card key={schedule.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{schedule.name}</h4>
                    {schedule.description && (
                      <p className="text-sm text-gray-500">{schedule.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">{schedule.schedule}</span>
                    </div>
                    {schedule.last_run && (
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">
                          Last run: {new Date(schedule.last_run).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={schedule.status === 'active' ? 'default' : 'secondary'}>
                      {schedule.status}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateStatus({
                        id: schedule.id,
                        status: schedule.status === 'active' ? 'paused' : 'active'
                      })}
                      disabled={isUpdating}
                    >
                      {schedule.status === 'active' ? 'Pause' : 'Resume'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteSchedule(schedule.id)}
                      disabled={isDeleting}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                {schedule.error_count > 0 && (
                  <div className="mt-4 p-4 bg-red-50 rounded-md">
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Error Count: {schedule.error_count}
                      </span>
                    </div>
                    {schedule.last_error && (
                      <p className="mt-1 text-sm text-red-500">
                        {schedule.last_error}
                      </p>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
