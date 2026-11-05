/**
 * Run `execute` unless an execution for the same run + step correlation ID is
 * already in flight in this process; a loser gets `loserResult()` once the
 * winner settled, unless `rerunAfter(winner)` says the winner ran nothing, in
 * which case the loser re-enters and tries the step itself.
 */
export declare function runSingleFlight<R>(runId: string, correlationId: string, execute: () => Promise<R>, loserResult: () => R, logLevel?: 'debug' | 'warn', rerunAfter?: (winner: R) => boolean): Promise<R>;
//# sourceMappingURL=step-single-flight.d.ts.map