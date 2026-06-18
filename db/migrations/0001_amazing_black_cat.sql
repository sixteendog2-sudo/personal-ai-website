ALTER TABLE "chat_sessions" ALTER COLUMN "related_record_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "knowledge_items" ALTER COLUMN "source_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "visitor_questions" ADD COLUMN "citations" jsonb DEFAULT '[]'::jsonb NOT NULL;