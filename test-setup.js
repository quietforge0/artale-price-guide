// 測試環境設定
import { expect, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

// 每個測試後清理
beforeEach(() => {
  cleanup();
});

// 模擬瀏覽器環境
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// 擴展expect匹配器
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
  toBeValidProbability(received) {
    const pass =
      received >= 0 &&
      received <= 100 &&
      !isNaN(received) &&
      isFinite(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid probability`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid probability (0-100)`,
        pass: false,
      };
    }
  },
  toBeValidScrollCombination(received) {
    const pass =
      received &&
      Array.isArray(received.scrolls) &&
      typeof received.totalScrolls === "number" &&
      typeof received.averageSuccessRate === "number" &&
      received.totalScrolls >= 0 &&
      received.averageSuccessRate >= 0 &&
      received.averageSuccessRate <= 100;

    if (pass) {
      return {
        message: () => `expected object not to be a valid scroll combination`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected object to be a valid scroll combination`,
        pass: false,
      };
    }
  },
});

global.console = {
  ...console,
  // 測試期間靜音某些日誌
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: console.warn,
  error: console.error,
};
