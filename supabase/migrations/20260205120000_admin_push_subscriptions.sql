-- Web Push subscriptions for admin order alerts (Edge Function sends pushes; RLS: staff only, own rows).

CREATE TABLE public.admin_push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_push_subscriptions_endpoint_key UNIQUE (endpoint)
);

CREATE INDEX admin_push_subscriptions_user_id_idx ON public.admin_push_subscriptions (user_id);

ALTER TABLE public.admin_push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_push_subs_select_own ON public.admin_push_subscriptions
  FOR SELECT
  USING (public.is_admin () AND user_id = auth.uid ());

CREATE POLICY admin_push_subs_insert_own ON public.admin_push_subscriptions
  FOR INSERT
  WITH CHECK (public.is_admin () AND user_id = auth.uid ());

CREATE POLICY admin_push_subs_update_own ON public.admin_push_subscriptions
  FOR UPDATE
  USING (public.is_admin () AND user_id = auth.uid ())
  WITH CHECK (public.is_admin () AND user_id = auth.uid ());

CREATE POLICY admin_push_subs_delete_own ON public.admin_push_subscriptions
  FOR DELETE
  USING (public.is_admin () AND user_id = auth.uid ());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_push_subscriptions TO authenticated;
