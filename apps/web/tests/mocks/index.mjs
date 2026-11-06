/**
 * One-line boot for the shared mock services (SP6-B): starts the mock
 * Telegram Bot API, the mock WhatsApp Graph API, and the mock Brevo
 * mail API on ephemeral ports and returns their base URLs plus the
 * assertion handles, so a test harness can stand up every outbound
 * channel without a single real credential.
 *
 *   const mocks = await startMocks();
 *   // mocks.telegram.baseUrl, mocks.whatsapp.baseUrl, mocks.mail.baseUrl
 *   await mocks.stop();
 */
import { startMailDev as startMockMail } from "./maildev-mock.mjs";
import { startMockTelegram } from "./telegram-mock.mjs";
import { startMockWhatsapp } from "./whatsapp-mock.mjs";

export { startMailDev } from "./maildev-mock.mjs";
export { startMockTelegram } from "./telegram-mock.mjs";
export { startMockWhatsapp } from "./whatsapp-mock.mjs";

/**
 * Start a subset (or all) of the mocks. `which` defaults to all three;
 * pass e.g. `{ whatsapp: false }` to skip one. Returns the started
 * handles keyed by channel, each with `baseUrl`/`port` filled in, plus
 * a single `stop()`.
 */
export async function startMocks(which = {}) {
  const wanted = {
    telegram: which.telegram !== false,
    whatsapp: which.whatsapp !== false,
    mail: which.mail !== false,
  };
  const out = {};
  if (wanted.telegram) {
    const handle = startMockTelegram();
    const { port, baseUrl } = await handle.start();
    out.telegram = { ...handle, port, baseUrl };
  }
  if (wanted.whatsapp) {
    const handle = startMockWhatsapp({ appSecret: which.whatsappAppSecret });
    const { port, baseUrl } = await handle.start();
    out.whatsapp = { ...handle, port, baseUrl };
  }
  if (wanted.mail) {
    const handle = startMockMail();
    const { port, baseUrl } = await handle.start();
    out.mail = { ...handle, port, baseUrl };
  }
  out.stop = async () => {
    await Promise.all(
      [out.telegram, out.whatsapp, out.mail]
        .filter(Boolean)
        .map((handle) => handle.stop().catch(() => {})),
    );
  };
  return out;
}
