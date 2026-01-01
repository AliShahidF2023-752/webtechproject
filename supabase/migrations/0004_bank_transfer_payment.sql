-- =============================================
-- Bank Transfer Payment Functions
-- =============================================

-- Function to calculate booking amounts
CREATE OR REPLACE FUNCTION calculate_booking_amounts(
  p_court_id UUID,
  p_duration_minutes INTEGER DEFAULT 60
)
RETURNS TABLE (
  hourly_rate INTEGER,
  total_amount INTEGER,
  commission_amount INTEGER,
  advance_amount INTEGER
) AS $$
DECLARE
  v_hourly_rate INTEGER;
  v_commission_pct DECIMAL;
  v_advance_pct INTEGER;
  v_total INTEGER;
  v_commission INTEGER;
  v_advance INTEGER;
BEGIN
  -- Get court hourly rate
  SELECT c.hourly_rate, v.commission_percentage
  INTO v_hourly_rate, v_commission_pct
  FROM public.courts c
  JOIN public.venues v ON v.id = c.venue_id
  WHERE c.id = p_court_id;
  
  -- Get advance payment percentage from config
  SELECT COALESCE(value::INTEGER, 50)
  INTO v_advance_pct
  FROM public.system_config
  WHERE key = 'advance_payment_percentage';
  
  -- Calculate amounts
  v_total := (v_hourly_rate * p_duration_minutes) / 60;
  v_commission := (v_total * v_commission_pct / 100)::INTEGER;
  v_advance := (v_total * v_advance_pct / 100)::INTEGER;
  
  RETURN QUERY SELECT v_hourly_rate, v_total, v_commission, v_advance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a booking with payment
CREATE OR REPLACE FUNCTION create_booking_with_payment(
  p_court_id UUID,
  p_booking_date DATE,
  p_booking_time TEXT,
  p_duration_minutes INTEGER DEFAULT 60,
  p_match_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_booking_id UUID;
  v_payment_id UUID;
  v_amounts RECORD;
  v_bank_account_id UUID;
BEGIN
  -- Calculate amounts
  SELECT * INTO v_amounts
  FROM calculate_booking_amounts(p_court_id, p_duration_minutes);
  
  -- Get active bank account
  SELECT id INTO v_bank_account_id
  FROM public.bank_accounts
  WHERE is_active = true
  LIMIT 1;
  
  -- Create booking
  INSERT INTO public.bookings (
    match_id, court_id, user_id, booking_date, booking_time,
    duration_minutes, total_amount, commission_amount, advance_paid, payment_status
  ) VALUES (
    p_match_id, p_court_id, auth.uid(), p_booking_date, p_booking_time,
    p_duration_minutes, v_amounts.total_amount, v_amounts.commission_amount, 0, 'pending'
  ) RETURNING id INTO v_booking_id;
  
  -- Create payment record
  INSERT INTO public.payments (
    booking_id, amount, payment_method, bank_account_id, status
  ) VALUES (
    v_booking_id, v_amounts.advance_amount, 'bank_transfer', v_bank_account_id, 'pending'
  ) RETURNING id INTO v_payment_id;
  
  RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to submit payment screenshot
CREATE OR REPLACE FUNCTION submit_payment_screenshot(
  p_payment_id UUID,
  p_screenshot_url TEXT,
  p_whatsapp_number TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.payments
  SET 
    screenshot_url = p_screenshot_url,
    whatsapp_number = p_whatsapp_number,
    status = 'submitted'
  WHERE id = p_payment_id
  AND status = 'pending'
  AND EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = payments.booking_id AND b.user_id = auth.uid()
  );
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify payment (admin only)
CREATE OR REPLACE FUNCTION verify_payment(
  p_payment_id UUID,
  p_verified BOOLEAN
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can verify payments';
  END IF;
  
  IF p_verified THEN
    -- Verify the payment
    UPDATE public.payments
    SET 
      status = 'verified',
      verified_at = NOW(),
      verified_by = auth.uid()
    WHERE id = p_payment_id AND status = 'submitted';
    
    -- Update booking payment status
    UPDATE public.bookings
    SET 
      payment_status = 'verified',
      advance_paid = (
        SELECT amount FROM public.payments WHERE id = p_payment_id
      )
    WHERE id = (SELECT booking_id FROM public.payments WHERE id = p_payment_id);
  ELSE
    -- Reject the payment
    UPDATE public.payments
    SET 
      status = 'rejected',
      verified_at = NOW(),
      verified_by = auth.uid()
    WHERE id = p_payment_id AND status = 'submitted';
    
    UPDATE public.bookings
    SET payment_status = 'pending'
    WHERE id = (SELECT booking_id FROM public.payments WHERE id = p_payment_id);
  END IF;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for payment details with bank account info
CREATE OR REPLACE VIEW public.payment_details AS
SELECT 
  p.id as payment_id,
  p.booking_id,
  p.amount,
  p.payment_method,
  p.screenshot_url,
  p.whatsapp_number as sender_whatsapp,
  p.status,
  p.created_at,
  p.verified_at,
  ba.bank_name,
  ba.account_number,
  ba.account_title,
  ba.iban,
  (SELECT value FROM public.system_config WHERE key = 'whatsapp_business_number') as receiver_whatsapp,
  b.booking_date,
  b.booking_time,
  b.total_amount,
  b.advance_paid,
  b.total_amount - b.advance_paid as remaining_amount,
  c.name as court_name,
  v.name as venue_name
FROM public.payments p
JOIN public.bank_accounts ba ON ba.id = p.bank_account_id
JOIN public.bookings b ON b.id = p.booking_id
JOIN public.courts c ON c.id = b.court_id
JOIN public.venues v ON v.id = c.venue_id;

-- Grant access to the view
GRANT SELECT ON public.payment_details TO authenticated;
