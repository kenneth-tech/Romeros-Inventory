-- Allow authenticated staff to read all profiles (needed for history display)

CREATE POLICY "Staff read all profiles"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');
