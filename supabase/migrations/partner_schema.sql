-- Add partner linking table
CREATE TABLE IF NOT EXISTS partner_links (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user1_id uuid REFERENCES profiles(id) NOT NULL,
  user2_id uuid REFERENCES profiles(id) NOT NULL,
  link_code text UNIQUE,
  status text DEFAULT 'pending', -- pending, active
  created_at timestamptz DEFAULT now(),
  activated_at timestamptz,
  CONSTRAINT different_partners CHECK (user1_id != user2_id)
);

-- Partner notifications table (AI decides what to send)
CREATE TABLE IF NOT EXISTS partner_notifications (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  task_owner_id uuid REFERENCES profiles(id) NOT NULL,
  partner_id uuid REFERENCES profiles(id) NOT NULL,
  notification_type text, -- 'reminder', 'support', 'urgent', 'celebrate'
  ai_reasoning text, -- Why AI thinks partner should know
  message text, -- AI-generated message for partner
  sent_at timestamptz DEFAULT now(),
  read_at timestamptz,
  action_taken text, -- 'called', 'messaged', 'ignored', 'dismissed'
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_partner_links_users ON partner_links(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_partner_notifications_partner ON partner_notifications(partner_id, read_at);
CREATE INDEX IF NOT EXISTS idx_partner_notifications_task ON partner_notifications(task_id);

-- Enable RLS
ALTER TABLE partner_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their partner links"
  ON partner_links FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create partner links"
  ON partner_links FOR INSERT
  WITH CHECK (auth.uid() = user1_id);

CREATE POLICY "Partners can view notifications sent to them"
  ON partner_notifications FOR SELECT
  USING (auth.uid() = partner_id);

CREATE POLICY "System can insert notifications"
  ON partner_notifications FOR INSERT
  WITH CHECK (true);
