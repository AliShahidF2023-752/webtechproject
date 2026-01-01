-- Trigger to run cleanup when users join queue
CREATE OR REPLACE FUNCTION public.run_cleanup_on_join()
RETURNS TRIGGER AS $$
BEGIN
    -- Run cleanup asynchronously if possible? No, sync is fine for now as it's just checking dates
    PERFORM public.cleanup_expired_matches();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_cleanup_on_join ON public.matchmaking_queue;

CREATE TRIGGER trigger_cleanup_on_join
    BEFORE INSERT ON public.matchmaking_queue
    FOR EACH ROW
    EXECUTE FUNCTION public.run_cleanup_on_join();
