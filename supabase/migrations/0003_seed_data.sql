-- =============================================
-- Seed Data for Sports Matchmaking App
-- =============================================

-- =============================================
-- Sports
-- =============================================

INSERT INTO public.sports (id, name, players_required, icon, description, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Table Tennis', 2, '🏓', 'Fast-paced indoor racket sport played on a table', true),
  ('22222222-2222-2222-2222-222222222222', 'Badminton', 2, '🏸', 'Indoor racket sport with shuttlecock', true);

-- =============================================
-- Sample Bank Account for Payments
-- =============================================

INSERT INTO public.bank_accounts (id, bank_name, account_number, account_title, iban, is_active) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'HBL', '1234567890123', 'SportMatch Payments', 'PK36HABB0001234567890123', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Meezan Bank', '0987654321098', 'SportMatch Payments', 'PK36MEZN0987654321098765', true);

-- =============================================
-- System Configuration
-- =============================================

INSERT INTO public.system_config (key, value, description) VALUES
  ('default_commission_percentage', '10', 'Default commission percentage for venue bookings'),
  ('default_elo_rating', '1200', 'Default ELO rating for new players'),
  ('elo_k_factor', '32', 'K-factor for ELO calculations'),
  ('max_rating_tolerance', '500', 'Maximum rating tolerance for matchmaking'),
  ('queue_expiry_hours', '2', 'Hours before matchmaking queue entry expires'),
  ('whatsapp_business_number', '923001234567', 'WhatsApp number for payment screenshots'),
  ('advance_payment_percentage', '50', 'Percentage of total required as advance payment'),
  ('min_booking_advance_hours', '1', 'Minimum hours in advance for booking'),
  ('max_booking_advance_days', '14', 'Maximum days in advance for booking');

-- =============================================
-- Sample Venues in Major Pakistan Cities
-- =============================================

INSERT INTO public.venues (id, name, description, address, city, location_lat, location_lng, images, rules, is_active, commission_percentage) VALUES
  (
    'a1111111-1111-1111-1111-111111111111',
    'Lahore Sports Complex',
    'Premier sports facility with multiple courts and professional equipment. Air-conditioned halls with excellent lighting.',
    'Main Boulevard, Gulberg III',
    'Lahore',
    31.5204,
    74.3587,
    ARRAY['https://images.unsplash.com/photo-1554068865-24cecd4e34b8'],
    'Players must wear appropriate sports attire. No food or drinks in playing areas.',
    true,
    10.00
  ),
  (
    'a2222222-2222-2222-2222-222222222222',
    'Karachi Indoor Stadium',
    'State-of-the-art indoor facility with international standard courts.',
    'Stadium Road, Saddar',
    'Karachi',
    24.8607,
    67.0011,
    ARRAY['https://images.unsplash.com/photo-1626224583764-f87db24ac4ea'],
    'Booking confirmation required. Cancellation must be 4 hours before.',
    true,
    12.00
  ),
  (
    'a3333333-3333-3333-3333-333333333333',
    'Islamabad Sports Center',
    'Modern sports center in the heart of the capital with ample parking.',
    'F-9 Park Sector',
    'Islamabad',
    33.6938,
    73.0652,
    ARRAY['https://images.unsplash.com/photo-1558618666-fcd25c85cd64'],
    'Players must arrive 10 minutes before slot. Late arrivals may forfeit slot.',
    true,
    10.00
  ),
  (
    'a4444444-4444-4444-4444-444444444444',
    'Peshawar Arena',
    'Well-maintained indoor facility with friendly staff.',
    'University Road, Near Peshawar University',
    'Peshawar',
    34.0151,
    71.5249,
    ARRAY['https://images.unsplash.com/photo-1551698618-1dfe5d97d256'],
    'Advance booking required for weekends.',
    true,
    8.00
  ),
  (
    'a5555555-5555-5555-5555-555555555555',
    'Faisalabad Sports Hub',
    'Community sports center with affordable rates.',
    'Peoples Colony No. 1',
    'Faisalabad',
    31.4504,
    73.1350,
    ARRAY['https://images.unsplash.com/photo-1544919982-b61976f0ba43'],
    'Equipment available for rent.',
    true,
    10.00
  );

-- =============================================
-- Courts for Each Venue
-- =============================================

-- Lahore Sports Complex Courts
INSERT INTO public.courts (venue_id, sport_id, name, hourly_rate, capacity, is_available) VALUES
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Table Tennis Court 1', 500, 2, true),
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Table Tennis Court 2', 500, 2, true),
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Table Tennis Court 3 (Premium)', 800, 2, true),
  ('a1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Badminton Court A', 700, 2, true),
  ('a1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Badminton Court B', 700, 2, true);

-- Karachi Indoor Stadium Courts
INSERT INTO public.courts (venue_id, sport_id, name, hourly_rate, capacity, is_available) VALUES
  ('a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'TT Hall 1', 600, 2, true),
  ('a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'TT Hall 2', 600, 2, true),
  ('a2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Badminton Arena 1', 900, 2, true),
  ('a2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Badminton Arena 2', 900, 2, true);

-- Islamabad Sports Center Courts
INSERT INTO public.courts (venue_id, sport_id, name, hourly_rate, capacity, is_available) VALUES
  ('a3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Table Tennis Room 1', 550, 2, true),
  ('a3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Table Tennis Room 2', 550, 2, true),
  ('a3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Badminton Hall', 800, 2, true);

-- Peshawar Arena Courts
INSERT INTO public.courts (venue_id, sport_id, name, hourly_rate, capacity, is_available) VALUES
  ('a4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Main TT Court', 400, 2, true),
  ('a4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Badminton Court 1', 600, 2, true);

-- Faisalabad Sports Hub Courts
INSERT INTO public.courts (venue_id, sport_id, name, hourly_rate, capacity, is_available) VALUES
  ('a5555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'TT Table 1', 350, 2, true),
  ('a5555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'TT Table 2', 350, 2, true),
  ('a5555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'Community Badminton Court', 500, 2, true);
