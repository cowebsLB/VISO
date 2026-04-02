-- Seed categories, catalog, ingredients, BOM (runs as superuser; bypasses RLS)

INSERT INTO product_categories (id, slug, sort_order)
  VALUES ('c1111111-1111-4111-8111-000000000001', 'bread', 1),
('c1111111-1111-4111-8111-000000000002', 'cookies', 2),
('c1111111-1111-4111-8111-000000000003', 'cakes', 3);

INSERT INTO ingredients (id, name, category, track_unit, cost_per_unit, quantity_on_hand, low_stock_threshold)
  VALUES ('11111111-1111-4111-8111-111111111111', 'Flour', 'dry', 'kg', 2.50, 1000, 50),
('22222222-2222-4222-8222-222222222222', 'Butter', 'dairy', 'kg', 8.00, 500, 20);

INSERT INTO products (id, category_id, is_active, weight_per_sale_unit_kg, image_path)
  VALUES ('kaak', 'c1111111-1111-4111-8111-000000000001', TRUE, 1.0, '/images/products/plain-kaak.webp'),
('maamoul-pistachio', 'c1111111-1111-4111-8111-000000000002', TRUE, 1.0, '/images/products/maamoul-pistachio.webp'),
('brioche', 'c1111111-1111-4111-8111-000000000001', TRUE, 1.0, '/images/products/brioche.webp'),
('armenian-gata', 'c1111111-1111-4111-8111-000000000003', TRUE, 1.0, '/images/products/armenian-gata.webp');

INSERT INTO product_options (product_id, id, sort_order, unit_price, weight_per_sale_unit_kg)
  VALUES ('kaak', 'salty', 1, 15.0, NULL),
('kaak', 'sweet', 2, 20.0, NULL),
('kaak', 'dates', 3, 22.0, NULL),
('maamoul-pistachio', 'dates', 1, 22.0, NULL),
('maamoul-pistachio', 'pistachio', 2, 26.0, NULL),
('maamoul-pistachio', 'walnut', 3, 24.0, NULL),
('brioche', 'plain', 1, 22.0, NULL),
('brioche', 'raisin', 2, 24.0, NULL),
('brioche', 'chocolate', 3, 28.0, NULL),
('armenian-gata', 'classic', 1, 30.0, NULL);

INSERT INTO product_i18n (product_id, locale, name, description)
  VALUES ('kaak', 'en', 'Kaak', 'Traditional kaak available with multiple fillings.'),
('kaak', 'ar', 'كعك', 'كعك تقليدي متوفر بعدة حشوات.'),
('kaak', 'hy', 'Քաաք', 'Ավանդական քաաք՝ տարբեր միջուկներով։'),
('maamoul-pistachio', 'en', 'Maamoul', 'Traditional maamoul with multiple fillings.'),
('maamoul-pistachio', 'ar', 'معمول', 'معمول تقليدي بعدة حشوات.'),
('maamoul-pistachio', 'hy', 'Մամուլ', 'Ավանդական մամուլ՝ տարբեր միջուկներով։'),
('brioche', 'en', 'Brioche', 'Soft and rich brioche with flavor options.'),
('brioche', 'ar', 'بريوش', 'بريوش طري وغني مع خيارات نكهة.'),
('brioche', 'hy', 'Բրիոշ', 'Փափուկ և հարուստ բրիոշ՝ տարբերակներով։'),
('armenian-gata', 'en', 'Armenian Gata', 'Traditional Armenian sweet bread with a rich buttery filling.'),
('armenian-gata', 'ar', 'غاتا أرمينية', 'خبز حلو أرمني تقليدي بحشوة زبدية غنية.'),
('armenian-gata', 'hy', 'Հայկական գաթա', 'Ավանդական հայկական քաղցր խմորեղեն՝ հարուստ կարագային միջուկով։');

INSERT INTO product_option_i18n (product_id, option_id, locale, name, description)
  VALUES ('kaak', 'salty', 'en', '1 KG Salty Kaak', 'Classic salty kaak.'),
