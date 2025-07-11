// 裝備圖示資源管理
// 注意：這些圖示需要手動添加到 equipment 資料夾中

export const EQUIPMENT_ICONS = {
  // 防具類
  HELMET: "/src/assets/equipment/helmet.webp",
  TOPWEAR: "/src/assets/equipment/topwear.webp",
  BOTTOMWEAR: "/src/assets/equipment/bottomwear.webp",
  OVERALL: "/src/assets/equipment/overall.webp",
  SHOES: "/src/assets/equipment/shoes.webp",
  GLOVES: "/src/assets/equipment/gloves.webp",
  CAPE: "/src/assets/equipment/cape.webp",
  SHIELD: "/src/assets/equipment/shield.webp",

  // 飾品類
  EARRING: "/src/assets/equipment/earring.webp",
  EYE_ACCESSORY: "/src/assets/equipment/eye_accessory.webp",
  FACE_ACCESSORY: "/src/assets/equipment/face_accessory.webp",
  PENDANT: "/src/assets/equipment/pendant.webp",
  BELT: "/src/assets/equipment/belt.webp",

  // 武器類
  ONE_HANDED_SWORD: "/src/assets/equipment/one_handed_sword.webp",
  TWO_HANDED_SWORD: "/src/assets/equipment/two_handed_sword.webp",
  ONE_HANDED_AXE: "/src/assets/equipment/one_handed_axe.webp",
  TWO_HANDED_AXE: "/src/assets/equipment/two_handed_axe.webp",
  ONE_HANDED_BW: "/src/assets/equipment/one_handed_bw.webp",
  TWO_HANDED_BW: "/src/assets/equipment/two_handed_bw.webp",
  SPEAR: "/src/assets/equipment/spear.webp",
  POLE_ARM: "/src/assets/equipment/pole_arm.webp",
  BOW: "/src/assets/equipment/bow.webp",
  CROSSBOW: "/src/assets/equipment/crossbow.webp",
  WAND: "/src/assets/equipment/wand.webp",
  STAFF: "/src/assets/equipment/staff.webp",
  DAGGER: "/src/assets/equipment/dagger.webp",
  CLAW: "/src/assets/equipment/claw.webp",
  KNUCKLE: "/src/assets/equipment/knuckle.webp",
  GUN: "/src/assets/equipment/gun.webp",
} as const;

// 根據裝備類型獲取圖示的輔助函數
export const getEquipmentIcon = (equipmentType: string): string => {
  const iconKey = equipmentType
    .toUpperCase()
    .replace(/\s+/g, "_") as keyof typeof EQUIPMENT_ICONS;
  return EQUIPMENT_ICONS[iconKey] || "/src/assets/equipment/default.png";
};

// 檢查圖示是否存在的輔助函數
export const hasEquipmentIcon = (equipmentType: string): boolean => {
  const iconKey = equipmentType
    .toUpperCase()
    .replace(/\s+/g, "_") as keyof typeof EQUIPMENT_ICONS;
  return iconKey in EQUIPMENT_ICONS;
};
