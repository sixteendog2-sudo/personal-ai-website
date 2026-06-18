CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
ALTER TABLE "knowledge_chunks"
  ALTER COLUMN "embedding" SET DATA TYPE vector(1536)
  USING CASE
    WHEN "embedding" IS NULL OR btrim("embedding") = '' THEN NULL
    ELSE "embedding"::vector
  END;--> statement-breakpoint
CREATE INDEX "knowledge_chunks_embedding_hnsw_idx" ON "knowledge_chunks" USING hnsw ("embedding" vector_cosine_ops);
