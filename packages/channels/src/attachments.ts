import { createHash } from "node:crypto";
import { gzip } from "node:zlib";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const gzipAsync = promisify(gzip);

/**
 * Where attachments live. The api app binds this to the filesystem under
 * the VPS data dir; tests bind it to a temp dir.
 */
export interface AttachmentStore {
  /** Store the bytes and return the path they were written to. */
  save(entityId: string, filename: string, bytes: Buffer): Promise<string>;
}

export interface FileAttachmentStoreConfig {
  /** Root directory. Defaults to DATA_DIR/attachments. */
  dir?: string;
  /** Called on write errors so the caller can log them. */
  onError?: (err: unknown) => void;
}

/**
 * Filesystem attachment store. Bytes are gzip compressed and written under
 * a per-entity directory. The file name is content addressed so the same
 * bytes are stored once.
 */
export function createFileAttachmentStore(config: FileAttachmentStoreConfig = {}): AttachmentStore {
  const root = config.dir ?? path.join(process.env.DATA_DIR ?? "./data", "attachments");

  return {
    async save(entityId: string, filename: string, bytes: Buffer): Promise<string> {
      const digest = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
      const safeName = filename.replace(/[^\w.-]+/g, "_").slice(0, 120) || "attachment";
      const dir = path.join(root, entityId);
      const target = path.join(dir, `${digest}-${safeName}.gz`);
      try {
        await mkdir(dir, { recursive: true });
        await writeFile(target, await gzipAsync(bytes));
      } catch (err) {
        config.onError?.(err);
        throw err;
      }
      return target;
    },
  };
}
