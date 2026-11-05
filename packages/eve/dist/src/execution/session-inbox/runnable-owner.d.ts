import type { World } from "#compiled/@workflow/world/index.js";
export type OwnerRun = Awaited<ReturnType<World["runs"]["get"]>>;
/**
 * Whether the World replays every run on the deployment that started it
 * (Vercel). There, an owner from another eve version is the normal handoff
 * case, not a stranded one.
 */
export declare function routesToOwnerDeployment(world: Pick<World, "capabilities">): boolean;
/**
 * The owner run when it is retired, or `undefined` when this build can run it.
 * Reads the run only when it is not already known to be runnable.
 */
export declare function findRetiredOwnerRun(world: Pick<World, "runs">, runId: string): Promise<OwnerRun | undefined>;
