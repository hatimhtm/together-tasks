-- Add AI fields to tasks table
ALTER TABLE public.tasks 
ADD COLUMN emergency_level text CHECK (emergency_level IN ('low', 'medium', 'high', 'critical')),
ADD COLUMN importance_level text CHECK (importance_level IN ('low', 'medium', 'high', 'critical')),
ADD COLUMN duration_estimate integer,
ADD COLUMN subtasks jsonb DEFAULT '[]'::jsonb;
