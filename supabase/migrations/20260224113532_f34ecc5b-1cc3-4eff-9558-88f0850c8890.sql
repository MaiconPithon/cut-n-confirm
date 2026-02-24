
-- Create business_settings table for white-label config
CREATE TABLE public.business_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read business settings (needed for public site)
CREATE POLICY "Anyone can view business settings"
  ON public.business_settings FOR SELECT
  USING (true);

-- Only super_admin can manage business settings
CREATE POLICY "Super admins can manage business settings"
  ON public.business_settings FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Insert default business name
INSERT INTO public.business_settings (key, value) VALUES ('business_name', 'Barbearia do Fal');

-- Upgrade maiconinform@gmail.com to super_admin
UPDATE public.user_roles
SET role = 'super_admin'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'maiconinform@gmail.com')
  AND role = 'admin';

-- Update has_role function: super_admin also passes admin checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND (
      role = _role
      OR (_role = 'admin' AND role = 'super_admin')
    )
  )
$$;
