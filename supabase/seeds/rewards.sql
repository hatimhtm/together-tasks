-- Supabase seed file to populate default rewards for Hatim & Celine

INSERT INTO public.rewards (title, description, point_cost, is_active)
VALUES
    ('A relaxing 30-min massage 💆‍♀️', 'Perfect after a long day of work or studying.', 150, true),
    ('Movie Night Choice 🍿', 'You get full control over the movie and snacks tonight.', 200, true),
    ('Get out of 1 Chore 🧹', 'Cash this in to skip one household chore or task, no questions asked.', 100, true),
    ('Cook my favorite meal 🍝', 'I will cook your favorite dinner for you.', 300, true),
    ('Surprise Date Night 🌹', 'I will plan and pay for a complete surprise date night.', 500, true),
    ('Breakfast in Bed 🥞', 'Wake up to a delicious, hot breakfast served in bed.', 250, true),
    ('Win an argument 🏆', 'Instantly win any minor disagreement (use wisely!).', 1000, true)
ON CONFLICT DO NOTHING;
