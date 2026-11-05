import { defineTool } from "eve/tools";
import { z } from "zod";
import { getProject, listProjects } from "@tarima/api/services/projects";
import { listEntities } from "@tarima/api/services/entities";
import { db, callerUserId } from "../lib/tarima";

/** Project + board entities, scoped to the calling user. */
export default defineTool({
  description:
    "Read one project of the calling user from tarima: its name, structured goal (city, dates, time window, topic, headcount, requirements), approval stage, and its board entities (candidate venues/sponsors with statuses). Omit projectId to use the user's most recent project.",
  inputSchema: z.object({
    projectId: z
      .string()
      .optional()
      .describe(
        "Project id (a UUID from tarima). Omit this unless you already have a real id from a previous tool result — unknown ids are invented, and invented ids return not_found.",
      ),
  }),
  async execute(input, ctx) {
    const userId = callerUserId(ctx);
    if (!userId) return { error: "unauthorized" };
    const project = input.projectId
      ? getProject(db, input.projectId, userId)
      : listProjects(db, userId)[0];
    if (!project) return { error: "not_found" };
    return {
      project,
      entities: listEntities(db, project.id),
    };
  },
});
