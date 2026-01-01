-- Additional Database Functions (0005_additional_functions.sql)

-- Function to update ELO after match
CREATE OR REPLACE FUNCTION update_elo_after_match(
  p_match_id UUID,
  p_winner_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_player1_id UUID;
  v_player2_id UUID;
  v_player1_rating INTEGER;
  v_player2_rating INTEGER;
  v_k_factor INTEGER := 32;
  v_expected1 DECIMAL;
  v_expected2 DECIMAL;
  v_change1 INTEGER;
  v_change2 INTEGER;
BEGIN
  -- Get player IDs from match
  SELECT user_id INTO v_player1_id
  FROM match_players
  WHERE match_id = p_match_id
  LIMIT 1;
  
  SELECT user_id INTO v_player2_id
  FROM match_players
  WHERE match_id = p_match_id AND user_id != v_player1_id
  LIMIT 1;
  
  IF v_player1_id IS NULL OR v_player2_id IS NULL THEN
    RAISE EXCEPTION 'Match players not found';
  END IF;
  
  -- Get current ratings
  SELECT elo_rating INTO v_player1_rating
  FROM player_profiles WHERE user_id = v_player1_id;
  
  SELECT elo_rating INTO v_player2_rating
  FROM player_profiles WHERE user_id = v_player2_id;
  
  -- Calculate expected scores
  v_expected1 := 1.0 / (1.0 + POWER(10, (v_player2_rating - v_player1_rating) / 400.0));
  v_expected2 := 1.0 / (1.0 + POWER(10, (v_player1_rating - v_player2_rating) / 400.0));
  
  -- Calculate rating changes
  IF p_winner_id = v_player1_id THEN
    v_change1 := ROUND(v_k_factor * (1 - v_expected1));
    v_change2 := ROUND(v_k_factor * (0 - v_expected2));
  ELSE
    v_change1 := ROUND(v_k_factor * (0 - v_expected1));
    v_change2 := ROUND(v_k_factor * (1 - v_expected2));
  END IF;
  
  -- Update player 1
  UPDATE player_profiles
  SET 
    elo_rating = elo_rating + v_change1,
    wins = wins + CASE WHEN p_winner_id = v_player1_id THEN 1 ELSE 0 END,
    losses = losses + CASE WHEN p_winner_id != v_player1_id THEN 1 ELSE 0 END,
    updated_at = NOW()
  WHERE user_id = v_player1_id;
  
  -- Update player 2
  UPDATE player_profiles
  SET 
    elo_rating = elo_rating + v_change2,
    wins = wins + CASE WHEN p_winner_id = v_player2_id THEN 1 ELSE 0 END,
    losses = losses + CASE WHEN p_winner_id != v_player2_id THEN 1 ELSE 0 END,
    updated_at = NOW()
  WHERE user_id = v_player2_id;
  
  -- Update match with winner
  UPDATE matches
  SET 
    winner_id = p_winner_id,
    status = 'completed',
    updated_at = NOW()
  WHERE id = p_match_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update behavior metrics
CREATE OR REPLACE FUNCTION update_behavior_metrics(
  p_user_id UUID,
  p_tone INTEGER,
  p_aggressiveness INTEGER,
  p_sportsmanship INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE behavior_metrics
  SET 
    tone = (tone * feedback_count + p_tone) / (feedback_count + 1),
    aggressiveness = (aggressiveness * feedback_count + p_aggressiveness) / (feedback_count + 1),
    sportsmanship = (sportsmanship * feedback_count + p_sportsmanship) / (feedback_count + 1),
    overall_score = (
      (tone * feedback_count + p_tone) / (feedback_count + 1) +
      (sportsmanship * feedback_count + p_sportsmanship) / (feedback_count + 1)
    ) / 2,
    feedback_count = feedback_count + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create match_feedback table if not exists
CREATE TABLE IF NOT EXISTS public.match_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tone_rating INTEGER NOT NULL CHECK (tone_rating >= 1 AND tone_rating <= 5),
  aggressiveness_rating INTEGER NOT NULL CHECK (aggressiveness_rating >= 1 AND aggressiveness_rating <= 5),
  sportsmanship_rating INTEGER NOT NULL CHECK (sportsmanship_rating >= 1 AND sportsmanship_rating <= 5),
  comment TEXT,
  reported_winner UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create analytics tables if not exists
CREATE TABLE IF NOT EXISTS public.visitor_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  page TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.interaction_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  element_id TEXT,
  element_class TEXT,
  x INTEGER,
  y INTEGER,
  scroll_depth INTEGER,
  page TEXT NOT NULL,
  viewport_width INTEGER,
  viewport_height INTEGER,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create matchmaking_queue table if not exists
CREATE TABLE IF NOT EXISTS public.matchmaking_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sport_id UUID NOT NULL REFERENCES public.sports(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES public.venues(id) ON DELETE SET NULL,
  preferred_date DATE NOT NULL,
  preferred_time TEXT NOT NULL,
  gender_preference TEXT NOT NULL DEFAULT 'any',
  rating_tolerance INTEGER NOT NULL DEFAULT 200,
  status TEXT NOT NULL DEFAULT 'waiting',
  matched_with UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.match_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interaction_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for match_feedback
CREATE POLICY "Users can view their own feedback" ON public.match_feedback
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create feedback" ON public.match_feedback
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- RLS Policies for visitor_analytics (admin only read, anyone can write)
CREATE POLICY "Admins can view analytics" ON public.visitor_analytics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Anyone can log analytics" ON public.visitor_analytics
  FOR INSERT WITH CHECK (true);

-- RLS Policies for interaction_events
CREATE POLICY "Admins can view events" ON public.interaction_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Anyone can log events" ON public.interaction_events
  FOR INSERT WITH CHECK (true);

-- RLS Policies for matchmaking_queue
CREATE POLICY "Users can view their queue entries" ON public.matchmaking_queue
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can join queue" ON public.matchmaking_queue
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their queue entries" ON public.matchmaking_queue
  FOR UPDATE USING (auth.uid() = user_id);

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_match_feedback_match ON public.match_feedback(match_id);
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_session ON public.visitor_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_page ON public.visitor_analytics(page);
CREATE INDEX IF NOT EXISTS idx_interaction_events_session ON public.interaction_events(session_id);
CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_status ON public.matchmaking_queue(status);
CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_sport ON public.matchmaking_queue(sport_id);
