-- v2: Routines — repeatable shared habits, distinct from one-off tasks.
-- A routine is a recurring intention (e.g. "Morning walk together", "Pay rent"),
-- and completions live in a separate table keyed by (routine_id, user_id, date)
-- so each partner ticks their own day independently and the system can compute
-- streaks + fairness ratios.

create type cadence as enum ('daily', 'weekdays', 'weekends', 'weekly', 'custom');

create table public.routines (
    id              uuid primary key default uuid_generate_v4(),
    creator_id      uuid not null references public.profiles(id) on delete cascade,
    assignee_id     uuid references public.profiles(id) on delete set null,
    partner_id      uuid references public.profiles(id) on delete set null,
    title           text not null,
    description     text,
    cadence         cadence not null default 'daily',
    -- For 'weekly' or 'custom': 0 (Sun) .. 6 (Sat). NULL → cadence dictates it.
    days_of_week    smallint[],
    color           text default 'primary',
    icon            text default 'star',
    xp_reward       integer not null default 5,
    is_shared       boolean not null default true,
    archived_at     timestamptz,
    created_at      timestamptz not null default now()
);

create index routines_creator_idx  on public.routines (creator_id);
create index routines_partner_idx  on public.routines (partner_id);
create index routines_active_idx   on public.routines (archived_at) where archived_at is null;

alter table public.routines enable row level security;

create policy "routines: select shared or own"
  on public.routines for select
  using (
    auth.uid() = creator_id
    or auth.uid() = assignee_id
    or (
      is_shared = true
      and exists (
        select 1 from public.profiles
        where id = auth.uid()
          and (profiles.partner_id = routines.creator_id
               or routines.partner_id = auth.uid())
      )
    )
  );

create policy "routines: insert own"
  on public.routines for insert
  with check ( auth.uid() = creator_id );

create policy "routines: update own or partner-shared"
  on public.routines for update
  using (
    auth.uid() = creator_id
    or (is_shared = true and exists (
      select 1 from public.profiles
      where id = auth.uid() and profiles.partner_id = routines.creator_id
    ))
  );

create policy "routines: delete own"
  on public.routines for delete
  using ( auth.uid() = creator_id );

-- Completions — one row per (routine, user, day). Allows each partner to log
-- their own completion independently.
create table public.routine_completions (
    id              uuid primary key default uuid_generate_v4(),
    routine_id      uuid not null references public.routines(id) on delete cascade,
    user_id         uuid not null references public.profiles(id) on delete cascade,
    completed_on    date not null default current_date,
    created_at      timestamptz not null default now(),
    unique (routine_id, user_id, completed_on)
);

create index routine_completions_user_date_idx
  on public.routine_completions (user_id, completed_on);
create index routine_completions_routine_idx
  on public.routine_completions (routine_id);

alter table public.routine_completions enable row level security;

create policy "routine_completions: select for involved users"
  on public.routine_completions for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.routines r
      where r.id = routine_completions.routine_id
        and (
          auth.uid() = r.creator_id
          or auth.uid() = r.assignee_id
          or (r.is_shared = true and exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.partner_id = r.creator_id
          ))
        )
    )
  );

create policy "routine_completions: insert own"
  on public.routine_completions for insert
  with check ( auth.uid() = user_id );

create policy "routine_completions: delete own"
  on public.routine_completions for delete
  using ( auth.uid() = user_id );

-- Award XP on routine completion. Re-uses the existing increment_user_xp RPC
-- if it's installed (see 20260220000006_add_xp_function.sql); otherwise this
-- trigger silently does nothing.
create or replace function award_routine_xp()
returns trigger
language plpgsql
security definer
as $$
declare
    reward integer;
begin
    select xp_reward into reward from public.routines where id = new.routine_id;
    if reward is null then reward := 5; end if;

    begin
        perform public.increment_user_xp(new.user_id, reward);
    exception
        when undefined_function then
            update public.profiles
            set xp = coalesce(xp, 0) + reward
            where id = new.user_id;
    end;
    return new;
end;
$$;

create trigger trg_award_routine_xp
    after insert on public.routine_completions
    for each row execute function award_routine_xp();
