ALTER TABLE "media_assets" ADD COLUMN "checksum_sha256" varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "variant" varchar(32) DEFAULT 'original' NOT NULL;--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "parent_asset_id" uuid;--> statement-breakpoint
CREATE INDEX "media_assets_owner_parent_idx" ON "media_assets" USING btree ("owner_id","parent_asset_id");