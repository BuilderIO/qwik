import { test, expect } from "@playwright/test";

test.describe("signals", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/e2e/signals");
    page.on("pageerror", (err) => expect(err).toEqual(undefined));
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        expect(msg.text()).toEqual(undefined);
      }
    });
  });

  function tests() {
    test("should do its thing", async ({ page }) => {
      const incrementBtn = page.locator("#count");
      const clickBtn = page.locator("#click");
      const incrementIdBtn = page.locator("#increment-id");
      const backgroundBtn = page.locator("#background");

      const parentRender = page.locator("#parent-renders");
      const childRender = page.locator("#child-renders");

      const text = page.locator("#text");
      const id = page.locator("#id");
      const computed = page.locator("#computed");
      const stuff = page.locator("#stuff");
      const body = page.locator("body");

      await expect(parentRender).toHaveText("Parent renders: 1");
      await expect(childRender).toHaveText("Child renders: 1");
      await expect(text).toHaveText("Text: Message");
      await expect(text).toHaveAttribute("data-set", "ref");
      await expect(id).toHaveText("Id: 0");
      await expect(computed).toHaveText("computed: ");
      await expect(stuff).toHaveText("Stuff: 10");
      await expect(stuff).toHaveAttribute("data-set", "ref2");

      await incrementBtn.click();
      await expect(parentRender).toHaveText("Parent renders: 1");
      await expect(childRender).toHaveText("Child renders: 1");
      await expect(text).toHaveText("Text: Message");
      await expect(text).toHaveAttribute("data-set", "ref");
      await expect(id).toHaveText("Id: 0");
      await expect(computed).toHaveText("computed: ");
      await expect(stuff).toHaveText("Stuff: 11");
      await expect(stuff).toHaveAttribute("data-set", "ref2");

      await clickBtn.click();
      await expect(parentRender).toHaveText("Parent renders: 1");
      await expect(childRender).toHaveText("Child renders: 1");
      await expect(text).toHaveText("Text: Message");
      await expect(text).toHaveAttribute("data-set", "ref");
      await expect(id).toHaveText("Id: 0");
      await expect(computed).toHaveText("computed: clicked");
      await expect(stuff).toHaveText("Stuff: 11");
      await expect(stuff).toHaveAttribute("data-set", "ref2");

      await incrementIdBtn.click();
      await expect(parentRender).toHaveText("Parent renders: 1");
      await expect(childRender).toHaveText("Child renders: 1");
      await expect(text).toHaveText("Text: Message");
      await expect(text).toHaveAttribute("data-set", "ref");
      await expect(id).toHaveText("Id: 1");
      await expect(computed).toHaveText("computed: clicked");
      await expect(stuff).toHaveText("Stuff: 11");
      await expect(stuff).toHaveAttribute("data-set", "ref2");
      await expect(body).toHaveCSS("background-color", "rgb(255, 255, 255)");

      await backgroundBtn.click();
      await expect(parentRender).toHaveText("Parent renders: 1");
      await expect(childRender).toHaveText("Child renders: 2");
      await expect(text).toHaveText("Text: Message");
      await expect(text).toHaveAttribute("data-set", "ref");
      await expect(id).toHaveText("Id: 1");
      await expect(computed).toHaveText("computed: clicked");
      await expect(stuff).toHaveText("Stuff: 11");
      await expect(stuff).toHaveAttribute("data-set", "ref2");
      await expect(body).toHaveCSS("background-color", "rgb(0, 0, 0)");
    });

    test("issue 1681", async ({ page }) => {
      const result = page.locator("#issue-1681-return");
      const button = page.locator("#issue-1681-btn");

      await expect(result).toHaveText("Count A is 0 Count B is 0");
      await button.click();
      await expect(result).toHaveText("Count A is 1 Count B is 1");
    });

    test("issue 1733", async ({ page }) => {
      const button = page.locator("#issue1733-btn");
      const spanSignal = page.locator("#issue1733-signal");
      const spanTrue = page.locator("#issue1733-true");
      const spanFalse = page.locator("#issue1733-false");
      const h1 = page.locator("#issue1733-h1");

      await expect(spanSignal).toHaveText("");
      await expect(spanTrue).toHaveText("");
      await expect(spanFalse).toHaveText("");
      await expect(h1).not.toBeVisible();

      await button.click();

      await expect(spanSignal).toHaveText("");
      await expect(spanTrue).toHaveText("");
      await expect(spanFalse).toHaveText("");
      await expect(h1).toBeVisible();
      await expect(h1).toHaveText("Message");
    });

    test("issue 1884", async ({ page }) => {
      const button = page.locator("#issue1884-btn");
      const text0 = page.locator(".issue1884-text:nth-child(1)");
      const text1 = page.locator(".issue1884-text:nth-child(2)");
      const text2 = page.locator(".issue1884-text:nth-child(3)");
      const text3 = page.locator(".issue1884-text:nth-child(4)");

      await expect(text0).toHaveCSS("color", "rgb(0, 0, 0)");
      await expect(text1).toHaveCSS("color", "rgb(0, 0, 0)");
      await expect(text2).toHaveCSS("color", "rgb(0, 0, 0)");
      await expect(text3).toHaveCSS("color", "rgb(0, 0, 0)");

      await button.click();

      await expect(text0).toHaveCSS("color", "rgb(255, 0, 0)");
      await expect(text1).toHaveCSS("color", "rgb(255, 0, 0)");
      await expect(text2).toHaveCSS("color", "rgb(255, 0, 0)");
      await expect(text3).toHaveCSS("color", "rgb(255, 0, 0)");
    });

    test("issue 2000", async ({ page }) => {
      const textArea = page.locator("#textarea");
      await expect(textArea).toHaveValue("body { background: white}");
    });

    test("issue 2176", async ({ page }) => {
      const btn = page.locator("#issue-2176-btn");
      const results = page.locator(".issue-2176-result");
      await expect(results).toHaveText([
        "testing flag=F num=1",
        "testing flag=F num=1",
        "testing flag=F num=1",
        "testing flag=F num=1",
        "testing flag=F num=1",
        "testing flag=F num=1",
        "testing flag=F num=1",
        "testing flag=F num=1",
        "testing flag=F num=1",
        "testing flag=F num=1",
        "testing flag=F num=1",
        "testing flag=F num=1",
      ]);

      await btn.click();
      await expect(results).toHaveText([
        "testing2 flag=T num=2",
        "testing2 flag=T num=2",
        "testing2 flag=T num=2",
        "testing2 flag=T num=2",
        "testing2 flag=T num=2",
        "testing2 flag=T num=2",
        "testing2 flag=T num=2",
        "testing2 flag=T num=2",
        "testing2 flag=T num=2",
        "testing2 flag=T num=2",
        "testing2 flag=T num=2",
        "testing2 flag=T num=2",
      ]);

      await btn.click();
      await expect(results).toHaveText([
        "testing3 flag=F num=3",
        "testing3 flag=F num=3",
        "testing3 flag=F num=3",
        "testing3 flag=F num=3",
        "testing3 flag=F num=3",
        "testing3 flag=F num=3",
        "testing3 flag=F num=3",
        "testing3 flag=F num=3",
        "testing3 flag=F num=3",
        "testing3 flag=F num=3",
        "testing3 flag=F num=3",
        "testing3 flag=F num=3",
      ]);
    });

    test("issue 2245", async ({ page }) => {
      const btn = page.locator("#issue-2245-btn");
      const results = page.locator(".issue-2245-results p");
      expect(await results.count()).toBe(16);
      for (let i = 0; i < 16; i++) {
        await expect(results.nth(i)).toHaveCSS("color", "rgb(0, 0, 0)");
      }

      await btn.click();
      for (let i = 0; i < 16; i++) {
        await expect(results.nth(i)).toHaveCSS("color", "rgb(255, 0, 0)");
      }

      await btn.click();
      for (let i = 0; i < 16; i++) {
        await expect(results.nth(i)).toHaveCSS("color", "rgb(0, 0, 255)");
      }
    });

    test("issue 2245-b", async ({ page }) => {
      const btn = page.locator("#issue-2245-b-btn");
      const results = page.locator(".issue-2245-b-results p");
      await expect(results).toHaveCSS("color", "rgb(0, 0, 0)");

      await btn.click();
      await expect(results).toHaveCSS("color", "rgb(255, 0, 0)");

      await btn.click();
      await expect(results).toHaveCSS("color", "rgb(0, 0, 255)");

      await btn.click();
      await expect(results).toHaveCSS("color", "rgb(0, 128, 0)");
    });

    test("complex classes with signals", async ({ page }) => {
      const btn = page.locator("#complex-classes-btn");
      const results = page.locator("#complex-classes-results");

      await expect(results).toHaveClass("initial visible");
      await btn.click();
      await expect(results).toHaveClass("change hidden");
    });

    test("issue 2311", async ({ page }) => {
      const btn = page.locator("#issue-2311-btn");
      const results = page.locator("#issue-2311-results > *");
      await expect(results).toHaveText([
        "This text should not change",
        "Hello",
        "This text should not change",
        "Hello",
        "This text should not change",
        "Hello",
        "This text should not change",
        "Hello",
        "This text should not change",
        "Hello",
      ]);

      await btn.click();

      await expect(results).toHaveText([
        "This text should not change",
        "Done!",
        "This text should not change",
        "Done!",
        "This text should not change",
        "Done!",
        "This text should not change",
        "Done!",
        "This text should not change",
        "Done!",
      ]);
    });

    test("issue 2344", async ({ page }) => {
      const btn = page.locator("#issue-2344-btn");
      const results = page.locator("#issue-2344-results");
      await expect(results).toHaveValue("Content");
      await btn.click();
      await expect(results).toHaveValue("Content");
    });

    test("issue 2930", async ({ page }) => {
      const input = page.locator("#issue-2930-input");
      const results = page.locator(".issue-2930-result");
      await expect(results).toHaveText([
        '{"controls":{"ctrl":{"value":""}}}',
        '{"ctrl":{"value":""}}',
        '{"value":""}',
        '""',
      ]);
      await page.waitForTimeout(100);
      await input.fill("test");
      await expect(results).toHaveText([
        '{"controls":{"ctrl":{"value":"test"}}}',
        '{"ctrl":{"value":"test"}}',
        '{"value":"test"}',
        '"test"',
      ]);
    });

    test("issue 3212", async ({ page }) => {
      const result0 = page.locator("#issue-3212-result-0");
      const result1 = page.locator("#issue-3212-result-1");
      const result2 = page.locator("#issue-3212-result-2");
      const result3 = page.locator("#issue-3212-result-3");

      await expect(result0).toHaveText("1");
      await expect(result1).toHaveText("1");
      await expect(result2).toHaveText("1");
      await expect(result3).toHaveText("1");
    });

    test("fine-grained-mutable", async ({ page }) => {
      const mutable = page.locator("#fine-grained-mutable");
      const signal = page.locator("#fine-grained-signal");

      await expect(mutable).toHaveText("2");
      await expect(signal).toHaveText("Increment 0");

      await signal.click();
      await expect(mutable).toHaveText("3");
      await expect(signal).toHaveText("Increment 1");

      await signal.click();
      await expect(mutable).toHaveText("4");
      await expect(signal).toHaveText("Increment 2");
    });

    test("issue 3415", async ({ page }) => {
      const result = page.locator("#issue-3415-result");
      const button = page.locator("#issue-3415-button");
      await expect(result).toHaveText("foo");
      await expect(await result.innerHTML()).toEqual("<b>foo</b>");

      await button.click();
      await expect(result).toHaveText("bar");
      await expect(await result.innerHTML()).toEqual("<i>bar</i>");
    });

    test("bind value", async ({ page }) => {
      const input = page.locator("#bind-input-1");
      const textarea = page.locator("#bind-input-2");
      const text1 = page.locator("#bind-text-1");
      const text2 = page.locator("#bind-text-2");
      const checkbox = page.locator("#bind-checkbox");
      const checkbox2 = page.locator("#bind-checkbox-2");

      await expect(input).toHaveValue("initial");
      await expect(textarea).toHaveValue("initial");
      await expect(text1).toHaveText("Value: initial");
      await expect(text2).toHaveText("Value: initial");

      await input.clear();
      await input.fill("from1");
      await expect(input).toHaveValue("from1");
      await expect(textarea).toHaveValue("from1");
      await expect(text1).toHaveText("Value: from1");
      await expect(text2).toHaveText("Value: from1");

      await input.clear();
      await textarea.type("from2");
      await expect(input).toHaveValue("from2");
      await expect(textarea).toHaveValue("from2");
      await expect(text1).toHaveText("Value: from2");
      await expect(text2).toHaveText("Value: from2");

      await input.clear();
      await expect(input).toHaveValue("");
      await expect(textarea).toHaveValue("");
      await expect(text1).toHaveText("Value: ");
      await expect(text2).toHaveText("Value: ");

      await expect(checkbox).not.toBeChecked();
      await expect(checkbox2).not.toBeChecked();
      await expect(input).not.toBeDisabled();
      await expect(textarea).not.toBeDisabled();

      await checkbox.click();
      await expect(checkbox).toBeChecked();
      await expect(checkbox2).toBeChecked();
      await expect(input).toBeDisabled();
      await expect(textarea).toBeDisabled();

      await checkbox2.click();
      await expect(checkbox).not.toBeChecked();
      await expect(checkbox2).not.toBeChecked();
      await expect(input).not.toBeDisabled();
      await expect(textarea).not.toBeDisabled();

      await checkbox2.click();
      await expect(checkbox).toBeChecked();
      await expect(checkbox2).toBeChecked();
      await expect(input).toBeDisabled();
      await expect(textarea).toBeDisabled();
    });

    test("issue 3482", async ({ page }) => {
      const button = page.locator("#issue-3482-button");
      const result = page.locator("#issue-3482-result");

      await expect(button).toHaveText("Increment 0");
      await expect(button).toHaveAttribute("data-count", "0");
      await expect(result).toHaveText("0");
      await expect(result).toHaveAttribute("data-count", "0");

      await button.click();
      await expect(button).toHaveText("Increment 1");
      await expect(button).toHaveAttribute("data-count", "1");
      await expect(result).toHaveText("1");
      await expect(result).toHaveAttribute("data-count", "1");
    });

    test("issue 3663", async ({ page }) => {
      const button = page.locator("#issue-3663-button");
      const result = page.locator(".issue-3663-result");
      await expect(result).toHaveText(["0", "0", "0"]);
      await button.click();
      await expect(result).toHaveText(["1", "1", "1"]);
      await button.click();
      await expect(result).toHaveText(["2", "2", "2"]);
      await button.click();
      await expect(result).toHaveText(["3", "3", "3"]);
    });

    test("issue 3440", async ({ page }) => {
      const results = page.locator(".issue-3440-results");
      const remove = page.locator("#issue-3440-remove");
      await expect(results).toHaveText([
        "my first blog",
        "my second blogs",
        "my third blog",
      ]);
      await remove.click();
      await expect(results).toHaveText(["my first blog", "my second blogs"]);
      await remove.click();
      await expect(results).toHaveText(["my first blog"]);
      await remove.click();
      await expect(results).toHaveText([]);
    });

    test("issue 4174", async ({ page }) => {
      const result = page.locator("#issue-4174-result");
      await expect(result).toHaveText("Store: visible-task");
    });

    test("issue 4249", async ({ page }) => {
      const first = page.locator("#issue-4249-first");
      const second = page.locator("#issue-4249-second");
      const result = page.locator("#issue-4249-result");

      await expect(result).toHaveText("Status: No collision");
      await expect(result).toHaveAttribute("data-value", "no-collision");
      await second.fill("bar");
      await first.fill("bar");
      await expect(result).toHaveText("Status: Collision detected");
      await expect(result).toHaveAttribute("data-value", "collision");

      await first.fill("foo");
      await second.fill("foo");
      await expect(result).toHaveText("Status: Collision detected");
      await expect(result).toHaveAttribute("data-value", "collision");
    });

    test("issue 4228", async ({ page }) => {
      const buttonA = page.locator("#issue-4228-button-a");
      const buttonB = page.locator("#issue-4228-button-b");
      const buttonC = page.locator("#issue-4228-button-c");
      const resultA = page.locator("#issue-4228-result-a");
      const resultB = page.locator("#issue-4228-result-b");
      const resultC = page.locator("#issue-4228-result-c");
      const resultTotal = page.locator("#issue-4228-result-total");

      await expect(resultA).toHaveText("0:0");
      await expect(resultB).toHaveText("0:0");
      await expect(resultC).toHaveText("0:0");
      await expect(resultTotal).toHaveText("0:0");

      await buttonA.click();
      await expect(resultA).toHaveText("1:1");
      await expect(resultB).toHaveText("0:0");
      await expect(resultC).toHaveText("0:0");
      await expect(resultTotal).toHaveText("1:1");

      await buttonB.click();
      await expect(resultA).toHaveText("1:1");
      await expect(resultB).toHaveText("1:1");
      await expect(resultC).toHaveText("0:0");
      await expect(resultTotal).toHaveText("2:2");

      await buttonC.click();
      await expect(resultA).toHaveText("1:1");
      await expect(resultB).toHaveText("1:1");
      await expect(resultC).toHaveText("1:1");
      await expect(resultTotal).toHaveText("3:3");

      await buttonA.click();
      await expect(resultA).toHaveText("2:2");
      await expect(resultB).toHaveText("1:1");
      await expect(resultC).toHaveText("1:1");
      await expect(resultTotal).toHaveText("4:4");

      await buttonB.click();
      await expect(resultA).toHaveText("2:2");
      await expect(resultB).toHaveText("2:2");
      await expect(resultC).toHaveText("1:1");
      await expect(resultTotal).toHaveText("5:5");

      await buttonC.click();
      await expect(resultA).toHaveText("2:2");
      await expect(resultB).toHaveText("2:2");
      await expect(resultC).toHaveText("2:2");
      await expect(resultTotal).toHaveText("6:6");
    });

    test("issue 4368", async ({ page }) => {
      const input = page.locator("#issue-4368-input");
      const button = page.locator("#issue-4368-button");

      await expect(button).toHaveText("Text is empty");
      await expect(button).toBeDisabled();

      await input.fill("foo");

      await expect(button).toHaveText("Example button");
      await expect(button).not.toBeDisabled();
    });

    test("issue 4868", async ({ page }) => {
      const btn1 = page.locator("#issue-4868-btn-1");
      const btn2 = page.locator("#issue-4868-btn-2");
      const json = page.locator("#issue-4868-json");
      const props = page.locator("#issue-4868-props");
      const usecomputed = page.locator("#issue-4868-usecomputed");

      await expect(json).toHaveText(
        `{"src":"https://placehold.co/400x400?text=1","id":1}`,
      );
      await expect(props).toHaveText(
        `Card props.src: https://placehold.co/400x400?text=1`,
      );
      await expect(usecomputed).toHaveText(
        `Card useComputed$: https://placehold.co/400x400?text=1&useComputed$`,
      );

      await btn2.click();

      await expect(json).toHaveText(
        `{"src":"https://placehold.co/500x500?text=2","id":2}`,
      );
      await expect(props).toHaveText(
        `Card props.src: https://placehold.co/500x500?text=2`,
      );
      await expect(usecomputed).toHaveText(
        `Card useComputed$: https://placehold.co/500x500?text=2&useComputed$`,
      );

      await btn1.click();

      await expect(json).toHaveText(
        `{"src":"https://placehold.co/400x400?text=1","id":1}`,
      );
      await expect(props).toHaveText(
        `Card props.src: https://placehold.co/400x400?text=1`,
      );
      await expect(usecomputed).toHaveText(
        `Card useComputed$: https://placehold.co/400x400?text=1&useComputed$`,
      );
    });
  }

  tests();

  test.describe("client rerender", () => {
    test.beforeEach(async ({ page }) => {
      const toggleRender = page.locator("#rerender");
      await toggleRender.click();
      await page.waitForTimeout(200);
    });
    tests();
  });
});

test.describe("regressions", () => {
  test("issue 5001", async ({ page }) => {
    await page.goto("/e2e/signals/issue-5001");
    await expect(page.locator(".count")).toHaveText("0");
    await page.locator("button").click();
    await expect(page.locator(".count")).toHaveText("1");
  });

  test("issue 5017", async ({ page }) => {
    await page.goto("/e2e/signals/issue-5017");
    await expect(page.locator(".standalone > .binding")).toHaveText("INITIAL");
    await expect(page.locator(".loop > .binding")).toHaveText("INITIAL");
    await page.locator("button").click();
    await expect(page.locator(".standalone > .binding")).toHaveText("UPDATE");
    await expect(page.locator(".loop > .binding")).toHaveText("UPDATE");
  });
});
