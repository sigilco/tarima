import { expect, test } from "@playwright/test";

/**
 * Smoke: sign in with a code, create a project with a brief, add a row
 * by hand, see it on the board.
 *
 * The login code is read out of the api's loopback inbox endpoint
 * (`/internal/admin/inbox`), which exists outside production and
 * captures all mail to `tarima.test` addresses. No external send.
 */

const EMAIL = `smoke-${Date.now()}@tarima.test`;

async function readOtp(request: import("@playwright/test").APIRequestContext): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const res = await request.get(`/internal/admin/inbox?to=${EMAIL}`);
    if (res.ok()) {
      const body = (await res.json()) as { messages: { otp: string | null }[] };
      const otp = body.messages[0]?.otp;
      if (otp) return otp;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("no otp captured in loopback inbox");
}

test("login, create project with brief, add row, see it on the board", async ({
  page,
  request,
}) => {
  await page.goto("/login");
  await page.getByPlaceholder("you@your-event.org").fill(EMAIL);
  await page.getByRole("button", { name: "Send code" }).click();
  await expect(page.getByText("Check your inbox")).toBeVisible();

  const code = await readOtp(request);
  await page.getByPlaceholder("123456").fill(code);
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page).toHaveURL(/\/app$/);

  // Create a project with a brief.
  await page.getByLabel("Project name, e.g. Spring hackathon sponsors").fill("Smoke dinner");
  await page.getByLabel("Event type").fill("founder dinner");
  await page.getByLabel("City").fill("Paris");
  await page.getByLabel("Headcount").fill("25");
  await page.getByLabel("Budget").fill("3500");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page).toHaveURL(/\/app\/p\//);
  await expect(page.getByText("Smoke dinner").first()).toBeVisible();

  // Add a row by hand.
  await page.getByRole("button", { name: "Add row" }).first().click();
  await page.getByLabel("Name").fill("Bistrot Léa");
  await page.getByLabel("Contact email").fill("leia@bistrot.test");
  await page.getByLabel("Channel").selectOption("email");
  await page.getByLabel("What's missing").fill("menu; photo");
  await page.getByTestId("add-row-modal").getByRole("button", { name: "Add row" }).click();
  await expect(page.getByText("Row added.")).toBeVisible();

  // The row is on the board.
  await page.getByRole("link", { name: "Close" }).click();
  await expect(page.getByText("Bistrot Léa")).toBeVisible();
});
