-- Priorities is a reference/lookup table — publicly readable, no auth required.
-- The ALL policy (auth.uid() IS NOT NULL) was not reliably granting SELECT
-- access to the browser client, causing urgent priority lookup to return null
-- when generating tickets from Settings > Orb Issues.

CREATE POLICY "priorities: select public"
  ON priorities
  FOR SELECT
  TO public
  USING (true);
