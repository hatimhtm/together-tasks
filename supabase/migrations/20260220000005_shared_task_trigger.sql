-- Function to automate the `is_completed` flag when the `completed_by` array has exactly two unique UUIDs in it.
CREATE OR REPLACE FUNCTION check_shared_task_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- If it's a shared task
    IF NEW.scope = 'shared' THEN
        -- If the array has 2 or more items, mark it physically completed
        IF array_length(NEW.completed_by, 1) >= 2 THEN
            NEW.is_completed := true;
            NEW.completed_at := now();
        ELSE
            NEW.is_completed := false;
            NEW.completed_at := null;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_shared_task_completion ON public.tasks;

CREATE TRIGGER trigger_check_shared_task_completion
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION check_shared_task_completion();
