import { gunzip } from "node:zlib";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterAll, describe, expect, it } from "vitest";
import { createFileAttachmentStore } from "../src/attachments";

const gunzipAsync = promisify(gunzip);

const dir = await new Promise<string>((resolve) => {
  const unique = `${process.pid}-${Date.now()}`;
  resolve(path.join(tmpdir(), `tarima-attachments-test-${unique}`));
});
afterAll(async () => {
  const { rm } = await import("node:fs/promises");
  await rm(dir, { recursive: true, force: true });
});

describe("createFileAttachmentStore", () => {
  it("stores gzip compressed bytes under the entity dir and returns the path", async () => {
    const store = createFileAttachmentStore({ dir });
    const bytes = Buffer.from("invoice pdf bytes");
    const stored = await store.save("entity-1", "invoice.pdf", bytes);

    expect(stored.startsWith(path.join(dir, "entity-1"))).toBe(true);
    expect(stored.endsWith(".gz")).toBe(true);
    const round = await gunzipAsync(await readFile(stored));
    expect(round.equals(bytes)).toBe(true);
  });

  it("content addresses the file so identical bytes store once", async () => {
    const store = createFileAttachmentStore({ dir });
    const bytes = Buffer.from("same");
    const a = await store.save("entity-1", "a.txt", bytes);
    const b = await store.save("entity-1", "b.txt", bytes);
    expect(path.dirname(a)).toBe(path.dirname(b));
  });

  it("sanitizes hostile filenames", async () => {
    const store = createFileAttachmentStore({ dir });
    const stored = await store.save("entity-2", "../../etc/passwd", Buffer.from("x"));
    const name = path.basename(stored);
    expect(name).not.toMatch(/\//);
    expect(stored.startsWith(path.join(dir, "entity-2"))).toBe(true);
  });
});
