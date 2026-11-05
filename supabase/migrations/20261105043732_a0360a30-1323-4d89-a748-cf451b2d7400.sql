CREATE OR REPLACE FUNCTION public.holo_touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.holo_players (
  telegram_id bigint PRIMARY KEY,
  username text, first_name text, photo_url text, language_code text,
  coins bigint NOT NULL DEFAULT 0, spins integer NOT NULL DEFAULT 0, tickets integer NOT NULL DEFAULT 0,
  gram numeric NOT NULL DEFAULT 0, solo numeric NOT NULL DEFAULT 0,
  pending jsonb NOT NULL DEFAULT '{}'::jsonb,
  state jsonb,
  joined_channel boolean NOT NULL DEFAULT false, joined_group boolean NOT NULL DEFAULT false,
  bot_started boolean NOT NULL DEFAULT false, blocked_bot boolean NOT NULL DEFAULT false,
  referred_by bigint,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.holo_players TO service_role;
ALTER TABLE public.holo_players ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER holo_players_touch BEFORE UPDATE ON public.holo_players FOR EACH ROW EXECUTE FUNCTION public.holo_touch_updated_at();

CREATE TABLE public.holo_admins (
  username text PRIMARY KEY,
  role text NOT NULL CHECK (role IN ('owner','tasks')),
  added_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.holo_admins TO service_role;
ALTER TABLE public.holo_admins ENABLE ROW LEVEL SECURITY;
INSERT INTO public.holo_admins (username, role) VALUES ('eigiza','owner'), ('torker','owner') ON CONFLICT DO NOTHING;

CREATE TABLE public.holo_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL, url text,
  kind text NOT NULL DEFAULT 'link' CHECK (kind IN ('link','join_channel','join_group')),
  chat_id text,
  reward_spins integer NOT NULL DEFAULT 0, reward_tickets integer NOT NULL DEFAULT 0, reward_coins integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true, sort integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.holo_tasks TO service_role;
ALTER TABLE public.holo_tasks ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER holo_tasks_touch BEFORE UPDATE ON public.holo_tasks FOR EACH ROW EXECUTE FUNCTION public.holo_touch_updated_at();
INSERT INTO public.holo_tasks (title, url, kind, chat_id, reward_spins, reward_tickets, sort) VALUES
 ('Join Holo News', 'https://t.me/holocom', 'join_channel', '@holocom', 20, 0, 1),
 ('Join Holo Community', 'https://t.me/holoik', 'join_group', '@holoik', 20, 1, 2);

CREATE TABLE public.holo_task_completions (
  telegram_id bigint NOT NULL REFERENCES public.holo_players(telegram_id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.holo_tasks(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (telegram_id, task_id)
);
GRANT ALL ON public.holo_task_completions TO service_role;
ALTER TABLE public.holo_task_completions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.holo_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id bigint NOT NULL,
  product text NOT NULL,
  method text NOT NULL CHECK (method IN ('stars','gram')),
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed')),
  reward jsonb NOT NULL DEFAULT '{}'::jsonb,
  charge_id text, tx_hash text, comment text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(), paid_at timestamptz
);
GRANT ALL ON public.holo_payments TO service_role;
ALTER TABLE public.holo_payments ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX holo_payments_tx_uniq ON public.holo_payments(tx_hash) WHERE tx_hash IS NOT NULL;
CREATE UNIQUE INDEX holo_payments_charge_uniq ON public.holo_payments(charge_id) WHERE charge_id IS NOT NULL;

CREATE TABLE public.holo_gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id bigint NOT NULL,
  reward jsonb NOT NULL,
  reason text NOT NULL DEFAULT 'daily',
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.holo_gifts TO service_role;
ALTER TABLE public.holo_gifts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.holo_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot text NOT NULL UNIQUE,
  text text NOT NULL,
  message_id bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.holo_posts TO service_role;
ALTER TABLE public.holo_posts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.holo_notifications (
  slot text PRIMARY KEY,
  sent integer NOT NULL DEFAULT 0,
  failed integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.holo_notifications TO service_role;
ALTER TABLE public.holo_notifications ENABLE ROW LEVEL SECURITY;

-- Atomic gift claim: credits pending rewards once.
CREATE OR REPLACE FUNCTION public.holo_claim_gift(p_gift uuid, p_user bigint) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g public.holo_gifts;
BEGIN
  UPDATE public.holo_gifts SET claimed_at = now() WHERE id = p_gift AND telegram_id = p_user AND claimed_at IS NULL RETURNING * INTO g;
  IF g.id IS NULL THEN RETURN NULL; END IF;
  INSERT INTO public.holo_players (telegram_id) VALUES (p_user) ON CONFLICT DO NOTHING;
  UPDATE public.holo_players SET
    coins = coins + COALESCE((g.reward->>'coins')::bigint,0),
    spins = spins + COALESCE((g.reward->>'spins')::int,0),
    tickets = tickets + COALESCE((g.reward->>'tickets')::int,0),
    pending = jsonb_build_object(
      'coins', COALESCE((pending->>'coins')::bigint,0) + COALESCE((g.reward->>'coins')::bigint,0),
      'spins', COALESCE((pending->>'spins')::int,0) + COALESCE((g.reward->>'spins')::int,0),
      'tickets', COALESCE((pending->>'tickets')::int,0) + COALESCE((g.reward->>'tickets')::int,0),
      'gram', COALESCE((pending->>'gram')::numeric,0) + COALESCE((g.reward->>'gram')::numeric,0))
  WHERE telegram_id = p_user;
  RETURN g.reward;
END; $$;
REVOKE ALL ON FUNCTION public.holo_claim_gift(uuid, bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.holo_claim_gift(uuid, bigint) TO service_role;

-- Atomic credit for payments/tasks into pending (applied by the app on next sync).
CREATE OR REPLACE FUNCTION public.holo_credit(p_user bigint, p_reward jsonb) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.holo_players (telegram_id) VALUES (p_user) ON CONFLICT DO NOTHING;
  UPDATE public.holo_players SET pending = jsonb_build_object(
      'coins', COALESCE((pending->>'coins')::bigint,0) + COALESCE((p_reward->>'coins')::bigint,0),
      'spins', COALESCE((pending->>'spins')::int,0) + COALESCE((p_reward->>'spins')::int,0),
      'tickets', COALESCE((pending->>'tickets')::int,0) + COALESCE((p_reward->>'tickets')::int,0),
      'gram', COALESCE((pending->>'gram')::numeric,0) + COALESCE((p_reward->>'gram')::numeric,0),
      'premium', COALESCE((pending->>'premium')::boolean,false) OR COALESCE((p_reward->>'premium')::boolean,false),
      'royal', COALESCE((pending->>'royal')::boolean,false) OR COALESCE((p_reward->>'royal')::boolean,false))
  WHERE telegram_id = p_user;
END; $$;
REVOKE ALL ON FUNCTION public.holo_credit(bigint, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.holo_credit(bigint, jsonb) TO service_role;

-- Take pending rewards (app adds them to local game state).
CREATE OR REPLACE FUNCTION public.holo_take_pending(p_user bigint) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r jsonb;
BEGIN
  UPDATE public.holo_players p SET pending = '{}'::jsonb FROM (SELECT pending FROM public.holo_players WHERE telegram_id = p_user FOR UPDATE) old
  WHERE p.telegram_id = p_user RETURNING old.pending INTO r;
  RETURN COALESCE(r, '{}'::jsonb);
END; $$;
REVOKE ALL ON FUNCTION public.holo_take_pending(bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.holo_take_pending(bigint) TO service_role;