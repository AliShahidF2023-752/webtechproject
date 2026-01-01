-- Trigger to sync match cancellation to queue entries
CREATE OR REPLACE FUNCTION public.handle_match_cancellation()
RETURNS TRIGGER AS $$
BEGIN
    -- If match status changes to cancelled
    IF NEW.status = 'cancelled' AND OLD.status != NEW.status THEN
        -- Update all related queue entries to cancelled
        UPDATE public.matchmaking_queue
        SET status = 'cancelled'
        WHERE match_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_match_cancellation ON public.matches;

CREATE TRIGGER trigger_match_cancellation
    AFTER UPDATE ON public.matches
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_match_cancellation();
