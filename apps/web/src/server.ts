import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";

// Node SSR entry for the unified Hono runtime. The vite plugin aliases
// virtual:tanstack-start-server-entry to this module and builds it into
// dist/ssr/server.js as a pure fetch handler.
export default createStartHandler(defaultStreamHandler);
