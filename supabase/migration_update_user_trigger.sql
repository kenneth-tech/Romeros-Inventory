-- Update the handle_new_user trigger to save first_name, last_name, and role from sign up

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff'),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$;
