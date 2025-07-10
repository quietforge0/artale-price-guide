import { describe, it, expect } from "vitest";
import {
  SCROLLS,
  getScrollsForEquipmentType,
  getScrollsBySuccessRate,
  getAvailableEquipmentTypes,
} from "../../constants/scrolls";
import { EQUIPMENT_TYPES } from "../../constants/equipmentTypes";

describe("捲軸計算功能測試", () => {
  describe("基本捲軸資料", () => {
    it("應該有捲軸資料", () => {
      expect(SCROLLS).toBeDefined();
      expect(SCROLLS.length).toBeGreaterThan(0);
      expect(SCROLLS.length).toBe(187); // 實際上有187種卷軸
    });

    it("每個捲軸都應該有必要的屬性", () => {
      SCROLLS.forEach((scroll) => {
        expect(scroll.id).toBeDefined();
        expect(scroll.name).toBeDefined();
        expect(scroll.successRate).toBeDefined();
        expect(scroll.equipmentType).toBeDefined();
        expect(scroll.primaryEffect).toBeDefined();
        expect(scroll.primaryEffect.stat).toBeDefined();
        expect(scroll.primaryEffect.value).toBeDefined();

        // 檢查成功率是有效的百分比
        expect(scroll.successRate).toBeGreaterThan(0);
        expect(scroll.successRate).toBeLessThanOrEqual(100);
      });
    });

    it("捲軸ID應該是唯一的", () => {
      const ids = SCROLLS.map((scroll) => scroll.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe("按裝備類型篩選捲軸", () => {
    it("應該能正確篩選頭盔捲軸", () => {
      const helmetScrolls = getScrollsForEquipmentType(EQUIPMENT_TYPES.HELMET);
      expect(helmetScrolls.length).toBeGreaterThan(0);
      helmetScrolls.forEach((scroll) => {
        expect(scroll.equipmentType).toBe(EQUIPMENT_TYPES.HELMET);
      });
    });

    it("應該能正確篩選單手劍捲軸", () => {
      const swordScrolls = getScrollsForEquipmentType(
        EQUIPMENT_TYPES.ONE_HANDED_SWORD
      );
      swordScrolls.forEach((scroll) => {
        expect(scroll.equipmentType).toBe(EQUIPMENT_TYPES.ONE_HANDED_SWORD);
      });
    });

    it("不存在的裝備類型應該回傳空陣列", () => {
      const unknownScrolls = getScrollsForEquipmentType("不存在的類型");
      expect(unknownScrolls).toEqual([]);
    });
  });

  describe("按成功率篩選捲軸", () => {
    it("應該能正確篩選10%成功率捲軸", () => {
      const tenPercentScrolls = getScrollsBySuccessRate(10);
      expect(tenPercentScrolls.length).toBeGreaterThan(0);
      tenPercentScrolls.forEach((scroll) => {
        expect(scroll.successRate).toBe(10);
      });
    });

    it("應該能正確篩選30%成功率捲軸", () => {
      const thirtyPercentScrolls = getScrollsBySuccessRate(30);
      thirtyPercentScrolls.forEach((scroll) => {
        expect(scroll.successRate).toBe(30);
      });
    });

    it("不存在的成功率應該回傳空陣列", () => {
      const unknownScrolls = getScrollsBySuccessRate(999);
      expect(unknownScrolls).toEqual([]);
    });
  });

  describe("裝備類型功能", () => {
    it("應該能取得所有可用的裝備類型", () => {
      const types = getAvailableEquipmentTypes();
      expect(types.length).toBeGreaterThan(0);
      expect(types).toContain(EQUIPMENT_TYPES.HELMET);
      expect(types).toContain(EQUIPMENT_TYPES.ONE_HANDED_SWORD);

      // 檢查是否為唯一值
      const uniqueTypes = new Set(types);
      expect(uniqueTypes.size).toBe(types.length);
    });
  });

  describe("捲軸效果計算", () => {
    it("主要效果應該有正值", () => {
      SCROLLS.forEach((scroll) => {
        expect(scroll.primaryEffect.value).toBeGreaterThan(0);
      });
    });

    it("次要效果如果存在，也應該有正值", () => {
      SCROLLS.forEach((scroll) => {
        if (scroll.secondaryEffects) {
          scroll.secondaryEffects.forEach((effect) => {
            expect(effect.value).toBeGreaterThan(0);
          });
        }
      });
    });
  });
});
