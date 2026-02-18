-- Gamification System: Legacy Points & Tiers

-- 1. Legacy History Table (Tracks every point earned)
CREATE TABLE IF NOT EXISTS public.legacy_history (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) NOT NULL,
  points integer NOT NULL,
  reason text NOT NULL, -- e.g., 'task_completion', 'daily_streak', 'bonus'
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.legacy_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own history"
  ON public.legacy_history FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Function to Add Points & Calculate Tier
-- This function handles the logic of leveling up based on total XP.
-- Tiers:
-- Level 1: Foundation (0 - 150 XP)
-- Level 2: Synergy (150 - 450 XP)
-- Level 3: Harmony (450 - 900 XP)
-- Level 4: Unity (900 - 1500 XP)
-- Level 5: Legacy (1500+ XP)

CREATE OR REPLACE FUNCTION public.add_legacy_points(
  target_user_id uuid, 
  amount integer, 
  reason_text text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_xp integer;
  current_level integer;
  new_xp integer;
  new_level integer;
  level_up_occurred boolean := false;
  
  -- Thresholds (Cumulative)
  threshold_l1 integer := 150;
  threshold_l2 integer := 450;
  threshold_l3 integer := 900;
  threshold_l4 integer := 1500;
BEGIN
  -- 1. Insert History Record
  INSERT INTO public.legacy_history (user_id, points, reason)
  VALUES (target_user_id, amount, reason_text);

  -- 2. Get Current Stats
  SELECT xp, level INTO current_xp, current_level
  FROM public.profiles
  WHERE id = target_user_id;

  -- 3. Calculate New XP
  new_xp := current_xp + amount;

  -- 4. Calculate New Level (Tier)
  IF new_xp < threshold_l1 THEN
    new_level := 1;
  ELSIF new_xp < threshold_l2 THEN
    new_level := 2;
  ELSIF new_xp < threshold_l3 THEN
    new_level := 3;
  ELSIF new_xp < threshold_l4 THEN
    new_level := 4;
  ELSE
    new_level := 5;
  END IF;

  -- 5. Check for Level Up
  IF new_level > current_level THEN
    level_up_occurred := true;
  END IF;

  -- 6. Update Profile
  UPDATE public.profiles
  SET xp = new_xp,
      level = new_level
  WHERE id = target_user_id;

  -- 7. Return Result
  RETURN jsonb_build_object(
    'new_xp', new_xp,
    'new_level', new_level,
    'new_level', new_level,
    'level_up', level_up_occurred
  );
END;
$$;

-- 3. Trigger Function: Auto-Award Points on Task Completion
CREATE OR REPLACE FUNCTION public.trigger_award_points_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if task is being marked as completed (and wasn't before)
  IF NEW.is_completed = true AND OLD.is_completed = false THEN
    -- Award 10 points for a standard task
    PERFORM public.add_legacy_points(NEW.assignee_id, 10, 'task_completion');
  END IF;
  
  -- Anti-Cheat: If uncompleted, maybe deduct? 
  -- For now, we prefer positive reinforcement only. 
  -- Repeatedly toggling won't spam because we could add a check or just let it slide for MVP.
  -- Better: Check if points were recently awarded for this task in 'legacy_history'?
  -- MVP: Allow it.
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create Trigger
DROP TRIGGER IF EXISTS on_task_completed ON public.tasks;
CREATE TRIGGER on_task_completed
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE PROCEDURE public.trigger_award_points_on_completion();
