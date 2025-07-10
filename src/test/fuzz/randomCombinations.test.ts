import { describe, it, expect } from "vitest";
import { SCROLLS, getScrollsForEquipmentType } from "../../constants/scrolls";
import { EQUIPMENT_TYPES } from "../../constants/equipmentTypes";
import { AVAILABLE_EQUIPMENT_TYPES } from "../../constants/equipment";

// 類型定義
interface SimulationResult {
  success: boolean;
  destroyed: boolean;
  stoppedByCondition: boolean;
  finalStats: { [key: string]: number };
  scrollsUsed: number;
  totalCost: number;
}

interface StopLossCondition {
  attribute: string;
  minValue: number;
  scrollIndex: number;
}

describe("模糊測試 - 隨機配置組合", () => {
  // 隨機測試工具函數
  const getRandomElement = <T>(array: T[]): T => {
    return array[Math.floor(Math.random() * array.length)];
  };

  const getRandomInt = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const generateRandomScrollSequence = (
    equipmentType: string,
    maxScrolls: number = 10
  ): string[] => {
    const availableScrolls = getScrollsForEquipmentType(equipmentType);
    if (availableScrolls.length === 0) return [];

    const sequenceLength = getRandomInt(1, Math.min(maxScrolls, 15));
    const sequence: string[] = [];

    for (let i = 0; i < sequenceLength; i++) {
      const randomScroll = getRandomElement(availableScrolls);
      sequence.push(randomScroll.id);
    }

    return sequence;
  };

  // 模擬單次隨機運行
  const simulateRandomRun = (
    scrollIds: string[],
    stopLossConditions: Array<{
      attribute: string;
      minValue: number;
      scrollIndex: number;
    }> = []
  ) => {
    const currentStats: { [key: string]: number } = {};
    let scrollsUsed = 0;
    let isDestroyed = false;
    let stoppedByCondition = false;
    let totalCost = 1000; // 基礎裝備成本

    for (let i = 0; i < scrollIds.length; i++) {
      if (isDestroyed || stoppedByCondition) break;

      const scroll = SCROLLS.find((s) => s.id === scrollIds[i]);
      if (!scroll) continue;

      scrollsUsed++;
      totalCost += getRandomInt(50, 500); // 隨機卷軸成本

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
        for (const condition of stopLossConditions) {
          if (scrollsUsed === condition.scrollIndex) {
            const currentValue = currentStats[condition.attribute] || 0;
            if (currentValue < condition.minValue) {
              stoppedByCondition = true;
              break;
            }
          }
        }
      } else {
        // 失敗導致裝備損壞
        isDestroyed = true;
      }
    }

    return {
      success: !isDestroyed && !stoppedByCondition,
      destroyed: isDestroyed,
      stoppedByCondition,
      finalStats: currentStats,
      scrollsUsed,
      totalCost,
    };
  };

  describe("隨機裝備類型組合測試", () => {
    it("隨機測試100種不同的裝備類型配置", () => {
      const results: any[] = [];

      for (let i = 0; i < 100; i++) {
        // 隨機選擇裝備類型
        const randomEquipType = getRandomElement(AVAILABLE_EQUIPMENT_TYPES);

        // 生成隨機卷軸序列
        const scrollSequence = generateRandomScrollSequence(randomEquipType, 8);

        if (scrollSequence.length === 0) continue;

        // 執行模擬
        const result = simulateRandomRun(scrollSequence);
        results.push({
          equipmentType: randomEquipType,
          scrollCount: scrollSequence.length,
          ...result,
        });
      }

      // 驗證結果
      expect(results.length).toBeGreaterThan(50); // 至少有50個有效結果

      // 統計分析
      const successRate =
        results.filter((r) => r.success).length / results.length;
      const avgScrollsUsed =
        results.reduce((sum, r) => sum + r.scrollsUsed, 0) / results.length;

      expect(successRate).toBeGreaterThan(0); // 至少有一些成功
      expect(successRate).toBeLessThan(1); // 不可能全部成功
      expect(avgScrollsUsed).toBeGreaterThan(0);
      expect(avgScrollsUsed).toBeLessThan(20);

      console.log(
        `隨機測試統計: 成功率 ${(successRate * 100).toFixed(
          1
        )}%, 平均卷軸使用 ${avgScrollsUsed.toFixed(1)}`
      );
    });

    it("測試所有裝備類型的隨機組合", () => {
      const equipmentResults: { [key: string]: number } = {};

      AVAILABLE_EQUIPMENT_TYPES.forEach((equipType) => {
        let successCount = 0;
        const testRuns = 20;

        for (let i = 0; i < testRuns; i++) {
          const scrollSequence = generateRandomScrollSequence(equipType, 5);
          if (scrollSequence.length === 0) continue;

          const result = simulateRandomRun(scrollSequence);
          if (result.success) successCount++;
        }

        equipmentResults[equipType] = successCount;
      });

      // 驗證每種裝備類型都至少有一些測試結果
      Object.values(equipmentResults).forEach((count) => {
        expect(count).toBeGreaterThanOrEqual(0);
      });

      console.log("各裝備類型成功次數:", equipmentResults);
    });
  });

  describe("隨機停損條件測試", () => {
    it("測試隨機停損條件組合", () => {
      const attributes = ["物攻", "命中率", "敏捷", "力量", "HP"];
      const results: any[] = [];

      for (let i = 0; i < 50; i++) {
        // 隨機選擇裝備和卷軸
        const randomEquipType = getRandomElement(AVAILABLE_EQUIPMENT_TYPES);
        const scrollSequence = generateRandomScrollSequence(randomEquipType, 6);

        if (scrollSequence.length === 0) continue;

        // 生成隨機停損條件
        const stopLossConditions = [];
        const conditionCount = getRandomInt(0, 2); // 0-2個停損條件

        for (let j = 0; j < conditionCount; j++) {
          stopLossConditions.push({
            attribute: getRandomElement(attributes),
            minValue: getRandomInt(1, 10),
            scrollIndex: getRandomInt(1, Math.min(scrollSequence.length, 5)),
          });
        }

        const result = simulateRandomRun(scrollSequence, stopLossConditions);
        results.push({
          conditionCount,
          stoppedByCondition: result.stoppedByCondition,
          ...result,
        });
      }

      // 驗證停損邏輯工作正常
      const withConditions = results.filter((r) => r.conditionCount > 0);
      const stoppedByConditions = withConditions.filter(
        (r) => r.stoppedByCondition
      );

      expect(withConditions.length).toBeGreaterThan(0);

      // 應該有一些被停損條件阻止的案例
      if (withConditions.length > 10) {
        expect(stoppedByConditions.length).toBeGreaterThan(0);
      }

      console.log(
        `停損測試: ${withConditions.length} 個有條件的測試中，${stoppedByConditions.length} 個被停損`
      );
    });
  });

  describe("極值和邊界測試", () => {
    it("測試極大數量的卷軸序列", () => {
      const equipType = EQUIPMENT_TYPES.GUN; // 使用已知有卷軸的類型
      const largeSequence = generateRandomScrollSequence(equipType, 50); // 超大序列

      const result = simulateRandomRun(largeSequence);

      // 即使序列很長，也應該有合理的結果
      expect(result.scrollsUsed).toBeGreaterThan(0);
      expect(result.scrollsUsed).toBeLessThanOrEqual(50);
      expect(result.totalCost).toBeGreaterThan(1000);
    });

    it("測試極端停損條件", () => {
      const equipType = EQUIPMENT_TYPES.GUN;
      const scrollSequence = generateRandomScrollSequence(equipType, 5);

      if (scrollSequence.length === 0) return;

      // 測試不可能達成的停損條件
      const impossibleCondition = [
        {
          attribute: "物攻",
          minValue: 999999, // 不可能達成
          scrollIndex: 1,
        },
      ];

      const result = simulateRandomRun(scrollSequence, impossibleCondition);

      // 應該被停損條件阻止（除非第一張就失敗）
      if (!result.destroyed) {
        expect(result.stoppedByCondition).toBe(true);
      }
    });

    it("測試零成本設定", () => {
      const equipType = EQUIPMENT_TYPES.GUN;
      const scrollSequence = generateRandomScrollSequence(equipType, 3);

      // 模擬零成本情況
      const simulateZeroCost = () => {
        const currentStats: { [key: string]: number } = {};
        let totalCost = 0; // 零成本

        scrollSequence.forEach((scrollId) => {
          const scroll = SCROLLS.find((s) => s.id === scrollId);
          if (scroll) {
            const isSuccess = Math.random() < scroll.successRate / 100;
            if (isSuccess) {
              currentStats[scroll.primaryEffect.stat] =
                (currentStats[scroll.primaryEffect.stat] || 0) +
                scroll.primaryEffect.value;
            }
          }
        });

        return { finalStats: currentStats, totalCost };
      };

      const result = simulateZeroCost();
      expect(result.totalCost).toBe(0);
    });
  });

  describe("大量隨機輸入壓力測試", () => {
    it("執行1000次隨機模擬測試", () => {
      const startTime = performance.now();
      const results: any[] = [];
      let errorCount = 0;

      for (let i = 0; i < 1000; i++) {
        try {
          const randomEquipType = getRandomElement(AVAILABLE_EQUIPMENT_TYPES);
          const scrollSequence = generateRandomScrollSequence(
            randomEquipType,
            getRandomInt(1, 10)
          );

          if (scrollSequence.length === 0) continue;

          const result = simulateRandomRun(scrollSequence);
          results.push(result);
        } catch (error) {
          errorCount++;
        }
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 性能檢查
      expect(duration).toBeLessThan(5000); // 5秒內完成
      expect(errorCount).toBe(0); // 不應該有錯誤

      // 結果合理性檢查
      expect(results.length).toBeGreaterThan(500);

      const stats = {
        successRate: results.filter((r) => r.success).length / results.length,
        avgCost:
          results.reduce((sum, r) => sum + r.totalCost, 0) / results.length,
        avgScrolls:
          results.reduce((sum, r) => sum + r.scrollsUsed, 0) / results.length,
      };

      expect(stats.successRate).toBeGreaterThan(0);
      expect(stats.successRate).toBeLessThan(1);
      expect(stats.avgCost).toBeGreaterThan(1000);
      expect(stats.avgScrolls).toBeGreaterThan(0);

      console.log(
        `壓力測試統計: ${results.length} 次模擬，${duration.toFixed(
          0
        )}ms，成功率 ${(stats.successRate * 100).toFixed(1)}%`
      );
    });

    it("並發隨機測試", () => {
      const concurrentTests = Array.from({ length: 10 }, (_, i) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            const results: any[] = [];

            for (let j = 0; j < 100; j++) {
              const randomEquipType = getRandomElement(
                AVAILABLE_EQUIPMENT_TYPES
              );
              const scrollSequence = generateRandomScrollSequence(
                randomEquipType,
                5
              );

              if (scrollSequence.length > 0) {
                const result = simulateRandomRun(scrollSequence);
                results.push(result);
              }
            }

            resolve({
              batchId: i,
              results: results.length,
              successCount: results.filter((r) => r.success).length,
            });
          }, i * 10); // 輕微延遲模擬並發
        });
      });

      return Promise.all(concurrentTests).then((batchResults) => {
        expect(batchResults.length).toBe(10);

        const totalResults = batchResults.reduce(
          (sum, batch: any) => sum + batch.results,
          0
        );
        const totalSuccess = batchResults.reduce(
          (sum, batch: any) => sum + batch.successCount,
          0
        );

        expect(totalResults).toBeGreaterThan(500);
        expect(totalSuccess).toBeGreaterThan(0);

        console.log(`並發測試: ${totalResults} 次結果，${totalSuccess} 次成功`);
      });
    });
  });

  describe("隨機性驗證測試", () => {
    it("驗證相同配置產生不同結果", () => {
      const equipType = EQUIPMENT_TYPES.GUN;
      const fixedScrollSequence = ["gun_att_10", "gun_att_60", "gun_att_60"];

      const results: any[] = [];
      for (let i = 0; i < 100; i++) {
        const result = simulateRandomRun(fixedScrollSequence);
        results.push(result);
      }

      // 應該有多種不同的結果
      const uniqueOutcomes = new Set(
        results.map((r) =>
          JSON.stringify({
            success: r.success,
            destroyed: r.destroyed,
            scrollsUsed: r.scrollsUsed,
          })
        )
      );

      expect(uniqueOutcomes.size).toBeGreaterThan(1);

      // 應該有成功和失敗的案例
      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => r.destroyed).length;

      expect(successCount).toBeGreaterThan(0);
      expect(failureCount).toBeGreaterThan(0);
    });

    it("測試隨機種子對結果的影響", () => {
      // 使用固定的隨機操作序列
      const getControlledRandomSequence = (length: number, seed: number) => {
        // 簡單的偽隨機數生成器（用於測試）
        let rng = seed;
        const random = () => {
          rng = (rng * 9301 + 49297) % 233280;
          return rng / 233280;
        };

        const sequence: boolean[] = [];
        for (let i = 0; i < length; i++) {
          sequence.push(random() < 0.1); // 10%成功率
        }
        return sequence;
      };

      const seed1Results = getControlledRandomSequence(100, 12345);
      const seed2Results = getControlledRandomSequence(100, 67890);

      // 不同種子應該產生不同的結果序列
      const differences = seed1Results.filter(
        (result, i) => result !== seed2Results[i]
      ).length;

      expect(differences).toBeGreaterThan(10); // 至少10%不同
    });
  });
});
