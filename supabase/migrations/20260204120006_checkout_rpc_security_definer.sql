-- SECURITY INVOKER (005) runs as anon: FK checks on order_items -> orders and INSERT ... RETURNING
-- both require SELECT visibility anon did not have → PostgREST 403.
-- Restore SECURITY DEFINER so the function runs as owner and bypasses RLS on owned tables.
-- Remove broad anon INSERT (no longer needed).

DROP POLICY IF EXISTS orders_anon_insert_web_checkout ON public.orders;
DROP POLICY IF EXISTS order_items_anon_insert_checkout ON public.order_items;

REVOKE INSERT ON public.orders FROM anon;
REVOKE INSERT ON public.order_items FROM anon;

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

GRANT EXECUTE ON FUNCTION public.create_order_from_checkout (jsonb) TO anon;
