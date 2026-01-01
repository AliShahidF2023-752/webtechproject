-- =============================================
-- Fix Matchmaking System
-- This migration fixes all matchmaking issues:
-- 1. Makes venue_id nullable in matches table
-- 2. Rewrites find_match() with correct logic
-- 3. Fixes RLS policy for matchmaking_queue
-- 4. Ensures trigger is properly defined
-- =============================================

-- 1. Make venue_id nullable in matches table
ALTER TABLE public.matches ALTER COLUMN venue_id DROP NOT NULL;

-- 2. Add location columns if not exists (idempotent)
ALTER TABLE public.matchmaking_queue 
ADD COLUMN IF NOT EXISTS location_lat FLOAT8,
ADD COLUMN IF NOT EXISTS location_lng FLOAT8,
ADD COLUMN IF NOT EXISTS radius_km FLOAT8 DEFAULT 10;

-- Add match_id column if not exists
ALTER TABLE public.matchmaking_queue 
ADD COLUMN IF NOT EXISTS match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL;

-- 3. Create Haversine distance function (returns km)
CREATE OR REPLACE FUNCTION public.haversine_distance(
    lat1 FLOAT8,
    lon1 FLOAT8,
    lat2 FLOAT8,
    lon2 FLOAT8
)
RETURNS FLOAT8 AS $$
DECLARE
    R CONSTANT FLOAT8 := 6371; -- Earth radius in km
    dLat FLOAT8;
    dLon FLOAT8;
    a FLOAT8;
    c FLOAT8;
BEGIN
    dLat := (lat2 - lat1) * PI() / 180;
    dLon := (lon2 - lon1) * PI() / 180;
    
    a := sin(dLat/2) * sin(dLat/2) +
         cos(lat1 * PI() / 180) * cos(lat2 * PI() / 180) *
         sin(dLon/2) * sin(dLon/2);
         
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    
    RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. Rewrite find_match function with correct logic and smart court selection
CREATE OR REPLACE FUNCTION public.find_match()
RETURNS TRIGGER AS $$
DECLARE
    opponent_record RECORD;
    new_match_id UUID;
    dist_km FLOAT8;
    both_have_location BOOLEAN;
    both_have_venue BOOLEAN;
    within_radius BOOLEAN;
    same_venue BOOLEAN;
    selected_venue_id UUID;
    selected_court_id UUID;
    midpoint_lat FLOAT8;
    midpoint_lng FLOAT8;
