-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavior_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interaction_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Helper function to check user role
-- =============================================

CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_vendor()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('vendor', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================
-- USERS Policies
-- =============================================

-- Users can view their own record
CREATE POLICY "Users can view own record"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (public.is_admin());

-- Users can update their own record (limited fields via API)
CREATE POLICY "Users can update own record"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can update any user
CREATE POLICY "Admins can update any user"
  ON public.users FOR UPDATE
  USING (public.is_admin());

-- =============================================
-- PLAYER PROFILES Policies
-- =============================================

-- Anyone authenticated can view profiles
CREATE POLICY "Authenticated users can view profiles"
  ON public.player_profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can create own profile"
  ON public.player_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.player_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
  ON public.player_profiles FOR UPDATE
  USING (public.is_admin());

-- =============================================
-- BEHAVIOR METRICS Policies
-- =============================================

-- Anyone authenticated can view behavior metrics
CREATE POLICY "Authenticated users can view behavior metrics"
  ON public.behavior_metrics FOR SELECT
  TO authenticated
  USING (true);

-- System updates metrics (via service role)
CREATE POLICY "Admins can update behavior metrics"
  ON public.behavior_metrics FOR UPDATE
  USING (public.is_admin());

-- =============================================
-- SPORTS Policies
-- =============================================

-- Everyone can view active sports
CREATE POLICY "Anyone can view active sports"
  ON public.sports FOR SELECT
  USING (is_active = true);

-- Admins can view all sports
CREATE POLICY "Admins can view all sports"
  ON public.sports FOR SELECT
  USING (public.is_admin());

-- Admins can manage sports
CREATE POLICY "Admins can insert sports"
  ON public.sports FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update sports"
  ON public.sports FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete sports"
  ON public.sports FOR DELETE
  USING (public.is_admin());

-- =============================================
-- PLAYER SPORTS Policies
-- =============================================

-- Anyone authenticated can view player sports
CREATE POLICY "Authenticated users can view player sports"
  ON public.player_sports FOR SELECT
  TO authenticated
  USING (true);

-- Users can manage their own sport preferences
CREATE POLICY "Users can insert own player sports"
  ON public.player_sports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own player sports"
  ON public.player_sports FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own player sports"
  ON public.player_sports FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- VENUES Policies
-- =============================================

-- Everyone can view active venues
CREATE POLICY "Anyone can view active venues"
  ON public.venues FOR SELECT
  USING (is_active = true);

-- Admins can view all venues
CREATE POLICY "Admins can view all venues"
  ON public.venues FOR SELECT
  USING (public.is_admin());

-- Vendors can view their own venues
CREATE POLICY "Vendors can view own venues"
  ON public.venues FOR SELECT
  USING (vendor_id = auth.uid());

-- Vendors can create venues
CREATE POLICY "Vendors can create venues"
  ON public.venues FOR INSERT
  TO authenticated
  WITH CHECK (public.is_vendor() AND vendor_id = auth.uid());

-- Admins can create venues
CREATE POLICY "Admins can create venues"
  ON public.venues FOR INSERT
  WITH CHECK (public.is_admin());

-- Vendors can update their own venues
CREATE POLICY "Vendors can update own venues"
  ON public.venues FOR UPDATE
  USING (vendor_id = auth.uid())
  WITH CHECK (vendor_id = auth.uid());

-- Admins can update any venue
CREATE POLICY "Admins can update any venue"
  ON public.venues FOR UPDATE
  USING (public.is_admin());

-- Admins can delete venues
CREATE POLICY "Admins can delete venues"
  ON public.venues FOR DELETE
  USING (public.is_admin());

-- =============================================
-- COURTS Policies
-- =============================================

-- Everyone can view courts of active venues
CREATE POLICY "Anyone can view courts"
  ON public.courts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.venues 
      WHERE venues.id = courts.venue_id AND venues.is_active = true
    )
  );

-- Admins can view all courts
CREATE POLICY "Admins can view all courts"
  ON public.courts FOR SELECT
  USING (public.is_admin());

-- Vendors can manage courts of their venues
CREATE POLICY "Vendors can insert courts"
  ON public.courts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.venues 
      WHERE venues.id = venue_id AND venues.vendor_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can update own courts"
  ON public.courts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.venues 
      WHERE venues.id = venue_id AND venues.vendor_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can delete own courts"
  ON public.courts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.venues 
      WHERE venues.id = venue_id AND venues.vendor_id = auth.uid()
    )
  );

