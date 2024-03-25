import { expect, test } from "@playwright/test";

test.describe("server$", () => {
  test("this is available", async ({ page }) => {
    await page.goto("/qwikcity-test/server-func/");
    const host = page.locator(".server-host");

    await expect(host).toHaveText([
      "localhost:3301",
      "localhost:3301",
      "localhost:3301",
      "localhost:3301",
      "",
      "localhost:3301",
    ]);

    const button = page.locator("#server-host-button");
    await button.click();
    await expect(host).toHaveText([
      "localhost:3301",
      "localhost:3301",
      "localhost:3301",
      "localhost:3301",
      "localhost:3301",
      "localhost:3301",
    ]);
  });

  test("streaming", async ({ page }) => {
    await page.goto("/qwikcity-test/server-func/");
    const logs = page.locator(".server-streaming");
    const button = page.locator("#server-streaming-button");

    await expect(logs).toHaveText("");
    await button.click();
    await expect(logs).toHaveText("0");
    await expect(logs).toHaveText("01");
    await expect(logs).toHaveText("012");
    await expect(logs).toHaveText("0123");
    await expect(logs).toHaveText("01234");
  });

  test.describe("server$ inside resource", () => {
    test("All functions have reference to request event", async ({ page }) => {
      await page.goto("/qwikcity-test/server-func/resource");

      await Promise.all(
        ["a", "b", "c"].map(async (letter) => {
          const result = await page.locator(`#${letter}`);

          await expect(result).toHaveText([
            "/qwikcity-test/server-func/resource/" + letter,
          ]);
        }),
      );
    });
  });

  test.describe("Multiple server$", () => {
    test("should use the same context when invoked from useTask$ with resource", async ({
      page,
    }) => {
      await page.goto("/qwikcity-test/server-func/");
      const methodsContainer = page.locator("#methods");
      await expect(methodsContainer).toContainText("GETGET");
    });

    test("should use the same context when invoked from useTask$", async ({
      page,
    }) => {
      await page.goto("/qwikcity-test/server-func/context");
      const methodsContainer = page.locator("#methods");
      await expect(methodsContainer).toContainText("GETGET");
    });
    test("should have multiple user cookie values", async ({ browser }) => {
      const user1Context = await browser.newContext();
      const user2Context = await browser.newContext();

      const user1Cookies = [
        { name: "user", value: "user1", url: "http://localhost:3301" },
      ];
      const user2Cookies = [
        { name: "user", value: "user2", url: "http://localhost:3301" },
      ];
      await user1Context.addCookies(user1Cookies);
      await user2Context.addCookies(user2Cookies);

      const [user1Page, user2Page] = await Promise.all([
        user1Context.newPage(),
        user2Context.newPage(),
      ]);
      await Promise.all([
        user1Page.goto("/qwikcity-test/server-func/cookie"),
        user2Page.goto("/qwikcity-test/server-func/cookie"),
      ]);
      const usersContainer1 = user1Page.locator("#users");
      const usersContainer2 = user2Page.locator("#users");
      await Promise.all([
        usersContainer1.waitFor({ state: "attached" }),
        usersContainer2.waitFor({ state: "attached" }),
      ]);
      await expect(usersContainer1).toContainText("user1user1");
      await expect(usersContainer2).toContainText("user2user2");
    });
    test("should have multiple server$ should set cookie value", async ({
      browser,
    }) => {
      const user1Context = await browser.newContext();
      const user2Context = await browser.newContext();

      const user1Cookies = [
        { name: "user", value: "user1", url: "http://localhost:3301" },
      ];
      const user2Cookies = [
        { name: "user", value: "user2", url: "http://localhost:3301" },
      ];
      await user1Context.addCookies(user1Cookies);
      await user2Context.addCookies(user2Cookies);

      const [user1Page, user2Page] = await Promise.all([
        user1Context.newPage(),
        user2Context.newPage(),
      ]);
      await Promise.all([
        user1Page.goto("/qwikcity-test/server-func/server-cookie"),
        user2Page.goto("/qwikcity-test/server-func/server-cookie"),
      ]);
      const usersContainer1 = user1Page.locator("#server-cookie");
      const usersContainer2 = user2Page.locator("#server-cookie");
      await Promise.all([
        usersContainer1.waitFor({ state: "visible", timeout: 2000 }),
        usersContainer2.waitFor({ state: "visible", timeout: 2000 }),
      ]);
      await expect(usersContainer1).toContainText("PatrickJS-user1");
      await expect(usersContainer2).toContainText("PatrickJS-user2");
    });
  });
});
