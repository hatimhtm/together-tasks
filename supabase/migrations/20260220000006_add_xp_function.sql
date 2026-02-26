create or replace function add_xp(amount int)
returns void
language plpgsql
security definer
as $$
declare
  user_id uuid;
  current_xp int;
  new_xp int;
  new_level int;
begin
  -- Get user ID from auth
  user_id := auth.uid();

  if user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Get current XP
  select xp into current_xp
  from profiles
  where id = user_id;

  -- Calculate new values
  new_xp := coalesce(current_xp, 0) + amount;
  new_level := floor(new_xp / 100) + 1;

  -- Update profile
  update profiles
  set xp = new_xp,
      level = new_level
  where id = user_id;
end;
$$;
