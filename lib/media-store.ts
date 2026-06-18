import { createHash } from "crypto";
import { and, desc, eq } from "drizzle-orm";
import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";
import { getDatabase } from "@/db/client";
import { adminAuditLogs, contentItems, contentMedia, mediaAssets } from "@/db/schema";
import { getObjectStorage } from "@/lib/storage";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxUploadBytes = 15 * 1024 * 1024;

type Actor = { ownerId: string; adminUserId: string; ipHash: string };

export class MediaValidationError extends Error {}

export async function uploadImage(actor: Actor, file: File, altText?: string) {
  if (file.size <= 0 || file.size > maxUploadBytes) throw new MediaValidationError("Image must be between 1 byte and 15 MB");
  const original = new Uint8Array(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(original);
  if (!detected || !allowedMimeTypes.has(detected.mime)) throw new MediaValidationError("Only JPEG, PNG and WebP images are allowed");

  const image = sharp(original, { failOn: "warning" }).rotate();
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height) throw new MediaValidationError("Image dimensions could not be read");
  if (metadata.width * metadata.height > 80_000_000) throw new MediaValidationError("Image dimensions are too large");

  const thumbnail = new Uint8Array(await image.clone().resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer());
  const now = new Date();
  const directory = `${actor.ownerId}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}`;
  const originalKey = `${directory}/original.${detected.ext}`;
  const thumbnailKey = `${directory}/thumbnail.webp`;
  const storage = getObjectStorage();
  const written: string[] = [];

  try {
    await storage.put({ key: originalKey, body: original, contentType: detected.mime });
    written.push(originalKey);
    await storage.put({ key: thumbnailKey, body: thumbnail, contentType: "image/webp" });
    written.push(thumbnailKey);

    return await getDatabase().transaction(async (tx) => {
      const [originalAsset] = await tx.insert(mediaAssets).values({
        ownerId: actor.ownerId, storageKey: originalKey, originalName: file.name,
        mimeType: detected.mime, sizeBytes: original.byteLength, width: metadata.width, height: metadata.height,
        altText: altText?.trim() || null, checksumSha256: createHash("sha256").update(original).digest("hex"), variant: "original"
      }).returning();
      const thumbMetadata = await sharp(thumbnail).metadata();
      const [thumbnailAsset] = await tx.insert(mediaAssets).values({
        ownerId: actor.ownerId, storageKey: thumbnailKey, originalName: `${file.name}.thumbnail.webp`,
        mimeType: "image/webp", sizeBytes: thumbnail.byteLength, width: thumbMetadata.width, height: thumbMetadata.height,
        altText: altText?.trim() || null, checksumSha256: createHash("sha256").update(thumbnail).digest("hex"),
        variant: "thumbnail", parentAssetId: originalAsset.id
      }).returning();
      await tx.insert(adminAuditLogs).values({
        ownerId: actor.ownerId, adminUserId: actor.adminUserId, action: "media.upload",
        resourceType: "media_asset", resourceId: originalAsset.id,
        changes: { original: originalAsset, thumbnailId: thumbnailAsset.id }, ipHash: actor.ipHash
      });
      return { original: originalAsset, thumbnail: thumbnailAsset };
    });
  } catch (error) {
    await Promise.allSettled(written.map((key) => storage.delete(key)));
    throw error;
  }
}

export async function listMediaAssets(ownerId: string) {
  const assets = await getDatabase().select().from(mediaAssets)
    .where(eq(mediaAssets.ownerId, ownerId))
    .orderBy(desc(mediaAssets.createdAt));
  return assets.filter((asset) => asset.variant === "original").map((asset) => ({
    ...asset,
    thumbnail: assets.find((candidate) => candidate.parentAssetId === asset.id) ?? null
  }));
}

export async function attachMediaToContent(actor: Actor, contentId: string, mediaId: string, sortOrder: number) {
  return getDatabase().transaction(async (tx) => {
    const [content] = await tx.select().from(contentItems).where(and(eq(contentItems.id, contentId), eq(contentItems.ownerId, actor.ownerId))).limit(1);
    const [media] = await tx.select().from(mediaAssets).where(and(eq(mediaAssets.id, mediaId), eq(mediaAssets.ownerId, actor.ownerId), eq(mediaAssets.variant, "original"))).limit(1);
    if (!content || !media) return null;
    const [link] = await tx.insert(contentMedia).values({ contentId, mediaId, sortOrder }).onConflictDoUpdate({
      target: [contentMedia.contentId, contentMedia.mediaId], set: { sortOrder }
    }).returning();
    await tx.insert(adminAuditLogs).values({
      ownerId: actor.ownerId, adminUserId: actor.adminUserId, action: "content.media.attach",
      resourceType: "content_item", resourceId: contentId, changes: { mediaId, sortOrder }, ipHash: actor.ipHash
    });
    return link;
  });
}

export async function getDeliverableMedia(assetId: string, adminOwnerId?: string) {
  const db = getDatabase();
  const [asset] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, assetId)).limit(1);
  if (!asset) return null;
  if (adminOwnerId === asset.ownerId) return asset;

  const linkedId = asset.parentAssetId ?? asset.id;
  const [allowed] = await db.select({ id: contentItems.id }).from(contentMedia)
    .innerJoin(contentItems, eq(contentMedia.contentId, contentItems.id))
    .where(and(
      eq(contentMedia.mediaId, linkedId), eq(contentItems.ownerId, asset.ownerId),
      eq(contentItems.status, "published"), eq(contentItems.visibility, "public")
    )).limit(1);
  return allowed ? asset : null;
}
