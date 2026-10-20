/** Project: a chase board scope (one event, one venue group, ...). */
import * as v from "valibot";
import { chaseRowStateSchema, channelSchema } from "./chase.js";

export const projectSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
  /** Free-form goal; engine reads it as JSON (plan: entities w/ JSON goal fields). */
  goal: v.optional(v.record(v.string(), v.unknown())),
  createdAt: v.pipe(v.string(), v.isoTimestamp()),
});
export type Project = v.InferOutput<typeof projectSchema>;

export const createProjectSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
  goal: v.optional(v.record(v.string(), v.unknown())),
});
export type CreateProject = v.InferInput<typeof createProjectSchema>;

/** One row on the chase board. */
export const entitySchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  projectId: v.pipe(v.string(), v.uuid()),
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
  contact: v.optional(v.pipe(v.string(), v.email())),
  channel: v.optional(channelSchema),
  status: chaseRowStateSchema,
  /** Missing deliverables, e.g. ["vector logo"]. */
  missing: v.array(v.pipe(v.string(), v.maxLength(200))),
  createdAt: v.pipe(v.string(), v.isoTimestamp()),
  updatedAt: v.pipe(v.string(), v.isoTimestamp()),
});
export type Entity = v.InferOutput<typeof entitySchema>;

export const createEntitySchema = v.omit(entitySchema, ["id", "createdAt", "updatedAt"]);
export type CreateEntity = v.InferInput<typeof createEntitySchema>;

export const updateEntitySchema = v.partial(v.omit(entitySchema, ["id", "projectId", "createdAt"]));
export type UpdateEntity = v.InferInput<typeof updateEntitySchema>;
