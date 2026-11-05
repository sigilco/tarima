import { type World, type Hook as WorldHook } from '#compiled/@workflow/world/index.js';
import { type PayloadKey } from '../serialization.js';
/**
 * A hook record with its serialized `metadata` omitted: everything a resume
 * actually reads. Resuming never looks at metadata, so the resume path accepts
 * both a raw {@link WorldHook} straight out of a World and a {@link Hook}
 * whose `metadata` is a Promise.
 */
type ResumableHook = Omit<WorldHook, 'metadata'>;
/**
 * A hook as returned by {@link getHookByToken} and {@link resumeHook}: the
 * World's {@link WorldHook} record with its user-defined `metadata` hydrated
 * lazily.
 *
 * `metadata` is a getter that returns a Promise — the same shape as
 * `Run.returnValue` — so looking a hook up by token costs exactly one read.
 * Hydrating metadata is a decrypting READ that needs the owning run's payload
 * keys, and resolving those can cost a run fetch plus a `run-key` API round
 * trip (~350ms). Deferring that to first access keeps the lookup fast for the
 * many callers that only need `runId`/`token` — most importantly hook
 * resumption, which never reads metadata at all.
 *
 * The promise is memoized: hydration (and the key resolution behind it) runs at
 * most once per hook object. Awaiting it on a hook that stored no metadata
 * resolves `undefined` and performs no I/O.
 *
 * Like `Run.returnValue`, the accessor is non-enumerable, so it is absent from
 * `{ ...hook }` and `JSON.stringify(hook)` — read it explicitly and include the
 * awaited value if you need to forward it.
 *
 * @example
 *
 * ```ts
 * const hook = await getHookByToken(token);
 * console.log(hook.runId); // no metadata work
 * const metadata = (await hook.metadata) as { allowedUserId?: string } | undefined;
 * ```
 */
export interface Hook extends ResumableHook {
    /**
     * The hook's user-defined metadata, hydrated on first access and memoized.
     * Resolves `undefined` when the hook carries no metadata.
     */
    readonly metadata: Promise<unknown>;
}
/**
 * Get the hook by token to find the associated workflow run.
 *
 * This is a single read. The returned hook's `metadata` is a getter that
 * resolves a Promise (see {@link Hook}), so the run fetch and
 * `run-key` round trip that hydrating it can require are only paid by callers
 * that actually await it:
 *
 * ```ts
 * const hook = await getHookByToken(token);
 * const metadata = await hook.metadata;
 * ```
 *
 * A Hook kept by minimum retention remains available here after its run ends,
 * but cannot be resumed.
 *
 * @param token - The unique token identifying the hook
 */
export declare function getHookByToken(token: string): Promise<Hook>;
/**
 * The result of {@link resumeHook}: a {@link Hook} augmented
 * with an optional resilience signal.
 *
 * `resilientResume` is retained for source compatibility and is never set.
 * `resumeHook()` now requires the durable `hook_received` write and workflow
 * wake to both succeed before it resolves. Treat the result as a plain
 * {@link Hook}.
 */
export type ResumedHook = Hook & {
    resilientResume?: boolean;
};
/**
 * Resumes a workflow run by sending a payload to a hook identified by its token.
 *
 * This function is called externally (e.g., from an API route or server action)
 * to send data to a hook and resume the associated workflow run.
 *
 * On an invoke-capable World, the serialized input is delivered to the run's
 * executor, which inspects it, writes `hook_received`, then responds. Resolving
 * means the executor accepted and persisted it, not that user code consumed it.
 * Other Worlds write the event here and then await queue acceptance of its wake.
 * On the existing path, a failure after the event write may leave a committed
 * event whose wake was not accepted. On the invoke path, a transport failure
 * leaves the executor's outcome unknown; do not retry by directly writing an
 * event. Event and response persistence may be separate backend operations.
 *
 * Pass a Hook object to skip the token lookup when its resumeContext and the
 * World support guarded delivery. A definite refusal falls back to a fresh
 * lookup; an uncertain write is never re-sent. Cached resumeCapabilities are
 * never trusted. Hooks without resumeContext keep the run-fallback path.
 *
 * @param tokenOrHook - A token, or a Hook targeting that specific hook (and
 *   its force-claim successor), not an unrelated later owner of the token.
 * @param payload - The data payload to send to the hook
 * @returns Promise resolving to the {@link ResumedHook}
 * @throws {HookNotFoundError} If the Hook does not exist or its run has ended
 *
 * @example
 *
 * ```ts
 * // In an API route
 * import { resumeHook } from '@workflow/core/runtime';
 *
 * export async function POST(request: Request) {
 *   const { token, data } = await request.json();
 *
 *   try {
 *     const hook = await resumeHook(token, data);
 *     return Response.json({ runId: hook.runId });
 *   } catch (error) {
 *     return new Response('Hook not found', { status: 404 });
 *   }
 * }
 * ```
 */
export declare function resumeHook<T = any>(tokenOrHook: string | ResumableHook, payload: T, encryptionKeyOverride?: PayloadKey): Promise<ResumedHook>;
/**
 * {@link resumeHook} against an explicit World rather than the process's
 * configured one, for SDK internals that act on a World they were handed
 * (e.g. `cancelRun(world, …)` resuming a parent's child-run completion hook).
 *
 * @internal
 */
export declare function resumeHookOnWorld<T = any>(world: World, token: string, payload: T): Promise<ResumedHook>;
/**
 * Resumes a webhook by sending a {@link https://developer.mozilla.org/en-US/docs/Web/API/Request | Request}
 * object to a hook identified by its token.
 *
 * This function is called externally (e.g., from an API route or server action)
 * to send a request to a webhook and resume the associated workflow run.
 *
 * @param token - The unique token identifying the hook
 * @param request - The request to send to the hook
 * @returns Promise resolving to the response
 * @throws Error if the hook is not found or if there's an error during the process
 *
 * @example
 *
 * ```ts
 * // In an API route
 * import { resumeWebhook } from '@workflow/core/runtime';
 *
 * export async function POST(request: Request) {
 *   const url = new URL(request.url);
 *   const token = url.searchParams.get('token');
 *
 *   if (!token) {
 *     return new Response('Missing token', { status: 400 });
 *   }
 *
 *   try {
 *     const response = await resumeWebhook(token, request);
 *     return response;
 *   } catch (error) {
 *     return new Response('Webhook not found', { status: 404 });
 *   }
 * }
 * ```
 */
export declare function resumeWebhook(token: string, request: Request): Promise<Response>;
export {};
//# sourceMappingURL=resume-hook.d.ts.map