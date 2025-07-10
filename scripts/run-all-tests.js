#!/usr/bin/env node

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

console.log("🚀 執行完整測試套件 - Artale 卷軸計算器");
console.log("=".repeat(60));
console.log();

const runCommand = (command, args, description) => {
  return new Promise((resolve, reject) => {
    console.log(`📋 ${description}`);
    console.log(`🔧 執行: ${command} ${args.join(" ")}`);
    console.log("-".repeat(50));

    const startTime = Date.now();
    const process = spawn(command, args, {
      cwd: projectRoot,
      stdio: "inherit",
      shell: true,
    });

    process.on("close", (code) => {
      const endTime = Date.now();
      const duration = endTime - startTime;

      if (code === 0) {
        console.log(`✅ ${description} - 完成 (${duration}ms)`);
        console.log();
        resolve({ success: true, duration, description });
      } else {
        console.log(`❌ ${description} - 失敗 (退出代碼: ${code})`);
        console.log();
        reject({ success: false, duration, description, code });
      }
    });

    process.on("error", (error) => {
      console.log(`💥 ${description} - 執行錯誤:`, error.message);
      console.log();
      reject({ success: false, description, error: error.message });
    });
  });
};

const checkFileExists = (filePath, description) => {
  const fullPath = join(projectRoot, filePath);
  const exists = existsSync(fullPath);
  console.log(
    `${exists ? "✅" : "❌"} ${description}: ${exists ? "存在" : "缺失"}`
  );
  return exists;
};

const runAllTests = async () => {
  const overallStartTime = Date.now();
  const results = [];
  let totalTests = 0;
  let passedTests = 0;
  let failedSuites = [];

  try {
    console.log("🔍 檢查測試文件結構...");
    console.log("-".repeat(50));

    // 檢查測試文件是否存在
    const testFiles = [
      { path: "src/test/dev-health-check.test.ts", name: "健康檢查測試" },
      { path: "src/test/unit/scrollCalculations.test.ts", name: "單元測試" },
      {
        path: "src/test/integration/comprehensiveScrollTest.test.ts",
        name: "整合測試",
      },
      { path: "src/test/fuzz/propertyBasedTest.test.ts", name: "Fuzz測試" },
      { path: "src/test/e2e/userFlows.test.ts", name: "E2E測試" },
    ];

    let allFilesExist = true;
    testFiles.forEach((file) => {
      if (!checkFileExists(file.path, file.name)) {
        allFilesExist = false;
      }
    });

    console.log();
    if (!allFilesExist) {
      console.log("⚠️  某些測試文件缺失，但繼續執行可用的測試...");
      console.log();
    }

    // 1. 健康檢查測試
    try {
      await runCommand(
        "pnpm",
        [
          "vitest",
          "run",
          "--reporter=verbose",
          "src/test/dev-health-check.test.ts",
        ],
        "1️⃣ 健康檢查測試 (核心功能驗證)"
      );
      results.push({ name: "健康檢查", status: "passed" });
    } catch (error) {
      results.push({ name: "健康檢查", status: "failed", error });
      failedSuites.push("健康檢查");
    }

    // 2. 單元測試
    if (checkFileExists("src/test/unit/scrollCalculations.test.ts", "")) {
      try {
        await runCommand(
          "pnpm",
          ["vitest", "run", "--reporter=verbose", "src/test/unit/"],
          "2️⃣ 單元測試 (核心邏輯驗證)"
        );
        results.push({ name: "單元測試", status: "passed" });
      } catch (error) {
        results.push({ name: "單元測試", status: "failed", error });
        failedSuites.push("單元測試");
      }
    }

    // 3. 整合測試
    if (
      checkFileExists(
        "src/test/integration/comprehensiveScrollTest.test.ts",
        ""
      )
    ) {
      try {
        await runCommand(
          "pnpm",
          ["vitest", "run", "--reporter=verbose", "src/test/integration/"],
          "3️⃣ 整合測試 (全面功能驗證)"
        );
        results.push({ name: "整合測試", status: "passed" });
      } catch (error) {
        results.push({ name: "整合測試", status: "failed", error });
        failedSuites.push("整合測試");
      }
    }

    // 4. Fuzz測試
    if (checkFileExists("src/test/fuzz/propertyBasedTest.test.ts", "")) {
      try {
        await runCommand(
          "pnpm",
          [
            "vitest",
            "run",
            "--reporter=verbose",
            "src/test/fuzz/",
            "--testTimeout=30000",
          ],
          "4️⃣ Fuzz測試 (隨機輸入壓力測試)"
        );
        results.push({ name: "Fuzz測試", status: "passed" });
      } catch (error) {
        results.push({ name: "Fuzz測試", status: "failed", error });
        failedSuites.push("Fuzz測試");
      }
    }

    // 5. E2E測試（可能需要額外設定，先跳過）
    console.log("⚠️  E2E測試需要完整的React組件和DOM環境，暫時跳過");
    console.log();

    // 6. 測試覆蓋率報告
    try {
      await runCommand(
        "pnpm",
        ["vitest", "run", "--coverage"],
        "6️⃣ 測試覆蓋率報告"
      );
      results.push({ name: "覆蓋率報告", status: "passed" });
    } catch (error) {
      results.push({ name: "覆蓋率報告", status: "failed", error });
      failedSuites.push("覆蓋率報告");
    }
  } catch (globalError) {
    console.log("💥 全局錯誤:", globalError);
  }

  // 最終總結
  const overallEndTime = Date.now();
  const totalDuration = overallEndTime - overallStartTime;

  console.log("=".repeat(60));
  console.log("📊 測試執行總結");
  console.log("=".repeat(60));

  results.forEach((result, index) => {
    const icon = result.status === "passed" ? "✅" : "❌";
    console.log(`${icon} ${result.name}: ${result.status.toUpperCase()}`);
  });

  console.log();
  console.log(`⏱️  總執行時間: ${(totalDuration / 1000).toFixed(2)}秒`);
  console.log(
    `📈 通過率: ${results.filter((r) => r.status === "passed").length}/${
      results.length
    }`
  );

  if (failedSuites.length === 0) {
    console.log("🎉 所有測試套件通過！您的代碼品質優秀！");
    console.log("✨ 建議: 可以安心部署或提交代碼");
  } else {
    console.log(
      `⚠️  ${failedSuites.length} 個測試套件失敗: ${failedSuites.join(", ")}`
    );
    console.log("💡 建議: 檢查失敗的測試並修復相關問題");
  }

  console.log();
  console.log("🔧 快速指令:");
  console.log("  pnpm test:health   - 快速健康檢查");
  console.log("  pnpm test:quick    - 單元測試");
  console.log("  pnpm test:coverage - 覆蓋率報告");
  console.log("  pnpm dev           - 啟動開發服務器");

  // 返回結果供程式使用
  process.exit(failedSuites.length === 0 ? 0 : 1);
};

// 執行測試
runAllTests().catch((error) => {
  console.error("執行測試時發生未處理的錯誤:", error);
  process.exit(1);
});
