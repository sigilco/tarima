import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { mcpToolNames } from "@tarima/contract";

// The database url must be set BEFORE the db module is imported: the
// api opens the sqlite file at import time.
const dir = mkdtempSync(join(tmpdir(), "tarima-mcp-"));
process.env.DATABASE_URL = join(dir, "test.db");
process.env.NODE_ENV = "test";

const { Hono } = await import("hono");
const { db } = await import("../db");
const { users } = await import("../db/schema");
const { mcpRoutes } = await import("./mcp");
const { createApiKeyForUser } = await import("../services/api-key-auth");

afterAll(() => rmSync(dir, { recursive: true, force: true }));

const USER_ID = "user-mcp";

if (db.select().from(users).all().length === 0) {
  db.insert(users).values({ id: USER_ID, email: "mcp@tarima.test", createdAt: Date.now() }).run();
}

const KEY = createApiKeyForUser(USER_ID, "test", [
  "projects:read",
  "projects:write",
  "entities:read",
  "entities:write",
  "workflows:write",
]).secret;

const app = new Hono().route("/", mcpRoutes);

const rpc = (method: string, params?: unknown, id: unknown = 1) => ({
  method: "POST",
  headers: { Authorization: `Bearer ${KEY}`, "content-type": "application/json" },
  body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
});

/** Read the JSON value out of a tool result content block. */
function toolValue(result: { content?: { text: string }[] }): unknown {
  const text = result.content?.[0]?.text ?? "{}";
  return JSON.parse(text);
}

describe("mcp endpoint", () => {
  it("answers 401 without a valid bearer key", async () => {
    const res = await app.request("/mcp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize" }),
    });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
  });

  it("initializes with the protocol version and server info", async () => {
    const res = await app.request("/mcp", rpc("initialize"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      jsonrpc: string;
      id: number;
      result: {
        protocolVersion: string;
        capabilities: unknown;
        serverInfo: { name: string; version: string };
      };
    };
    expect(body.jsonrpc).toBe("2.0");
    expect(body.id).toBe(1);
    expect(body.result.protocolVersion).toBe("2024-11-05");
    expect(body.result.capabilities).toEqual({ tools: {} });
    expect(body.result.serverInfo).toEqual({ name: "tarima", version: "0.1.0" });
  });

  it("lists exactly the six contract tools", async () => {
    const res = await app.request("/mcp", rpc("tools/list"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      result: { tools: { name: string; description: string; inputSchema: unknown }[] };
    };
    expect(body.result.tools.map((tool) => tool.name).toSorted()).toEqual(mcpToolNames.toSorted());
    expect(body.result.tools).toHaveLength(6);
    for (const tool of body.result.tools) {
      expect(tool.description.length).toBeGreaterThan(0);
      expect(tool.inputSchema).toMatchObject({ type: "object" });
    }
  });

  it("creates a project and lists it back", async () => {
    const created = await app.request(
      "/mcp",
      rpc("tools/call", {
        name: "projects.create",
        arguments: { name: "mcp project", goal: { source: "mcp" } },
      }),
    );
    expect(created.status).toBe(200);
    const createdBody = (await created.json()) as {
      result: { content: { text: string }[]; isError: boolean };
    };
    expect(createdBody.result.isError).toBe(false);
    const createdValue = toolValue(createdBody.result) as {
      project: { id: string; name: string; goal: Record<string, unknown> };
    };
    expect(createdValue.project.name).toBe("mcp project");
    expect(createdValue.project.goal).toEqual({ source: "mcp" });

    const listed = await app.request("/mcp", rpc("tools/call", { name: "projects.list" }));
    const listedBody = (await listed.json()) as { result: { content: { text: string }[] } };
    const listedValue = toolValue(listedBody.result) as { projects: { id: string }[] };
    expect(listedValue.projects.map((p) => p.id)).toContain(createdValue.project.id);
  });

  it("answers a tool call with invalid arguments as isError, not a 400", async () => {
    const res = await app.request(
      "/mcp",
      rpc("tools/call", { name: "projects.create", arguments: { name: "" } }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      result: { content: { text: string }[]; isError: boolean };
    };
    expect(body.result.isError).toBe(true);
    expect(JSON.parse(body.result.content[0].text)).toMatchObject({ error: "invalid_request" });
  });

  it("answers 405 for GET and DELETE", async () => {
    const get = await app.request("/mcp", { headers: { Authorization: `Bearer ${KEY}` } });
    expect(get.status).toBe(405);

    const del = await app.request("/mcp", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${KEY}` },
    });
    expect(del.status).toBe(405);
  });

  it("answers 202 with an empty body for the initialized notification", async () => {
    const res = await app.request("/mcp", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
    });
    expect(res.status).toBe(202);
    expect(await res.text()).toBe("");
  });

  it("answers -32601 for an unknown method", async () => {
    const res = await app.request("/mcp", rpc("does/not/exist"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { error: { code: number; message: string } };
    expect(body.error).toEqual({ code: -32601, message: "Method not found" });
  });
});
