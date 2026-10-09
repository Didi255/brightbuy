-- =========================================================================
-- 016 — Align product description column name with SCHEMA.md  OWNER: M2
-- =========================================================================

ALTER TABLE product RENAME COLUMN product_description TO description;
