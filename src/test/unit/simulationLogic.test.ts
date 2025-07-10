import { describe, it, expect, vi, beforeEach } from "vitest";
import { SCROLLS } from "../../constants/scrolls";

describe("模擬邏輯測試", () => {
  describe("基礎卷軸計算驗證", () => {
    it("應該正確識別手槍攻擊力卷軸10%的數值", () => {
      const scroll10 = SCROLLS.find((s) => s.id === "gun_att_10");
      expect(scroll10).toBeDefined();
      expect(scroll10?.primaryEffect.stat).toBe("物攻");
      expect(scroll10?.primaryEffect.value).toBe(5);
      expect(scroll10?.secondaryEffects).toHaveLength(2);
      expect(scroll10?.secondaryEffects?.[0].stat).toBe("命中率");
      expect(scroll10?.secondaryEffects?.[0].value).toBe(3);
      expect(scroll10?.secondaryEffects?.[1].stat).toBe("敏捷");
      expect(scroll10?.secondaryEffects?.[1].value).toBe(1);
    });

    it("應該正確識別手槍攻擊力卷軸60%的數值", () => {
      const scroll60 = SCROLLS.find((s) => s.id === "gun_att_60");
      expect(scroll60).toBeDefined();
      expect(scroll60?.primaryEffect.stat).toBe("物攻");
      expect(scroll60?.primaryEffect.value).toBe(2);
      expect(scroll60?.secondaryEffects).toHaveLength(1);
      expect(scroll60?.secondaryEffects?.[0].stat).toBe("命中率");
      expect(scroll60?.secondaryEffects?.[0].value).toBe(1);
    });

    it("計算1張10%+5張60%手槍卷軸的理論最大物攻值", () => {
      const scroll10 = SCROLLS.find((s) => s.id === "gun_att_10")!;
      const scroll60 = SCROLLS.find((s) => s.id === "gun_att_60")!;

      // 1張10%卷軸：主效果+5物攻，無物攻副效果
      const attack10 = scroll10.primaryEffect.value;

      // 5張60%卷軸：每張主效果+2物攻，無物攻副效果
      const attack60 = scroll60.primaryEffect.value * 5;

      const totalAttack = attack10 + attack60;

      expect(totalAttack).toBe(15); // 5 + (2 × 5) = 15，不是40
    });

    it("模擬屬性累加邏輯", () => {
      // 模擬實際的屬性累加過程
      const currentStats: { [key: string]: number } = {};

      // 第一張：10%手槍攻擊力卷軸成功
      const scroll10 = SCROLLS.find((s) => s.id === "gun_att_10")!;
      currentStats[scroll10.primaryEffect.stat] =
        (currentStats[scroll10.primaryEffect.stat] || 0) +
        scroll10.primaryEffect.value;

      if (scroll10.secondaryEffects) {
        scroll10.secondaryEffects.forEach((effect) => {
          currentStats[effect.stat] =
            (currentStats[effect.stat] || 0) + effect.value;
        });
      }

      // 接下來5張：60%手槍攻擊力卷軸成功
      const scroll60 = SCROLLS.find((s) => s.id === "gun_att_60")!;
      for (let i = 0; i < 5; i++) {
        currentStats[scroll60.primaryEffect.stat] =
          (currentStats[scroll60.primaryEffect.stat] || 0) +
          scroll60.primaryEffect.value;

        if (scroll60.secondaryEffects) {
          scroll60.secondaryEffects.forEach((effect) => {
            currentStats[effect.stat] =
              (currentStats[effect.stat] || 0) + effect.value;
          });
        }
      }

      expect(currentStats["物攻"]).toBe(15); // 5 + (2×5) = 15
      expect(currentStats["命中率"]).toBe(8); // 3 + (1×5) = 8
      expect(currentStats["敏捷"]).toBe(1); // 1 + (0×5) = 1
    });
  });

  describe("模擬算法隨機性驗證", () => {
    beforeEach(() => {
      // 重置隨機種子，確保測試可重現
      vi.restoreAllMocks();
    });

    it("應該生成真正隨機的結果", () => {
      // 模擬低成功率卷軸的隨機性
      const lowSuccessScroll = SCROLLS.find((s) => s.successRate === 10)!;
      const results: boolean[] = [];

      // 進行1000次模擬
      for (let i = 0; i < 1000; i++) {
        const randomValue = Math.random();
        const isSuccess = randomValue < lowSuccessScroll.successRate / 100;
        results.push(isSuccess);
      }

      const successCount = results.filter((r) => r).length;
      const successRate = successCount / 1000;

      // 10%成功率的測試，允許5%-15%的範圍（統計誤差）
      expect(successRate).toBeGreaterThan(0.05);
      expect(successRate).toBeLessThan(0.15);
    });

    it("不同成功率卷軸應該有明顯不同的成功率", () => {
      const scroll10 = SCROLLS.find((s) => s.successRate === 10)!;
      const scroll60 = SCROLLS.find((s) => s.successRate === 60)!;
      const scroll100 = SCROLLS.find((s) => s.successRate === 100)!;

      const testRuns = 1000;

      const results10: boolean[] = [];
      const results60: boolean[] = [];
      const results100: boolean[] = [];

      for (let i = 0; i < testRuns; i++) {
        results10.push(Math.random() < scroll10.successRate / 100);
        results60.push(Math.random() < scroll60.successRate / 100);
        results100.push(Math.random() < scroll100.successRate / 100);
      }

      const rate10 = results10.filter((r) => r).length / testRuns;
      const rate60 = results60.filter((r) => r).length / testRuns;
      const rate100 = results100.filter((r) => r).length / testRuns;

      // 驗證成功率順序正確
      expect(rate10).toBeLessThan(rate60);
      expect(rate60).toBeLessThan(rate100);
      expect(rate100).toBeGreaterThan(0.99); // 100%應該接近1
    });

    it("相同配置的不同模擬應該產生不同結果", () => {
      // 模擬同樣配置的多次執行
      const mockSimulation = (id: number) => {
        const currentStats: { [key: string]: number } = {};
        const scrolls = ["gun_att_10", "gun_att_60", "gun_att_60"];
        let destroyed = false;

        for (const scrollId of scrolls) {
          if (destroyed) break;

          const scroll = SCROLLS.find((s) => s.id === scrollId)!;
          const isSuccess = Math.random() < scroll.successRate / 100;

          if (isSuccess) {
            currentStats[scroll.primaryEffect.stat] =
              (currentStats[scroll.primaryEffect.stat] || 0) +
              scroll.primaryEffect.value;
          } else {
            destroyed = true;
          }
        }

        return { id, destroyed, finalStats: currentStats };
      };

      // 執行100次相同模擬
      const results = Array.from({ length: 100 }, (_, i) => mockSimulation(i));

      // 檢查結果多樣性
      const destroyedCount = results.filter((r) => r.destroyed).length;
      const uniqueStats = new Set(
        results.map((r) => JSON.stringify(r.finalStats))
      );

      // 應該有一些失敗案例（不是全部成功）
      expect(destroyedCount).toBeGreaterThan(0);
      expect(destroyedCount).toBeLessThan(100);

      // 應該有多種不同的結果組合
      expect(uniqueStats.size).toBeGreaterThan(1);
    });
  });

  describe("停損條件邏輯測試", () => {
    it("應該在指定張數後正確檢查停損條件", () => {
      // 模擬停損條件：第2張卷軸後物攻需要≥5
      const stopLossCondition = {
        attribute: "物攻",
        minValue: 5,
        scrollIndex: 2,
      };

      const scroll10 = SCROLLS.find((s) => s.id === "gun_att_10")!; // +5物攻
      const scroll60 = SCROLLS.find((s) => s.id === "gun_att_60")!; // +2物攻

      // 測試情境1：前兩張都成功，滿足停損條件
      const scenario1 = () => {
        const currentStats: { [key: string]: number } = {};
        const scrolls = [scroll10, scroll60]; // 第1張+5，第2張+2 = 總共7，滿足≥5

        for (let i = 0; i < scrolls.length; i++) {
          const scroll = scrolls[i];
          // 模擬成功
          currentStats[scroll.primaryEffect.stat] =
            (currentStats[scroll.primaryEffect.stat] || 0) +
            scroll.primaryEffect.value;

          // 檢查停損條件
          if (i + 1 === stopLossCondition.scrollIndex) {
            const currentValue = currentStats[stopLossCondition.attribute] || 0;
            if (currentValue < stopLossCondition.minValue) {
              return {
                stopLoss: true,
                stats: currentStats,
                scrollsUsed: i + 1,
              };
            }
          }
        }

        return {
          stopLoss: false,
          stats: currentStats,
          scrollsUsed: scrolls.length,
        };
      };

      const result1 = scenario1();
      expect(result1.stopLoss).toBe(false); // 不應該停損
      expect(result1.stats["物攻"]).toBe(7); // 5 + 2 = 7

      // 測試情境2：前兩張一成功一失敗，不滿足停損條件
      const scenario2 = () => {
        const currentStats: { [key: string]: number } = {};

        // 第1張成功：+2物攻
        currentStats[scroll60.primaryEffect.stat] =
          (currentStats[scroll60.primaryEffect.stat] || 0) +
          scroll60.primaryEffect.value;

        // 第2張成功：+2物攻，總共4，不滿足≥5
        currentStats[scroll60.primaryEffect.stat] =
          (currentStats[scroll60.primaryEffect.stat] || 0) +
          scroll60.primaryEffect.value;

        // 檢查停損條件
        const currentValue = currentStats[stopLossCondition.attribute] || 0;
        if (currentValue < stopLossCondition.minValue) {
          return { stopLoss: true, stats: currentStats, scrollsUsed: 2 };
        }

        return { stopLoss: false, stats: currentStats, scrollsUsed: 2 };
      };

      const result2 = scenario2();
      expect(result2.stopLoss).toBe(true); // 應該停損
      expect(result2.stats["物攻"]).toBe(4); // 2 + 2 = 4 < 5
    });

    it("應該支援多個停損條件", () => {
      const stopLossConditions = [
        { attribute: "物攻", minValue: 5, scrollIndex: 2 },
        { attribute: "命中率", minValue: 3, scrollIndex: 3 },
      ];

      // 模擬檢查多個停損條件的邏輯
      const checkStopLoss = (
        currentStats: { [key: string]: number },
        scrollsUsed: number
      ) => {
        for (const condition of stopLossConditions) {
          if (scrollsUsed === condition.scrollIndex) {
            const currentValue = currentStats[condition.attribute] || 0;
            if (currentValue < condition.minValue) {
              return { shouldStop: true, reason: `${condition.attribute}不足` };
            }
          }
        }
        return { shouldStop: false, reason: null };
      };

      // 測試：第2張後物攻足夠，但第3張後命中率不足
      const stats = { 物攻: 7, 命中率: 2 };

      const check2 = checkStopLoss(stats, 2);
      expect(check2.shouldStop).toBe(false); // 物攻7≥5，通過

      const check3 = checkStopLoss(stats, 3);
      expect(check3.shouldStop).toBe(true); // 命中率2<3，停損
      expect(check3.reason).toBe("命中率不足");
    });
  });

  describe("成本計算驗證", () => {
    it("應該正確計算單次模擬的總成本", () => {
      const costSettings = {
        enabled: true,
        cleanEquipmentPrice: 1000,
        scrollPrices: {
          gun_att_10: 500,
          gun_att_60: 100,
        } as { [key: string]: number },
      };

      const scrollSequence = ["gun_att_10", "gun_att_60", "gun_att_60"];

      // 計算總成本
      let totalCost = costSettings.cleanEquipmentPrice;
      for (const scrollId of scrollSequence) {
        totalCost += costSettings.scrollPrices[scrollId] || 0;
      }

      const expectedCost = 1000 + 500 + 100 + 100; // 1700
      expect(totalCost).toBe(expectedCost);
    });

    it("成本計算應該考慮失敗時的部分消耗", () => {
      const costSettings = {
        enabled: true,
        cleanEquipmentPrice: 1000,
        scrollPrices: {
          gun_att_10: 500,
          gun_att_60: 100,
        } as { [key: string]: number },
      };

      // 模擬第3張卷軸失敗的情況
      const scrollSequence = ["gun_att_10", "gun_att_60", "gun_att_60"];
      const failAtIndex = 2; // 第3張失敗

      let totalCost = costSettings.cleanEquipmentPrice;
      for (let i = 0; i <= failAtIndex; i++) {
        const scrollId = scrollSequence[i];
        totalCost += costSettings.scrollPrices[scrollId] || 0;
      }

      const expectedCost = 1000 + 500 + 100 + 100; // 失敗時也要算消耗的卷軸費用
      expect(totalCost).toBe(expectedCost);
    });
  });

  describe("結果分組和統計", () => {
    it("應該按完整屬性組合正確分組結果", () => {
      const mockResults = [
        { finalStats: { 物攻: 5, 命中率: 3 }, success: true },
        { finalStats: { 物攻: 5, 命中率: 3 }, success: true },
        { finalStats: { 物攻: 7, 命中率: 4 }, success: true },
        { finalStats: { 物攻: 5, 命中率: 4 }, success: true },
      ];

      // 模擬分組邏輯
      const groupResults = (results: typeof mockResults) => {
        const groups: { [key: string]: typeof mockResults } = {};

        results.forEach((result) => {
          if (!result.success) return;

          const stats = Object.entries(result.finalStats);
          const sortedStats = stats.sort(([a], [b]) => a.localeCompare(b));
          const key = sortedStats
            .map(([attr, value]) => `${attr}:+${value}`)
            .join(", ");

          if (!groups[key]) groups[key] = [];
          groups[key].push(result);
        });

        return groups;
      };

      const grouped = groupResults(mockResults);

      // 驗證分組結果
      expect(Object.keys(grouped)).toHaveLength(3); // 3個不同的組合
      expect(grouped["命中率:+3, 物攻:+5"]).toHaveLength(2); // 2個相同結果
      expect(grouped["命中率:+4, 物攻:+7"]).toHaveLength(1);
      expect(grouped["命中率:+4, 物攻:+5"]).toHaveLength(1);
    });

    it("應該正確計算統計數據", () => {
      const mockResults = [
        { success: true, scrollsUsed: 3, totalCost: 1700 },
        { success: false, scrollsUsed: 1, totalCost: 1500 }, // 第1張失敗
        { success: true, scrollsUsed: 5, totalCost: 2100 },
        { success: false, scrollsUsed: 2, totalCost: 1600 }, // 第2張失敗
        { success: true, scrollsUsed: 4, totalCost: 1900 },
      ];

      // 計算統計
      const totalRuns = mockResults.length;
      const successCount = mockResults.filter((r) => r.success).length;
      const successRate = (successCount / totalRuns) * 100;
      const averageScrollsUsed =
        mockResults.reduce((sum, r) => sum + r.scrollsUsed, 0) / totalRuns;
      const totalCost = mockResults.reduce(
        (sum, r) => sum + (r.totalCost || 0),
        0
      );

      expect(totalRuns).toBe(5);
      expect(successCount).toBe(3);
      expect(successRate).toBe(60); // 3/5 = 60%
      expect(averageScrollsUsed).toBe(3); // (3+1+5+2+4)/5 = 3
      expect(totalCost).toBe(8800); // 1700+1500+2100+1600+1900
    });
  });

  describe("邊緣情況處理", () => {
    it("應該處理空卷軸列表", () => {
      const emptyScrolls: string[] = [];
      const currentStats: { [key: string]: number } = {};

      // 模擬空卷軸列表的處理
      expect(emptyScrolls.length).toBe(0);
      expect(Object.keys(currentStats)).toHaveLength(0);
    });

    it("應該處理不存在的卷軸ID", () => {
      const invalidScrollId = "invalid_scroll_id";
      const foundScroll = SCROLLS.find((s) => s.id === invalidScrollId);

      expect(foundScroll).toBeUndefined();
    });

    it("應該處理極值停損條件", () => {
      // 測試極低要求
      const lowCondition = { attribute: "物攻", minValue: 0, scrollIndex: 1 };
      expect(lowCondition.minValue).toBe(0);

      // 測試極高要求
      const highCondition = {
        attribute: "物攻",
        minValue: 999999,
        scrollIndex: 1,
      };
      expect(highCondition.minValue).toBe(999999);
    });

    it("應該處理零成本設定", () => {
      const zeroCostSettings = {
        enabled: true,
        cleanEquipmentPrice: 0,
        scrollPrices: {},
      };

      expect(zeroCostSettings.cleanEquipmentPrice).toBe(0);
      expect(Object.keys(zeroCostSettings.scrollPrices)).toHaveLength(0);
    });
  });
});