BEGIN
    -- Search for a suitable opponent
    FOR opponent_record IN 
        SELECT * FROM public.matchmaking_queue
        WHERE 
            sport_id = NEW.sport_id
            AND status = 'waiting'
            AND user_id != NEW.user_id
            -- Date must match exactly
            AND preferred_date = NEW.preferred_date
            -- Time matching: Allow +/- 60 minutes
            AND (
                NEW.preferred_time::time BETWEEN 
                    (preferred_time::time - interval '60 minutes') 
                    AND (preferred_time::time + interval '60 minutes')
            )
        ORDER BY created_at ASC
        FOR UPDATE SKIP LOCKED
    LOOP
        -- Calculate matching criteria
        both_have_location := (
            NEW.location_lat IS NOT NULL AND NEW.location_lng IS NOT NULL 
            AND opponent_record.location_lat IS NOT NULL AND opponent_record.location_lng IS NOT NULL
        );
        
        both_have_venue := (
            NEW.venue_id IS NOT NULL AND opponent_record.venue_id IS NOT NULL
        );
        
        -- Check distance if both have location
        IF both_have_location THEN
            dist_km := public.haversine_distance(
                NEW.location_lat, NEW.location_lng, 
                opponent_record.location_lat, opponent_record.location_lng
            );
            within_radius := dist_km <= LEAST(COALESCE(NEW.radius_km, 10), COALESCE(opponent_record.radius_km, 10));
        ELSE
            within_radius := FALSE;
        END IF;
        
        -- Check venue match
        same_venue := (NEW.venue_id IS NOT NULL AND NEW.venue_id = opponent_record.venue_id);
        
        -- MATCH CONDITIONS (any one of these):
        -- 1. Same venue selected by both
        -- 2. Within each other's radius
        -- 3. One has venue, other doesn't - match at that venue
        -- 4. Neither has venue nor location - match anyway (flexible matching)
        IF same_venue 
           OR within_radius 
           OR (NEW.venue_id IS NOT NULL AND opponent_record.venue_id IS NULL)
           OR (NEW.venue_id IS NULL AND opponent_record.venue_id IS NOT NULL)
           OR (NOT both_have_location AND NOT both_have_venue) THEN
            
            -- Determine venue and court
            selected_venue_id := COALESCE(NEW.venue_id, opponent_record.venue_id);
            
            -- Smart court selection: find best court near both players
            IF selected_venue_id IS NULL AND both_have_location THEN
                -- Calculate midpoint between both players
                midpoint_lat := (NEW.location_lat + opponent_record.location_lat) / 2;
                midpoint_lng := (NEW.location_lng + opponent_record.location_lng) / 2;
                
                -- Find nearest venue with a court for this sport
                SELECT v.id, c.id INTO selected_venue_id, selected_court_id
                FROM public.venues v
                INNER JOIN public.courts c ON c.venue_id = v.id
                WHERE v.is_active = true 
                  AND c.is_available = true
                  AND c.sport_id = NEW.sport_id
                ORDER BY public.haversine_distance(midpoint_lat, midpoint_lng, v.location_lat::float8, v.location_lng::float8) ASC
                LIMIT 1;
            ELSIF selected_venue_id IS NOT NULL THEN
                -- Find an available court at the selected venue
                SELECT c.id INTO selected_court_id
                FROM public.courts c
                WHERE c.venue_id = selected_venue_id
                  AND c.is_available = true
                  AND c.sport_id = NEW.sport_id
                LIMIT 1;
            END IF;
            
            -- Create a new match
            INSERT INTO public.matches (
                sport_id,
                venue_id,
                court_id,
                scheduled_date,
                scheduled_time,
                status,
                created_by
            ) VALUES (
                NEW.sport_id,
                selected_venue_id,
                selected_court_id,
                NEW.preferred_date,
                NEW.preferred_time,
                'pending',
                NEW.user_id 
            ) RETURNING id INTO new_match_id;

            -- Create match players
            INSERT INTO public.match_players (match_id, user_id, rating_before, confirmed)
            VALUES 
                (new_match_id, NEW.user_id, 1200, false),
                (new_match_id, opponent_record.user_id, 1200, false);

            -- Update opponent's queue entry
            UPDATE public.matchmaking_queue
            SET 
                status = 'matched',
                match_id = new_match_id
            WHERE id = opponent_record.id;

            -- Update new user's queue entry
            UPDATE public.matchmaking_queue
            SET 
                status = 'matched',
                match_id = new_match_id
            WHERE id = NEW.id;
            
            -- Exit loop after first match
            EXIT;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_matchmaking ON public.matchmaking_queue;

CREATE TRIGGER trigger_matchmaking
    AFTER INSERT ON public.matchmaking_queue
    FOR EACH ROW
    EXECUTE FUNCTION public.find_match();

-- 6. Fix RLS policy for matchmaking_queue
-- Drop existing policies and recreate with better logic
DROP POLICY IF EXISTS "Users can view waiting queue entries" ON public.matchmaking_queue;
DROP POLICY IF EXISTS "Users can view own queue entries" ON public.matchmaking_queue;

-- Users can view their own entries (any status) OR waiting entries (for matching)
CREATE POLICY "Users can view own queue entries"
    ON public.matchmaking_queue FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() 
        OR status = 'waiting'
    );

-- Grant execute on the distance function
GRANT EXECUTE ON FUNCTION public.haversine_distance TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_match TO authenticated;

-- 7. Ensure realtime is enabled for matchmaking_queue
-- This allows clients to subscribe to changes (idempotent)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.matchmaking_queue;
EXCEPTION
    WHEN duplicate_object THEN
        -- Table already in publication, ignore
        NULL;
END $$;
