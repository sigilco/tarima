import type { World } from '#compiled/@workflow/world/index.js';
import type { LoadedEventLog } from '../runtime/helpers.js';
/**
 * A full log load against an explicit World, keeping the first page's
 * snapshot, for tests that do not install a global World.
 */
export declare function loadWorkflowRunEventsFrom(world: Pick<World, 'events'>, runId: string): Promise<LoadedEventLog>;
//# sourceMappingURL=load-events.d.ts.map