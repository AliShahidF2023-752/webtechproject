-- =============================================
-- Sports Matchmaking App - Initial Database Schema
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- =============================================
-- ENUM Types
-- =============================================

CREATE TYPE user_role AS ENUM ('player', 'vendor', 'admin');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'any');
CREATE TYPE match_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'submitted', 'verified', 'rejected');
CREATE TYPE payment_method AS ENUM ('bank_transfer', 'on_site');
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');
CREATE TYPE penalty_type AS ENUM ('warning', 'rating_penalty', 'temp_ban', 'permanent_ban');
CREATE TYPE queue_status AS ENUM ('waiting', 'matched', 'expired', 'cancelled');

-- =============================================
-- Users Table (extends Supabase auth.users)
-- =============================================

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'player',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- Player Profiles
-- =============================================

CREATE TABLE public.player_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  gender gender_type NOT NULL DEFAULT 'any',
  age INTEGER CHECK (age >= 10 AND age <= 100),
  elo_rating INTEGER NOT NULL DEFAULT 1200,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  availability JSONB NOT NULL DEFAULT '[]'::jsonb,
  price_range_min INTEGER NOT NULL DEFAULT 0,
  price_range_max INTEGER NOT NULL DEFAULT 10000,
  whatsapp_number TEXT,
  instagram TEXT,
  is_profile_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- Behavior Metrics
-- =============================================

CREATE TABLE public.behavior_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  tone DECIMAL(3,2) NOT NULL DEFAULT 3.00 CHECK (tone >= 1 AND tone <= 5),
  aggressiveness DECIMAL(3,2) NOT NULL DEFAULT 3.00 CHECK (aggressiveness >= 1 AND aggressiveness <= 5),
  sportsmanship DECIMAL(3,2) NOT NULL DEFAULT 3.00 CHECK (sportsmanship >= 1 AND sportsmanship <= 5),
  total_ratings INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- Sports
-- =============================================

CREATE TABLE public.sports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  players_required INTEGER NOT NULL DEFAULT 2,
  icon TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- Player Sports (Sport-specific ELO)
-- =============================================

CREATE TABLE public.player_sports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sport_id UUID NOT NULL REFERENCES public.sports(id) ON DELETE CASCADE,
  elo_rating INTEGER NOT NULL DEFAULT 1200,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, sport_id)
);

-- =============================================
-- Venues
-- =============================================

CREATE TABLE public.venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  location_lat DECIMAL(10, 8) NOT NULL,
  location_lng DECIMAL(11, 8) NOT NULL,
  images TEXT[] NOT NULL DEFAULT '{}',
  rules TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  vendor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  commission_percentage DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- Courts / Tables
-- =============================================

CREATE TABLE public.courts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  sport_id UUID NOT NULL REFERENCES public.sports(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  hourly_rate INTEGER NOT NULL DEFAULT 500,
  capacity INTEGER NOT NULL DEFAULT 2,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- Bank Accounts (for payments)
-- =============================================

CREATE TABLE public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_title TEXT NOT NULL,
  iban TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- Matchmaking Queue
-- =============================================

CREATE TABLE public.matchmaking_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sport_id UUID NOT NULL REFERENCES public.sports(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES public.venues(id) ON DELETE SET NULL,
  preferred_time TEXT NOT NULL, -- HH:MM format
  preferred_date DATE NOT NULL,
  gender_preference gender_type NOT NULL DEFAULT 'any',
  rating_tolerance INTEGER NOT NULL DEFAULT 200,
  status queue_status NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '2 hours')
);

-- =============================================
-- Matches
-- =============================================

CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sport_id UUID NOT NULL REFERENCES public.sports(id) ON DELETE RESTRICT,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE RESTRICT,
  court_id UUID REFERENCES public.courts(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TEXT NOT NULL, -- HH:MM format
  status match_status NOT NULL DEFAULT 'pending',
  winner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- Match Players
-- =============================================

CREATE TABLE public.match_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  confirmed BOOLEAN NOT NULL DEFAULT false,
  rating_before INTEGER NOT NULL,
  rating_after INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(match_id, user_id)
);

-- =============================================
-- Bookings
-- =============================================

CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  court_id UUID NOT NULL REFERENCES public.courts(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  booking_date DATE NOT NULL,
  booking_time TEXT NOT NULL, -- HH:MM format
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  total_amount INTEGER NOT NULL,
  commission_amount INTEGER NOT NULL DEFAULT 0,
  advance_paid INTEGER NOT NULL DEFAULT 0,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- Payments
-- =============================================

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  payment_method payment_method NOT NULL DEFAULT 'bank_transfer',
  bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  screenshot_url TEXT,
  whatsapp_number TEXT,
  status payment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- =============================================
-- Chat Rooms
-- =============================================

CREATE TABLE public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- Chat Messages
-- =============================================

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- Match Feedback
-- =============================================

CREATE TABLE public.match_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  skill_accuracy INTEGER NOT NULL CHECK (skill_accuracy >= 1 AND skill_accuracy <= 5),
  fair_play INTEGER NOT NULL CHECK (fair_play >= 1 AND fair_play <= 5),
  punctuality INTEGER NOT NULL CHECK (punctuality >= 1 AND punctuality <= 5),
  behavior_tone INTEGER NOT NULL CHECK (behavior_tone >= 1 AND behavior_tone <= 5),
  behavior_aggressiveness INTEGER NOT NULL CHECK (behavior_aggressiveness >= 1 AND behavior_aggressiveness <= 5),
  behavior_sportsmanship INTEGER NOT NULL CHECK (behavior_sportsmanship >= 1 AND behavior_sportsmanship <= 5),
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(match_id, from_user_id, to_user_id)
);

-- =============================================
-- Reports
-- =============================================

CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reported_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reported_user UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  evidence_urls TEXT[] NOT NULL DEFAULT '{}',
  status report_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- User Penalties
-- =============================================

CREATE TABLE public.user_penalties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  penalty_type penalty_type NOT NULL,
  reason TEXT NOT NULL,
  duration_days INTEGER,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- Visitor Analytics
-- =============================================

CREATE TABLE public.visitor_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  page TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT,
  country TEXT,
  city TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- Interaction Events (for heatmaps)
-- =============================================

CREATE TABLE public.interaction_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'click', 'scroll', 'hover'
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

-- =============================================
-- System Configuration
-- =============================================

CREATE TABLE public.system_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- Indexes for Performance
-- =============================================

-- Users
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_email ON public.users(email);

-- Player Profiles
CREATE INDEX idx_player_profiles_user_id ON public.player_profiles(user_id);
CREATE INDEX idx_player_profiles_username ON public.player_profiles(username);
CREATE INDEX idx_player_profiles_elo ON public.player_profiles(elo_rating);

-- Venues
CREATE INDEX idx_venues_location ON public.venues(location_lat, location_lng);
CREATE INDEX idx_venues_city ON public.venues(city);
CREATE INDEX idx_venues_vendor ON public.venues(vendor_id);
CREATE INDEX idx_venues_active ON public.venues(is_active) WHERE is_active = true;

-- Courts
CREATE INDEX idx_courts_venue ON public.courts(venue_id);
CREATE INDEX idx_courts_sport ON public.courts(sport_id);
CREATE INDEX idx_courts_available ON public.courts(is_available) WHERE is_available = true;

-- Matchmaking Queue
CREATE INDEX idx_queue_user ON public.matchmaking_queue(user_id);
CREATE INDEX idx_queue_sport ON public.matchmaking_queue(sport_id);
CREATE INDEX idx_queue_status ON public.matchmaking_queue(status) WHERE status = 'waiting';
CREATE INDEX idx_queue_expires ON public.matchmaking_queue(expires_at);

-- Matches
CREATE INDEX idx_matches_status ON public.matches(status);
CREATE INDEX idx_matches_venue ON public.matches(venue_id);
CREATE INDEX idx_matches_date ON public.matches(scheduled_date);

-- Bookings
CREATE INDEX idx_bookings_user ON public.bookings(user_id);
CREATE INDEX idx_bookings_court ON public.bookings(court_id);
CREATE INDEX idx_bookings_date ON public.bookings(booking_date);
CREATE INDEX idx_bookings_status ON public.bookings(payment_status);

-- Chat Messages
CREATE INDEX idx_chat_messages_room ON public.chat_messages(room_id);
CREATE INDEX idx_chat_messages_created ON public.chat_messages(created_at DESC);

-- Analytics
CREATE INDEX idx_analytics_session ON public.visitor_analytics(session_id);
CREATE INDEX idx_analytics_timestamp ON public.visitor_analytics(timestamp DESC);
CREATE INDEX idx_events_session ON public.interaction_events(session_id);
CREATE INDEX idx_events_page ON public.interaction_events(page);

-- =============================================
-- Triggers for updated_at
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_player_profiles_updated_at
  BEFORE UPDATE ON public.player_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_behavior_metrics_updated_at
  BEFORE UPDATE ON public.behavior_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_player_sports_updated_at
  BEFORE UPDATE ON public.player_sports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_venues_updated_at
  BEFORE UPDATE ON public.venues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_courts_updated_at
  BEFORE UPDATE ON public.courts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- Function to create user profile on signup
-- =============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public.users
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'player');
  
  -- Create behavior metrics
  INSERT INTO public.behavior_metrics (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