('kaak', 'salty', 'ar', '1 كغ كعك مالح', 'كعك مالح كلاسيكي.'),
('kaak', 'salty', 'hy', '1 կգ աղի քաաք', 'Դասական աղի քաաք։'),
('kaak', 'sweet', 'en', '1 KG Sweet Kaak', 'Sweet kaak version.'),
('kaak', 'sweet', 'ar', '1 كغ كعك حلو', 'نسخة الكعك الحلو.'),
('kaak', 'sweet', 'hy', '1 կգ քաղցր քաաք', 'Քաղցր քաաք տարբերակ։'),
('kaak', 'dates', 'en', '1 KG Kaak Dates', 'Kaak filled with date paste.'),
('kaak', 'dates', 'ar', '1 كغ كعك بالتمر', 'كعك محشو بمعجون التمر.'),
('kaak', 'dates', 'hy', '1 կգ քաաք արմավով', 'Արմավի միջուկով քաաք։'),
('maamoul-pistachio', 'dates', 'en', '1 KG Maamoul Dates', 'Maamoul with date filling.'),
('maamoul-pistachio', 'dates', 'ar', '1 كغ معمول تمر', 'معمول بحشوة تمر.'),
('maamoul-pistachio', 'dates', 'hy', '1 կգ մամուլ արմավով', 'Մամուլ արմավի միջուկով։'),
('maamoul-pistachio', 'pistachio', 'en', '1 KG Maamoul Pistachio', 'Maamoul with pistachio filling.'),
('maamoul-pistachio', 'pistachio', 'ar', '1 كغ معمول فستق', 'معمول بحشوة فستق.'),
('maamoul-pistachio', 'pistachio', 'hy', '1 կգ մամուլ պիստակով', 'Մամուլ պիստակի միջուկով։'),
('maamoul-pistachio', 'walnut', 'en', '1 KG Maamoul Walnut', 'Maamoul with walnut filling.'),
('maamoul-pistachio', 'walnut', 'ar', '1 كغ معمول جوز', 'معمول بحشوة جوز.'),
('maamoul-pistachio', 'walnut', 'hy', '1 կգ մամուլ ընկույզով', 'Մամուլ ընկույզի միջուկով։'),
('brioche', 'plain', 'en', '1 KG Brioche', 'Classic plain brioche.'),
('brioche', 'plain', 'ar', '1 كغ بريوش', 'بريوش سادة كلاسيكي.'),
('brioche', 'plain', 'hy', '1 կգ բրիոշ', 'Դասական պարզ բրիոշ։'),
('brioche', 'raisin', 'en', '1 KG Brioche Raisin', 'Brioche with raisins.'),
('brioche', 'raisin', 'ar', '1 كغ بريوش زبيب', 'بريوش مع الزبيب.'),
('brioche', 'raisin', 'hy', '1 կգ բրիոշ չամիչով', 'Բրիոշ չամիչով։'),
('brioche', 'chocolate', 'en', '1 KG Brioche Chocolate', 'Brioche with chocolate filling.'),
('brioche', 'chocolate', 'ar', '1 كغ بريوش شوكولا', 'بريوش بحشوة شوكولا.'),
('brioche', 'chocolate', 'hy', '1 կգ շոկոլադե բրիոշ', 'Բրիոշ շոկոլադե միջուկով։'),
('armenian-gata', 'classic', 'en', '1 KG Armenian Gata', 'Classic Armenian gata.'),
('armenian-gata', 'classic', 'ar', '1 كغ غاتا أرمينية', 'غاتا أرمينية كلاسيكية.'),
('armenian-gata', 'classic', 'hy', '1 կգ հայկական գաթա', 'Դասական հայկական գաթա։');

-- BOM: flour + butter per kg finished product (same for every variant in v1 seed)
INSERT INTO recipe_lines (product_id, product_option_id, ingredient_id, amount_per_kg_finished_product)
  SELECT
    po.product_id,
    po.id,
    '11111111-1111-4111-8111-111111111111'::uuid,
    0.5
  FROM
    product_options po;

INSERT INTO recipe_lines (product_id, product_option_id, ingredient_id, amount_per_kg_finished_product)
  SELECT
    po.product_id,
    po.id,
    '22222222-2222-4222-8222-222222222222'::uuid,
    0.1
  FROM
    product_options po;
