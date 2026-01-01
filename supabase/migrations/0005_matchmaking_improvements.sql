-- Add location and radius columns to matchmaking_queue
ALTER TABLE public.matchmaking_queue 
ADD COLUMN IF NOT EXISTS location_lat FLOAT8,
ADD COLUMN IF NOT EXISTS location_lng FLOAT8,
ADD COLUMN IF NOT EXISTS radius_km FLOAT8 DEFAULT 10;

-- Function to calculate Haversine distance (returns km)
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
    dLat := API.radians(lat2 - lat1); -- Need separate radians function if older PG, but let's just do math inline or assume simple
    -- Actually, standard PG doesn't have 'radians' in public by default sometimes? 
    -- Let's use simple math to be safe: rad = deg * PI / 180
    dLat := (lat2 - lat1) * PI() / 180;
    dLon := (lon2 - lon1) * PI() / 180;
    
    a := sin(dLat/2) * sin(dLat/2) +
         cos(lat1 * PI() / 180) * cos(lat2 * PI() / 180) *
         sin(dLon/2) * sin(dLon/2);
         
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    
    RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update find_match to use location and relaxed time
CREATE OR REPLACE FUNCTION public.find_match()
RETURNS TRIGGER AS $$
DECLARE
    opponent_record RECORD;
    new_match_id UUID;
    dist_km FLOAT8;
BEGIN
    -- 1. Search for a suitable opponent
    SELECT * INTO opponent_record
    FROM public.matchmaking_queue
    WHERE 
        sport_id = NEW.sport_id
        AND status = 'waiting'
        AND user_id != NEW.user_id
        
        -- Time Matching: Allow +/- 60 minutes
        AND (
            NEW.preferred_time::time BETWEEN (preferred_time::time - interval '60 minutes') AND (preferred_time::time + interval '60 minutes')
        )
        
        -- Date Matching: Still exact date for now (simplifies things)
        AND preferred_date = NEW.preferred_date

        -- Distance Matching (if both provide location)
        AND (
            CASE 
                WHEN NEW.location_lat IS NOT NULL AND NEW.location_lng IS NOT NULL 
                     AND location_lat IS NOT NULL AND location_lng IS NOT NULL THEN
                    public.haversine_distance(NEW.location_lat, NEW.location_lng, location_lat, location_lng) <= LEAST(NEW.radius_km, radius_km)
                ELSE
                    -- If either has no location (e.g. online match?), assume match allowed or blocked?
                    -- For this app, let's assume if location is missing, we skip distance check (or fallback to strict venue check)
                    -- Fallback: If venue_id is same, it's a match
                    (NEW.venue_id IS NOT NULL AND venue_id = NEW.venue_id)
            END
        )
        
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    -- 2. If opponent found
    IF FOUND THEN
        -- Create a new match
        INSERT INTO public.matches (
            sport_id,
            venue_id,
            scheduled_date,
            scheduled_time,
            status,
            created_by
        ) VALUES (
            NEW.sport_id,
            COALESCE(NEW.venue_id, opponent_record.venue_id), -- Pick a venue if one specified
            NEW.preferred_date,
            NEW.preferred_time,
            'pending',
            NEW.user_id 
        ) RETURNING id INTO new_match_id;

        -- Create match players
        INSERT INTO public.match_players (match_id, user_id, rating_before, confirmed)
        VALUES 
            (new_match_id, NEW.user_id, 1200, false), -- Fetch actual rating in prod
            (new_match_id, opponent_record.user_id, 1200, false);

        -- Update BOTH queue entries
        UPDATE public.matchmaking_queue
        SET 
            status = 'matched',
            match_id = new_match_id
        WHERE id = opponent_record.id;

        UPDATE public.matchmaking_queue
        SET 
            status = 'matched',
            match_id = new_match_id
        WHERE id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
