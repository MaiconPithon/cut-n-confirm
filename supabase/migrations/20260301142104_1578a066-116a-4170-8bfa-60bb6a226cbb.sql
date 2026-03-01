
CREATE TABLE public.avaliacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_cliente TEXT NOT NULL,
  estrelas INTEGER NOT NULL CHECK (estrelas >= 1 AND estrelas <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert avaliacoes"
ON public.avaliacoes FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view avaliacoes"
ON public.avaliacoes FOR SELECT
USING (true);