-- Admins can manage any court
CREATE POLICY "Admins can insert any court"
  ON public.courts FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update any court"
  ON public.courts FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete any court"
  ON public.courts FOR DELETE
  USING (public.is_admin());

-- =============================================
-- BANK ACCOUNTS Policies
-- =============================================

-- Authenticated users can view active bank accounts
CREATE POLICY "Users can view active bank accounts"
  ON public.bank_accounts FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admins can manage bank accounts
CREATE POLICY "Admins can view all bank accounts"
  ON public.bank_accounts FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert bank accounts"
  ON public.bank_accounts FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update bank accounts"
  ON public.bank_accounts FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete bank accounts"
  ON public.bank_accounts FOR DELETE
  USING (public.is_admin());

-- =============================================
-- MATCHMAKING QUEUE Policies
-- =============================================

-- Users can view queue entries for matching
CREATE POLICY "Users can view waiting queue entries"
  ON public.matchmaking_queue FOR SELECT
  TO authenticated
  USING (status = 'waiting');

-- Users can manage their own queue entries
CREATE POLICY "Users can insert own queue entry"
  ON public.matchmaking_queue FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own queue entry"
  ON public.matchmaking_queue FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own queue entry"
  ON public.matchmaking_queue FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- MATCHES Policies
-- =============================================

-- Users can view matches they're part of
CREATE POLICY "Users can view own matches"
  ON public.matches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.match_players 
      WHERE match_players.match_id = matches.id AND match_players.user_id = auth.uid()
    )
    OR created_by = auth.uid()
  );

-- Admins can view all matches
CREATE POLICY "Admins can view all matches"
  ON public.matches FOR SELECT
  USING (public.is_admin());

-- Users can create matches
CREATE POLICY "Users can create matches"
  ON public.matches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Match participants can update match status
CREATE POLICY "Participants can update matches"
  ON public.matches FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.match_players 
      WHERE match_players.match_id = matches.id AND match_players.user_id = auth.uid()
    )
  );

-- Admins can update any match
CREATE POLICY "Admins can update any match"
  ON public.matches FOR UPDATE
  USING (public.is_admin());

-- =============================================
-- MATCH PLAYERS Policies
-- =============================================

-- Users can view match players for their matches
CREATE POLICY "Users can view match players"
  ON public.match_players FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.matches 
      WHERE matches.id = match_players.match_id
      AND (
        EXISTS (
          SELECT 1 FROM public.match_players mp2 
          WHERE mp2.match_id = matches.id AND mp2.user_id = auth.uid()
        )
        OR matches.created_by = auth.uid()
      )
    )
  );

-- Admins can view all
CREATE POLICY "Admins can view all match players"
  ON public.match_players FOR SELECT
  USING (public.is_admin());

-- System/creators can insert match players
CREATE POLICY "Users can insert match players"
  ON public.match_players FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can update their own confirmation
CREATE POLICY "Users can update own match player record"
  ON public.match_players FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- BOOKINGS Policies
-- =============================================

-- Users can view their own bookings
CREATE POLICY "Users can view own bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Vendors can view bookings for their venues
CREATE POLICY "Vendors can view venue bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courts c
      JOIN public.venues v ON v.id = c.venue_id
      WHERE c.id = bookings.court_id AND v.vendor_id = auth.uid()
    )
  );

-- Admins can view all bookings
CREATE POLICY "Admins can view all bookings"
  ON public.bookings FOR SELECT
  USING (public.is_admin());

-- Users can create bookings
CREATE POLICY "Users can create bookings"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own bookings
CREATE POLICY "Users can update own bookings"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can update any booking
CREATE POLICY "Admins can update any booking"
  ON public.bookings FOR UPDATE
  USING (public.is_admin());

-- =============================================
-- PAYMENTS Policies
-- =============================================

-- Users can view payments for their bookings
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = payments.booking_id AND bookings.user_id = auth.uid()
    )
  );

-- Admins can view all payments
CREATE POLICY "Admins can view all payments"
  ON public.payments FOR SELECT
  USING (public.is_admin());

-- Users can create payments for their bookings
CREATE POLICY "Users can create payments"
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = booking_id AND bookings.user_id = auth.uid()
    )
  );

-- Users can update their own payments (submit screenshot)
CREATE POLICY "Users can update own payments"
  ON public.payments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = booking_id AND bookings.user_id = auth.uid()
    )
  );

