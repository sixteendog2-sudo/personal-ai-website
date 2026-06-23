import { mkdir, readFile, rename, rm, writeFile } from "fs/promises";
import path from "path";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "@/lib/config";
import { eq } from "drizzle-orm";
import { getDatabase } from "@/db/client";
import { objectBlobs } from "@/db/schema";

export type StoredObject = { key: string; body: Uint8Array; contentType: string };

interface ObjectStorage {
  put(object: StoredObject): Promise<void>;
  get(key: string): Promise<Uint8Array>;
  delete(key: string): Promise<void>;
}

class LocalStorage implements ObjectStorage {
  private root = path.resolve(process.cwd(), "storage", "uploads");

  private resolveKey(key: string) {
    const target = path.resolve(this.root, key.replaceAll("/", path.sep));
    if (!target.startsWith(`${this.root}${path.sep}`)) throw new Error("Invalid storage key");
    return target;
  }

  async put(object: StoredObject) {
    const target = this.resolveKey(object.key);
    await mkdir(path.dirname(target), { recursive: true });
    const temp = `${target}.${crypto.randomUUID()}.tmp`;
    await writeFile(temp, object.body);
    await rename(temp, target);
  }

  async get(key: string) {
    return readFile(this.resolveKey(key));
  }

  async delete(key: string) {
    await rm(this.resolveKey(key), { force: true });
  }
}

class S3Storage implements ObjectStorage {
  private client: S3Client;

  constructor() {
    if (!env.S3_REGION || !env.S3_BUCKET || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
      throw new Error("S3 storage requires region, bucket and credentials");
    }
    this.client = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      forcePathStyle: env.S3_FORCE_PATH_STYLE === "true",
      credentials: { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY }
    });
  }

  async put(object: StoredObject) {
    await this.client.send(new PutObjectCommand({ Bucket: env.S3_BUCKET!, Key: object.key, Body: object.body, ContentType: object.contentType }));
  }

  async get(key: string) {
    const response = await this.client.send(new GetObjectCommand({ Bucket: env.S3_BUCKET!, Key: key }));
    if (!response.Body) throw new Error("Stored object has no body");
    return response.Body.transformToByteArray();
  }

  async delete(key: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET!, Key: key }));
  }
}

class DatabaseStorage implements ObjectStorage {
  async put(object: StoredObject) {
    await getDatabase().insert(objectBlobs).values({
      key: object.key,
      body: Buffer.from(object.body),
      contentType: object.contentType
    }).onConflictDoUpdate({
      target: objectBlobs.key,
      set: { body: Buffer.from(object.body), contentType: object.contentType, updatedAt: new Date() }
    });
  }

  async get(key: string) {
    const [object] = await getDatabase().select({ body: objectBlobs.body }).from(objectBlobs)
      .where(eq(objectBlobs.key, key)).limit(1);
    if (!object) throw new Error("Stored object not found");
    return new Uint8Array(object.body);
  }

  async delete(key: string) {
    await getDatabase().delete(objectBlobs).where(eq(objectBlobs.key, key));
  }
}

let storage: ObjectStorage | undefined;

export function getObjectStorage(): ObjectStorage {
  storage ??= env.STORAGE_DRIVER === "s3"
    ? new S3Storage()
    : env.STORAGE_DRIVER === "local"
      ? new LocalStorage()
      : new DatabaseStorage();
  return storage;
}
