import { EQUIPMENT_TYPES } from "./equipmentTypes.ts";
import helmetIcon from "../assets/equipment/helmet.webp";
import topwearIcon from "../assets/equipment/topwear.webp";
import bottomwearIcon from "../assets/equipment/bottomwear.webp";
import overallIcon from "../assets/equipment/overall.webp";
import shoesIcon from "../assets/equipment/shoes.webp";
import glovesIcon from "../assets/equipment/gloves.webp";
import capeIcon from "../assets/equipment/cape.webp";
import shieldIcon from "../assets/equipment/shield.webp";
import earringIcon from "../assets/equipment/earring.webp";
import eyeAccessoryIcon from "../assets/equipment/eye_accessory.webp";
import faceAccessoryIcon from "../assets/equipment/face_accessory.webp";
import pendantIcon from "../assets/equipment/pendant.webp";
import beltIcon from "../assets/equipment/belt.webp";
import oneHandedSwordIcon from "../assets/equipment/one_handed_sword.webp";
import twoHandedSwordIcon from "../assets/equipment/two_handed_sword.webp";
import oneHandedAxeIcon from "../assets/equipment/one_handed_axe.webp";
import twoHandedAxeIcon from "../assets/equipment/two_handed_axe.webp";
import oneHandedBwIcon from "../assets/equipment/one_handed_bw.webp";
import twoHandedBwIcon from "../assets/equipment/two_handed_bw.webp";
import spearIcon from "../assets/equipment/spear.webp";
import poleArmIcon from "../assets/equipment/pole_arm.webp";
import bowIcon from "../assets/equipment/bow.webp";
import crossbowIcon from "../assets/equipment/crossbow.webp";
import wandIcon from "../assets/equipment/wand.webp";
import staffIcon from "../assets/equipment/staff.webp";
import daggerIcon from "../assets/equipment/dagger.webp";
import clawIcon from "../assets/equipment/claw.webp";
import knuckleIcon from "../assets/equipment/knuckle.webp";
import gunIcon from "../assets/equipment/gun.webp";

// 裝備分類
export const EQUIPMENT_CATEGORIES = {
  ARMOR: "防具",
  WEAPONS: "武器",
  ACCESSORIES: "飾品",
} as const;

// 實際有卷軸數據的裝備類型（基於scrolls.ts中的實際數據）
export const EQUIPMENT_TYPES_WITH_SCROLLS = [
  // 防具類
  EQUIPMENT_TYPES.HELMET, // 頭盔
  EQUIPMENT_TYPES.TOPWEAR, // 上衣
  EQUIPMENT_TYPES.BOTTOMWEAR, // 下衣
  EQUIPMENT_TYPES.OVERALL, // 套服
  EQUIPMENT_TYPES.SHOES, // 鞋子
  EQUIPMENT_TYPES.GLOVES, // 手套
  EQUIPMENT_TYPES.CAPE, // 披風
  EQUIPMENT_TYPES.SHIELD, // 盾牌

  // 武器類
  EQUIPMENT_TYPES.ONE_HANDED_SWORD, // 單手劍
  EQUIPMENT_TYPES.TWO_HANDED_SWORD, // 雙手劍
  EQUIPMENT_TYPES.ONE_HANDED_AXE, // 單手斧
  EQUIPMENT_TYPES.TWO_HANDED_AXE, // 雙手斧
  EQUIPMENT_TYPES.ONE_HANDED_BW, // 單手棍
  EQUIPMENT_TYPES.TWO_HANDED_BW, // 雙手棍
  EQUIPMENT_TYPES.SPEAR, // 槍
  EQUIPMENT_TYPES.POLE_ARM, // 矛
  EQUIPMENT_TYPES.BOW, // 弓
  EQUIPMENT_TYPES.CROSSBOW, // 弩
  EQUIPMENT_TYPES.WAND, // 短杖
  EQUIPMENT_TYPES.STAFF, // 長杖
  EQUIPMENT_TYPES.DAGGER, // 短劍
  EQUIPMENT_TYPES.CLAW, // 拳套
  EQUIPMENT_TYPES.KNUCKLE, // 指虎
  EQUIPMENT_TYPES.GUN, // 手槍

  // 飾品類
  EQUIPMENT_TYPES.EARRING, // 耳環
  EQUIPMENT_TYPES.EYE_ACCESSORY, // 眼部裝飾
  EQUIPMENT_TYPES.FACE_ACCESSORY, // 臉飾
  EQUIPMENT_TYPES.PENDANT, // 項鍊
  EQUIPMENT_TYPES.BELT, // 腰帶
] as const;

