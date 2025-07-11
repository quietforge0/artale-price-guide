#!/bin/bash

# 使用 maplestory.io API 下載正確的楓之谷裝備 icon
# 預設 GMS/237 版本
EQUIP_DIR="src/assets/equipment"
BASE_URL="https://maplestory.io/api/GMS/237/item"

mkdir -p "$EQUIP_DIR"

# 用 bash 陣列
items_keys=(helmet topwear bottomwear overall shoes gloves cape shield earring eye_accessory face_accessory pendant belt one_handed_sword two_handed_sword one_handed_axe two_handed_axe one_handed_bw two_handed_bw spear pole_arm bow crossbow wand staff dagger claw knuckle gun)
items_ids=(1002000 1040002 1060002 1050039 1072001 1082002 1102000 1092000 1032000 1012007 1022000 1122000 1132000 1302000 1402000 1312004 1412001 1322005 1422001 1432001 1442001 1452001 1462001 1372000 1382000 1332000 1472000 1482000 1492000)

echo "開始下載正確的楓之谷裝備 icon..."

for i in "${!items_keys[@]}"; do
  key="${items_keys[$i]}"
  id="${items_ids[$i]}"
  url="$BASE_URL/$id/icon"
  out="$EQUIP_DIR/$key.png"
  curl -s -f -o "$out" "$url"
  if [[ $? -eq 0 ]]; then
    echo "✅ $key ($id) 下載完成"
  else
    echo "❌ $key ($id) 下載失敗"
  fi
done

echo "全部下載完成！請檢查 $EQUIP_DIR 目錄。" 