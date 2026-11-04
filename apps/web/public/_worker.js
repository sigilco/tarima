export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/api/access-requests") {
      let body;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "invalid_body" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }

      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return new Response(JSON.stringify({ error: "invalid_body" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }

      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return new Response(JSON.stringify({ error: "invalid_email" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }

      const apiBase =
        typeof env?.API_BASE === "string" ? env.API_BASE.trim().replace(/\/+$/, "") : "";
      if (!apiBase) {
        return new Response(JSON.stringify({ error: "not_configured" }), {
          status: 503,
          headers: { "content-type": "application/json" },
        });
      }

      try {
        const upstream = await fetch(`${apiBase}/api/access-requests`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        const text = await upstream.text();
        return new Response(text, {
          status: upstream.status,
          headers: { "content-type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ error: "upstream_error" }), {
          status: 502,
          headers: { "content-type": "application/json" },
        });
      }
    }
    return env.ASSETS.fetch(request);
  },
};
