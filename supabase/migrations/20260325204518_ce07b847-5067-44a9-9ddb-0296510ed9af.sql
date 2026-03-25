-- Add tier column to atp_points
ALTER TABLE public.atp_points ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT '250';

-- Add is_grand_slam flag to games
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS is_grand_slam BOOLEAN DEFAULT false;