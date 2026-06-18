CREATE TABLE "model_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"provider" varchar(50) NOT NULL,
	"base_url" text NOT NULL,
	"model" varchar(120) NOT NULL,
	"temperature_milli" integer DEFAULT 700 NOT NULL,
	"max_tokens" integer DEFAULT 1200 NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "owner_profiles" (
	"owner_id" uuid PRIMARY KEY NOT NULL,
	"nickname" varchar(120) NOT NULL,
	"real_name" varchar(120),
	"headline" varchar(300) DEFAULT '' NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"city" varchar(120) DEFAULT '' NOT NULL,
	"contact" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"visibility" "visibility" DEFAULT 'public' NOT NULL,
	"is_ai_usable" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"scene" varchar(50) DEFAULT 'default' NOT NULL,
	"system_prompt" text NOT NULL,
	"safety_prompt" text DEFAULT '' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "model_settings" ADD CONSTRAINT "model_settings_owner_id_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_profiles" ADD CONSTRAINT "owner_profiles_owner_id_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_templates" ADD CONSTRAINT "prompt_templates_owner_id_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "model_settings_owner_active_idx" ON "model_settings" USING btree ("owner_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "prompt_templates_owner_name_version_uidx" ON "prompt_templates" USING btree ("owner_id","name","version");--> statement-breakpoint
CREATE INDEX "prompt_templates_owner_scene_active_idx" ON "prompt_templates" USING btree ("owner_id","scene","is_active");