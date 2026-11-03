/**
 * P0 UI: the product loop in a real browser.
 *
 *   login -> create project -> CSV import -> start chase ->
 *   the board shows the row -> a reply lands -> the board updates
 *
 * The suite drives the real board ui against the real api process, with
 * the loopback mail domain and the deterministic stub LLM. The reply is
 * injected the way the Cloudflare email worker injects it, so the ui
 * only sees what a user would see.
 *
 * Running this suite needs the Playwright browsers:
 *
 *   pnpm --filter @tarima/e2e exec playwright install chromium
 *
 * The api-level suite in `src/api` proves the same loop without a
 * browser and is the gate that runs on every push.
 */
import { expect, test, type Page } from "@playwright/test";

/** The origin of the app under test (the api and the ui share it). */
const API_ORIGIN = "http://127.0.0.1:3101";

/** The shared secret the inbound email webhook expects. */
const WEBHOOK_SECRET = "e2e-inbound-secret";

/** The contact the suite chases. */
const CONTACT_EMAIL = "booker@bluenote.test";

/** A fresh login address per test run. */
function loginEmail(): string {
  return `ui-${Date.now()}-${Math.floor(Math.random() * 1e6)}@tarima.test`;
}

/** Read the one-time code the api captured for `email`. */
async function readOtp(email: string): Promise<string> {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const res = await fetch(`${API_ORIGIN}/internal/admin/inbox?to=${encodeURIComponent(email)}`);
    if (res.ok) {
      const payload = (await res.json()) as { messages: Array<{ otp: string | null }> };
      const otp = payload.messages.find((message) => message.otp)?.otp;
      if (otp) return otp;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`no otp captured for ${email}`);
}

/** Log in through the ui and land on the project list. */
async function loginThroughUi(page: Page, email: string): Promise<void> {
  await page.goto("/login");
  // The email field carries a placeholder, not an aria-label, so the
  // structural locator is the stable one.
  await page.locator('input[type="email"]').fill(email);
  await page.getByRole("button", { name: "Send code" }).click();

  const code = await readOtp(email);
  await page.locator('input[inputmode="numeric"]').fill(code);
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page).toHaveURL(/\/app/);
}

/** Inject a reply the way the inbound email worker does. */
async function injectReply(from: string, body: string): Promise<void> {
  const raw = [
    `From: ${from}`,
    "To: outreach@tarima.test",
    "Subject: Re: deliverables",
    "Content-Type: text/plain; charset=utf-8",
    "",
    body,
  ].join("\r\n");

  const res = await fetch(`${API_ORIGIN}/webhooks/email`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Webhook-Secret": WEBHOOK_SECRET,
    },
    body: JSON.stringify({ raw, from, to: "outreach@tarima.test" }),
  });
  expect(res.ok).toBeTruthy();
}

test("login, import a csv, start the chase and see the row move", async ({ page }) => {
  const email = loginEmail();
  await loginThroughUi(page, email);

  // Create a project.
  await page.getByLabel(/project name/i).fill("SF dinner");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page).toHaveURL(/\/app\/p\//);

  // Import a csv of rows.
  await page.getByRole("button", { name: "Import CSV" }).click();
  await page
    .locator("textarea")
    .fill(`name,contact,missing\nBlue Note SF,${CONTACT_EMAIL},menu;deposit`);
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await expect(page.getByText(/Imported 1 row/)).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();

  // The row is on the board.
  await expect(page.getByRole("cell", { name: "Blue Note SF" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "menu, deposit" })).toBeVisible();

  // Start the chase.
  await page.getByRole("button", { name: "Start chase" }).click();
  await expect(page.getByText(/chase/i).first()).toBeVisible();

  // The runs stage their drafts and park at the send gate: the api
  // moved the project to send_review, so the banner shows the send
  // decision and nothing has been sent yet.
  await expect(page.getByText(/nothing has been sent yet/i)).toBeVisible({ timeout: 20_000 });

  // Approve the send gate from the banner.
  await page.getByRole("button", { name: /send all/i }).click();
  await expect(page.getByText(/approved/i).first()).toBeVisible({ timeout: 20_000 });

  // The engine stamps the row's status only when the parse reaches the
  // update step, so the board still shows the intake pill before the
  // reply lands.
  await expect(page.locator("tbody td").nth(2)).toHaveText("intake");

  // A reply lands and the live board moves the row out of intake: the
  // parsed fields arrive, the status becomes `updating` (the wire state
  // of the db status `updated`).
  await injectReply(CONTACT_EMAIL, "Done, everything is attached.");
  await expect(page.locator("tbody td").nth(2)).toHaveText("updating", { timeout: 20_000 });
});
