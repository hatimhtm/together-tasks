-- Add push_subscriptions and rewards tables
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Ensure user can only read/write their own subscriptions
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own subscriptions" 
    ON public.push_subscriptions FOR ALL 
    USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.rewards (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    point_cost integer NOT NULL DEFAULT 100,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- Users can see their own rewards and their partner's rewards
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view relevant rewards" 
    ON public.rewards FOR SELECT 
    USING (
        auth.uid() = creator_id OR 
        creator_id IN (SELECT partner_id FROM public.profiles WHERE id = auth.uid()) OR
        auth.uid() IN (SELECT partner_id FROM public.profiles WHERE id = creator_id)
    );

CREATE POLICY "Users can insert their own rewards" 
    ON public.rewards FOR INSERT 
    WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own rewards" 
    ON public.rewards FOR UPDATE 
    USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own rewards" 
    ON public.rewards FOR DELETE 
    USING (auth.uid() = creator_id);
