-- Function to safely increment error count
create or replace function increment_error_count(schedule_id uuid)
returns table (error_count integer)
language plpgsql
security definer
as $$
declare
  current_count integer;
begin
  -- Get current error count
  select coalesce(sw.error_count, 0)
  into current_count
  from scheduled_workflows sw
  where sw.id = schedule_id;

  -- Increment count
  update scheduled_workflows
  set error_count = current_count + 1
  where id = schedule_id;

  -- Return new count
  return query
  select error_count
  from scheduled_workflows
  where id = schedule_id;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function increment_error_count(uuid) to authenticated;

-- Add comment for documentation
comment on function increment_error_count(uuid) is 'Safely increments the error count for a scheduled workflow and returns the new count';

-- Create function to reset error count
create or replace function reset_error_count(schedule_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update scheduled_workflows
  set 
    error_count = 0,
    last_error = null
  where id = schedule_id;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function reset_error_count(uuid) to authenticated;

-- Add comment for documentation
comment on function reset_error_count(uuid) is 'Resets the error count and last error for a scheduled workflow';

-- Create function to check if max retries exceeded
create or replace function has_exceeded_max_retries(schedule_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  max_retries integer;
  current_count integer;
begin
  -- Get max retries from config and current count
  select 
    coalesce((sw.config->>'max_retries')::integer, 3),
    coalesce(sw.error_count, 0)
  into max_retries, current_count
  from scheduled_workflows sw
  where sw.id = schedule_id;

  -- Return true if current count exceeds max retries
  return current_count >= max_retries;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function has_exceeded_max_retries(uuid) to authenticated;

-- Add comment for documentation
comment on function has_exceeded_max_retries(uuid) is 'Checks if a scheduled workflow has exceeded its maximum retry attempts';

-- Create trigger function to handle max retries
create or replace function handle_max_retries()
returns trigger
language plpgsql
as $$
begin
  -- Check if max retries exceeded after update
  if has_exceeded_max_retries(new.id) then
    -- Update status to error
    update scheduled_workflows
    set status = 'error'
    where id = new.id;
  end if;
  return new;
end;
$$;

-- Create trigger to automatically check max retries after error count update
create trigger check_max_retries_after_update
  after update of error_count on scheduled_workflows
  for each row
  when (new.error_count > old.error_count)
  execute function handle_max_retries();