// 按類別分組的裝備類型（只包含有卷軸數據的）
export const EQUIPMENT_BY_CATEGORY_WITH_SCROLLS = {
  [EQUIPMENT_CATEGORIES.ARMOR]: [
    EQUIPMENT_TYPES.HELMET,
    EQUIPMENT_TYPES.TOPWEAR,
    EQUIPMENT_TYPES.BOTTOMWEAR,
    EQUIPMENT_TYPES.OVERALL,
    EQUIPMENT_TYPES.SHOES,
    EQUIPMENT_TYPES.GLOVES,
    EQUIPMENT_TYPES.CAPE,
    EQUIPMENT_TYPES.SHIELD,
  ],
  [EQUIPMENT_CATEGORIES.WEAPONS]: [
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
  ],
  [EQUIPMENT_CATEGORIES.ACCESSORIES]: [
    EQUIPMENT_TYPES.EARRING,
    EQUIPMENT_TYPES.EYE_ACCESSORY,
    EQUIPMENT_TYPES.FACE_ACCESSORY,
    EQUIPMENT_TYPES.PENDANT,
    EQUIPMENT_TYPES.BELT,
  ],
};

// 所有可用的裝備類型（扁平化）
export const AVAILABLE_EQUIPMENT_TYPES = Object.values(
  EQUIPMENT_BY_CATEGORY_WITH_SCROLLS
).flat();

// 裝備圖示映射（使用實際的圖片檔案）
export const EQUIPMENT_ICONS: Record<string, string> = {
  頭盔: helmetIcon,
  上衣: topwearIcon,
  下衣: bottomwearIcon,
  套服: overallIcon,
  鞋子: shoesIcon,
  手套: glovesIcon,
  披風: capeIcon,
  盾牌: shieldIcon,
  耳環: earringIcon,
  眼部裝飾: eyeAccessoryIcon,
  臉飾: faceAccessoryIcon,
  項鍊: pendantIcon,
  腰帶: beltIcon,
  單手劍: oneHandedSwordIcon,
  雙手劍: twoHandedSwordIcon,
  單手斧: oneHandedAxeIcon,
  雙手斧: twoHandedAxeIcon,
  單手棍: oneHandedBwIcon,
  雙手棍: twoHandedBwIcon,
  槍: spearIcon,
  矛: poleArmIcon,
  弓: bowIcon,
  弩: crossbowIcon,
  短杖: wandIcon,
  長杖: staffIcon,
  短劍: daggerIcon,
  拳套: clawIcon,
  指虎: knuckleIcon,
  手槍: gunIcon,
};

// 可用的屬性類型（基於scrolls.ts中實際存在的屬性）
export const ATTRIBUTE_TYPES = [
  "物攻",
  "魔攻",
  "敏捷",
  "智力",
  "力量",
  "幸運",
  "體力",
  "HP",
  "MP",
  "物防",
  "魔防",
  "命中率",
  "移動速度",
  "跳躍力",
] as const;

export type AttributeType = (typeof ATTRIBUTE_TYPES)[number];

// 屬性圖示映射（更炫砲的設計）
export const ATTRIBUTE_ICONS: Record<string, string> = {
  物攻: "⚔️",
  魔攻: "🔮",
  敏捷: "⚡",
  智力: "🧠",
  力量: "💪",
  幸運: "🍀",
  體力: "❤️‍🔥",
  HP: "❤️",
  MP: "💙",
  物防: "🛡️",
  魔防: "✨",
  命中率: "🎯",
  移動速度: "��",
  跳躍力: "🦘",
};

// 屬性分類
export const ATTRIBUTE_CATEGORIES = {
  ATTACK: "攻擊",
  BASIC: "基本能力",
  VITALITY: "生命力",
  DEFENSE: "防禦",
  SPECIAL: "特殊",
} as const;

// 按類別分組的屬性
export const ATTRIBUTES_BY_CATEGORY = {
  [ATTRIBUTE_CATEGORIES.ATTACK]: ["物攻", "魔攻"],
  [ATTRIBUTE_CATEGORIES.BASIC]: ["敏捷", "智力", "力量", "幸運", "體力"],
  [ATTRIBUTE_CATEGORIES.VITALITY]: ["HP", "MP"],
  [ATTRIBUTE_CATEGORIES.DEFENSE]: ["物防", "魔防"],
  [ATTRIBUTE_CATEGORIES.SPECIAL]: ["命中率", "移動速度", "跳躍力"],
} as const;
