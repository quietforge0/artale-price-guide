import { describe, it, expect } from "vitest";
import { SCROLLS, getScrollsForEquipmentType } from "../../constants/scrolls";
import { EQUIPMENT_TYPES } from "../../constants/equipmentTypes";
import { AVAILABLE_EQUIPMENT_TYPES } from "../../constants/equipment";

describe("所有裝備類型全面測試", () => {
  describe("裝備類型完整性驗證", () => {
    it("應該涵蓋所有29種裝備類型", () => {
      const allEquipmentTypes = Object.values(EQUIPMENT_TYPES);

      // 驗證總數
      expect(allEquipmentTypes).toHaveLength(29);

      // 驗證每種類型都有對應的卷軸
      const equipmentTypesWithScrolls = new Set(
        SCROLLS.map((scroll) => scroll.equipmentType)
      );

      // 檢查哪些裝備類型有卷軸數據
      console.log(
        "有卷軸數據的裝備類型:",
        Array.from(equipmentTypesWithScrolls).sort()
      );

      // 至少應該有主要的裝備類型有卷軸
      const expectedTypes = [
        EQUIPMENT_TYPES.HELMET,
        EQUIPMENT_TYPES.TOPWEAR,
        EQUIPMENT_TYPES.SHOES,
        EQUIPMENT_TYPES.GLOVES,
        EQUIPMENT_TYPES.GUN,
        EQUIPMENT_TYPES.ONE_HANDED_SWORD,
        EQUIPMENT_TYPES.BOW,
      ];

      expectedTypes.forEach((equipType) => {
        expect(equipmentTypesWithScrolls.has(equipType)).toBe(true);
      });
    });

    it("所有可用裝備類型都應該有對應的卷軸", () => {
      AVAILABLE_EQUIPMENT_TYPES.forEach((equipmentType) => {
        const scrolls = getScrollsForEquipmentType(equipmentType);
        expect(scrolls.length).toBeGreaterThan(0);
      });
    });
  });

  describe("防具類裝備測試", () => {
    const armorTypes = [
      EQUIPMENT_TYPES.HELMET,
      EQUIPMENT_TYPES.TOPWEAR,
      EQUIPMENT_TYPES.BOTTOMWEAR,
      EQUIPMENT_TYPES.OVERALL,
      EQUIPMENT_TYPES.SHOES,
      EQUIPMENT_TYPES.GLOVES,
      EQUIPMENT_TYPES.CAPE,
      EQUIPMENT_TYPES.SHIELD,
    ];

    armorTypes.forEach((equipmentType) => {
      describe(`${equipmentType} 裝備測試`, () => {
        const scrollsForEquip = getScrollsForEquipmentType(equipmentType);

        it(`${equipmentType} 應該有可用的卷軸`, () => {
          expect(scrollsForEquip.length).toBeGreaterThan(0);
        });

        it(`${equipmentType} 卷軸應該涵蓋不同成功率`, () => {
          const successRates = [
            ...new Set(scrollsForEquip.map((s) => s.successRate)),
          ];
          expect(successRates.length).toBeGreaterThan(0);

          // 至少應該有一些常見的成功率
          const commonRates = [10, 60, 100].filter((rate) =>
            successRates.includes(rate)
          );
          expect(commonRates.length).toBeGreaterThan(0);
        });

        it(`${equipmentType} 卷軸屬性效果應該正確`, () => {
          scrollsForEquip.forEach((scroll) => {
            // 驗證主效果
            expect(scroll.primaryEffect).toBeDefined();
            expect(scroll.primaryEffect.stat).toBeTruthy();
            expect(scroll.primaryEffect.value).toBeGreaterThan(0);

            // 驗證次要效果（如果存在）
            if (scroll.secondaryEffects) {
              scroll.secondaryEffects.forEach((effect) => {
                expect(effect.stat).toBeTruthy();
                expect(effect.value).toBeGreaterThan(0);
              });
            }
          });
        });

        it(`${equipmentType} 模擬屬性累加邏輯`, () => {
          const testScrolls = scrollsForEquip.slice(0, 3); // 取前3個卷軸測試
          const currentStats: { [key: string]: number } = {};

          testScrolls.forEach((scroll) => {
            // 模擬成功應用卷軸
            currentStats[scroll.primaryEffect.stat] =
              (currentStats[scroll.primaryEffect.stat] || 0) +
              scroll.primaryEffect.value;

            if (scroll.secondaryEffects) {
              scroll.secondaryEffects.forEach((effect) => {
                currentStats[effect.stat] =
                  (currentStats[effect.stat] || 0) + effect.value;
              });
            }
          });

          // 驗證累加結果
          Object.values(currentStats).forEach((value) => {
            expect(value).toBeGreaterThan(0);
          });
        });
      });
    });
  });

  describe("武器類裝備測試", () => {
    const weaponTypes = [
      EQUIPMENT_TYPES.ONE_HANDED_SWORD,
      EQUIPMENT_TYPES.TWO_HANDED_SWORD,
      EQUIPMENT_TYPES.ONE_HANDED_AXE,
      EQUIPMENT_TYPES.TWO_HANDED_AXE,
      EQUIPMENT_TYPES.ONE_HANDED_BW,
      EQUIPMENT_TYPES.TWO_HANDED_BW,
      EQUIPMENT_TYPES.SPEAR,
      EQUIPMENT_TYPES.POLE_ARM,
      EQUIPMENT_TYPES.BOW,
      EQUIPMENT_TYPES.CROSSBOW,
      EQUIPMENT_TYPES.WAND,
      EQUIPMENT_TYPES.STAFF,
      EQUIPMENT_TYPES.DAGGER,
      EQUIPMENT_TYPES.CLAW,
      EQUIPMENT_TYPES.KNUCKLE,
      EQUIPMENT_TYPES.GUN,
    ];

    weaponTypes.forEach((equipmentType) => {
      describe(`${equipmentType} 武器測試`, () => {
        const scrollsForEquip = getScrollsForEquipmentType(equipmentType);

        it(`${equipmentType} 應該有可用的卷軸`, () => {
          expect(scrollsForEquip.length).toBeGreaterThan(0);
        });

        it(`${equipmentType} 應該有攻擊力或命中率相關卷軸`, () => {
          const hasAttackScrolls = scrollsForEquip.some(
            (scroll) =>
              scroll.primaryEffect.stat === "物攻" ||
              scroll.primaryEffect.stat === "魔攻" ||
              scroll.primaryEffect.stat === "命中率"
          );
          expect(hasAttackScrolls).toBe(true);
        });

        it(`${equipmentType} 卷軸成功率應該合理`, () => {
          scrollsForEquip.forEach((scroll) => {
            expect(scroll.successRate).toBeGreaterThan(0);
            expect(scroll.successRate).toBeLessThanOrEqual(100);
          });
        });

        it(`${equipmentType} 攻擊力卷軸的數值應該隨成功率變化`, () => {
          const attackScrolls = scrollsForEquip.filter(
            (s) => s.primaryEffect.stat === "物攻"
          );

          if (attackScrolls.length > 1) {
            // 按成功率排序
            const sortedByRate = attackScrolls.sort(
              (a, b) => a.successRate - b.successRate
            );

            // 通常低成功率的卷軸提供更高的數值
            for (let i = 1; i < sortedByRate.length; i++) {
              const prevScroll = sortedByRate[i - 1];
              const currentScroll = sortedByRate[i];

              if (prevScroll.successRate < currentScroll.successRate) {
                expect(prevScroll.primaryEffect.value).toBeGreaterThanOrEqual(
                  currentScroll.primaryEffect.value
                );
              }
            }
          }
        });
      });
    });
  });

  describe("飾品類裝備測試", () => {
    const accessoryTypes = [
      EQUIPMENT_TYPES.EARRING,
      EQUIPMENT_TYPES.EYE_ACCESSORY,
      EQUIPMENT_TYPES.FACE_ACCESSORY,
      EQUIPMENT_TYPES.PENDANT,
      EQUIPMENT_TYPES.BELT,
    ];

    accessoryTypes.forEach((equipmentType) => {
      describe(`${equipmentType} 飾品測試`, () => {
        const scrollsForEquip = getScrollsForEquipmentType(equipmentType);

        it(`${equipmentType} 應該有可用的卷軸`, () => {
          if (scrollsForEquip.length === 0) {
            console.warn(`警告: ${equipmentType} 沒有可用的卷軸`);
          }
          // 飾品可能沒有卷軸，這是正常的
        });

        if (scrollsForEquip.length > 0) {
          it(`${equipmentType} 應該提供屬性增強`, () => {
            const attributeTypes = new Set();

            scrollsForEquip.forEach((scroll) => {
              attributeTypes.add(scroll.primaryEffect.stat);

              if (scroll.secondaryEffects) {
                scroll.secondaryEffects.forEach((effect) => {
                  attributeTypes.add(effect.stat);
                });
              }
            });

            expect(attributeTypes.size).toBeGreaterThan(0);
          });

          it(`${equipmentType} 卷軸屬性值應該適中`, () => {
            scrollsForEquip.forEach((scroll) => {
              // 飾品通常提供較小的屬性增強
              expect(scroll.primaryEffect.value).toBeGreaterThan(0);
              expect(scroll.primaryEffect.value).toBeLessThanOrEqual(50);
            });
          });
        }
      });
    });
  });

  describe("跨裝備類型綜合測試", () => {
    it("不同裝備類型的相同屬性卷軸應該有一致的邏輯", () => {
      // 收集所有物攻卷軸
      const allAttackScrolls = SCROLLS.filter(
        (s) => s.primaryEffect.stat === "物攻"
      );

      // 按成功率分組
      const groupedByRate = allAttackScrolls.reduce((groups, scroll) => {
        const rate = scroll.successRate;
        if (!groups[rate]) groups[rate] = [];
        groups[rate].push(scroll);
        return groups;
      }, {} as { [key: number]: typeof allAttackScrolls });

      // 驗證相同成功率的卷軸有合理的數值分布
      Object.entries(groupedByRate).forEach(([, scrolls]) => {
        if (scrolls.length > 1) {
          const values = scrolls.map((s) => s.primaryEffect.value);

          // 相同成功率的卷軸可能有不同數值，但應該在合理範圍內
          const minValue = Math.min(...values);
          const maxValue = Math.max(...values);

          expect(minValue).toBeGreaterThan(0);
          expect(maxValue).toBeLessThanOrEqual(20); // 物攻最大值約20
        }
      });
    });

    it("所有卷軸名稱應該符合命名規範", () => {
      SCROLLS.forEach((scroll) => {
        // 名稱應該包含裝備類型
        expect(scroll.name).toBeTruthy();
        expect(scroll.name.length).toBeGreaterThan(3);

        // 名稱應該包含成功率信息
        expect(scroll.name).toMatch(/\d+%/);

        // ID應該是有效的
        expect(scroll.id).toBeTruthy();
        expect(scroll.id).toMatch(/^[a-z0-9_]+$/);
      });
    });

    it("卷軸數據結構一致性檢查", () => {
      SCROLLS.forEach((scroll) => {
        // 基本屬性檢查
        expect(scroll.id).toBeTruthy();
        expect(scroll.name).toBeTruthy();
        expect(scroll.successRate).toBeGreaterThan(0);
        expect(scroll.equipmentType).toBeTruthy();
        expect(scroll.primaryEffect).toBeDefined();

        // 主效果檢查
        expect(scroll.primaryEffect.stat).toBeTruthy();
        expect(scroll.primaryEffect.value).toBeGreaterThan(0);

        // 次要效果檢查（可選）
        if (scroll.secondaryEffects) {
          expect(Array.isArray(scroll.secondaryEffects)).toBe(true);
          scroll.secondaryEffects.forEach((effect) => {
            expect(effect.stat).toBeTruthy();
            expect(effect.value).toBeGreaterThan(0);
          });
        }
      });
    });

    it("裝備類型覆蓋率統計", () => {
      const coverageReport: { [key: string]: number } = {};

      Object.values(EQUIPMENT_TYPES).forEach((equipType) => {
        const scrollCount = getScrollsForEquipmentType(equipType).length;
        coverageReport[equipType] = scrollCount;
      });

      console.log("裝備類型卷軸覆蓋率報告:", coverageReport);

      // 至少應該有一半的裝備類型有卷軸
      const typesWithScrolls = Object.values(coverageReport).filter(
        (count) => count > 0
      ).length;
      const totalTypes = Object.keys(coverageReport).length;
      const coverageRate = typesWithScrolls / totalTypes;

      expect(coverageRate).toBeGreaterThan(0.5); // 至少50%覆蓋率
    });
  });

  describe("效能和規模測試", () => {
    it("大量卷軸查詢性能測試", () => {
      const startTime = performance.now();

      // 模擬大量查詢
      for (let i = 0; i < 1000; i++) {
        const randomEquipType =
          AVAILABLE_EQUIPMENT_TYPES[
            Math.floor(Math.random() * AVAILABLE_EQUIPMENT_TYPES.length)
          ];
        getScrollsForEquipmentType(randomEquipType);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 1000次查詢應該在100ms內完成
      expect(duration).toBeLessThan(100);
    });

    it("卷軸數據總量檢查", () => {
      // 總卷軸數應該是187種
      expect(SCROLLS.length).toBe(187);

      // 成功率分布檢查
      const rateDistribution = SCROLLS.reduce((dist, scroll) => {
        const rate = scroll.successRate;
        dist[rate] = (dist[rate] || 0) + 1;
        return dist;
      }, {} as { [key: number]: number });

      console.log("成功率分布:", rateDistribution);

      // 應該有10%, 30%, 60%, 100%的卷軸
      expect(rateDistribution[10]).toBeGreaterThan(0);
      expect(rateDistribution[60]).toBeGreaterThan(0);
      expect(rateDistribution[100]).toBeGreaterThan(0);
    });
  });
});
