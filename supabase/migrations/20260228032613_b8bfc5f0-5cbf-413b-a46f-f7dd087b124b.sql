
-- Add actual_end_time to track early finishes
ALTER TABLE public.appointments ADD COLUMN actual_end_time time without time zone DEFAULT NULL;

-- Add slot interval setting (default 30 min)
INSERT INTO public.business_settings (key, value) 
VALUES ('slot_interval_minutes', '30')
ON CONFLICT DO NOTHING;
