-- Function to cleanup expired matches (pending > 30 mins)
CREATE OR REPLACE FUNCTION public.cleanup_expired_matches()
RETURNS void AS $$
DECLARE
    m RECORD;
    booking_rec RECORD;
    paid_user_id UUID;
    queue_rec RECORD;
BEGIN
    -- Loop through pending matches created > 30 mins ago
    FOR m IN
        SELECT * FROM public.matches
        WHERE status = 'pending' 
        AND created_at < (NOW() - INTERVAL '30 minutes')
    LOOP
        -- Check for verified bookings for this match
        SELECT count(*) INTO booking_rec FROM public.bookings 
        WHERE match_id = m.id AND payment_status = 'verified';
        
        -- Scenario 1: No one paid (count = 0) -> Cancel match
        IF booking_rec.count = 0 THEN
            UPDATE public.matches SET status = 'cancelled' WHERE id = m.id;
            -- Trigger handles queue status update to cancelled
            
        -- Scenario 2: One person paid (count = 1) -> Rematch
        ELSIF booking_rec.count = 1 THEN
            -- Find the user who paid
            SELECT user_id INTO paid_user_id FROM public.bookings
            WHERE match_id = m.id AND payment_status = 'verified' LIMIT 1;
            
            -- 1. Orphan the booking (unlink from this dying match)
            UPDATE public.bookings 
            SET match_id = NULL 
            WHERE match_id = m.id AND user_id = paid_user_id;
            
            -- 2. Cancel the match
            UPDATE public.matches SET status = 'cancelled' WHERE id = m.id;
            
            -- 3. Re-queue the paid user
            -- Fetch original queue preferences (assuming connection via user_id and recent time? 
            -- Better: query matchmaking_queue even if cancelled/matched)
            -- We need to find the queue entry that LED to this match.
            -- The queue entry has match_id.
            
            SELECT * INTO queue_rec FROM public.matchmaking_queue
            WHERE match_id = m.id AND user_id = paid_user_id LIMIT 1;
            
            IF queue_rec.id IS NOT NULL THEN
                -- Insert new queue entry with high priority? (just insert normally for now)
                INSERT INTO public.matchmaking_queue (
                    user_id, sport_id, venue_id, preferred_date, preferred_time, 
                    min_rating, max_rating, gender_preference, location, radius_km,
                    status, created_at
                ) VALUES (
                    queue_rec.user_id, queue_rec.sport_id, queue_rec.venue_id, 
                    queue_rec.preferred_date, queue_rec.preferred_time,
                    queue_rec.min_rating, queue_rec.max_rating, queue_rec.gender_preference,
                    queue_rec.location, queue_rec.radius_km,
                    'waiting', NOW()
                );
            END IF;
            
        -- Scenario 3: Both paid (count >= 2) -> Confirm match (Safety net)
        ELSE
            UPDATE public.matches SET status = 'confirmed' WHERE id = m.id;
        END IF;
        
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
