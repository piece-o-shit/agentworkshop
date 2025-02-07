-- Create enum for workflow execution status
create type workflow_execution_status as enum ('pending', 'running', 'completed', 'error');

-- Create table for workflow execution logs
create table workflow_execution_logs (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid references workflows(id) on delete cascade,
  step integer,
  status workflow_execution_status not null,
  result jsonb,
  error text,
  execution_time timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  metadata jsonb default '{}'::jsonb
);

-- Add indexes for better query performance
create index idx_workflow_execution_logs_workflow_id on workflow_execution_logs(workflow_id);
create index idx_workflow_execution_logs_status on workflow_execution_logs(status);
create index idx_workflow_execution_logs_execution_time on workflow_execution_logs(execution_time);

-- Add RLS policies
alter table workflow_execution_logs enable row level security;

create policy "Users can view their own workflow logs"
  on workflow_execution_logs for select
  using (
    exists (
      select 1 from workflows
      where workflows.id = workflow_execution_logs.workflow_id
      and workflows.created_by = auth.uid()
    )
  );

create policy "Users can insert their own workflow logs"
  on workflow_execution_logs for insert
  with check (
    exists (
      select 1 from workflows
      where workflows.id = workflow_execution_logs.workflow_id
      and workflows.created_by = auth.uid()
    )
  );

-- Create view for pending workflow executions with more details
create or replace view pending_workflow_executions as
select
  sw.id,
  sw.workflow_id,
  sw.name,
  sw.next_run,
  sw.config,
  w.steps,
  w.created_by
from scheduled_workflows sw
join workflows w on w.id = sw.workflow_id
where
  sw.status = 'active'
  and sw.next_run <= now()
  and sw.error_count < coalesce((sw.config->>'max_retries')::int, 3);

-- Add function to update next_run based on cron schedule
create or replace function update_next_run_from_cron(schedule text, last_run timestamp with time zone)
returns timestamp with time zone
language plpgsql
as $$
declare
  next_run timestamp with time zone;
begin
  -- This is a simplified version. In production, you'd want to implement proper cron parsing
  -- For now, we'll just add an hour to the last run time
  next_run := last_run + interval '1 hour';
  return next_run;
end;
$$;

-- Add trigger to automatically update next_run after execution
create or replace function update_schedule_after_execution()
returns trigger
language plpgsql
as $$
begin
  update scheduled_workflows
  set next_run = update_next_run_from_cron(schedule, new.execution_time)
  where id = new.workflow_id
  and status = 'active';
  return new;
end;
$$;

create trigger trigger_update_schedule_after_execution
  after insert on workflow_execution_logs
  for each row
  when (new.status = 'completed')
  execute function update_schedule_after_execution();
