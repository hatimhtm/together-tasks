-- Add notification preference fields to profiles
-- These power the morning briefing, weekly review, and settings prompt

alter table public.profiles
    add column if not exists briefing_time time default '08:00',
    add column if not exists briefing_enabled boolean default false,
    add column if not exists weekly_review_enabled boolean default true,
    add column if not exists notification_prefs_set boolean default false;

-- notification_prefs_set: false = user hasn't been prompted yet, triggers the settings prompt
