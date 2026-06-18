CREATE TABLE "api_rate_limit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key_hash" varchar(64) NOT NULL,
	"action" varchar(80) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "api_rate_limit_events_lookup_idx" ON "api_rate_limit_events" USING btree ("key_hash","action","created_at");