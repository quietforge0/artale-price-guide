#!/usr/bin/env node

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

console.log("🧪 開發前測試檢查...\n");

const runTest = (testPath, description) => {
  return new Promise((resolve, reject) => {
    console.log(`📋 ${description}`);

    const testProcess = spawn(
      "pnpm",
      ["vitest", "run", "--reporter=basic", testPath],
      {
        cwd: projectRoot,
        stdio: "pipe",
      }
    );

    let output = "";
    let errorOutput = "";

    testProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    testProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    testProcess.on("close", (code) => {
      if (code === 0) {
        // 提取通過的測試數量
        const passMatch = output.match(/(\d+) passed/);
        const passed = passMatch ? passMatch[1] : "?";
        console.log(`   ✅ ${passed} 個測試通過\n`);
        resolve({ passed: parseInt(passed) || 0, output });
      } else {
        // 提取失敗信息
        const failMatch = output.match(/(\d+) failed/);
        const failed = failMatch ? failMatch[1] : "未知";
        console.log(`   ❌ ${failed} 個測試失敗`);
        console.log(`   錯誤: ${errorOutput.slice(0, 200)}...\n`);
        reject({ failed, output, errorOutput });
      }
    });

    // 5秒超時
    setTimeout(() => {
      testProcess.kill();
      reject({ timeout: true, message: "測試超時" });
    }, 5000);
  });
};

const quickHealthCheck = async () => {
  const startTime = Date.now();
  let totalPassed = 0;
  let anyFailed = false;

  try {
    // 1. 核心計算函數測試
    try {
      const result = await runTest(
        "src/test/unit/scrollCalculations.test.ts",
        "檢查核心計算邏輯"
      );
      totalPassed += result.passed;
    } catch (error) {
      anyFailed = true;
      if (error.timeout) {
        console.log("   ⚠️  核心測試超時，跳過...\n");
      }
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log("📊 測試摘要:");
    console.log(`   ⏱️  總用時: ${duration}ms`);
    console.log(`   ✅ 通過: ${totalPassed} 個測試`);

    if (anyFailed) {
      console.log("   ⚠️  有測試失敗，但繼續啟動開發服務器");
      console.log("   💡 建議稍後運行 pnpm test 查看詳細信息\n");
    } else {
      console.log("   🎉 所有核心測試通過！\n");
    }

    console.log("🚀 正在啟動開發服務器...\n");
    return true;
  } catch (error) {
    console.log("❌ 測試檢查時發生錯誤，但繼續啟動服務器");
    console.log(`   錯誤信息: ${error.message || error}\n`);
    return true; // 即使測試失敗也繼續啟動
  }
};

// 如果直接運行此腳本
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  quickHealthCheck()
    .then(() => {
      process.exit(0);
    })
    .catch(() => {
      process.exit(0); // 不阻止開發服務器啟動
    });
}

export { quickHealthCheck };
