-- Anon RPC create_order_from_checkout runs as SECURITY DEFINER but session user is still
-- anon, so RLS policies (orders_admin_all requiring is_admin()) blocked inserts.
-- Temporarily disable row_security inside this function only (transaction-local).

CREATE OR REPLACE FUNCTION public.create_order_from_checkout (payload jsonb)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
DECLARE
  v_id uuid;
  line jsonb;
  v_sub numeric;
BEGIN
  PERFORM set_config('row_security', 'off', TRUE);
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
