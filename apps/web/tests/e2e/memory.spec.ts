import { expect, test, type Page } from "@playwright/test";

/**
 * Memory e2e (batch dev-memory-e2e, verification check 6): the stub
 * responder's `remember: <fact>` path must persist a fact through the
 * agent's SQLite-backed memory, scoped to the signed-in user.
 *
 * Three browser contexts:
 * - A saves a fact in one session.
 * - A, in a NEW session (fresh storageState, so a fresh eve session),
 *   recalls the fact through the chat panel.
 * - B (a second dev-login user) must not see it.
 *
 * Requires the server booted with the stub LLM (TARIMA_AGENT_STUB=1)
 * and dev-login enabled — see tests/e2e/run-memory.sh.
 */

const EMAIL_A = `mem-a-${Date.now()}@tarima.test`;
const EMAIL_B = `mem-b-${Date.now()}@tarima.test`;
const FACT = `the launch party is on a Thursday`;

async function devLogin(page: Page, email: string): Promise<void> {
  await page.goto(`/api/dev/login?email=${encodeURIComponent(email)}`);
  await expect(page).toHaveURL(/\/app$/);
}

async function openChat(page: Page): Promise<void> {
  const composer = page.getByRole("textbox", { name: "Message eve…" });
  // The bubble click races the panel mount on a slow page load; retry.
  for (let attempt = 0; attempt < 5 && !(await composer.isVisible()); attempt += 1) {
    if (
      await page
        .getByRole("button", { name: "Open chat" })
        .isVisible()
        .catch(() => false)
    ) {
      await page.getByRole("button", { name: "Open chat" }).click();
    }
    await expect(composer)
      .toBeVisible({ timeout: 10_000 })
      .catch(() => undefined);
  }
  await expect(composer).toBeVisible();
}

async function send(page: Page, text: string): Promise<void> {
  const composer = page.getByRole("textbox", { name: "Message eve…" });
  await composer.fill(text);
  await page.getByRole("button", { name: "Send" }).click();
}

async function lastAssistantText(page: Page): Promise<string> {
  // Assistant replies are paragraphs inside the last `.is-assistant`
  // message (see ai-elements/message.tsx: the Message root gets the
  // `is-assistant` class when the role is not user).
  await expect
    .poll(
      async () =>
        (
          await page
            .locator('[data-slot="chat-panel"] .is-assistant p')
            .all()
            .then((ps) => Promise.all(ps.map((p) => p.textContent())))
        )?.join(" ") ?? "",
      { timeout: 30_000, intervals: [500] },
    )
    .toBeTruthy();
  return (
    await page
      .locator('[data-slot="chat-panel"] .is-assistant p')
      .all()
      .then((ps) => Promise.all(ps.map((p) => p.textContent())))
  ).join(" ");
}

test("A saves a fact, A recalls it in a new session, B does not see it", async ({ browser }) => {
  // -- A, session 1: save ------------------------------------------------
  const contextA1 = await browser.newContext();
  const pageA1 = await contextA1.newPage();
  await devLogin(pageA1, EMAIL_A);
  await openChat(pageA1);
  await send(pageA1, `remember: ${FACT}`);
  const savedReply = await lastAssistantText(pageA1);
  expect(savedReply).toContain(FACT);
  await contextA1.close();

  // -- A, session 2 (fresh browser context => fresh eve session): recall --
  const contextA2 = await browser.newContext();
  const pageA2 = await contextA2.newPage();
  await devLogin(pageA2, EMAIL_A);
  await openChat(pageA2);
  await send(pageA2, "what do you remember?");
  const recalled = await lastAssistantText(pageA2);
  expect(recalled).toContain(FACT);
  await contextA2.close();

  // -- B: must not see A's memory ----------------------------------------
  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  await devLogin(pageB, EMAIL_B);
  await openChat(pageB);
  await send(pageB, "what do you remember?");
  const bSees = await lastAssistantText(pageB);
  expect(bSees).not.toContain(FACT);
  await contextB.close();
});
