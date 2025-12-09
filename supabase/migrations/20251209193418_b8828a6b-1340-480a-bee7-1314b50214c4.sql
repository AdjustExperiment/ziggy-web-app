-- Debate clubs/organizations that users can belong to
CREATE TABLE debate_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  school_organization TEXT,
  description TEXT,
  logo_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team membership linking users to debate teams
CREATE TABLE team_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES debate_teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(team_id, user_id)
);

-- Team practice sessions and internal events
CREATE TABLE team_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES debate_teams(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'practice',
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  location TEXT,
  is_virtual BOOLEAN DEFAULT FALSE,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team achievements from actual tournament results
CREATE TABLE team_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES debate_teams(id) ON DELETE CASCADE NOT NULL,
  tournament_id UUID REFERENCES tournaments(id),
  registration_id UUID REFERENCES tournament_registrations(id),
  achievement_type TEXT NOT NULL DEFAULT 'participation',
  position TEXT,
  prize_amount NUMERIC,
  achieved_at DATE,
  members JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add team_id reference to tournament_registrations (optional link)
ALTER TABLE tournament_registrations ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES debate_teams(id);

-- Enable RLS on all tables
ALTER TABLE debate_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for debate_teams
CREATE POLICY "Anyone can view teams" ON debate_teams FOR SELECT USING (true);
CREATE POLICY "Admins can manage all teams" ON debate_teams FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Users can create teams" ON debate_teams FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Team creators can update their teams" ON debate_teams FOR UPDATE 
  USING (auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM team_memberships tm 
    WHERE tm.team_id = debate_teams.id 
    AND tm.user_id = auth.uid() 
    AND tm.role IN ('captain', 'coach')
  ));

-- RLS Policies for team_memberships
CREATE POLICY "Anyone can view team memberships" ON team_memberships FOR SELECT USING (true);
CREATE POLICY "Admins can manage all memberships" ON team_memberships FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Team captains/coaches can manage memberships" ON team_memberships FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM team_memberships tm 
    WHERE tm.team_id = team_memberships.team_id 
    AND tm.user_id = auth.uid() 
    AND tm.role IN ('captain', 'coach')
  ));
CREATE POLICY "Users can join teams" ON team_memberships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave teams" ON team_memberships FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for team_events
CREATE POLICY "Team members can view events" ON team_events FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM team_memberships tm 
    WHERE tm.team_id = team_events.team_id 
    AND tm.user_id = auth.uid()
  ) OR is_admin());
CREATE POLICY "Admins can manage all events" ON team_events FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Team captains/coaches can manage events" ON team_events FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM team_memberships tm 
    WHERE tm.team_id = team_events.team_id 
    AND tm.user_id = auth.uid() 
    AND tm.role IN ('captain', 'coach')
  ));

-- RLS Policies for team_achievements
CREATE POLICY "Anyone can view achievements" ON team_achievements FOR SELECT USING (true);
CREATE POLICY "Admins can manage achievements" ON team_achievements FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Create indexes
CREATE INDEX idx_team_memberships_team ON team_memberships(team_id);
CREATE INDEX idx_team_memberships_user ON team_memberships(user_id);
CREATE INDEX idx_team_events_team ON team_events(team_id);
CREATE INDEX idx_team_events_date ON team_events(scheduled_date);
CREATE INDEX idx_team_achievements_team ON team_achievements(team_id);
CREATE INDEX idx_registrations_team ON tournament_registrations(team_id);

-- Update trigger for debate_teams
CREATE TRIGGER update_debate_teams_updated_at
  BEFORE UPDATE ON debate_teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();