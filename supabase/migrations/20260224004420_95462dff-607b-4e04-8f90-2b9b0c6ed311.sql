
-- Add duration and buffer columns to services
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS duration_minutes integer NOT NULL DEFAULT 30,
ADD COLUMN IF NOT EXISTS buffer_minutes integer NOT NULL DEFAULT 5;

-- Update known services with sensible defaults
UPDATE public.services SET duration_minutes = 30, buffer_minutes = 5 WHERE name ILIKE '%corte%';
UPDATE public.services SET duration_minutes = 20, buffer_minutes = 5 WHERE name ILIKE '%barba%';
UPDATE public.services SET duration_minutes = 45, buffer_minutes = 5 WHERE name ILIKE '%combo%' OR name ILIKE '%corte e barba%';
UPDATE public.services SET duration_minutes = 40, buffer_minutes = 5 WHERE name ILIKE '%degradê%';
UPDATE public.services SET duration_minutes = 60, buffer_minutes = 10 WHERE name ILIKE '%sobrancelha%' OR name ILIKE '%pigment%';
