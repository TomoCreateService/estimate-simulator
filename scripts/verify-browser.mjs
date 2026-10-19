import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, firefox, webkit } from "@playwright/test";

const baseURL = process.env.TEST_URL || "http://127.0.0.1:5173/tools/estimate/";
await mkdir("artifacts", { recursive: true });
const report = [];

for (const [name, engine, options] of [
  ["Chrome", chromium, { channel: "chrome" }],
  ["Firefox", firefox, {}],
  ["WebKit", webkit, {}],
]) {
  const browser = await engine.launch(options);
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1100 },
      locale: "ja-JP",
    });
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type()))
        errors.push(message.text());
    });
    const total = page.getByTestId("initial-total");
    const monthly = page.getByTestId("monthly-total");
    const amount = async (initial, month = "¥0") => {
      assert.equal(await total.textContent(), initial);
      assert.equal(await monthly.textContent(), month);
    };
    await page.goto(baseURL);
    await page.getByRole("heading", { name: "お見積もりの目安" }).waitFor();
    await amount("110,000");
    assert.equal(
      await page.getByTestId("initial-tax").textContent(),
      "（うち消費税 10,000円）",
    );
    assert.equal(
      await page.locator(".p-toolbar__taxRate").textContent(),
      "消費税10%",
    );
    assert.equal(
      await page.locator(".p-siteHeader__brand").getAttribute("href"),
      "https://tomo-cs.com/",
    );
    for (const section of [
      "Concept",
      "Story",
      "Service",
      "Works",
      "Process",
      "Price",
      "Contact",
    ]) {
      assert.equal(
        await page
          .locator(".p-siteHeader__nav")
          .getByRole("link", { name: section, exact: true })
          .getAttribute("href"),
        `https://tomo-cs.com/#${section.toLowerCase()}`,
      );
    }
    assert.equal(
      await page
        .getByRole("checkbox", { name: /お問い合わせフォーム設置/ })
        .isDisabled(),
      true,
    );
    await page.getByRole("radio", { name: "税別", exact: true }).check();
    await amount("100,000");
    assert.equal(
      await page.getByTestId("initial-tax").textContent(),
      "消費税10%：10,000円",
    );
    await page.getByRole("radio", { name: "税込", exact: true }).check();
    await page
      .getByRole("spinbutton", { name: "追加ページ制作の数量", exact: true })
      .fill("3");
    await page.getByRole("checkbox", { name: /WordPress導入/ }).check();
    await amount("236,500");
    await page.getByRole("radio", { name: "税別", exact: true }).check();
    await amount("215,000");
    await page.getByRole("radio", { name: "税込", exact: true }).check();
    await page.getByRole("checkbox", { name: /月次保守プラン/ }).check();
    await amount("236,500", "¥5,500〜");
    assert.equal(
      await page.getByTestId("initial-tax").textContent(),
      "（うち消費税 21,500円）",
    );
    assert.equal(
      await page.getByTestId("monthly-tax").textContent(),
      "（うち消費税 500円）",
    );
    await page.getByRole("radio", { name: "税別", exact: true }).check();
    assert.equal(
      await page.getByTestId("monthly-tax").textContent(),
      "消費税10%：500円",
    );
    await page.getByRole("radio", { name: "税込", exact: true }).check();
    await page
      .getByRole("textbox", { name: /見積書の宛名/ })
      .fill("サンプル株式会社");
    assert.equal(
      await page
        .getByRole("link", { name: "この内容で相談する" })
        .getAttribute("href"),
      "https://tomo-cs.com/#contact",
    );
    for (const width of [1440, 1280, 1024, 768, 414, 375]) {
      await page.setViewportSize({ width, height: width < 768 ? 812 : 1100 });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${name} ${width}px：横はみ出し`,
      );
      if (width === 375) {
        await page.evaluate(() => window.scrollTo(0, 0));
        const openButton = page.getByRole("button", {
          name: "メニューを開く",
          exact: true,
        });
        await openButton.click();
        const mobileMenu = page.getByRole("navigation", {
          name: "モバイルナビゲーション",
        });
        await mobileMenu.waitFor({ state: "visible" });
        assert.equal(
          await page
            .getByRole("button", { name: "メニューを閉じる", exact: true })
            .getAttribute("aria-expanded"),
          "true",
        );
        assert.equal(
          await page.evaluate(() => document.body.style.overflow),
          "hidden",
        );
        assert.equal(
          await mobileMenu
            .getByRole("link", { name: "Concept", exact: true })
            .getAttribute("href"),
          "https://tomo-cs.com/#concept",
        );
        await page.waitForTimeout(400);
        await page
          .getByRole("button", { name: "メニューを閉じる", exact: true })
          .focus();
        await page.keyboard.press("Tab");
        assert.equal(
          await mobileMenu
            .getByRole("link", { name: "Concept", exact: true })
            .evaluate((element) => document.activeElement === element),
          true,
        );
        await page.keyboard.press("Shift+Tab");
        assert.equal(
          await page
            .getByRole("button", { name: "メニューを閉じる", exact: true })
            .evaluate((element) => document.activeElement === element),
          true,
        );
        if (name === "Chrome") {
          await page.waitForTimeout(400);
          await page.screenshot({ path: "artifacts/estimate-375px-menu.png" });
        }
        await page.keyboard.press("Escape");
        assert.equal(await openButton.getAttribute("aria-expanded"), "false");
        assert.equal(
          await page.evaluate(() => document.body.style.overflow),
          "",
        );
        await openButton.click();
        const contactLink = mobileMenu.getByRole("link", {
          name: "Contact",
          exact: true,
        });
        await contactLink.evaluate((element) =>
          element.addEventListener("click", (event) => event.preventDefault(), {
            once: true,
          }),
        );
        await contactLink.click();
        assert.equal(await openButton.getAttribute("aria-expanded"), "false");
        await openButton.click();
        await page.setViewportSize({ width: 1440, height: 1100 });
        await page.waitForFunction(
          () =>
            document
              .querySelector(".p-hamburger")
              .getAttribute("aria-expanded") === "false",
        );
        await page.setViewportSize({ width: 375, height: 812 });
      }
      if (name === "Chrome" && [1440, 375].includes(width)) {
        await page.evaluate(() => {
          document.activeElement?.blur();
          window.scrollTo(0, 0);
        });
        await page.screenshot({
          path: `artifacts/estimate-${width === 1440 ? "pc" : "375px"}.png`,
          fullPage: true,
        });
      }
    }
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.evaluate(() => window.scrollTo(0, 100));
    await page.waitForFunction(() =>
      document.querySelector(".p-siteHeader").classList.contains("is-scrolled"),
    );
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForFunction(
      () =>
        !document
          .querySelector(".p-siteHeader")
          .classList.contains("is-scrolled"),
    );

    await page
      .getByRole("spinbutton", { name: "追加ページ制作の数量", exact: true })
      .fill("0");
    await page.getByRole("checkbox", { name: /WordPress導入/ }).uncheck();
    await amount("110,000", "¥5,500〜");
    await page
      .getByRole("spinbutton", { name: "追加ページ制作の数量", exact: true })
      .fill("");
    await amount("110,000", "¥5,500〜");
    await page.getByRole("checkbox", { name: /月次保守プラン/ }).uncheck();
    await page.getByRole("radio", { name: /^LP制作/ }).check();
    await page
      .getByRole("checkbox", { name: /お問い合わせフォーム設置/ })
      .check();
    await page
      .getByRole("spinbutton", {
        name: "GSAPアニメーションの数量",
        exact: true,
      })
      .fill("2");
    await amount("121,000");
    await page.getByRole("radio", { name: "税別", exact: true }).check();
    await amount("110,000");
    await page.getByRole("radio", { name: "税込", exact: true }).check();
    await page.getByRole("radio", { name: /^ホームページ制作/ }).check();
    assert.equal(
      await page
        .getByRole("checkbox", { name: /お問い合わせフォーム設置/ })
        .isDisabled(),
      true,
    );
    await amount("132,000");
    await page
      .getByRole("spinbutton", {
        name: "GSAPアニメーションの数量",
        exact: true,
      })
      .fill("0");
    await page.getByRole("radio", { name: /^コーディング代行/ }).check();
    await page
      .getByRole("spinbutton", { name: "下層ページの数量", exact: true })
      .fill("4");
    await page.getByRole("checkbox", { name: /WordPress導入/ }).check();
    await amount("121,000");
    await page.getByRole("radio", { name: "税別", exact: true }).check();
    await amount("110,000");
    await page.getByRole("radio", { name: "税込", exact: true }).check();
    await page
      .getByRole("spinbutton", { name: "TOPページの数量", exact: true })
      .fill("");
    await page
      .getByRole("spinbutton", { name: "下層ページの数量", exact: true })
      .fill("0");
    await amount("44,000");
    await page.getByRole("checkbox", { name: /WordPress導入/ }).uncheck();
    await amount("0");
    assert.equal(
      await page.getByRole("button", { name: "PDFで保存" }).isDisabled(),
      true,
    );
    await page.getByRole("radio", { name: /^Webアプリ開発/ }).check();
    await amount("110,000");
    assert.equal(
      await page.locator(".p-summary__consultation").isVisible(),
      true,
    );
    await page.getByRole("radio", { name: /^ホームページ制作/ }).check();
    await page
      .getByRole("spinbutton", { name: "追加ページ制作の数量", exact: true })
      .fill("3");
    await page.getByRole("checkbox", { name: /WordPress導入/ }).check();
    await page.getByRole("checkbox", { name: /月次保守プラン/ }).check();
    await amount("236,500", "¥5,500〜");
    let printCalled = false;
    await page.exposeFunction("recordPrint", () => {
      printCalled = true;
    });
    await page.evaluate(() => {
      window.print = () => window.recordPrint();
    });
    await page.getByRole("button", { name: "PDFで保存" }).click();
    await page.waitForTimeout(50);
    assert.equal(printCalled, true);
    await page.evaluate(() => document.activeElement?.blur());
    await page.emulateMedia({ media: "print" });
    assert.equal(await page.locator(".p-screen").isVisible(), false);
    assert.equal(
      await page
        .getByRole("heading", { name: "概算見積書", exact: true })
        .isVisible(),
      true,
    );
    assert.equal(
      await page.locator(".p-document__recipient").textContent(),
      "サンプル株式会社 様",
    );
    const totals = page.locator(".p-document__totals");
    assert.deepEqual(await totals.locator("dt").allTextContents(), [
      "合計（税別）",
      "消費税（10%）",
      "合計（税込）",
    ]);
    assert.deepEqual(
      (await totals.locator("dd").allTextContents()).map((text) => text.trim()),
      ["¥215,000", "¥21,500", "¥236,500〜"],
    );
    if (name === "Chrome") {
      await page.pdf({
        path: "artifacts/estimate-sample.pdf",
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
      });
      await page.screenshot({
        path: "artifacts/estimate-print-preview.png",
        fullPage: true,
      });
    }

    assert.deepEqual(errors, []);
    report.push({
      browser: name,
      status: "合格",
      widths: [1440, 1280, 1024, 768, 414, 375],
      consoleErrorsAndWarnings: errors.length,
    });
    process.stdout.write(`${name}：表示・操作・印刷レイアウト 合格\n`);
    await page.close();
  } catch (error) {
    report.push({ browser: name, status: "未完了", error: error.stack });
    process.stderr.write(
      `${name}：検証未完了（${error.message.split("\n")[0]}）\n`,
    );
    process.exitCode = 1;
  } finally {
    await writeFile(
      "artifacts/browser-report.json",
      `${JSON.stringify(report, null, 2)}\n`,
    );
    await browser.close();
  }
}
await writeFile(
  "artifacts/browser-report.json",
  `${JSON.stringify(report, null, 2)}\n`,
);
