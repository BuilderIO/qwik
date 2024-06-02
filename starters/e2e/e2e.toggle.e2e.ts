import { expect, test } from "@playwright/test";

test.describe("toggle", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/e2e/toggle");
    page.on("pageerror", (err) => expect(err).toEqual(undefined));
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        expect(msg.text()).toEqual(undefined);
      }
    });
  });

  // TODO(v2): fix this
  test("should load", async ({ page }) => {
    const title = page.locator("h1");
    const mount = page.locator("#mount");
    const root = page.locator("#root");
    const logs = page.locator("#logs");
    const btnToggle = page.locator("button#toggle");
    const btnIncrement = page.locator("button#increment");

    let logsStr = "Logs: Log(0)";
    await expect(title).toHaveText("ToggleA");
    await expect(mount).toHaveText("mounted in server");
    await expect(root).toHaveText("hello from root (0/0)");
    await expect(logs).toHaveText(logsStr);

    // ToggleA
    await btnToggle.click();
    logsStr += "Child(0)ToggleA()Child(0)";

    await expect(title).toHaveText("ToggleB");
    await expect(mount).toHaveText("mounted in client");
    await expect(root).toHaveText("hello from root (0/0)");
    await expect(logs).toHaveText(logsStr);

    // Increment
    await btnIncrement.click();
    logsStr += "Log(1)Child(1)";

    await expect(title).toHaveText("ToggleB");
    await expect(mount).toHaveText("mounted in client");
    await expect(root).toHaveText("hello from root (1/1)");
    await expect(logs).toHaveText(logsStr);

    // ToggleB
    await btnToggle.click();
    logsStr += "Child(1)ToggleB()";

    await expect(title).toHaveText("ToggleA");
    await expect(mount).toHaveText("mounted in client");
    await expect(root).toHaveText("hello from root (1/1)");
    await expect(logs).toHaveText(logsStr);

    // Increment
    await btnIncrement.click();
    logsStr += "Log(2)Child(2)";

    await expect(title).toHaveText("ToggleA");
    await expect(mount).toHaveText("mounted in client");
    await expect(root).toHaveText("hello from root (2/2)");
    await expect(logs).toHaveText(logsStr);

    // ToggleA + increment
    await btnToggle.click();
    await btnIncrement.click();
    logsStr += "Child(2)ToggleA()Log(3)Child(3)";

    await expect(title).toHaveText("ToggleB");
    await expect(mount).toHaveText("mounted in client");
    await expect(root).toHaveText("hello from root (3/3)");
    await expect(logs).toHaveText(logsStr);
  });
});
