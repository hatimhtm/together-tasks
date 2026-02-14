-- ⚠️ RESET SCRIPT: This completely resets your database tables to ensure a clean start.
-- It avoids the "relation already exists" error.

-- 1. CLEANUP (Drop existing tables/triggers to start fresh)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists public.categories cascade;
drop table if exists public.tasks cascade;
drop table if exists public.profiles cascade;

-- 2. SETUP EXTENSIONS
create extension if not exists "uuid-ossp";

-- 3. CREATE TABLES

-- Profiles Table
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  phone text,
  username text,
  role text check (role in ('queen', 'king')),
  theme text default 'system',
  ai_personality text default 'sage',
  goals text,
  schedule_habits text,
  has_completed_onboarding boolean default false,
  xp integer default 0,
  level integer default 1,
  avatar_url text,
  partner_id uuid references public.profiles(id),
  current_location_context text,
  last_location_update timestamptz,
  created_at timestamptz default now()
);

-- Enable RLS for Profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

create policy "Users can insert their own profile"
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

-- Tasks Table
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid references public.profiles(id) not null,
  assignee_id uuid references public.profiles(id),
  title text not null,
  description text,
  due_date timestamptz,
  is_completed boolean default false,
  completed_at timestamptz,
  category_id uuid, -- We'll add categories table later if needed detailed
  priority text check (priority in ('low', 'medium', 'high', 'urgent')),
  recurrence_rule text,
  is_private boolean default false,
  scope text default 'shared',
  created_at timestamptz default now()
);

-- Enable RLS for Tasks
alter table public.tasks enable row level security;

-- Policy: Users can see tasks created by them OR their partner
create policy "Users can view shared tasks"
  on tasks for select
  using (
    auth.uid() = creator_id OR 
    auth.uid() = assignee_id OR
    (is_private = false AND exists (
      select 1 from profiles 
      where id = auth.uid() 
      and partner_id = tasks.creator_id
    ))
  );

create policy "Users can insert tasks"
  on tasks for insert
  with check ( auth.uid() = creator_id );

create policy "Users can update tasks"
  on tasks for update
  using (
    auth.uid() = creator_id OR 
    auth.uid() = assignee_id OR
    (is_private = false AND exists (
      select 1 from profiles 
      where id = auth.uid() 
      and partner_id = tasks.creator_id
    ))
  );

create policy "Users can delete own tasks"
  on tasks for delete
  using ( auth.uid() = creator_id );

-- Categories Table (Simple)
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  color text,
  icon text,
  user_id uuid references public.profiles(id), -- null means system category
  created_at timestamptz default now()
);

alter table public.categories enable row level security;

create policy "View categories"
  on categories for select
  using ( user_id is null OR user_id = auth.uid() );

create policy "Manage own categories"
  on categories for all
  using ( user_id = auth.uid() );

-- 4. AUTH & SECURITY LOGIC

create or replace function public.handle_new_user()
returns trigger as $$
declare
  user_role text;
begin
  -- Validate Email
  if new.email not in ('hatimhtm2003@gmail.com', 'queen@example.com') then
    raise exception 'Access Denied: This app is restricted.';
  end if;

  -- Assign Role
  if new.email = 'hatimhtm2003@gmail.com' then
    user_role := 'king';
  elsif new.email = 'queen@example.com' then
    user_role := 'queen';
  end if;

  insert into public.profiles (id, email, phone, role, xp, level, has_completed_onboarding)
  values (new.id, new.email, new.raw_user_meta_data->>'phone', user_role, 0, 1, false);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
