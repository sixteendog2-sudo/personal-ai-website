CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS knowledge_items_title_trgm_idx
  ON knowledge_items USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS knowledge_items_category_trgm_idx
  ON knowledge_items USING gin (category gin_trgm_ops);

CREATE INDEX IF NOT EXISTS knowledge_items_body_trgm_idx
  ON knowledge_items USING gin (body gin_trgm_ops);
