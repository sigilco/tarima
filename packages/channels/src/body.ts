/**
 * A Request body is a one-shot stream. The webhook route has to read the
 * raw bytes to check a signature, and the adapter has to read them again to
 * parse the payload. The raw body is therefore cached per Request.
 */
const bodyCache = new WeakMap<Request, string>();

/** The cached raw body of a request, if it was already read. */
export function cachedRequestBody(req: Request): string | undefined {
  return bodyCache.get(req);
}

/**
 * Read the raw body of a request and cache it. Use this in the webhook route
 * before calling `verifyWebhook` and `parseInbound` so both see the same bytes.
 */
export async function readRawBody(req: Request): Promise<string> {
  const cached = bodyCache.get(req);
  if (cached !== undefined) return cached;
  const raw = await req.text();
  bodyCache.set(req, raw);
  return raw;
}
