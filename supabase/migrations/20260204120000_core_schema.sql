-- VISO bakery: core enums, tables, indexes (PostgreSQL 15+)

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE public.order_status AS ENUM (
  'pending',
  'confirmed',
  'in_progress',
  'ready',
  'completed',
  'cancelled'
);

CREATE TYPE public.order_source AS ENUM ('web', 'manual');

CREATE TYPE public.ingredient_track_unit AS ENUM ('kg', 'L');

CREATE TYPE public.inventory_tx_reason AS ENUM (
  'order_consumption',
  'purchase',
  'adjustment',
  'waste',
  'correction'
);

-- ---------------------------------------------------------------------------
-- Schema for internal-only functions (not exposed via PostgREST API)
-- ---------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS private;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
CREATE TABLE public.admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  slug text NOT NULL UNIQUE,
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE public.products (
  id text PRIMARY KEY,
  category_id uuid REFERENCES public.product_categories (id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  weight_per_sale_unit_kg numeric NOT NULL,
  image_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.product_options (
  product_id text NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  id text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  unit_price numeric NOT NULL,
  weight_per_sale_unit_kg numeric,
  PRIMARY KEY (product_id, id)
);

CREATE TABLE public.product_i18n (
  product_id text NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  locale text NOT NULL,
  name text NOT NULL,
  description text,
  PRIMARY KEY (product_id, locale)
);

CREATE TABLE public.product_option_i18n (
  product_id text NOT NULL,
  option_id text NOT NULL,
  locale text NOT NULL,
  name text NOT NULL,
  description text,
  PRIMARY KEY (product_id, option_id, locale),
  FOREIGN KEY (product_id, option_id) REFERENCES public.product_options (product_id, id) ON DELETE CASCADE
);

CREATE TABLE public.ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  name text NOT NULL,
  category text,
  track_unit public.ingredient_track_unit NOT NULL,
  cost_per_unit numeric NOT NULL,
  quantity_on_hand numeric NOT NULL DEFAULT 0,
  low_stock_threshold numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.recipe_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  product_id text NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  product_option_id text,
  ingredient_id uuid NOT NULL REFERENCES public.ingredients (id) ON DELETE RESTRICT,
  amount_per_kg_finished_product numeric NOT NULL,
  FOREIGN KEY (product_id, product_option_id) REFERENCES public.product_options (product_id, id)
);

CREATE UNIQUE INDEX recipe_lines_unique_bom ON public.recipe_lines (product_id, product_option_id, ingredient_id) NULLS NOT DISTINCT;

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  status public.order_status NOT NULL DEFAULT 'pending',
  source public.order_source NOT NULL,
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  inventory_applied_at timestamptz,
  customer_name text NOT NULL,
  phone text NOT NULL,
  notes text,
  pickup_note text,
  locale text,
  subtotal numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  order_id uuid NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  product_id text NOT NULL REFERENCES public.products (id) ON DELETE RESTRICT,
  option_id text,
  qty int NOT NULL CHECK (qty > 0),
  unit_price numeric NOT NULL,
  line_total numeric NOT NULL,
  title_snapshot text NOT NULL
);

CREATE TABLE public.inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  ingredient_id uuid NOT NULL REFERENCES public.ingredients (id) ON DELETE RESTRICT,
  delta numeric NOT NULL,
  reason public.inventory_tx_reason NOT NULL,
  order_id uuid REFERENCES public.orders (id) ON DELETE SET NULL,
  notes text,
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX idx_orders_status_created ON public.orders (status, created_at DESC);

CREATE INDEX idx_orders_source ON public.orders (source);

CREATE INDEX idx_order_items_order_id ON public.order_items (order_id);

CREATE INDEX idx_recipe_lines_product ON public.recipe_lines (product_id);

CREATE INDEX idx_recipe_lines_ingredient ON public.recipe_lines (ingredient_id);

CREATE INDEX idx_inv_tx_ingredient_created ON public.inventory_transactions (ingredient_id, created_at DESC);

CREATE INDEX idx_inv_tx_order ON public.inventory_transactions (order_id)
WHERE
  order_id IS NOT NULL;

CREATE INDEX idx_products_active ON public.products (is_active);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at ()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at ();

CREATE TRIGGER ingredients_updated_at
BEFORE UPDATE ON public.ingredients
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at ();

CREATE TRIGGER orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at ();
