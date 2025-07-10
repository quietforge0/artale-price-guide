import { describe, it, expect } from "vitest";
import { SCROLLS, getScrollsForEquipmentType } from "../../constants/scrolls";
import { EQUIPMENT_TYPES } from "../../constants/equipmentTypes";
import { AVAILABLE_EQUIPMENT_TYPES } from "../../constants/equipment";

describe("模糊測試 - 邊緣情況處理", () => {
  describe("輸入驗證邊緣情況", () => {
    it("應該處理空卷軸數組", () => {
      const emptyScrolls: string[] = [];

      // 模擬處理空數組的情況
      const processEmptyScrolls = (scrollIds: string[]) => {
        if (scrollIds.length === 0) {
          return { success: false, reason: "沒有卷軸" };
        }
        return { success: true };
      };

      const result = processEmptyScrolls(emptyScrolls);
      expect(result.success).toBe(false);
      expect(result.reason).toBe("沒有卷軸");
    });

    it("應該處理不存在的卷軸ID", () => {
      const invalidScrollIds = [
        "invalid_scroll_1",
        "nonexistent_scroll",
        "",
        null as unknown as string,
        undefined as unknown as string,
      ];

      invalidScrollIds.forEach((scrollId) => {
        const foundScroll = SCROLLS.find((s) => s.id === scrollId);
        expect(foundScroll).toBeUndefined();
      });
    });

    it("應該處理無效的裝備類型", () => {
      const invalidEquipmentTypes = [
        "",
        "invalid_equipment",
        "不存在的裝備",
        null as unknown as string,
        undefined as unknown as string,
      ];

      invalidEquipmentTypes.forEach((equipType) => {
        const scrolls = getScrollsForEquipmentType(equipType);
        expect(scrolls).toEqual([]);
      });
    });

    it("應該處理特殊字符的裝備類型", () => {
      const specialCharTypes = [
        "!@#$%^&*()",
        "裝備\n\t類型",
        "équipment_typé",
        "装备类型",
        "🎮⚔️🛡️",
      ];

      specialCharTypes.forEach((equipType) => {
        const scrolls = getScrollsForEquipmentType(equipType);
        expect(Array.isArray(scrolls)).toBe(true);
        expect(scrolls.length).toBe(0);
      });
    });
  });

  describe("數值邊界測試", () => {
    it("應該處理極值停損條件", () => {
      const extremeConditions = [
        { attribute: "物攻", minValue: 0, scrollIndex: 1 }, // 最小值
        {
          attribute: "物攻",
          minValue: Number.MAX_SAFE_INTEGER,
          scrollIndex: 1,
        }, // 最大值
        { attribute: "物攻", minValue: -1, scrollIndex: 1 }, // 負數
        { attribute: "物攻", minValue: 999999999, scrollIndex: 0 }, // 零索引
        { attribute: "物攻", minValue: 5, scrollIndex: -1 }, // 負索引
      ];

      const mockCurrentStats = { 物攻: 10, 命中率: 5 };

      const checkStopLoss = (
        stats: Record<string, number>,
        scrollsUsed: number,
        condition: (typeof extremeConditions)[0]
      ) => {
        if (scrollsUsed === condition.scrollIndex) {
          const currentValue = stats[condition.attribute] || 0;
          return currentValue < condition.minValue;
        }
        return false;
      };

      // 測試最小值條件 - 應該通過
      expect(checkStopLoss(mockCurrentStats, 1, extremeConditions[0])).toBe(
        false
      );

      // 測試極大值條件 - 應該失敗
      expect(checkStopLoss(mockCurrentStats, 1, extremeConditions[1])).toBe(
        true
      );

      // 測試負數條件 - 應該通過
      expect(checkStopLoss(mockCurrentStats, 1, extremeConditions[2])).toBe(
        false
      );
    });

    it("應該處理超大卷軸數量", () => {
      const largeNumbers = [100, 1000, 10000, Number.MAX_SAFE_INTEGER];

      largeNumbers.forEach((count) => {
        // 模擬生成大量卷軸序列
        const generateLargeSequence = (requestedCount: number) => {
          const maxPracticalCount = Math.min(requestedCount, 1000); // 實際限制
          const scrolls = getScrollsForEquipmentType(EQUIPMENT_TYPES.GUN);

          if (scrolls.length === 0) return [];

          const sequence: string[] = [];
          for (let i = 0; i < maxPracticalCount; i++) {
            sequence.push(scrolls[i % scrolls.length].id);
          }
          return sequence;
        };

        const sequence = generateLargeSequence(count);
        expect(sequence.length).toBeLessThanOrEqual(1000); // 合理的上限
        expect(sequence.length).toBeGreaterThanOrEqual(0);
      });
    });

    it("應該處理極值成功率", () => {
      // 測試邊界成功率的數學計算
      const edgeSuccessRates = [0, 0.001, 99.999, 100, 100.001, -1];

      edgeSuccessRates.forEach((rate) => {
        const calculateSuccess = (successRate: number) => {
          const clampedRate = Math.max(0, Math.min(100, successRate));
          return Math.random() < clampedRate / 100;
        };

        // 這個測試主要是確保不會拋出錯誤
        expect(() => calculateSuccess(rate)).not.toThrow();
      });
    });
  });

  describe("記憶體和性能邊界", () => {
    it("應該處理大量屬性統計", () => {
      const massiveStats: Record<string, number> = {};

      // 創建大量屬性
      for (let i = 0; i < 1000; i++) {
        massiveStats[`屬性_${i}`] = Math.floor(Math.random() * 100);
      }

      // 測試統計操作的性能
      const startTime = performance.now();

      const totalStats = Object.keys(massiveStats).length;
      const sumValues = Object.values(massiveStats).reduce(
        (sum, val) => sum + val,
        0
      );
      const avgValue = sumValues / totalStats;

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(totalStats).toBe(1000);
      expect(sumValues).toBeGreaterThan(0);
      expect(avgValue).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100); // 應該在100ms內完成
    });

    it("應該處理深度嵌套的數據結構", () => {
      interface NestedResult {
        level: number;
        stats: Record<string, number>;
        children?: NestedResult[];
      }

      const createDeepStructure = (depth: number): NestedResult => {
        const result: NestedResult = {
          level: depth,
          stats: { 物攻: depth * 2, 命中率: depth },
        };

        if (depth > 0) {
          result.children = [
            createDeepStructure(depth - 1),
            createDeepStructure(depth - 1),
          ];
        }

        return result;
      };

      const deepStructure = createDeepStructure(10);

      // 測試遍歷深度結構
      const traverseStructure = (node: NestedResult): number => {
        let count = 1;
        if (node.children) {
          count += node.children.reduce(
            (sum, child) => sum + traverseStructure(child),
            0
          );
        }
        return count;
      };

      const nodeCount = traverseStructure(deepStructure);
      expect(nodeCount).toBeGreaterThan(1000); // 2^10 + 2^9 + ... ≈ 2000+
    });
  });

  describe("併發和競態條件測試", () => {
    it("同時訪問共享資源", () => {
      let sharedCounter = 0;
      const promises: Promise<void>[] = [];

      // 模擬多個併發操作
      for (let i = 0; i < 100; i++) {
        promises.push(
          new Promise((resolve) => {
            setTimeout(() => {
              sharedCounter++;
              resolve();
            }, Math.random() * 10);
          })
        );
      }

      return Promise.all(promises).then(() => {
        expect(sharedCounter).toBe(100);
      });
    });

    it("處理異步錯誤", async () => {
      const faultyAsyncOperation = async (shouldFail: boolean) => {
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 50));

        if (shouldFail) {
          throw new Error("模擬異步錯誤");
        }

        return "成功";
      };

      // 測試正常情況
      const successResult = await faultyAsyncOperation(false);
      expect(successResult).toBe("成功");

      // 測試錯誤情況
      await expect(faultyAsyncOperation(true)).rejects.toThrow("模擬異步錯誤");
    });
  });

  describe("數據一致性測試", () => {
    it("驗證卷軸數據的完整性", () => {
      // 檢查是否有重複的卷軸ID
      const scrollIds = SCROLLS.map((s) => s.id);
      const uniqueIds = new Set(scrollIds);
      expect(uniqueIds.size).toBe(scrollIds.length);

      // 檢查必需欄位
      SCROLLS.forEach((scroll, index) => {
        expect(scroll.id, `卷軸 ${index} 缺少 ID`).toBeTruthy();
        expect(scroll.name, `卷軸 ${index} 缺少 name`).toBeTruthy();
        expect(
          scroll.successRate,
          `卷軸 ${index} 的 successRate 無效`
        ).toBeGreaterThan(0);
        expect(
          scroll.successRate,
          `卷軸 ${index} 的 successRate 無效`
        ).toBeLessThanOrEqual(100);
        expect(
          scroll.equipmentType,
          `卷軸 ${index} 缺少 equipmentType`
        ).toBeTruthy();
        expect(
          scroll.primaryEffect,
          `卷軸 ${index} 缺少 primaryEffect`
        ).toBeDefined();
        expect(
          scroll.primaryEffect.stat,
          `卷軸 ${index} 的 primaryEffect.stat 無效`
        ).toBeTruthy();
        expect(
          scroll.primaryEffect.value,
          `卷軸 ${index} 的 primaryEffect.value 無效`
        ).toBeGreaterThan(0);
      });
    });

    it("驗證裝備類型映射的一致性", () => {
      // 檢查所有引用的裝備類型都存在
      const referencedTypes = new Set(SCROLLS.map((s) => s.equipmentType));
      const definedTypes = new Set(Object.values(EQUIPMENT_TYPES));

      referencedTypes.forEach((referencedType) => {
        expect(
          definedTypes.has(referencedType),
          `未定義的裝備類型: ${referencedType}`
        ).toBe(true);
      });
    });

    it("驗證可用裝備類型列表的正確性", () => {
      // 驗證 AVAILABLE_EQUIPMENT_TYPES 包含所有有卷軸的類型
      const typesWithScrolls = new Set(SCROLLS.map((s) => s.equipmentType));

      AVAILABLE_EQUIPMENT_TYPES.forEach((availableType) => {
        expect(
          typesWithScrolls.has(availableType),
          `${availableType} 在可用列表中但沒有卷軸`
        ).toBe(true);
      });
    });
  });

  describe("異常狀態恢復測試", () => {
    it("模擬系統異常後的狀態恢復", () => {
      // 模擬狀態損壞
      const corruptedState = {
        stats: { 物攻: NaN, 命中率: undefined, 敏捷: -Infinity },
        scrollsUsed: "not_a_number" as unknown as number,
        isValid: null,
      };

      // 狀態清理函數
      const cleanState = (state: typeof corruptedState) => {
        const cleanedStats: Record<string, number> = {};

        Object.entries(state.stats).forEach(([key, value]) => {
          const numValue = Number(value);
          if (!isNaN(numValue) && isFinite(numValue) && numValue >= 0) {
            cleanedStats[key] = numValue;
          }
        });

        return {
          stats: cleanedStats,
          scrollsUsed: Math.max(0, Number(state.scrollsUsed) || 0),
          isValid: true,
        };
      };

      const cleaned = cleanState(corruptedState);

      expect(Object.keys(cleaned.stats)).toEqual([]); // 所有損壞的數據被清除
      expect(cleaned.scrollsUsed).toBe(0);
      expect(cleaned.isValid).toBe(true);
    });

    it("處理記憶體洩漏風險", () => {
      // 創建大量臨時對象
      const createManyObjects = (count: number) => {
        const objects: Array<{ id: number; data: number[] }> = [];

        for (let i = 0; i < count; i++) {
          objects.push({
            id: i,
            data: Array.from({ length: 100 }, (_, j) => i * 100 + j),
          });
        }

        return objects;
      };

      const startTime = performance.now();
      const objects = createManyObjects(1000);
      const endTime = performance.now();

      expect(objects.length).toBe(1000);
      expect(endTime - startTime).toBeLessThan(1000); // 應該在1秒內完成

      // 清理引用（在實際應用中會被垃圾回收）
      objects.length = 0;
    });
  });

  describe("國際化和本地化邊緣情況", () => {
    it("處理不同語言的屬性名稱", () => {
      const multiLanguageStats = {
        物攻: 10,
        attack: 5,
        ataque: 3,
        攻擊力: 7,
        공격력: 2,
      };

      // 歸一化屬性名稱
      const normalizeAttribute = (attr: string) => {
        const mapping: Record<string, string> = {
          attack: "物攻",
          ataque: "物攻",
          攻擊力: "物攻",
          공격력: "物攻",
        };
        return mapping[attr] || attr;
      };

      const normalizedStats: Record<string, number> = {};
      Object.entries(multiLanguageStats).forEach(([attr, value]) => {
        const normalizedAttr = normalizeAttribute(attr);
        normalizedStats[normalizedAttr] =
          (normalizedStats[normalizedAttr] || 0) + value;
      });

      expect(normalizedStats["物攻"]).toBe(27); // 10 + 5 + 3 + 7 + 2
    });

    it("處理特殊數字格式", () => {
      const specialNumbers = [
        "1,000", // 千位分隔符
        "1.5k", // K記號
        "2.5萬", // 中文單位
        "1e3", // 科學記號
        "0xFF", // 十六進制
        "∞", // 無限符號
      ];

      const parseSpecialNumber = (value: string): number => {
        // 移除千位分隔符
        if (value.includes(",")) {
          return Number(value.replace(/,/g, ""));
        }

        // 處理K記號
        if (value.includes("k") || value.includes("K")) {
          return Number(value.replace(/[kK]/g, "")) * 1000;
        }

        // 處理中文單位
        if (value.includes("萬")) {
          return Number(value.replace("萬", "")) * 10000;
        }

        // 處理無限符號
        if (value === "∞") {
          return Number.MAX_SAFE_INTEGER;
        }

        // 其他情況直接轉換
        const parsed = Number(value);
        return isNaN(parsed) ? 0 : parsed;
      };

      expect(parseSpecialNumber("1,000")).toBe(1000);
      expect(parseSpecialNumber("1.5k")).toBe(1500);
      expect(parseSpecialNumber("2.5萬")).toBe(25000);
      expect(parseSpecialNumber("1e3")).toBe(1000);
      expect(parseSpecialNumber("∞")).toBe(Number.MAX_SAFE_INTEGER);
    });
  });
});
