-- Add streak and last_active_date columns to profiles
alter table public.profiles
add column if not exists streak integer default 0,
add column if not exists last_active_date timestamptz;

-- Function to handle streak updates
create or replace function public.handle_streak_update()
returns trigger as $$
declare
  user_last_active_date date;
  user_streak integer;
  current_user_id uuid;
begin
  -- Get the user ID (creator of the task)
  -- Since this is triggered by an update, we can use auth.uid() if the user is logged in,
  -- or we can use the creator_id from the task itself. Using auth.uid() rewards the person DOING the action.
  -- But usually, tasks are private or shared. Let's stick to auth.uid() as it's the actor.
  current_user_id := auth.uid();

  if current_user_id is null then
    return new;
  end if;

  select last_active_date::date, streak into user_last_active_date, user_streak
  from public.profiles
  where id = current_user_id;

  -- If no profile found (shouldn't happen for valid users), exit
  if not found then
    return new;
  end if;

  -- Logic
  if user_last_active_date is null or user_last_active_date < (current_date - 1) then
    -- Missed a day or first time
    update public.profiles
    set streak = 1,
        last_active_date = now()
    where id = current_user_id;
  elsif user_last_active_date = (current_date - 1) then
    -- Streak continues (yesterday was active)
    update public.profiles
    set streak = user_streak + 1,
        last_active_date = now()
    where id = current_user_id;
  else
    -- Already active today, just update timestamp
    update public.profiles
    set last_active_date = now()
    where id = current_user_id;
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger
drop trigger if exists on_task_complete on public.tasks;
create trigger on_task_complete
  after update on public.tasks
  for each row
  when (old.is_completed = false and new.is_completed = true)
  execute procedure public.handle_streak_update();
