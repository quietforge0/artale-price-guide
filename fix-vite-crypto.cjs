const fs = require("fs");
const path = require("path");

// 動態找到 Vite 文件路徑
function findViteFile() {
  const possiblePaths = [
    "node_modules/.pnpm/vite@7.0.1/node_modules/vite/dist/node/chunks/dep-DJGyAxkV.js",
    "node_modules/.pnpm/vite@7.0.0_jiti@2.4.2_lightningcss@1.30.1/node_modules/vite/dist/node/chunks/dep-Bsx9IwL8.js",
    "node_modules/vite/dist/node/chunks/dep-DJGyAxkV.js",
    "node_modules/vite/dist/node/chunks/dep-Bsx9IwL8.js",
  ];

  // 也檢查所有可能的 dep- 文件
  try {
    const pnpmDir = "node_modules/.pnpm";
    if (fs.existsSync(pnpmDir)) {
      const pnpmViteDirs = fs
        .readdirSync(pnpmDir, { withFileTypes: true })
        .filter(
          (dirent) => dirent.isDirectory() && dirent.name.startsWith("vite@")
        )
        .map((dirent) => dirent.name);

      for (const viteDir of pnpmViteDirs) {
        const chunksDir = path.join(
          pnpmDir,
          viteDir,
          "node_modules/vite/dist/node/chunks"
        );
        if (fs.existsSync(chunksDir)) {
          const files = fs
            .readdirSync(chunksDir)
            .filter((file) => file.startsWith("dep-") && file.endsWith(".js"));

          for (const file of files) {
            const fullPath = path.join(chunksDir, file);
            possiblePaths.unshift(fullPath);
          }
        }
      }
    }
  } catch (e) {
    console.log("搜索pnpm目錄時出錯，使用預設路徑");
  }

  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, "utf8");
        if (content.includes("crypto.hash") && content.includes("getHash")) {
          console.log(`找到Vite文件: ${filePath}`);
          return filePath;
        }
      } catch (e) {
        // 忽略讀取錯誤，繼續嘗試下一個文件
      }
    }
  }
  return null;
}

const viteFilePath = findViteFile();

if (!viteFilePath) {
  console.error("❌ 找不到需要修復的Vite文件");
  console.log("請確保已安裝依賴：pnpm install");
  process.exit(1);
}

try {
  // 讀取文件內容
  let content = fs.readFileSync(viteFilePath, "utf8");

  // 檢查是否已經修復過
  if (content.includes("crypto.hash ??")) {
    console.log("✅ Vite crypto.hash 問題已經修復過了！");
    process.exit(0);
  }

  // 修復 crypto.hash 問題 - 更靈活的匹配
  const patterns = [
    // Vite 7.0.1 pattern
    {
      original:
        /function getHash\(text, length = 8\) \{\s*const h\$2 = crypto\.hash\("sha256", text, "hex"\)\.substring\(0, length\);/,
      replacement: `const hash =
  // crypto.hash is supported in Node 21.7.0+, 20.12.0+
  crypto.hash ??
  ((
    algorithm,
    data,
    outputEncoding,
  ) => crypto.createHash(algorithm).update(data).digest(outputEncoding))
function getHash(text, length = 8) {
	const h$2 = hash("sha256", text, "hex").substring(0, length);`,
    },
    // Vite 7.0.0 pattern
    {
      original: `function getHash(text, length = 8) {
	const h$2 = crypto.hash("sha256", text, "hex").substring(0, length);`,
      replacement: `const hash =
  // crypto.hash is supported in Node 21.7.0+, 20.12.0+
  crypto.hash ??
  ((
    algorithm,
    data,
    outputEncoding,
  ) => crypto.createHash(algorithm).update(data).digest(outputEncoding))
function getHash(text, length = 8) {
	const h$2 = hash("sha256", text, "hex").substring(0, length);`,
    },
  ];

  let patched = false;
  for (const pattern of patterns) {
    const newContent = content.replace(pattern.original, pattern.replacement);
    if (newContent !== content) {
      content = newContent;
      patched = true;
      break;
    }
  }

  if (!patched) {
    console.log("❌ 未找到需要修復的代碼模式");
    console.log("文件內容預覽:");
    const lines = content.split("\n");
    const cryptoLines = lines
      .filter(
        (line, index) =>
          line.includes("crypto.hash") || line.includes("getHash")
      )
      .slice(0, 5);
    cryptoLines.forEach((line) => console.log(`  ${line.trim()}`));
    process.exit(1);
  }

  // 寫回文件
  fs.writeFileSync(viteFilePath, content);
  console.log("✅ 成功修復 Vite crypto.hash 問題！");
  console.log("🚀 現在可以運行 npm run dev 了");
} catch (error) {
  console.error("❌ 修復失敗:", error.message);
  process.exit(1);
}