-- Admins can update any payment (verify)
CREATE POLICY "Admins can update any payment"
  ON public.payments FOR UPDATE
  USING (public.is_admin());

-- =============================================
-- CHAT ROOMS Policies
-- =============================================

-- Users can view chat rooms they're part of
CREATE POLICY "Users can view own chat rooms"
  ON public.chat_rooms FOR SELECT
  TO authenticated
  USING (
    (match_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.match_players 
      WHERE match_players.match_id = chat_rooms.match_id AND match_players.user_id = auth.uid()
    ))
    OR
    (booking_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = chat_rooms.booking_id AND bookings.user_id = auth.uid()
    ))
  );

-- System creates chat rooms
CREATE POLICY "Authenticated users can create chat rooms"
  ON public.chat_rooms FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =============================================
-- CHAT MESSAGES Policies
-- =============================================

-- Users can view messages in their chat rooms
CREATE POLICY "Users can view messages in own rooms"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      WHERE cr.id = chat_messages.room_id
      AND (
        (cr.match_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.match_players 
          WHERE match_players.match_id = cr.match_id AND match_players.user_id = auth.uid()
        ))
        OR
        (cr.booking_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.bookings 
          WHERE bookings.id = cr.booking_id AND bookings.user_id = auth.uid()
        ))
      )
    )
  );

-- Users can send messages to their rooms
CREATE POLICY "Users can insert messages"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      WHERE cr.id = room_id
      AND (
        (cr.match_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.match_players 
          WHERE match_players.match_id = cr.match_id AND match_players.user_id = auth.uid()
        ))
        OR
        (cr.booking_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.bookings 
          WHERE bookings.id = cr.booking_id AND bookings.user_id = auth.uid()
        ))
      )
    )
  );

-- =============================================
-- MATCH FEEDBACK Policies
-- =============================================

-- Users can view feedback they gave or received
CREATE POLICY "Users can view own feedback"
  ON public.match_feedback FOR SELECT
  TO authenticated
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback"
  ON public.match_feedback FOR SELECT
  USING (public.is_admin());

-- Users can submit feedback
CREATE POLICY "Users can submit feedback"
  ON public.match_feedback FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = from_user_id
    AND EXISTS (
      SELECT 1 FROM public.match_players 
      WHERE match_players.match_id = match_feedback.match_id 
      AND match_players.user_id = auth.uid()
    )
  );

-- =============================================
-- REPORTS Policies
-- =============================================

-- Users can view reports they submitted
CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT
  TO authenticated
  USING (reported_by = auth.uid());

-- Admins can view all reports
CREATE POLICY "Admins can view all reports"
  ON public.reports FOR SELECT
  USING (public.is_admin());

-- Users can submit reports
CREATE POLICY "Users can submit reports"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reported_by);

-- Admins can update reports
CREATE POLICY "Admins can update reports"
  ON public.reports FOR UPDATE
  USING (public.is_admin());

-- =============================================
-- USER PENALTIES Policies
-- =============================================

-- Users can view their own penalties
CREATE POLICY "Users can view own penalties"
  ON public.user_penalties FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can manage penalties
CREATE POLICY "Admins can view all penalties"
  ON public.user_penalties FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can create penalties"
  ON public.user_penalties FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update penalties"
  ON public.user_penalties FOR UPDATE
  USING (public.is_admin());

-- =============================================
-- ANALYTICS Policies (Insert-only for tracking)
-- =============================================

-- Anyone can insert analytics (for tracking)
CREATE POLICY "Anyone can insert visitor analytics"
  ON public.visitor_analytics FOR INSERT
  WITH CHECK (true);

-- Admins can view analytics
CREATE POLICY "Admins can view visitor analytics"
  ON public.visitor_analytics FOR SELECT
  USING (public.is_admin());

-- Anyone can insert interaction events
CREATE POLICY "Anyone can insert interaction events"
  ON public.interaction_events FOR INSERT
  WITH CHECK (true);

-- Admins can view interaction events
CREATE POLICY "Admins can view interaction events"
  ON public.interaction_events FOR SELECT
  USING (public.is_admin());

-- =============================================
-- SYSTEM CONFIG Policies
-- =============================================

-- Authenticated users can view config
CREATE POLICY "Authenticated users can view config"
  ON public.system_config FOR SELECT
  TO authenticated
  USING (true);

-- Admins can manage config
CREATE POLICY "Admins can insert config"
  ON public.system_config FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update config"
  ON public.system_config FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete config"
  ON public.system_config FOR DELETE
  USING (public.is_admin());
