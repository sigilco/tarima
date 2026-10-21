import { describe, expect, it } from "vitest";
import { mcpToolNames } from "@tarima/contract";
import { capabilitiesPayload } from "./capabilities";

describe("capabilities catalog", () => {
  it("is deterministic", () => {
    expect(capabilitiesPayload()).toEqual(capabilitiesPayload());
  });

  it("sorts every list", () => {
    const payload = capabilitiesPayload();

    const paths = payload.routes.map((route) => route.path);
    expect(paths.toSorted((a, b) => a.localeCompare(b))).toEqual(paths);

    const toolNames = payload.mcpTools.map((tool) => tool.name);
    expect(toolNames.toSorted()).toEqual(toolNames);

    expect(payload.scopes.toSorted()).toEqual(payload.scopes);
  });

  it("publishes exactly the contract tools", () => {
    const payload = capabilitiesPayload();
    expect(payload.mcpTools.map((tool) => tool.name).toSorted()).toEqual(mcpToolNames.toSorted());
  });

  it("lists a scope for every route that needs one", () => {
    const publicRoutes = new Set(["/api/health", "/api/access-requests", "/capabilities"]);
    for (const route of capabilitiesPayload().routes) {
      if (publicRoutes.has(route.path)) continue;
      expect(route.scopes.length).toBeGreaterThan(0);
    }
  });
});
