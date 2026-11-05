/**
 * Server boot seam: the api handlers need the runtime's db, engine and
 * side-effect wiring. In production (and in the e2e suites) the runtime
 * registers itself here before the first request is served; an
 * unregistered runtime answers 503 with a clear message instead of
 * crashing the module graph.
 */
export interface ApiRuntime {
  /** Handle a request with the api handler table. */
  fetch: (request: Request) => Promise<Response>;
  /** Start the workflow engine (step runner + outbox pump). */
  startEngine: () => void | Promise<void>;
}

let runtime: ApiRuntime | undefined;

/** Register the api runtime. Called once at server boot. */
export function registerApiRuntime(impl: ApiRuntime): void {
  runtime = impl;
}

/** The registered runtime, or undefined before boot. */
export function apiRuntime(): ApiRuntime | undefined {
  return runtime;
}

/** A 503 Response for requests that arrive before the runtime boots. */
export function runtimeNotReadyResponse(): Response {
  return Response.json({ error: "runtime_not_ready" }, { status: 503 });
}
