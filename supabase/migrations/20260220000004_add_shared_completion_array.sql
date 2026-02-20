-- Migration to support Dual-Completion for Shared Tasks
ALTER TABLE public.tasks
ADD COLUMN completed_by uuid[] DEFAULT '{}'::uuid[];

-- Backfill: if a task is already completed, add the assignee and creator to the array to avoid data loss
UPDATE public.tasks
SET completed_by = ARRAY[creator_id, assignee_id]
WHERE is_completed = true;
