-- Enable realtime for profiles table to support instant sidebar updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;