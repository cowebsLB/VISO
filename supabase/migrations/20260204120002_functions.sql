-- RPCs: orders, inventory (apply_order_to_inventory in private schema)

CREATE OR REPLACE FUNCTION private.apply_order_to_inventory (p_order_id uuid)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
DECLARE
  r_item RECORD;
  r_recipe RECORD;
  v_kg numeric;
  v_w numeric;
  v_consumption numeric;
  v_actor uuid;
  v_has_option_bom boolean;
  n_lines int;
BEGIN
  IF EXISTS (
    SELECT
      1
    FROM
      orders
    WHERE
      id = p_order_id
      AND inventory_applied_at IS NOT NULL) THEN
  RETURN;
END IF;
  v_actor := auth.uid ();
  FOR r_item IN
  SELECT
    *
  FROM
    order_items
  WHERE
    order_id = p_order_id
    LOOP
      SELECT
        COALESCE(po.weight_per_sale_unit_kg, p.weight_per_sale_unit_kg) INTO v_w
      FROM
        products p
        LEFT JOIN product_options po ON po.product_id = p.id
        AND po.id IS NOT DISTINCT FROM r_item.option_id
      WHERE
        p.id = r_item.product_id;
      IF v_w IS NULL THEN
        RAISE EXCEPTION 'Missing weight for product %', r_item.product_id;
      END IF;
      v_kg := r_item.qty * v_w;
      v_has_option_bom := FALSE;
      IF r_item.option_id IS NOT NULL THEN
        SELECT
          EXISTS (
            SELECT
              1
            FROM
              recipe_lines rl
            WHERE
              rl.product_id = r_item.product_id
              AND rl.product_option_id IS NOT DISTINCT FROM r_item.option_id) INTO v_has_option_bom;
      END IF;
      n_lines := 0;
      IF v_has_option_bom THEN
        FOR r_recipe IN
        SELECT
          rl.*
        FROM
          recipe_lines rl
        WHERE
          rl.product_id = r_item.product_id
          AND rl.product_option_id IS NOT DISTINCT FROM r_item.option_id
          LOOP
            n_lines := n_lines + 1;
            v_consumption := r_recipe.amount_per_kg_finished_product * v_kg;
            UPDATE
              ingredients
            SET
              quantity_on_hand = quantity_on_hand - v_consumption
            WHERE
              id = r_recipe.ingredient_id;
            INSERT INTO inventory_transactions (ingredient_id,
              delta,
              reason,
              order_id,
              created_by)
              VALUES (r_recipe.ingredient_id, - v_consumption, 'order_consumption'::inventory_tx_reason, p_order_id, v_actor);
          END LOOP;
      ELSE
        FOR r_recipe IN
        SELECT
          rl.*
        FROM
          recipe_lines rl
        WHERE
          rl.product_id = r_item.product_id
          AND rl.product_option_id IS NULL
          LOOP
            n_lines := n_lines + 1;
            v_consumption := r_recipe.amount_per_kg_finished_product * v_kg;
            UPDATE
              ingredients
            SET
              quantity_on_hand = quantity_on_hand - v_consumption
            WHERE
              id = r_recipe.ingredient_id;
            INSERT INTO inventory_transactions (ingredient_id,
              delta,
              reason,
              order_id,
              created_by)
              VALUES (r_recipe.ingredient_id, - v_consumption, 'order_consumption'::inventory_tx_reason, p_order_id, v_actor);
          END LOOP;
      END IF;
      IF n_lines = 0 THEN
        RAISE EXCEPTION 'Missing recipe for product % option %', r_item.product_id, r_item.option_id;
      END IF;
    END LOOP;
  UPDATE
    orders
  SET
    inventory_applied_at = now()
  WHERE
    id = p_order_id;
END;
$$;

REVOKE ALL ON FUNCTION private.apply_order_to_inventory (uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.confirm_order (p_order_id uuid)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
BEGIN
  IF NOT public.is_admin () THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF NOT EXISTS (
    SELECT
      1
    FROM
      orders
    WHERE
      id = p_order_id
      AND status = 'pending') THEN
  RAISE EXCEPTION 'invalid status';
END IF;
  UPDATE
    orders
  SET
    status = 'confirmed'
  WHERE
    id = p_order_id;
  PERFORM
    private.apply_order_to_inventory (p_order_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_order (uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.update_order_status (p_order_id uuid, p_next public.order_status)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
DECLARE
  cur public.order_status;
BEGIN
  IF NOT public.is_admin () THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  SELECT
    status INTO cur
  FROM
    orders
  WHERE
    id = p_order_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not found';
  END IF;
  IF cur = 'pending' AND p_next NOT IN ('confirmed', 'cancelled') THEN
    RAISE EXCEPTION 'invalid transition';
  END IF;
  IF cur = 'pending' AND p_next = 'confirmed' THEN
    RAISE EXCEPTION 'use confirm_order';
  END IF;
  IF cur = 'confirmed' AND p_next NOT IN ('in_progress', 'cancelled') THEN
    RAISE EXCEPTION 'invalid transition';
  END IF;
  IF cur = 'in_progress' AND p_next <> 'ready' THEN
    RAISE EXCEPTION 'invalid transition';
  END IF;
  IF cur = 'ready' AND p_next <> 'completed' THEN
    RAISE EXCEPTION 'invalid transition';
  END IF;
  IF cur IN ('completed', 'cancelled') THEN
    RAISE EXCEPTION 'terminal status';
  END IF;
  UPDATE
    orders
  SET
    status = p_next
  WHERE
    id = p_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_order_status (uuid, public.order_status) TO authenticated;

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

GRANT EXECUTE ON FUNCTION public.create_order_from_checkout (jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_order_manual (payload jsonb)
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
  IF NOT public.is_admin () THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  v_sub := (payload ->> 'subtotal')::numeric;
  INSERT INTO orders (status, source, created_by, customer_name, phone, notes, pickup_note, locale, subtotal, currency)
    VALUES ('pending', 'manual', auth.uid (), payload ->> 'customer_name', payload ->> 'phone', payload ->> 'notes', payload ->> 'pickup_note', payload ->> 'locale', v_sub, COALESCE(payload ->> 'currency', 'USD'))
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

GRANT EXECUTE ON FUNCTION public.create_order_manual (jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.adjust_inventory (p_ingredient_id uuid, p_delta numeric, p_reason public.inventory_tx_reason, p_notes text)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
BEGIN
  IF NOT public.is_admin () THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE
    ingredients
  SET
    quantity_on_hand = quantity_on_hand + p_delta
  WHERE
    id = p_ingredient_id;
  INSERT INTO inventory_transactions (ingredient_id, delta, reason, order_id, notes, created_by)
    VALUES (p_ingredient_id, p_delta, p_reason, NULL, p_notes, auth.uid ());
END;
$$;

GRANT EXECUTE ON FUNCTION public.adjust_inventory (uuid, numeric, public.inventory_tx_reason, text) TO authenticated;
