/**
 * Channel adapters for the api process (Stage 4, T4.3/T4.1b).
 *
 * One email adapter and one WhatsApp adapter, built lazily so the
 * environment is read at first use instead of at import time (tests set
 * `INBOUND_WEBHOOK_SECRET` / `WHATSAPP_APP_SECRET` before the first
 * request). Both the engine outbox dispatcher and the webhook routes
 * use these instances, so the outbound transport and the inbound
 * signature check always agree on the configuration.
 *
 * Transport selection is the adapter's job, not the caller's:
 *   - email to a loopback domain (default `tarima.test`) lands in the
 *     `loopback_inbox` table
 *   - email with `BREVO_API_KEY` goes out through Brevo
 *   - email without a provider key lands in the file outbox (logged)
 *   - WhatsApp goes out through the Graph API
 */
import { randomUUID } from "node:crypto";
import {
  createChannelRouter,
  createEmailAdapter,
  createWhatsappAdapter,
  type ChannelAdapter,
  type FileOutbox,
  type LoopbackSink,
  type WhatsappAdapter,
} from "@tarima/channels";
import { db } from "./db";
import { loopbackInbox } from "./db/schema";

/**
 * Loopback transport: dev/test domains land in the `loopback_inbox`
 * table instead of a provider. Same seam the transactional mailer uses.
 */
const loopbackSink: LoopbackSink = {
  save(msg) {
    db.insert(loopbackInbox)
      .values({
        id: randomUUID(),
        toAddr: msg.to.trim().toLowerCase(),
        fromAddr: msg.from ?? null,
        subject: msg.subject,
        body: msg.body,
        html: msg.html ?? null,
      })
      .run();
  },
};

/**
 * Provider-less fallback: outbound mail with no provider key is logged
 * so nothing is silently dropped in dev.
 */
const fileOutbox: FileOutbox = {
  save(msg) {
    console.info(
      "[channels:file-outbox]",
      `to=${msg.to}`,
      `subject=${msg.subject ?? ""}`,
      `body=${(msg.text ?? "").slice(0, 200)}`,
    );
  },
};

let email: ChannelAdapter | undefined;
let whatsapp: WhatsappAdapter | undefined;
let router: ReturnType<typeof createChannelRouter> | undefined;

/** The email adapter (loopback / Brevo / file outbox). */
export function emailAdapter(): ChannelAdapter {
  if (!email) {
    email = createEmailAdapter({ loopback: loopbackSink, outbox: fileOutbox });
  }
  return email;
}

/** The WhatsApp Cloud API adapter. */
export function whatsappAdapter(): WhatsappAdapter {
  if (!whatsapp) {
    whatsapp = createWhatsappAdapter();
  }
  return whatsapp;
}

/** The router that maps a channel tag to its adapter. */
export function channelsRouter(): ReturnType<typeof createChannelRouter> {
  if (!router) {
    router = createChannelRouter([emailAdapter(), whatsappAdapter()]);
  }
  return router;
}
