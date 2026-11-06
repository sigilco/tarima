import { defineTool } from "eve/tools";
import { z } from "zod";
import * as v from "valibot";
import { briefSchema, type Brief } from "@tarima/contract";
import { getProject, updateProject } from "@tarima/api/services/projects";
import { db, callerUserId } from "../lib/tarima";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD");

/**
 * Brief capture: persist the event brief into `projects.goal.brief`,
 * the namespaced key `get_project_context` already reads. Validated
 * against the contract `briefSchema` — the same shape the brief form
 * writes — so the agent's brief and a form brief are interchangeable.
 *
 * The write merges into the existing goal record (other keys the
 * engine or older rows put there are preserved). Internal write,
 * ungated like `update_task`.
 */
export default defineTool({
  description:
    "Save or update the structured event brief of one of the calling user's projects in tarima (event type, city, date or date window, headcount, budget, currency, venue requirements, sponsor wants, notes). Call this once the user has described the event, and again whenever the brief changes — get_project_context reads it back.",
  inputSchema: z.object({
    projectId: z.string().describe("The project the brief belongs to."),
    eventType: z.string().min(1).max(100).describe("e.g. 'founder dinner', 'demo night'."),
    city: z.string().min(1).max(100).describe("Event city."),
    date: isoDate.optional().describe("Fixed day YYYY-MM-DD. Use window when flexible."),
    window: z
      .object({ start: isoDate, end: isoDate })
      .optional()
      .describe("Flexible dates, inclusive YYYY-MM-DD range."),
    headcount: z.number().int().min(1).max(100000),
    budgetAmount: z.number().min(0),
    currency: z
      .string()
      .regex(/^[A-Z]{3}$/, "ISO 4217, upper case")
      .describe("e.g. EUR, USD."),
    venueRequirements: z.string().max(2000).optional(),
    sponsors: z
      .object({
        wanted: z.boolean(),
        tiers: z.array(z.string().min(1).max(100)).optional(),
        deliverables: z.array(z.string().min(1).max(200)).optional(),
      })
      .optional(),
    notes: z.string().max(4000).optional(),
  }),
  async execute(input, ctx) {
    const userId = callerUserId(ctx);
    if (!userId) return { error: "unauthorized" };
    const project = getProject(db, input.projectId, userId);
    if (!project) return { error: "not_found" };

    const { projectId: _projectId, ...brief } = input;
    const parsed = v.safeParse(briefSchema, brief);
    if (!parsed.success) return { error: "invalid_brief" };

    const goal = { ...project.goal, brief: parsed.output as Brief };
    const updated = updateProject(db, input.projectId, { goal });
    if (!updated) return { error: "invalid_brief" };
    return { project: updated };
  },
});
