Both questions are answered below. The repo context: your plan already reserves a packages/channels package for "email/telegram seams" (line 7), and WhatsApp was explicitly deferred to post-plan followups (line 93). The setup you're racing through is ahead of the plan, so the abstraction work is actually the right thing to do now to catch it.

## 1. Multi-channel abstraction

Recommendation: build a thin ChannelAdapter interface yourself, no framework. The multi-channel libraries (ConversationSDK-style, Botpress,Vonage conversations, etc.) are too heavy and opinionated for a prototype where you own the whole engine. Your stack already has the hard parts:

- Inbound normalization: T4.1b already does CF Email Worker → signed webhook POST → engine parse step
- Outbound durability: the engine outbox gives retries + idempotency for free
- Telegram is already planned via grammY long-poll (T5.1)

Define the interface in packages/channels/ (the package already exists in the plan, so this slots in):

interface ChannelAdapter {
  id: "whatsapp" | "telegram" | "email" | "inapp";
  send(msg: OutboundMessage): Promise<{ externalId: string }>;
  verifyWebhook(req: Request): boolean;
  parseInbound(req: Request): InboundMessage;
}

interface InboundMessage {
  channel: string;
  threadId: string;   // wa phone, chat id, email reply-to
  from: string;
  text?: string;
  attachments?: Attachment[];
  raw: unknown;       // original payload, stored for debugging
}

Then:

- Inbound: one route POST /webhooks/:channel on the API. Each adapter's verifyWebhook does its signature check (WhatsApp: X-Hub-Signature-256; Telegram: secret token header; email: your X-Webhook-Secret). Normalize → same engine parse step. Telegram uses long-poll instead of a webhook initially, which is fine: grammY can push into the same parseInbound shape, only the transport differs.
- Outbound: outbox events get a channel tag; a small router maps tag → adapter. WhatsApp's outbound call is a single fetch to the Graph API, no SDK needed, roughly 100 lines.

The whatsapp-cloud adapter is the fastest channel to build after inapp because the API is one HTTP call. If you later outgrow the homemade abstraction, migrating means swapping the adapter implementations, not touching the engine or chase pipeline. This matches your "seams, not frameworks" philosophy already written into the plan.

## 2. WhatsApp setup from "configure webhooks"

Key shortcut first: you can skip webhooks for the prototype. Outbound-only via the test number works with no public endpoint. That lets you validate the channel integration today and add inbound later. If your prototype needs replies (chase "await→parse" flow), you'll need webhooks, but not for a first demo.

### A. Verify prerequisites (in the Meta App Dashboard)

1. App is type Business, with WhatsApp product added and the WhatsApp → API Setup page visible.
2. Note down: Test number, Phone number ID, WhatsApp Business Account ID, and the temporary access token (valid 24h, regenerate freely during dev).
3. App Settings → Basic: copy the App Secret (needed for webhook signature validation later).

### B. Outbound-only (do this first, ~10 min)

Send from the API using the Graph API directly, no webhook needed:

1. Add yourself as a test recipient: API Setup → To → Add phone number, then verify the code from the WhatsApp app on that phone. Test numbers allow up to 5 recipients.
2. Send a test message with curl to confirm the token + phone number ID work:

curl -s -X POST "https://graph.facebook.com/v21.0/$WHATSAPP_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer $WHATSAPP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "<recipient_e164>",
    "type": "text",
    "text": { "body": "hello from tarima" }
  }'

3. Store secrets in Infisical (dev env, whatsapp/ folder): WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_APP_SECRET, WHATSAPP_VERIFY_TOKEN (this last one is a random string you choose, not from Meta). The repo is public, so nothing goes to .env.

### C. Webhooks (only when you need inbound replies)

1. Public HTTPS endpoint required. Webhook verification hits a URL, so localhost won't work. Options in order of friction:
   - cloudflared tunnel --url localhost:PORT for dev against your local API
   - deploy the API to the VPS early (which the plan already wants)
2. Two endpoints on the API (Hono):

// GET: Meta's one-time verification. Set "Verify Token" in dashboard to WHATSAPP_VERIFY_TOKEN.
app.get("/webhooks/whatsapp", (c) => {
  const mode = c.req.query("hub.mode");
  const token = c.req.query("hub.verify_token");
  const challenge = c.req.query("hub.challenge");
  if (mode === "subscribe" && token === env.WHATSAPP_VERIFY_TOKEN) {
    return c.body(challenge ?? "");
  }
  return c.text("forbidden", 403);
});

// POST: actual message events. Validate signature against App Secret.
app.post("/webhooks/whatsapp", async (c) => {
  const raw = await c.req.text();
  const sig = c.req.header("X-Hub-Signature-256"); // "sha256=<hex>"
  const expected = "sha256=" + createHmac("sha256", env.WHATSAPP_APP_SECRET).update(raw).digest("hex");
  if (sig !== expected) return c.text("invalid signature", 401);
  // normalize via ChannelAdapter.parseInbound → engine parse step
  return c.json({ ok: true }); // reply 200 fast; Meta retries on non-200
});

3. Back in the dashboard, at the step you're stuck on: paste the public HTTPS URL, set Verify Token to the same value as WHATSAPP_VERIFY_TOKEN, click Verify and save, then click Subscribe next to the messages webhook field.
4. Have someone send your test number a message; the POST handler should receive an inbound messages event you can inspect and wire into parseInbound.

### D. Constraints to keep in mind

- Business-initiated messages outside a 24h customer-service window require an approved template; in the prototype just have the recipient message first (or within the window after they do).
- Temporary access tokens expire every 24h during dev. Permanent tokens need Business Verification; defer that until the prototype is proven.
- If you later move to production, you'll register a real phone number (replacing the test number) and can request a business-initiated conversation tier increase.
