import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";

// Node SSR entry for the unified Hono runtime. The vite plugin aliases
// virtual:tanstack-start-server-entry to this module and builds it into
// dist/ssr/server.js as a pure fetch handler. Wrapped in { fetch } because
// the TanStack Start vite plugin (>=1.171) invokes the default export as an
// itty-style fetch object in dev.
const handler = createStartHandler(defaultStreamHandler);
export default {
  fetch: (request: Request, options?: Parameters<typeof handler>[1]) => handler(request, options),
};
