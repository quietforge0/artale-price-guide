import { describe, it, expect } from "vitest";
import { SCROLLS, getScrollsForEquipmentType } from "../../constants/scrolls";
import { EQUIPMENT_TYPES } from "../../constants/equipmentTypes";

describe("模擬流程整合測試", () => {
  // 模擬完整的數據流程
  interface SimulationConfig {
    equipmentType: string;
    scrollSequence: Array<{ scrollId: string; count: number }>;
    stopLossConditions: Array<{
      attribute: string;
      minValue: number;
      scrollIndex: number;
    }>;
    costSettings: {
      enabled: boolean;
      cleanEquipmentPrice: number;
      scrollPrices: Record<string, number>;
    };
    simulationCount: number;
  }

  interface SimulationResult {
    success: boolean;
    destroyed: boolean;
    stoppedByCondition: boolean;
    finalStats: Record<string, number>;
    scrollsUsed: number;
    totalCost?: number;
    stopLossReason?: string;
  }

  // 核心模擬邏輯
  const simulateSingleRun = (config: SimulationConfig): SimulationResult => {
    const currentStats: Record<string, number> = {};
    let scrollsUsed = 0;
    let isDestroyed = false;
    let stoppedByCondition = false;
    let stopLossReason: string | undefined;
    let totalCost = config.costSettings.enabled
      ? config.costSettings.cleanEquipmentPrice
      : 0;

    // 展開卷軸序列
    const expandedScrolls: string[] = [];
    config.scrollSequence.forEach(({ scrollId, count }) => {
      for (let i = 0; i < count; i++) {
        expandedScrolls.push(scrollId);
      }
    });

    for (let i = 0; i < expandedScrolls.length; i++) {
      if (isDestroyed || stoppedByCondition) break;

      const scrollId = expandedScrolls[i];
      const scroll = SCROLLS.find((s) => s.id === scrollId);

      if (!scroll) continue;

      scrollsUsed++;

      // 計算成本
      if (config.costSettings.enabled) {
        totalCost += config.costSettings.scrollPrices[scrollId] || 0;
      }

      // 模擬成功/失敗
      const isSuccess = Math.random() < scroll.successRate / 100;

      if (isSuccess) {
        // 應用主效果
        currentStats[scroll.primaryEffect.stat] =
          (currentStats[scroll.primaryEffect.stat] || 0) +
          scroll.primaryEffect.value;

        // 應用次要效果
        if (scroll.secondaryEffects) {
          scroll.secondaryEffects.forEach((effect) => {
            currentStats[effect.stat] =
              (currentStats[effect.stat] || 0) + effect.value;
          });
        }

        // 檢查停損條件
        for (const condition of config.stopLossConditions) {
          if (scrollsUsed === condition.scrollIndex) {
            const currentValue = currentStats[condition.attribute] || 0;
            if (currentValue < condition.minValue) {
              stoppedByCondition = true;
              stopLossReason = `第${condition.scrollIndex}張後${condition.attribute}未達${condition.minValue}`;
              break;
            }
          }
        }
      } else {
        isDestroyed = true;
      }
    }

    return {
      success: !isDestroyed && !stoppedByCondition,
      destroyed: isDestroyed,
      stoppedByCondition,
      finalStats: currentStats,
      scrollsUsed,
      totalCost: config.costSettings.enabled ? totalCost : undefined,
      stopLossReason,
    };
  };

  // 批量模擬
  const runSimulation = (
    config: SimulationConfig
  ): {
    results: SimulationResult[];
    statistics: {
      totalRuns: number;
      successCount: number;
      destroyedCount: number;
      stopLossCount: number;
      successRate: number;
      averageScrollsUsed: number;
      averageCost?: number;
      totalCost?: number;
    };
    groupedResults: Record<string, SimulationResult[]>;
  } => {
    const results: SimulationResult[] = [];

    for (let i = 0; i < config.simulationCount; i++) {
      const result = simulateSingleRun(config);
      results.push(result);
    }

    // 計算統計
    const successCount = results.filter((r) => r.success).length;
    const destroyedCount = results.filter((r) => r.destroyed).length;
    const stopLossCount = results.filter((r) => r.stoppedByCondition).length;
    const averageScrollsUsed =
      results.reduce((sum, r) => sum + r.scrollsUsed, 0) / results.length;

    const statistics = {
      totalRuns: results.length,
      successCount,
      destroyedCount,
      stopLossCount,
      successRate: (successCount / results.length) * 100,
      averageScrollsUsed,
      ...(config.costSettings.enabled && {
        averageCost:
          results.reduce((sum, r) => sum + (r.totalCost || 0), 0) /
          results.length,
        totalCost: results.reduce((sum, r) => sum + (r.totalCost || 0), 0),
      }),
    };

    // 分組結果
    const groupedResults: Record<string, SimulationResult[]> = {};
    results.forEach((result) => {
      if (!result.success) return;

      const stats = Object.entries(result.finalStats);
      const sortedStats = stats.sort(([a], [b]) => a.localeCompare(b));
      const key = sortedStats
        .map(([attr, value]) => `${attr}:+${value}`)
        .join(", ");

      if (!groupedResults[key]) groupedResults[key] = [];
      groupedResults[key].push(result);
    });

    return { results, statistics, groupedResults };
  };

  describe("基本模擬流程測試", () => {
    it("應該正確執行簡單的卷軸模擬", () => {
      const config: SimulationConfig = {
        equipmentType: EQUIPMENT_TYPES.GUN,
        scrollSequence: [
          { scrollId: "gun_att_10", count: 1 },
          { scrollId: "gun_att_60", count: 2 },
        ],
        stopLossConditions: [],
        costSettings: {
          enabled: false,
          cleanEquipmentPrice: 0,
          scrollPrices: {},
        },
        simulationCount: 100,
      };

      const { results, statistics } = runSimulation(config);

      expect(results).toHaveLength(100);
      expect(statistics.totalRuns).toBe(100);
      expect(statistics.successCount + statistics.destroyedCount).toBe(100);
      expect(statistics.successRate).toBeGreaterThanOrEqual(0);
      expect(statistics.successRate).toBeLessThanOrEqual(100);
      expect(statistics.averageScrollsUsed).toBeGreaterThan(0);
    });

    it("應該正確處理停損條件", () => {
      const config: SimulationConfig = {
        equipmentType: EQUIPMENT_TYPES.GUN,
        scrollSequence: [
          { scrollId: "gun_att_60", count: 5 }, // 5張60%卷軸，每張+2物攻
        ],
        stopLossConditions: [
          { attribute: "物攻", minValue: 8, scrollIndex: 3 }, // 第3張後需要≥8物攻
        ],
        costSettings: {
          enabled: false,
          cleanEquipmentPrice: 0,
          scrollPrices: {},
        },
        simulationCount: 100,
      };

      const { results, statistics } = runSimulation(config);

      expect(statistics.stopLossCount).toBeGreaterThan(0); // 應該有一些停損案例

      // 檢查停損的結果
      const stopLossResults = results.filter((r) => r.stoppedByCondition);
      stopLossResults.forEach((result) => {
        expect(result.stopLossReason).toBeTruthy();
        expect(result.scrollsUsed).toBe(3); // 在第3張後停損
      });
    });

    it("應該正確計算成本", () => {
      const config: SimulationConfig = {
        equipmentType: EQUIPMENT_TYPES.GUN,
        scrollSequence: [
          { scrollId: "gun_att_10", count: 1 },
          { scrollId: "gun_att_60", count: 2 },
        ],
        stopLossConditions: [],
        costSettings: {
          enabled: true,
          cleanEquipmentPrice: 1000,
          scrollPrices: {
            gun_att_10: 500,
            gun_att_60: 100,
          },
        },
        simulationCount: 50,
      };

      const { results, statistics } = runSimulation(config);

      expect(statistics.averageCost).toBeDefined();
      expect(statistics.totalCost).toBeDefined();
      expect(statistics.averageCost!).toBeGreaterThanOrEqual(1000); // 至少包含基礎裝備成本

      // 檢查個別結果的成本
      results.forEach((result) => {
        expect(result.totalCost).toBeDefined();
        expect(result.totalCost!).toBeGreaterThanOrEqual(1000);
      });
    });
  });

  describe("複雜場景測試", () => {
    it("應該處理多種卷軸混合的複雜配置", () => {
      const config: SimulationConfig = {
        equipmentType: EQUIPMENT_TYPES.GUN,
        scrollSequence: [
          { scrollId: "gun_att_10", count: 1 }, // +5物攻
          { scrollId: "gun_att_60", count: 3 }, // +2物攻 x3
        ],
        stopLossConditions: [
          { attribute: "物攻", minValue: 5, scrollIndex: 1 }, // 第1張後≥5物攻
          { attribute: "命中率", minValue: 2, scrollIndex: 2 }, // 第2張後≥2命中率
        ],
        costSettings: {
          enabled: true,
          cleanEquipmentPrice: 2000,
          scrollPrices: {
            gun_att_10: 800,
            gun_att_60: 200,
          },
        },
        simulationCount: 200,
      };

      const { results, statistics, groupedResults } = runSimulation(config);

      // 基本統計驗證
      expect(statistics.totalRuns).toBe(200);
      expect(
        statistics.successCount +
          statistics.destroyedCount +
          statistics.stopLossCount
      ).toBe(200);

      // 成本計算驗證
      expect(statistics.averageCost).toBeGreaterThan(2000);
      expect(statistics.totalCost).toBeGreaterThan(400000); // 200次 × 至少2000

      // 分組結果驗證
      expect(Object.keys(groupedResults).length).toBeGreaterThan(0);

      // 檢查分組的正確性
      Object.entries(groupedResults).forEach(([groupKey, groupResults]) => {
        expect(groupKey).toMatch(/物攻:\+\d+/); // 應該包含物攻信息
        expect(groupResults.length).toBeGreaterThan(0);

        // 同組內的結果應該有相同的最終屬性
        const firstResult = groupResults[0];
        groupResults.forEach((result) => {
          expect(result.finalStats).toEqual(firstResult.finalStats);
        });
      });
    });

    it("應該正確處理極端停損條件", () => {
      const config: SimulationConfig = {
        equipmentType: EQUIPMENT_TYPES.GUN,
        scrollSequence: [
          { scrollId: "gun_att_60", count: 10 }, // 10張60%卷軸
        ],
        stopLossConditions: [
          { attribute: "物攻", minValue: 999, scrollIndex: 1 }, // 不可能達成的條件
        ],
        costSettings: {
          enabled: false,
          cleanEquipmentPrice: 0,
          scrollPrices: {},
        },
        simulationCount: 50,
      };

      const { statistics } = runSimulation(config);

      // 由於停損條件不可能達成，大部分應該被停損
      expect(statistics.stopLossCount).toBeGreaterThan(statistics.successCount);
    });

    it("效能測試：大量模擬應該在合理時間內完成", () => {
      const config: SimulationConfig = {
        equipmentType: EQUIPMENT_TYPES.GUN,
        scrollSequence: [
          { scrollId: "gun_att_10", count: 2 },
          { scrollId: "gun_att_60", count: 3 },
        ],
        stopLossConditions: [
          { attribute: "物攻", minValue: 8, scrollIndex: 3 },
        ],
        costSettings: {
          enabled: true,
          cleanEquipmentPrice: 1500,
          scrollPrices: {
            gun_att_10: 600,
            gun_att_60: 150,
          },
        },
        simulationCount: 5000, // 大量模擬
      };

      const startTime = performance.now();
      const { results, statistics } = runSimulation(config);
      const endTime = performance.now();

      const duration = endTime - startTime;

      expect(results).toHaveLength(5000);
      expect(statistics.totalRuns).toBe(5000);
      expect(duration).toBeLessThan(3000); // 應該在3秒內完成

      console.log(`5000次模擬完成時間: ${duration.toFixed(0)}ms`);
    });
  });

  describe("數據一致性驗證", () => {
    it("統計數據應該與個別結果一致", () => {
      const config: SimulationConfig = {
        equipmentType: EQUIPMENT_TYPES.GUN,
        scrollSequence: [
          { scrollId: "gun_att_10", count: 1 },
          { scrollId: "gun_att_60", count: 2 },
        ],
        stopLossConditions: [],
        costSettings: {
          enabled: true,
          cleanEquipmentPrice: 1000,
          scrollPrices: {
            gun_att_10: 500,
            gun_att_60: 100,
          },
        },
        simulationCount: 100,
      };

      const { results, statistics } = runSimulation(config);

      // 手動計算統計並與自動統計比較
      const manualSuccessCount = results.filter((r) => r.success).length;
      const manualDestroyedCount = results.filter((r) => r.destroyed).length;
      const manualStopLossCount = results.filter(
        (r) => r.stoppedByCondition
      ).length;
      const manualAverageScrolls =
        results.reduce((sum, r) => sum + r.scrollsUsed, 0) / results.length;
      const manualTotalCost = results.reduce(
        (sum, r) => sum + (r.totalCost || 0),
        0
      );

      expect(statistics.successCount).toBe(manualSuccessCount);
      expect(statistics.destroyedCount).toBe(manualDestroyedCount);
      expect(statistics.stopLossCount).toBe(manualStopLossCount);
      expect(
        Math.abs(statistics.averageScrollsUsed - manualAverageScrolls)
      ).toBeLessThan(0.01);
      expect(statistics.totalCost).toBe(manualTotalCost);
    });

    it("分組結果應該涵蓋所有成功案例", () => {
      const config: SimulationConfig = {
        equipmentType: EQUIPMENT_TYPES.GUN,
        scrollSequence: [{ scrollId: "gun_att_60", count: 3 }],
        stopLossConditions: [],
        costSettings: {
          enabled: false,
          cleanEquipmentPrice: 0,
          scrollPrices: {},
        },
        simulationCount: 100,
      };

      const { results, groupedResults } = runSimulation(config);

      const successResults = results.filter((r) => r.success);
      const groupedCount = Object.values(groupedResults).reduce(
        (sum, group) => sum + group.length,
        0
      );

      expect(groupedCount).toBe(successResults.length);
    });
  });

  describe("錯誤處理與邊界情況", () => {
    it("應該處理無效的卷軸配置", () => {
      const config: SimulationConfig = {
        equipmentType: EQUIPMENT_TYPES.GUN,
        scrollSequence: [{ scrollId: "invalid_scroll", count: 1 }],
        stopLossConditions: [],
        costSettings: {
          enabled: false,
          cleanEquipmentPrice: 0,
          scrollPrices: {},
        },
        simulationCount: 10,
      };

      const { results, statistics } = runSimulation(config);

      // 系統應該優雅處理無效卷軸，不會崩潰
      expect(results).toHaveLength(10);
      expect(statistics.totalRuns).toBe(10);
    });

    it("應該處理空的卷軸序列", () => {
      const config: SimulationConfig = {
        equipmentType: EQUIPMENT_TYPES.GUN,
        scrollSequence: [],
        stopLossConditions: [],
        costSettings: {
          enabled: false,
          cleanEquipmentPrice: 0,
          scrollPrices: {},
        },
        simulationCount: 10,
      };

      const { results, statistics } = runSimulation(config);

      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result.scrollsUsed).toBe(0);
        expect(Object.keys(result.finalStats)).toHaveLength(0);
      });
    });

    it("應該處理負數和異常數值", () => {
      const config: SimulationConfig = {
        equipmentType: EQUIPMENT_TYPES.GUN,
        scrollSequence: [
          { scrollId: "gun_att_60", count: -1 }, // 負數
          { scrollId: "gun_att_10", count: 0 }, // 零
        ],
        stopLossConditions: [
          { attribute: "物攻", minValue: -5, scrollIndex: -1 }, // 異常值
        ],
        costSettings: {
          enabled: true,
          cleanEquipmentPrice: -1000, // 負價格
          scrollPrices: {},
        },
        simulationCount: 10,
      };

      const { results } = runSimulation(config);

      // 系統應該不會因為異常值而崩潰
      expect(results).toHaveLength(10);
    });
  });
});
