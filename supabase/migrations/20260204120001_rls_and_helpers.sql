-- RLS policies + helper is_admin()

CREATE OR REPLACE FUNCTION public.is_admin ()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
  AS $$
  SELECT
    EXISTS (
      SELECT
        1
      FROM
        public.admins
      WHERE
        user_id = auth.uid ());
$$;

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.product_options ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.product_i18n ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.product_option_i18n ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.recipe_lines ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Public read catalog
CREATE POLICY catalog_categories_select ON public.product_categories
  FOR SELECT
  USING (TRUE);

CREATE POLICY catalog_products_select ON public.products
  FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY catalog_options_select ON public.product_options
  FOR SELECT
  USING (EXISTS (
      SELECT
        1
      FROM
        public.products p
      WHERE
        p.id = product_id AND p.is_active = TRUE));

CREATE POLICY catalog_product_i18n_select ON public.product_i18n
  FOR SELECT
  USING (EXISTS (
      SELECT
        1
      FROM
        public.products p
      WHERE
        p.id = product_id AND p.is_active = TRUE));

CREATE POLICY catalog_option_i18n_select ON public.product_option_i18n
  FOR SELECT
  USING (EXISTS (
      SELECT
        1
      FROM
        public.products p
      WHERE
        p.id = product_id AND p.is_active = TRUE));

-- Admins: read own row
CREATE POLICY admins_select_self ON public.admins
  FOR SELECT
  USING (user_id = auth.uid ());

CREATE POLICY admins_admin_all ON public.admins
  FOR ALL
  USING (public.is_admin ())
  WITH CHECK (public.is_admin ());

-- Admin-only operational tables
CREATE POLICY ingredients_admin_all ON public.ingredients
  FOR ALL
  USING (public.is_admin ())
  WITH CHECK (public.is_admin ());

CREATE POLICY recipe_lines_admin_all ON public.recipe_lines
  FOR ALL
  USING (public.is_admin ())
  WITH CHECK (public.is_admin ());

CREATE POLICY orders_admin_all ON public.orders
  FOR ALL
  USING (public.is_admin ())
  WITH CHECK (public.is_admin ());

CREATE POLICY order_items_admin_all ON public.order_items
  FOR ALL
  USING (public.is_admin ())
  WITH CHECK (public.is_admin ());

CREATE POLICY inv_tx_admin_all ON public.inventory_transactions
  FOR ALL
  USING (public.is_admin ())
  WITH CHECK (public.is_admin ());

CREATE POLICY products_admin_all ON public.products
  FOR ALL
  USING (public.is_admin ())
  WITH CHECK (public.is_admin ());

CREATE POLICY product_options_admin_all ON public.product_options
  FOR ALL
  USING (public.is_admin ())
  WITH CHECK (public.is_admin ());

CREATE POLICY product_i18n_admin_all ON public.product_i18n
  FOR ALL
  USING (public.is_admin ())
  WITH CHECK (public.is_admin ());

CREATE POLICY product_option_i18n_admin_all ON public.product_option_i18n
  FOR ALL
  USING (public.is_admin ())
  WITH CHECK (public.is_admin ());

CREATE POLICY categories_admin_all ON public.product_categories
  FOR ALL
  USING (public.is_admin ())
  WITH CHECK (public.is_admin ());

-- Orders: anon cannot select (privacy) — only via RPC success for own order is not in v1
-- No direct anon insert on orders
GRANT EXECUTE ON FUNCTION public.is_admin () TO anon;

GRANT EXECUTE ON FUNCTION public.is_admin () TO authenticated;
