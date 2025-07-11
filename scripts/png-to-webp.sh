#!/bin/bash

# 將 src/assets/equipment 內所有 png 轉成 webp
EQUIP_DIR="src/assets/equipment"

for file in "$EQUIP_DIR"/*.png; do
  [ -e "$file" ] || continue
  base="${file%.png}"
  cwebp -q 90 "$file" -o "$base.webp"
  echo "轉換: $file -> $base.webp"
done

echo "全部轉換完成！" 