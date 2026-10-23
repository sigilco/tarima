/**
 * MCP tool contracts (POST /mcp, Stage 3). Tools are the parity surface:
 * every tool call validates args and returns the same schema the REST API
 * returns, so curl/MCP/UI give identical results.
 */
import * as v from "valibot";
import { createEntitySchema, createProjectSchema, updateEntitySchema } from "./project.js";

export const mcpToolNames = [
  "projects.list",
  "projects.create",
  "entities.list",
  "entities.create",
  "entities.update",
  "workflow.trigger",
] as const;
export type McpToolName = (typeof mcpToolNames)[number];

export const mcpToolSchemas = {
  "projects.list": v.object({}),
  "projects.create": createProjectSchema,
  "entities.list": v.object({ projectId: v.pipe(v.string(), v.uuid()) }),
  "entities.create": createEntitySchema,
  "entities.update": v.intersect([
    updateEntitySchema,
    v.object({ entityId: v.pipe(v.string(), v.uuid()) }),
  ]),
  "workflow.trigger": v.object({
    projectId: v.pipe(v.string(), v.uuid()),
    /** Template id, e.g. "chase-deliverables". */
    template: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  }),
} satisfies Record<McpToolName, v.GenericSchema>;

export type McpToolArgs<T extends McpToolName> = v.InferInput<(typeof mcpToolSchemas)[T]>;
