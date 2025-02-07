-- Create enum for workflow schedule status
create type workflow_schedule_status as enum ('active', 'paused', 'error');

-- Create table for scheduled workflows
create table scheduled_workflows (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid references workflows(id) on delete cascade,
  name text not null,
  description text,
  schedule text not null, -- cron expression
  last_run timestamp with time zone,
  next_run timestamp with time zone,
  status workflow_schedule_status default 'active',
  config jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  created_by uuid references auth.users(id),
  error_count int default 0,
  last_error text,
  metadata jsonb default '{}'::jsonb
);

-- Create index for efficient querying
create index idx_scheduled_workflows_next_run on scheduled_workflows(next_run)
where status = 'active';

-- Create function to update next_run timestamp
create or replace function calculate_next_run(schedule text, base_time timestamp with time zone)
returns timestamp with time zone
language plpgsql
as $$
declare
  next_run timestamp with time zone;
begin
  -- This is a placeholder. In production, you'd implement proper cron expression parsing
  -- For now, we'll use a simple interval-based approach
  next_run := base_time + interval '1 hour';
  return next_run;
end;
$$;

-- Create function to automatically update next_run
create or replace function update_next_run()
returns trigger
language plpgsql
as $$
begin
  new.next_run := calculate_next_run(new.schedule, coalesce(new.last_run, now()));
  return new;
end;
$$;

-- Create trigger to update next_run on insert or update
create trigger trigger_update_next_run
  before insert or update of schedule, last_run
  on scheduled_workflows
  for each row
  execute function update_next_run();

-- Create function to update updated_at timestamp
create or replace function update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Create trigger to update updated_at on any change
create trigger trigger_update_updated_at
  before update
  on scheduled_workflows
  for each row
  execute function update_updated_at();

-- Add RLS policies
alter table scheduled_workflows enable row level security;

create policy "Users can view their own scheduled workflows"
  on scheduled_workflows for select
  using (created_by = auth.uid());

create policy "Users can insert their own scheduled workflows"
  on scheduled_workflows for insert
  with check (created_by = auth.uid());

create policy "Users can update their own scheduled workflows"
  on scheduled_workflows for update
  using (created_by = auth.uid());

create policy "Users can delete their own scheduled workflows"
  on scheduled_workflows for delete
  using (created_by = auth.uid());

-- Create view for active workflows that need to be executed
create view pending_workflow_executions as
select
  id,
  workflow_id,
  name,
  next_run,
  config
from scheduled_workflows
where
  status = 'active'
  and next_run <= now()
  and error_count < coalesce((config->>'max_retries')::int, 3);
