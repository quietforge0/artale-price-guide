import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EQUIPMENT_DIR = path.join(__dirname, "../src/assets/equipment");

// 從 equipmentTypes.ts 讀取裝備類型
const equipmentTypesContent = fs.readFileSync(
  path.join(__dirname, "../src/constants/equipmentTypes.ts"),
  "utf8"
);

// 解析裝備類型
const equipmentTypesMatch = equipmentTypesContent.match(
  /EQUIPMENT_TYPES\s*=\s*{([^}]+)}/s
);
if (!equipmentTypesMatch) {
  console.error("無法解析裝備類型定義");
  process.exit(1);
}

const equipmentTypesText = equipmentTypesMatch[1];
const equipmentTypes = {};

// 解析每個裝備類型
equipmentTypesText.split("\n").forEach((line) => {
  const match = line.match(/(\w+):\s*"[^"]+"/);
  if (match) {
    equipmentTypes[match[1]] = true;
  }
});

// 檢查圖片檔案
const imageFiles = fs
  .readdirSync(EQUIPMENT_DIR)
  .filter((file) => file.endsWith(".webp"))
  .map((file) => file.replace(".webp", ""));

console.log("=== 裝備圖片覆蓋率檢查 ===\n");

// 檢查每個裝備類型是否有對應的圖片
let missingImages = [];
let extraImages = [];

Object.keys(equipmentTypes).forEach((type) => {
  const imageName = type.toLowerCase();
  if (!imageFiles.includes(imageName)) {
    missingImages.push(type);
  }
});

// 檢查是否有多餘的圖片
imageFiles.forEach((imageName) => {
  const typeName = imageName.toUpperCase();
  if (!equipmentTypes[typeName]) {
    extraImages.push(imageName);
  }
});

// 輸出結果
if (missingImages.length === 0 && extraImages.length === 0) {
  console.log("✅ 完美！所有裝備類型都有對應的圖片，且沒有多餘的圖片。");
} else {
  if (missingImages.length > 0) {
    console.log("❌ 缺少以下裝備類型的圖片：");
    missingImages.forEach((type) => console.log(`  - ${type}`));
  }

  if (extraImages.length > 0) {
    console.log("\n⚠️  發現多餘的圖片檔案：");
    extraImages.forEach((image) => console.log(`  - ${image}.webp`));
  }
}

console.log(`\n📊 統計資訊：`);
console.log(`  - 裝備類型總數：${Object.keys(equipmentTypes).length}`);
console.log(`  - 圖片檔案總數：${imageFiles.length}`);
console.log(`  - 缺少圖片：${missingImages.length}`);
console.log(`  - 多餘圖片：${extraImages.length}`);
