import { describe, expect, test } from "vitest";
import prices from "../config/prices.json";
import {
  calculateEstimate,
  createDocumentDetails,
  normalizeQuantity,
  withTax,
} from "./calculateEstimate.js";

describe("確認済みの正解表", () => {
  test("1. ホームページ制作のみ", () => {
    const result = calculateEstimate({ service: "website" });
    expect([result.initialWithTax, result.initial]).toEqual([110000, 100000]);
  });
  test("2. ホームページ制作＋追加ページ3＋WordPress", () => {
    const result = calculateEstimate({
      service: "website",
      options: { pages: 3, wordpress: true },
    });
    expect([result.initialWithTax, result.initial]).toEqual([236500, 215000]);
  });
  test("3. LP制作＋フォーム＋アニメーション2", () => {
    const result = calculateEstimate({
      service: "landing",
      options: { form: true, animation: 2 },
    });
    expect([result.initialWithTax, result.initial]).toEqual([121000, 110000]);
  });
  test("4. コーディング代行TOP1・下層4＋WordPress", () => {
    const result = calculateEstimate({
      service: "coding",
      coding: { top: 1, subpage: 4 },
      options: { wordpress: true },
    });
    expect([result.initialWithTax, result.initial]).toEqual([121000, 110000]);
  });
  test("5. ホームページ制作＋月次保守", () => {
    const result = calculateEstimate({ service: "website", maintenance: true });
    expect([
      result.initialWithTax,
      result.monthlyWithTax,
      result.initial,
      result.monthly,
    ]).toEqual([110000, 5500, 100000, 5000]);
  });
});

describe("二重請求と数量の境界値", () => {
  test("ホームページ制作でフォームを指定しても追加請求しない", () => {
    const result = calculateEstimate({
      service: "website",
      options: { form: true },
    });
    expect(result.initial).toBe(100000);
    expect(result.items.some((item) => item.id === "form")).toBe(false);
  });
  test.each([0, "", undefined, null])(
    "追加ページ・アニメーションの数量 %s は0件になる",
    (quantity) => {
      const result = calculateEstimate({
        service: "website",
        options: { pages: quantity, animation: quantity },
      });
      expect([result.initial, result.initialWithTax]).toEqual([100000, 110000]);
      expect(result.items).toHaveLength(1);
    },
  );
  test.each([0, ""])(
    "コーディング数量 %s でNaNや不要な料金が発生しない",
    (quantity) => {
      const result = calculateEstimate({
        service: "coding",
        coding: { top: quantity, subpage: quantity, lp: quantity },
      });
      expect([result.initial, result.initialWithTax]).toEqual([0, 0]);
      expect(result.items).toEqual([]);
    },
  );
  test.each([
    [-5, 0],
    ["abc", 0],
    [Infinity, 0],
    [2.9, 2],
    ["3", 3],
    [10000, 99],
  ])("不正値・小数・上限を正規化する：%s → %s", (value, expected) => {
    expect(normalizeQuantity(value)).toBe(expected);
  });
  test("オプションのみで月額保守を選べる", () => {
    const result = calculateEstimate({ service: "options", maintenance: true });
    expect([result.initial, result.monthlyWithTax]).toEqual([0, 5500]);
  });
  test("Webアプリには要相談の情報が含まれる", () => {
    const result = calculateEstimate({ service: "app" });
    expect(result.consultation).toBe(true);
    expect(result.initialWithTax).toBe(110000);
  });
  test("コーディングLPと固定料金オプションを集計する", () => {
    const result = calculateEstimate({
      service: "coding",
      coding: { lp: 1 },
      options: { form: true, server: true },
    });
    expect([result.initial, result.initialWithTax]).toEqual([55000, 60500]);
  });
  test("画面に表示されていないコーディング数量は加算しない", () => {
    expect(
      calculateEstimate({ service: "landing", coding: { top: 1, subpage: 4 } })
        .initial,
    ).toBe(80000);
  });
});

describe("単価設定と税計算", () => {
  const allPrices = [
    ...Object.values(prices.services),
    ...Object.values(prices.coding),
    ...Object.values(prices.options),
    prices.maintenance,
  ];
  test("設定された全単価が税別の非負整数であり、税込計算に端数がない", () => {
    for (const item of allPrices) {
      expect(Number.isInteger(item.price)).toBe(true);
      expect(item.price).toBeGreaterThanOrEqual(0);
      expect((item.price * (100 + prices.taxRatePercent)) % 100).toBe(0);
    }
  });
  test("数量0〜99の範囲でも税込額に端数がない", () => {
    for (const item of allPrices) {
      for (let quantity = 0; quantity <= 99; quantity += 1) {
        const amount = item.price * quantity;
        expect(withTax(amount)).toBe(
          (amount * (100 + prices.taxRatePercent)) / 100,
        );
      }
    }
  });
  test("内訳の合計が初期費用と一致する", () => {
    const result = calculateEstimate({
      service: "website",
      options: { pages: 3, wordpress: true, animation: 2, server: true },
      maintenance: true,
    });
    expect(result.items.reduce((sum, item) => sum + item.amount, 0)).toBe(
      result.initial,
    );
  });
});

describe("見積書の日付・番号", () => {
  test("年をまたいでも有効期限は発行日の30日後になる", () => {
    const details = createDocumentDetails(new Date(2026, 11, 15, 12));
    expect(details.date).toBe("2026-12-15");
    expect(details.expires).toBe("2027-01-14");
    expect(details.number).toMatch(/^TCS-20261215-[A-F0-9]{8}$/);
  });
  test("再発行時に異なる番号を作る", () => {
    expect(createDocumentDetails().number).not.toBe(
      createDocumentDetails().number,
    );
  });
});
