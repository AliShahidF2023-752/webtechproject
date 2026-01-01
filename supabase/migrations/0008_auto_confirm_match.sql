-- Trigger to auto-confirm matches when booking payment is verified
CREATE OR REPLACE FUNCTION public.confirm_match_on_payment()
RETURNS TRIGGER AS $$
BEGIN
    -- If payment status changes to verified and there is a linked match
    IF NEW.payment_status = 'verified' AND NEW.match_id IS NOT NULL THEN
        -- Update match status to confirmed
        UPDATE public.matches
        SET status = 'confirmed'
        WHERE id = NEW.match_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_confirm_match ON public.bookings;

CREATE TRIGGER trigger_confirm_match
    AFTER UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.confirm_match_on_payment();
