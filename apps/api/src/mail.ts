interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

/**
 * Transactional mail seam. Brevo HTTP API when BREVO_API_KEY is set;
 * logs to stdout otherwise. Swap the implementation for CF Email
 * Workers later — callers never see the provider.
 */
export async function sendMail(message: MailMessage): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.info("[mail:noop]", message.subject, "->", message.to);
    return;
  }
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: {
        email: process.env.MAIL_FROM ?? "hello@tarima.events",
        name: "Tarima",
      },
      to: [{ email: message.to }],
      subject: message.subject,
      textContent: message.text,
    }),
  });
  if (!res.ok) {
    throw new Error(`Brevo send failed: ${res.status} ${await res.text()}`);
  }
}
