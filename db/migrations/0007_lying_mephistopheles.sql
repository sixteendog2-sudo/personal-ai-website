CREATE TABLE "object_blobs" (
	"key" text PRIMARY KEY NOT NULL,
	"body" bytea NOT NULL,
	"content_type" varchar(120) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "model_settings" ADD COLUMN "api_key_encrypted" text;--> statement-breakpoint
ALTER TABLE "model_settings" ADD COLUMN "api_key_last_four" varchar(4);
