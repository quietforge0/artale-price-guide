import { describe, it, expect } from "vitest";

describe("開發環境健康檢查", () => {
  it("應能正常執行基本測試", () => {
    expect(true).toBe(true);
  });

  it("環境變數應該正確設定", () => {
    expect(typeof window).toBe("object");
  });

  it("數學運算應該正常", () => {
    expect(1 + 1).toBe(2);
    expect(Math.max(1, 2, 3)).toBe(3);
  });

  it("陣列操作應該正常", () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
    expect(arr.includes(2)).toBe(true);
  });

  it("物件操作應該正常", () => {
    const obj = { name: "test", value: 100 };
    expect(obj.name).toBe("test");
    expect(obj.value).toBe(100);
  });
});
