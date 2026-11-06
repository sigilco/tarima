import { defineTool } from "eve/tools";
import { z } from "zod";
import { CHANNELS, CHASE_ROW_STATES } from "@tarima/contract";
import { getProject } from "@tarima/api/services/projects";
import { createEntity } from "@tarima/api/services/entities";
import { db, callerUserId } from "../lib/tarima";

/**
 * Candidate intake (scout step 3): stage a board row the agent found —
 * a venue or sponsor candidate — through the SAME `createEntity`
 * service the REST/MCP path uses, so the row is byte-identical to one
 * created over MCP. Internal board write: ungated like `update_task`;
 * `send_*` stays the gated family.
 *
 * Ownership mirrors the other tools: the project must belong to the
 * session principal; another user's project reads as not_found.
 */
export default defineTool({
  description:
    "Add a candidate venue or sponsor to one of the calling user's projects in tarima, as a new board row. Use after research (list_venues, web results the user confirmed) — the row lands with the given status (default 'candidate', the curated shortlist state) and shows up on the project board for the user to approve or chase.",
  inputSchema: z.object({
    projectId: z.string().describe("The project the candidate belongs to."),
    name: z.string().min(1).max(200).describe("Candidate name, e.g. the venue or company."),
    contact: z.string().email().optional().describe("Verified contact email, if known."),
    channel: z.enum(CHANNELS).optional().describe("Outreach channel, if known."),
    status: z
      .enum(CHASE_ROW_STATES)
      .optional()
      .describe("Board status (contract states). Defaults to 'candidate'."),
    missing: z
      .array(z.string().max(200))
      .optional()
      .describe("Missing deliverables or info, e.g. ['vector logo', 'contact email']."),
  }),
  async execute(input, ctx) {
    const userId = callerUserId(ctx);
    if (!userId) return { error: "unauthorized" };
    const project = getProject(db, input.projectId, userId);
    if (!project) return { error: "not_found" };
    const entity = createEntity(db, {
      projectId: input.projectId,
      name: input.name,
      ...(input.contact ? { contact: input.contact } : {}),
      ...(input.channel ? { channel: input.channel } : {}),
      status: input.status ?? "candidate",
      missing: input.missing ?? [],
    });
    return { entity };
  },
});
