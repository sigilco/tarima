/**
 * MCP tool implementations.
 *
 * Every tool delegates to the SAME service functions the REST routes
 * use, so a project created over MCP is byte-for-byte the same project
 * a POST /api/projects would have created. This module is the single
 * place where a tool name maps to an operation; the MCP route owns the
 * JSON-RPC envelope, this module owns the behaviour.
 *
 * SP7 teardown: the workflow trigger tool is deferred with the rest of
 * the workflow engine (the mcp.ts route stays mounted but its tools
 * shrink to the project/entity operations that survive).
 */
import type { McpToolName } from "@tarima/contract";
import { db } from "../db";
import {
  createEntity,
  listEntities,
  updateEntity,
  type CreateEntityInput,
  type UpdateEntityInput,
} from "./entities";
import { createProject, getProject, listProjects } from "./projects";

/** The scope each tool needs. */
export const TOOL_SCOPES: Record<McpToolName, string> = {
  "projects.list": "projects:read",
  "projects.create": "projects:write",
  "entities.list": "entities:read",
  "entities.create": "entities:write",
  "entities.update": "entities:write",
  "workflow.trigger": "workflows:write",
};

/** One-line description per tool, surfaced in tools/list. */
export const TOOL_DESCRIPTIONS: Record<McpToolName, string> = {
  "projects.list": "List every chase project.",
  "projects.create": "Create a chase project.",
  "entities.list": "List the entities (board rows) of a project.",
  "entities.create": "Add an entity (board row) to a project.",
  "entities.update": "Patch an entity (board row).",
  "workflow.trigger": "Trigger a workflow template for a project.",
};

/**
 * Run a tool. The arguments are already validated against the
 * contract schema by the caller. Returns the value the tool produces;
 * the MCP route wraps it in a text content block.
 */
export function runTool(name: McpToolName, args: Record<string, unknown>): unknown {
  switch (name) {
    case "projects.list":
      return { projects: listProjects(db) };
    case "projects.create": {
      const input = args as { name: string; goal?: Record<string, unknown> };
      return { project: createProject(db, input) };
    }
    case "entities.list": {
      const input = args as { projectId: string };
      if (!getProject(db, input.projectId)) return { error: "not_found" };
      return { entities: listEntities(db, input.projectId) };
    }
    case "entities.create": {
      const input = args as unknown as CreateEntityInput;
      if (!getProject(db, input.projectId)) return { error: "not_found" };
      return { entity: createEntity(db, input) };
    }
    case "entities.update": {
      const input = args as unknown as UpdateEntityInput & { entityId: string };
      const entity = updateEntity(db, input.entityId, input);
      if (!entity) return { error: "not_found" };
      return { entity };
    }
    // SP7: the workflow engine is removed; the tool stays in the
    // contract's name list (mcp.ts is deferred, not rewritten), so this
    // arm answers the stable "no engine" error instead of importing the
    // deleted service.
    case "workflow.trigger":
      return { error: "engine_removed" };
    default: {
      const exhaustive: never = name;
      throw new Error(`unknown tool: ${String(exhaustive)}`);
    }
  }
}
