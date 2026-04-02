-- RLS: orders_admin_all requires is_admin(), so anon could never insert web orders.
-- Supabase still evaluates RLS as the invoker (anon) for many RPC paths.
-- Allow anon INSERT only for pending + web + no created_by (checkout shape).
-- Revoke broad table access: anon still cannot SELECT/UPDATE/DELETE orders without a matching policy.

GRANT INSERT ON public.orders TO anon;
GRANT INSERT ON public.order_items TO anon;

CREATE POLICY orders_anon_insert_web_checkout ON public.orders
  FOR INSERT
  TO anon
  WITH CHECK (
    status = 'pending'::public.order_status
    AND source = 'web'::public.order_source
    AND created_by IS NULL
  );

CREATE POLICY order_items_anon_insert_checkout ON public.order_items
  FOR INSERT
  TO anon
  WITH CHECK (qty > 0);

-- Revert to INVOKER so inserts run as anon and use policies above.
-- Remove set_config hack (may be blocked for some roles).
CREATE OR REPLACE FUNCTION public.create_order_from_checkout (payload jsonb)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY INVOKER
  SET search_path = public
  AS $$
DECLARE
  v_id uuid;
  line jsonb;
  v_sub numeric;
BEGIN
  v_sub := (payload ->> 'subtotal')::numeric;
  INSERT INTO orders (status, source, created_by, customer_name, phone, notes, pickup_note, locale, subtotal, currency)
    VALUES ('pending', 'web', NULL, payload ->> 'customer_name', payload ->> 'phone', payload ->> 'notes', payload ->> 'pickup_note', payload ->> 'locale', v_sub, COALESCE(payload ->> 'currency', 'USD'))
  RETURNING
    id INTO v_id;
  FOR line IN
  SELECT
    jsonb_array_elements(payload -> 'lines')
    LOOP
      INSERT INTO order_items (order_id, product_id, option_id, qty, unit_price, line_total, title_snapshot)
        VALUES (v_id, line ->> 'product_id', NULLIF(line ->> 'option_id', ''), (line ->> 'qty')::int, (line ->> 'unit_price')::numeric, (line ->> 'line_total')::numeric, line ->> 'title_snapshot');
    END LOOP;
  RETURN v_id;
END;
$$;
