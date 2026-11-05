CREATE TABLE public.holo_art (
  id text PRIMARY KEY,
  kind text NOT NULL,
  prompt text NOT NULL,
  mime text NOT NULL DEFAULT 'image/png',
  data_b64 text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.holo_art TO service_role;
ALTER TABLE public.holo_art ENABLE ROW LEVEL SECURITY;
CREATE INDEX holo_art_kind_idx ON public.holo_art (kind, created_at DESC);