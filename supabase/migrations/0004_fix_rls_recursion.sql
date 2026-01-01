-- Fix infinite recursion in RLS policies for matches and match_players

-- 1. Create a helper function to check participation without triggering RLS (Security Definer)
-- This checks if the current user is a player in the given match.
-- SECURITY DEFINER is crucial here: it runs with the privileges of the creator (postgres/admin),
-- effectively bypassing RLS on 'match_players' to avoid the recursion loop.
CREATE OR REPLACE FUNCTION public.is_match_participant(lookup_match_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public -- Secure the search path
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.match_players 
    WHERE match_id = lookup_match_id 
    AND user_id = auth.uid()
  );
$$;

-- 2. Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own matches" ON public.matches;
DROP POLICY IF EXISTS "Participants can update matches" ON public.matches;
DROP POLICY IF EXISTS "Users can view match players" ON public.match_players;
DROP POLICY IF EXISTS "Users can update own match player record" ON public.match_players;

-- 3. Re-create policies using the new function

-- MATCHES: View if creator OR participant
CREATE POLICY "Users can view own matches"
  ON public.matches FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR public.is_match_participant(id)
  );

-- MATCHES: Update if participant
CREATE POLICY "Participants can update matches"
  ON public.matches FOR UPDATE
  TO authenticated
  USING (
    public.is_match_participant(id)
  );

-- MATCH_PLAYERS: View if you are in the same match
-- This allows a user to see their opponents in a match they are playing in.
CREATE POLICY "Users can view match players"
  ON public.match_players FOR SELECT
  TO authenticated
  USING (
    public.is_match_participant(match_id)
  );

-- MATCH_PLAYERS: Update ONLY your own record
CREATE POLICY "Users can update own match player record"
  ON public.match_players FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
