import type { DevBootProgressReporter } from "#internal/dev-boot-progress.js";
import { startCliLiveRow } from "#cli/ui/live-row.js";
export declare function createDevBootProgressReporter(row: ReturnType<typeof startCliLiveRow> | undefined): DevBootProgressReporter;
