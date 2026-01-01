-- Add match_id to matchmaking_queue to link the resulting match
ALTER TABLE public.matchmaking_queue 
ADD COLUMN IF NOT EXISTS match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL;

-- Function to find a match
CREATE OR REPLACE FUNCTION public.find_match()
RETURNS TRIGGER AS $$
DECLARE
    opponent_record RECORD;
    new_match_id UUID;
BEGIN
    -- 1. Search for a suitable opponent
    SELECT * INTO opponent_record
    FROM public.matchmaking_queue
    WHERE 
        sport_id = NEW.sport_id
        AND preferred_date = NEW.preferred_date
        AND preferred_time = NEW.preferred_time -- Exact time match for MVP
        AND status = 'waiting'
        AND user_id != NEW.user_id
        -- Lock the row to prevent race conditions
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

        -- Update the fetching row (NEW is not yet committed to table, but Trigger runs AFTER INSERT? 
        -- Wait, if AFTER INSERT, the row is in table.
        UPDATE public.matchmaking_queue
        SET 
            status = 'matched',
            match_id = new_match_id
        WHERE id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run matchmaking on new queue entry
DROP TRIGGER IF EXISTS trigger_matchmaking ON public.matchmaking_queue;

CREATE TRIGGER trigger_matchmaking
    AFTER INSERT ON public.matchmaking_queue
    FOR EACH ROW
    EXECUTE FUNCTION public.find_match();
