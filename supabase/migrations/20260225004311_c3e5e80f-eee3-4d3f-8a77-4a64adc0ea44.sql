
ALTER TABLE public.schedule_config
  ADD COLUMN break_start time without time zone DEFAULT NULL,
  ADD COLUMN break_end time without time zone DEFAULT NULL;
