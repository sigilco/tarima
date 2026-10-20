import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const Route = createFileRoute("/api/access-requests")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { email?: unknown; intent?: unknown };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "invalid body" }, { status: 400 });
        }
        const email = typeof body.email === "string" ? body.email.trim() : "";
        if (!EMAIL_RE.test(email)) {
          return Response.json({ error: "invalid email" }, { status: 400 });
        }
        const intent = typeof body.intent === "string" ? body.intent : null;
        try {
          await env.TARIMA_WAITLIST.put(
            `req:${email.toLowerCase()}`,
            JSON.stringify({ email, intent, at: new Date().toISOString() }),
          );
        } catch {
          return Response.json({ error: "store unavailable" }, { status: 502 });
        }
        return Response.json({ ok: true }, { status: 201 });
      },
    },
  },
});
